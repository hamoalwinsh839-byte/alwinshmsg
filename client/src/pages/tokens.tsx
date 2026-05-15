import React, { useState } from "react";
import { useListTokens, useCreateToken, useDeleteToken, useTestToken, getListTokensQueryKey } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, CheckCircle2, XCircle, HelpCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language";
import { format } from "date-fns";

export default function TokensPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: tokens, isLoading } = useListTokens({ query: { queryKey: getListTokensQueryKey() } });
  const createToken = useCreateToken();
  const deleteToken = useDeleteToken();
  const testToken = useTestToken();

  const [open, setOpen] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [label, setLabel] = useState("");
  const [showValue, setShowValue] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  const handleAdd = () => {
    if (!tokenValue.trim()) return;
    createToken.mutate({ data: { tokenValue: tokenValue.trim(), label: label.trim() || undefined } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListTokensQueryKey() });
        toast({ title: t("tokenAdded") });
        setOpen(false); setTokenValue(""); setLabel("");
      },
      onError: (err) => toast({ variant: "destructive", title: t("error"), description: err.message }),
    });
  };

  const handleDelete = (id: number) => {
    deleteToken.mutate({ id }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListTokensQueryKey() }); toast({ title: t("tokenDeleted") }); },
    });
  };

  const handleTest = (id: number) => {
    setTestingId(id);
    testToken.mutate({ id }, {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: getListTokensQueryKey() });
        toast({ title: data.valid ? "✓ " + data.message : "✗ " + data.message, variant: data.valid ? "default" : "destructive" });
        setTestingId(null);
      },
      onError: (err) => { toast({ variant: "destructive", title: t("error"), description: err.message }); setTestingId(null); },
    });
  };

  const statusIcon = (s: string) => s === "active" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : s === "invalid" ? <XCircle className="h-4 w-4 text-red-500" /> : <HelpCircle className="h-4 w-4 text-yellow-500" />;
  const statusLabel = (s: string) => s === "active" ? t("active") : s === "invalid" ? t("invalid") : t("unknown");
  const statusBg = (s: string) => s === "active" ? "bg-green-500/10 border-green-500/20" : s === "invalid" ? "bg-red-500/10 border-red-500/20" : "bg-yellow-500/10 border-yellow-500/20";
  const mask = (v: string) => v.slice(0, 10) + "•".repeat(Math.max(0, v.length - 14)) + v.slice(-4);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><KeyRound className="h-7 w-7 text-primary" />{t("tokensTitle")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("tokensDesc")}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" />{t("addToken")}</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : tokens && tokens.length > 0 ? (
        <div className="grid gap-3">
          {tokens.map((token) => (
            <Card key={token.id} className="border-border/50 bg-card/40 hover:bg-card/60 transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg border ${statusBg(token.status)}`}>{statusIcon(token.status)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{token.label || `Token #${token.id}`}</span>
                        <Badge variant={token.status === "invalid" ? "destructive" : "outline"} className={`text-[10px] h-5 ${token.status === "active" ? "border-green-500/30 text-green-400" : ""}`}>{statusLabel(token.status)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate" dir="ltr">{mask(token.tokenValue)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t("addedOn")}: {format(new Date(token.createdAt), "yyyy/MM/dd")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white" onClick={() => handleTest(token.id)} disabled={testingId === token.id}>
                      {testingId === token.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                      {testingId === token.id ? t("testing") : t("test")}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDelete(token.id)}>
                      <Trash2 className="h-3 w-3" />{t("delete")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-border/50 bg-card/20">
          <CardContent className="py-16 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-4"><KeyRound className="h-10 w-10 text-muted-foreground/40" /></div>
            <p className="text-sm text-muted-foreground">{t("noTokens")}</p>
            <Button onClick={() => setOpen(true)} variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" />{t("addToken")}</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />{t("addToken")}</DialogTitle>
            <DialogDescription>{t("tokensDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("tokenValue")}</Label>
              <div className="relative">
                <Input type={showValue ? "text" : "password"} placeholder={t("tokenPlaceholder")} value={tokenValue} onChange={(e) => setTokenValue(e.target.value)} className="bg-background/50 border-border/50 pe-10" dir="ltr" />
                <button type="button" className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground" onClick={() => setShowValue(!showValue)}>
                  {showValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("tokenLabel")}</Label>
              <Input placeholder={t("labelPlaceholder")} value={label} onChange={(e) => setLabel(e.target.value)} className="bg-background/50 border-border/50" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button className="flex-1" onClick={handleAdd} disabled={createToken.isPending || !tokenValue.trim()}>
                {createToken.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Plus className="h-4 w-4 me-2" />}{t("addToken")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
