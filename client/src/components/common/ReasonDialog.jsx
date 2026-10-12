import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import './ReasonDialog.css';

// Asks for an optional reason (used when rejecting requests and renewals).
export default function ReasonDialog({ open, title, message, confirmLabel, loading, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const close = () => { setReason(''); onCancel(); };
  return (
    <Modal
      open={open}
      title={title}
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={() => onConfirm(reason.trim())}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="reason-dialog__message">{message}</p>
      <label className="reason-dialog__label" htmlFor="reject-reason">Reason (optional, shown to the student)</label>
      <textarea id="reject-reason" className="reason-dialog__input" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
    </Modal>
  );
}
