import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@/lib/api";
import { Loader2, LayoutDashboard, KeyRound, ListTodo, ScrollText, LogOut, TerminalSquare, Globe, Sun, Moon, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts/language";
import { useTheme } from "@/contexts/theme";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe();
  const logout = useLogout();
  const { t, lang, setLang, isRtl } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { if (isError) setLocation("/"); }, [isError, setLocation]);

  if (isLoading) return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
          <TerminalSquare className="h-8 w-8 text-primary" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  );

  if (!user) return null;

  const navItems = [
    { href: "/dashboard", labelKey: "overview" as const, icon: LayoutDashboard },
    { href: "/tokens", labelKey: "tokens" as const, icon: KeyRound },
    { href: "/tasks", labelKey: "tasks" as const, icon: ListTodo },
    { href: "/logs", labelKey: "logs" as const, icon: ScrollText },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <TerminalSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block">{t("appName")}</span>
            <span className="text-[10px] text-muted-foreground">by Alwinsh</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${isActive ? "bg-primary/10 text-primary font-medium border border-primary/20 shadow-sm" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"}`}>
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span className="text-sm">{t(item.labelKey)}</span>
                {isActive && <div className={`${isRtl ? "mr-auto" : "ml-auto"} w-1.5 h-1.5 rounded-full bg-primary animate-pulse`} />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/50 bg-secondary/40 hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="flex items-center flex-1 gap-1.5 px-3 py-2 rounded-lg bg-secondary/40 border border-border/30">
            <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="flex gap-1 ml-auto">
              {(["ar", "en"] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {l === "ar" ? "ع" : "EN"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg bg-secondary/20 border border-border/20">
          <p className="text-[10px] text-muted-foreground mb-0.5">{lang === "ar" ? "المستخدم" : "Logged in as"}</p>
          <p className="text-sm font-medium truncate">@{user.username}</p>
        </div>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
          onClick={() => logout.mutate(undefined, { onSuccess: () => setLocation("/") })}>
          <LogOut className="h-3.5 w-3.5" />{t("logout")}
        </Button>
      </div>
    </>
  );

  return (
    <div className={`min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row font-sans`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card/80 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20"><TerminalSquare className="h-4 w-4 text-primary" /></div>
          <span className="font-bold text-sm">{t("appName")}</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg border border-border/50 bg-secondary/40">
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />}
      {mobileOpen && (
        <aside className={`md:hidden fixed top-0 ${isRtl ? "right-0" : "left-0"} h-full w-72 z-40 bg-card border-border/50 flex flex-col shadow-2xl`}>
          <SidebarContent />
        </aside>
      )}

      <aside className={`hidden md:flex w-64 bg-card/50 border-b md:border-b-0 ${isRtl ? "md:border-l" : "md:border-r"} border-border/50 flex-col sticky top-0 h-[100dvh] shadow-2xl`}>
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
        <footer className="py-3 text-center border-t border-border/30 bg-card/20">
          <p className="text-xs text-muted-foreground font-mono">{t("copyright")}</p>
        </footer>
      </div>
    </div>
  );
}
