import { useListLogs, getListLogsQueryKey } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ScrollText, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language";

export default function LogsPage() {
  const { t } = useLanguage();
  const { data: logs, isLoading } = useListLogs({ query: { queryKey: getListLogsQueryKey() } });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ScrollText className="h-7 w-7 text-primary" />{t("logsTitle")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("logsDesc")}</p>
      </div>
      <Card className="border-border/50 bg-card/30">
        <CardHeader className="pb-2">
          <p className="text-sm text-muted-foreground">{logs ? `${logs.length} ${t("logsTitle").toLowerCase()}` : ""}</p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : logs && logs.length > 0 ? (
            <div className="divide-y divide-border/30">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 px-6 py-2.5 bg-muted/20 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>{t("status")}</span><span>{t("task")}</span><span>{t("channel")}</span><span>{t("time")}</span>
              </div>
              {logs.map((log) => (
                <div key={log.id} className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 px-6 py-3 hover:bg-muted/10 transition-colors items-center">
                  <div>{log.status === "success" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}</div>
                  <Badge variant="outline" className="text-[10px] h-5 font-mono border-border/50 w-fit">#{log.taskId}</Badge>
                  <span className="text-xs font-mono text-muted-foreground" dir="ltr">{log.channelId}</span>
                  <div className="flex flex-col">
                    <span className="text-xs tabular-nums">{format(new Date(log.sentAt), "HH:mm:ss")}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(log.sentAt), "yyyy/MM/dd")}</span>
                    {log.errorMessage && <span className="text-[10px] text-destructive mt-0.5 truncate max-w-[120px]">{log.errorMessage}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-4"><ScrollText className="h-10 w-10 text-muted-foreground/30" /></div>
              <p className="text-sm text-muted-foreground">{t("noLogs")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
