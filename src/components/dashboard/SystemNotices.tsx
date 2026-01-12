import type { DashboardDTO } from "./types";

const severityStyles = {
  info: "border-blue-500/30 text-blue-300",
  warn: "border-amber-500/30 text-amber-300",
  error: "border-red-500/30 text-red-300",
};

const SystemNotices = ({ system }: { system: DashboardDTO["system"] }) => {
  const notices = system?.notices ?? [];

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">System Messages</h2>
          {system?.lastSyncAt && (
            <span className="text-xs text-muted-foreground">Last verified: {system.lastSyncAt}</span>
          )}
        </div>
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No system notices right now.</p>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className={`border rounded-xl p-3 text-sm ${severityStyles[notice.severity]}`}
              >
                {notice.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemNotices;
