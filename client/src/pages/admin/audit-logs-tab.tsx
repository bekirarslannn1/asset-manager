import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@shared/schema";

export default function AuditLogsTab() {
  const { data: logs = [] } = useQuery<AuditLog[]>({ queryKey: ["/api/admin/audit-logs"] });
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const entities = Array.from(new Set(logs.map((l) => l.entity)));
  const filtered = entityFilter === "all" ? logs : logs.filter((l) => l.entity === entityFilter);

  return (
    <div data-testid="admin-audit-logs">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h3 className="text-lg font-semibold">Denetim Kayitlari ({logs.length})</h3>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48" data-testid="select-audit-entity-filter">
            <SelectValue placeholder="Tumu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tumu</SelectItem>
            {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((log) => (
          <div key={log.id} className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-md flex-wrap" data-testid={`audit-log-${log.id}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{log.userName || "Sistem"}</span>
                <Badge variant="secondary">{log.action}</Badge>
                <Badge variant="outline">{log.entity}</Badge>
                {log.entityId && <span className="text-xs text-muted-foreground">#{log.entityId}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                IP: {log.ipAddress || "-"} | {log.createdAt ? new Date(log.createdAt).toLocaleString("tr-TR") : "-"}
              </p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Kayit bulunamadi.</p>}
      </div>
    </div>
  );
}
