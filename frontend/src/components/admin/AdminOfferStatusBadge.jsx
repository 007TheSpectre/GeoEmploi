import { Badge } from '../common/Badge';

export const AdminOfferStatusBadge = ({ status }) => {
  switch (status) {
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'pending_moderation':
      return <Badge variant="warning">En attente</Badge>;
    case 'rejected':
      return <Badge variant="error">Rejetée</Badge>;
    case 'closed':
      return <Badge variant="neutral">Fermée</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
