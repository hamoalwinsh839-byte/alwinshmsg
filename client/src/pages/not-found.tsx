import { Link } from "wouter";
import { TerminalSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-background">
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
        <TerminalSquare className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-muted-foreground text-sm">الصفحة غير موجودة</p>
      <Link href="/" className="text-primary text-sm hover:underline">العودة للرئيسية</Link>
    </div>
  );
}
