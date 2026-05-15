import React, { useState, useRef } from "react";
import {
  useListTasks, useCreateTask, useDeleteTask, useToggleTask, useSendTaskNow,
  useListTokens, getListTasksQueryKey, getListTokensQueryKey, getListLogsQueryKey
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Loader2, ListTodo, Send, RefreshCw, Timer, Calendar, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language";

const PRESETS = [
  { value: 30, label: "كل 30 ثانية" }, { value: 60, label: "كل دقيقة" },
  { value: 300, label: "كل 5 دقائق" }, { value: 600, label: "كل 10 دقائق" },
  { value: 1800, label: "كل 30 دقيقة" }, { value: 3600, label: "كل ساعة" },
];

export default function TasksPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useListTasks({ query: { queryKey: getListTasksQueryKey() } });
  const { data: tokens } = useListTokens({ query: { queryKey: getListTokensQueryKey() } });
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const toggleTask = useToggleTask();
  const sendNow = useSendTaskNow();

  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [scheduleMode, setScheduleMode] = useState<"interval" | "cron">("interval");
  const [intervalPreset, setIntervalPreset] = useState("custom");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ tokenId: "", channelId: "", serverId: "", message: "", imageUrl: "", intervalSeconds: "", cronExpr: "0 * * * *" });

  const activeTokens = tokens?.filter(t => t.status !== "invalid") ?? [];
  const resetForm = () => { setForm({ tokenId: "", channelId: "", serverId: "", message: "", imageUrl: "", intervalSeconds: "", cronExpr: "0 * * * *" }); setIntervalPreset("custom"); setScheduleMode("interval"); };

  const handleCreate = () => {
    if (!form.tokenId || !form.channelId || !form.message.trim()) {
      toast({ variant: "destructive", title: t("error") }); return;
    }
    const payload = {
      tokenId: Number(form.tokenId), channelId: form.channelId.trim(), message: form.message.trim(),
      scheduleTime: scheduleMode === "cron" ? form.cronExpr : "0 * * * *",
      ...(form.serverId.trim() && { serverId: form.serverId.trim() }),
      ...(form.imageUrl.trim() && { imagePath: form.imageUrl.trim() }),
      ...(scheduleMode === "interval" && form.intervalSeconds && { intervalSeconds: Number(form.intervalSeconds) }),
    };
    createTask.mutate({ data: payload }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListTasksQueryKey() }); toast({ title: t("taskCreated") }); setOpen(false); resetForm(); },
      onError: (err) => toast({ variant: "destructive", title: t("error"), description: err.message }),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      if (res.ok) { const d = await res.json() as { url: string }; setForm(f => ({ ...f, imageUrl: d.url })); toast({ title: t("imageUploaded") }); }
      else toast({ variant: "destructive", title: t("error") });
    } catch { toast({ variant: "destructive", title: t("error") }); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const tokenLabel = (id: number) => { const tok = tokens?.find(t => t.id === id); return tok ? tok.label || `Token #${tok.id}` : `#${id}`; };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><ListTodo className="h-7 w-7 text-primary" />{t("tasksTitle")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("tasksDesc")}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />{t("addTask")}</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      : tasks && tasks.length > 0 ? (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <Card key={task.id} className={`border-border/50 bg-card/40 hover:bg-card/60 transition-all duration-200 ${task.isActive ? "border-primary/20" : "opacity-75"}`}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <Badge variant="outline" className="font-mono text-[10px] h-5">#{task.id}</Badge>
                      <Badge variant="outline" className="text-[10px] h-5 border-blue-500/20 text-blue-400">{tokenLabel(task.tokenId)}</Badge>
                      {task.intervalSeconds
                        ? <Badge variant="secondary" className="text-[10px] h-5 gap-1"><Timer className="h-2.5 w-2.5" />{task.intervalSeconds}s</Badge>
                        : <Badge variant="secondary" className="text-[10px] h-5 gap-1 font-mono"><Calendar className="h-2.5 w-2.5" />{task.scheduleTime}</Badge>}
                      <Badge variant="outline" className="text-[10px] h-5"><RefreshCw className="h-2.5 w-2.5 me-1" />{task.sentCount}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-medium ${task.isActive ? "text-green-400" : "text-muted-foreground"}`}>{task.isActive ? t("on") : t("off")}</span>
                      <Switch checked={task.isActive} onCheckedChange={() => toggleTask.mutate({ id: task.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListTasksQueryKey() }) })} className="scale-75" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground mb-0.5" dir="ltr">ch: {task.channelId}</p>
                      <p className="text-sm text-foreground/90 line-clamp-2 leading-relaxed">{task.message}</p>
                      {task.imagePath && <div className="flex items-center gap-1.5 mt-1.5"><ImageIcon className="h-3 w-3 text-muted-foreground" /><span className="text-[11px] text-muted-foreground truncate max-w-[200px]">{task.imagePath}</span></div>}
                    </div>
                    <div className="flex sm:flex-col items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white" onClick={() => { setSendingId(task.id); sendNow.mutate({ id: task.id }, { onSuccess: (d) => { qc.invalidateQueries({ queryKey: getListLogsQueryKey() }); qc.invalidateQueries({ queryKey: getListTasksQueryKey() }); toast({ title: d.success ? t("sendSuccess") : t("sendFailed"), description: d.message, variant: d.success ? "default" : "destructive" }); setSendingId(null); }, onError: () => setSendingId(null) }); }} disabled={sendingId === task.id}>
                        {sendingId === task.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}{sendingId === task.id ? t("sending") : t("sendNow")}
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteId(task.id)}>
                        <Trash2 className="h-3 w-3" />{t("delete")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/50 bg-card/20">
          <CardContent className="py-16 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-4"><ListTodo className="h-10 w-10 text-muted-foreground/40" /></div>
            <h3 className="text-sm font-medium mb-1">{t("noTasks")}</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-4">{t("noTasksDesc")}</p>
            <Button onClick={() => setOpen(true)} variant="outline" className="gap-2"><Plus className="h-4 w-4" />{t("addTask")}</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg bg-card border-border/50 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ListTodo className="h-5 w-5 text-primary" />{t("newTask")}</DialogTitle>
            <DialogDescription>{t("newTaskDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("selectToken")}</Label>
              <Select value={form.tokenId} onValueChange={(v) => setForm(f => ({ ...f, tokenId: v }))}>
                <SelectTrigger className="bg-background/50 border-border/50"><SelectValue placeholder={t("selectTokenPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {activeTokens.length === 0 ? <SelectItem value="_none" disabled>{t("noActiveTokens")}</SelectItem>
                    : activeTokens.map(tok => <SelectItem key={tok.id} value={String(tok.id)}>{tok.label || `Token #${tok.id}`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("scheduleType")}</Label>
              <div className="flex rounded-lg border border-border/50 overflow-hidden">
                {(["interval", "cron"] as const).map(mode => (
                  <button key={mode} className={`flex-1 py-2 text-sm flex items-center justify-center gap-1.5 transition-colors ${scheduleMode === mode ? "bg-primary text-primary-foreground" : "bg-background/50 text-muted-foreground hover:text-foreground"}`} onClick={() => setScheduleMode(mode)}>
                    {mode === "interval" ? <><Timer className="h-3.5 w-3.5" />{t("intervalMode")}</> : <><Calendar className="h-3.5 w-3.5" />{t("cronMode")}</>}
                  </button>
                ))}
              </div>
            </div>

            {scheduleMode === "interval" ? (
              <div className="space-y-2">
                <Label className="text-sm">{t("intervalLabel")}</Label>
                <Select value={intervalPreset} onValueChange={(v) => { setIntervalPreset(v); if (v !== "custom") setForm(f => ({ ...f, intervalSeconds: v })); }}>
                  <SelectTrigger className="bg-background/50 border-border/50"><SelectValue placeholder={t("intervalPresets")} /></SelectTrigger>
                  <SelectContent>
                    {PRESETS.map(p => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}
                    <SelectItem value="custom">{t("custom")}</SelectItem>
                  </SelectContent>
                </Select>
                {intervalPreset === "custom" && <Input type="number" placeholder={t("customSeconds")} value={form.intervalSeconds} onChange={(e) => setForm(f => ({ ...f, intervalSeconds: e.target.value }))} className="bg-background/50 border-border/50" min={5} />}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-sm">{t("cronExpr")}</Label>
                <Input value={form.cronExpr} onChange={(e) => setForm(f => ({ ...f, cronExpr: e.target.value }))} className="bg-background/50 border-border/50 font-mono" dir="ltr" />
                <p className="text-[11px] text-muted-foreground">{t("cronHelper")}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">{t("serverId")}</Label><Input placeholder={t("serverPlaceholder")} value={form.serverId} onChange={(e) => setForm(f => ({ ...f, serverId: e.target.value }))} className="bg-background/50 border-border/50 font-mono" dir="ltr" /></div>
              <div className="space-y-1.5"><Label className="text-sm">{t("channelId")} *</Label><Input placeholder={t("channelPlaceholder")} value={form.channelId} onChange={(e) => setForm(f => ({ ...f, channelId: e.target.value }))} className="bg-background/50 border-border/50 font-mono" dir="ltr" /></div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("messageContent")} *</Label>
              <Textarea placeholder={t("messagePlaceholder")} value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} className="bg-background/50 border-border/50 min-h-[80px] resize-none" rows={3} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">{t("imageUrl")}</Label>
              <div className="flex gap-2">
                <Input placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="bg-background/50 border-border/50 flex-1 font-mono text-xs" dir="ltr" />
                {form.imageUrl && <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}><X className="h-4 w-4" /></Button>}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" className="gap-2 border-dashed text-xs" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? t("imageUploading") : t("uploadImageBtn")}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={createTask.isPending}>
                {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Plus className="h-4 w-4 me-2" />}
                {createTask.isPending ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader><AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle><AlertDialogDescription>{t("tasksDesc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteId) deleteTask.mutate({ id: deleteId }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListTasksQueryKey() }); toast({ title: t("taskDeleted") }); setDeleteId(null); } }); }}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
