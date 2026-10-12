import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';

// A failed notification must never fail the business action that triggered it.
export async function notify(recipient, type, title, message, dedupeKey) {
  try {
    await Notification.create({ recipient, type, title, message, dedupeKey });
    return true;
  } catch (err) {
    if (err.code !== 11000) console.error('Notification failed:', err.message);
    return false;
  }
}

export async function listNotifications(userId, { page, limit, unreadOnly }) {
  const filter = { recipient: userId, ...(unreadOnly ? { isRead: false } : {}) };
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);
  return { items, total, unreadCount };
}

export async function markRead(id, userId) {
  const n = await Notification.findOneAndUpdate({ _id: id, recipient: userId }, { isRead: true }, { new: true });
  if (!n) throw new ApiError(404, 'Notification not found');
  return n;
}

export const markAllRead = (userId) => Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
