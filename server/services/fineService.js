import { Fine } from '../models/Fine.js';
import { PaymentRecord } from '../models/PaymentRecord.js';
import { ApiError } from '../utils/ApiError.js';
import { audit } from './auditService.js';

const populate = [{ path: 'student', select: 'fullName email studentId' }, { path: 'issue', select: 'book dueDate returnDate', populate: { path: 'book', select: 'title author' } }];

export async function listFines({ status, student, page, limit }, studentId) {
  const filter = {};
  if (studentId || student) filter.student = studentId || student;
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    Fine.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(populate).lean(),
    Fine.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getFine(id, user) {
  const fine = await Fine.findById(id).populate(populate).lean();
  if (!fine || (user.role === 'STUDENT' && fine.student._id.toString() !== user._id.toString())) throw new ApiError(404, 'Fine not found');
  const payment = fine.status === 'paid' ? await PaymentRecord.findOne({ fine: fine._id }).lean() : null;
  return { ...fine, payment };
}

// The amount always comes from the stored fine, never from the request.
export async function recordPayment(fineId, { method, reference }, staff) {
  const fine = await Fine.findById(fineId);
  if (!fine) throw new ApiError(404, 'Fine not found');
  if (fine.status !== 'pending') throw new ApiError(409, `This fine is already ${fine.status}`);

  let payment;
  try {
    // Unique index on payment.fine means only one concurrent caller can create the record.
    payment = await PaymentRecord.create({ fine: fine._id, student: fine.student, amount: fine.amount, method, reference, recordedBy: staff._id });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'A payment has already been recorded for this fine');
    throw err;
  }
  const updated = await Fine.findOneAndUpdate({ _id: fine._id, status: 'pending' }, { status: 'paid' }, { new: true });
  if (!updated) {
    await PaymentRecord.deleteOne({ _id: payment._id }); // fine changed under us (e.g. waived): undo
    throw new ApiError(409, 'This fine is no longer pending');
  }
  await audit(staff, 'FINE_PAID', 'Fine', fine._id, { amount: fine.amount, method });
  return { fine: updated, payment };
}

export async function waiveFine(fineId, reason, admin) {
  const fine = await Fine.findOneAndUpdate(
    { _id: fineId, status: 'pending' },
    { status: 'waived', waivedBy: admin._id, waivedAt: new Date(), waiveReason: reason },
    { new: true }
  );
  if (!fine) {
    const exists = await Fine.exists({ _id: fineId });
    throw new ApiError(exists ? 409 : 404, exists ? 'Only pending fines can be waived' : 'Fine not found');
  }
  await audit(admin, 'FINE_WAIVED', 'Fine', fine._id, { reason });
  return fine;
}
