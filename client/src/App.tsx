import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { LanguageProvider } from "@/contexts/language";
import { ThemeProvider } from "@/contexts/theme";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import TokensPage from "@/pages/tokens";
import TasksPage from "@/pages/tasks";
import LogsPage from "@/pages/logs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const e = error as { status?: number };
        if (e?.status === 401 || e?.status === 403 || e?.status === 404) return false;
        return failureCount < 2;
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Switch>
              <Route path="/" component={AuthPage} />
              <Route path="/dashboard">
                <Layout><DashboardPage /></Layout>
              </Route>
              <Route path="/tokens">
                <Layout><TokensPage /></Layout>
              </Route>
              <Route path="/tasks">
                <Layout><TasksPage /></Layout>
              </Route>
              <Route path="/logs">
                <Layout><LogsPage /></Layout>
              </Route>
              <Route component={NotFound} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
