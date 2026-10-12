import { User, ROLES } from '../models/User.js';
import { BookIssue } from '../models/BookIssue.js';
import { Fine } from '../models/Fine.js';
import { ApiError } from '../utils/ApiError.js';
import { audit } from './auditService.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Librarians may only see students; admins see everyone.
async function findVisible(id, viewer) {
  const user = await User.findById(id);
  if (!user || (viewer.role === ROLES.LIBRARIAN && user.role !== ROLES.STUDENT)) throw new ApiError(404, 'Member not found');
  return user;
}

export async function listMembers(query, viewer) {
  const filter = {};
  if (viewer.role === ROLES.LIBRARIAN) filter.role = ROLES.STUDENT;
  else if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ fullName: rx }, { email: rx }, { studentId: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit),
    User.countDocuments(filter),
  ]);
  return { items, total };
}

export async function getMember(id, viewer) {
  const user = await findVisible(id, viewer);
  const [activeLoans, fines] = await Promise.all([
    BookIssue.countDocuments({ student: user._id, status: 'issued' }),
    Fine.aggregate([{ $match: { student: user._id, status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  return { ...user.toJSON(), activeLoans, outstandingFines: fines[0]?.total || 0 };
}

export async function createMember(data, admin) {
  const user = await User.create(data);
  await audit(admin, 'MEMBER_CREATED', 'User', user._id, { role: user.role });
  return user;
}

export async function updateMember(id, data, admin) {
  const user = await findVisible(id, admin);
  Object.assign(user, data);
  await user.save();
  await audit(admin, 'MEMBER_UPDATED', 'User', user._id);
  return user;
}

export async function setStatus(id, status, admin) {
  if (String(id) === String(admin._id)) throw new ApiError(409, 'You cannot change your own account status');
  const user = await findVisible(id, admin);
  if (status === 'inactive' && (await BookIssue.exists({ student: user._id, status: 'issued' }))) {
    throw new ApiError(409, 'This member has books on loan. Process the returns before deactivating the account');
  }
  user.status = status;
  await user.save();
  await audit(admin, status === 'active' ? 'MEMBER_ACTIVATED' : 'MEMBER_DEACTIVATED', 'User', user._id);
  return user;
}

export async function setRole(id, role, admin) {
  if (String(id) === String(admin._id)) throw new ApiError(409, 'You cannot change your own role');
  const user = await findVisible(id, admin);
  if (user.role === ROLES.STUDENT && role !== ROLES.STUDENT && (await BookIssue.exists({ student: user._id, status: 'issued' }))) {
    throw new ApiError(409, 'This member has books on loan. Process the returns first');
  }
  const previous = user.role;
  user.role = role;
  await user.save();
  await audit(admin, 'MEMBER_ROLE_CHANGED', 'User', user._id, { from: previous, to: role });
  return user;
}
