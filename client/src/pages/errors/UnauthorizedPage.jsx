import StatusPage from './StatusPage';
export default function UnauthorizedPage() {
  return <StatusPage code="403" title="Access denied" message="Your account does not have permission to view this page." />;
}
