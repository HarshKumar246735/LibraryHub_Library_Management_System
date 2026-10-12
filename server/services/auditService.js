import { AuditLog } from '../models/AuditLog.js';

// Audit failures must never break the business operation that already succeeded.
export async function audit(actor, action, entityType, entityId, meta) {
  try {
    await AuditLog.create({ actor: actor?._id || actor, action, entityType, entityId, meta });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}
