import Badge from '../common/Badge';

export default function AvailabilityBadge({ book }) {
  return book.availableCopies > 0
    ? <Badge tone="success">{book.availableCopies} available</Badge>
    : <Badge tone="danger">Unavailable</Badge>;
}
