import { AlertTriangle } from 'lucide-react';
import { getErrorMessage } from '../../services/api';
import Button from './Button';
import EmptyState from './EmptyState';

export default function ErrorState({ error, onRetry }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Something went wrong"
      message={getErrorMessage(error)}
      action={onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    />
  );
}
