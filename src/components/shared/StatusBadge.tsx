import { cn } from '@/lib/utils';

type StatusType = 'active' | 'inactive' | 'pending' | 'assigned' | 'in_progress' | 'in_process' | 'delivered' | 'partially_delivered' | 'failed' | 'cancelled' | 'paid' | 'partial' | 'unpaid' | 'open' | 'closed';

const statusStyles: Record<string, string> = {
  active: 'status-active',
  delivered: 'status-delivered',
  paid: 'status-delivered',
  closed: 'status-delivered',
  inactive: 'status-inactive',
  cancelled: 'status-inactive',
  pending: 'status-pending',
  assigned: 'status-pending',
  open: 'status-pending',
  partial: 'status-pending',
  in_progress: 'bg-info/10 text-info',
  in_process: 'bg-info/10 text-info',
  partially_delivered: 'bg-warning/10 text-warning',
  failed: 'status-failed',
  unpaid: 'status-failed',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  in_process: 'In Process',
  delivered: 'Delivered',
  partially_delivered: 'Partial',
  failed: 'Failed',
  cancelled: 'Cancelled',
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
  open: 'Open',
  closed: 'Closed',
};

export default function StatusBadge({ status }: { status: StatusType }) {
  return (
    <span className={cn('status-badge', statusStyles[status] || 'status-inactive')}>
      {statusLabels[status] || status}
    </span>
  );
}
