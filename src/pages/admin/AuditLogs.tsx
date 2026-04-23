import PageHeader from '@/components/shared/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '@/lib/operationsApi';

export default function AuditLogsPage() {
  const { data: logs = [], isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => fetchAuditLogs(200),
  });

  return (
    <div>
      <PageHeader title="Audit Logs" description="System activity and change history" />
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load audit logs</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      <div className="bg-card border border-border rounded-md divide-y divide-border">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">No logs yet.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-start gap-4">
              <span className="text-xs text-muted-foreground font-mono w-32 shrink-0">{log.timestamp}</span>
              <span className="text-sm font-medium w-32 shrink-0">{log.user}</span>
              <span className="text-sm">{log.action}</span>
              <span className="text-xs text-muted-foreground ml-auto">{log.details}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
