import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./components/theme-provider";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import BlockVariantsPage from "@/pages/block-variants";
import TestPage from "@/pages/test-page";
import ResultsPage from "@/pages/results-page";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import RankingPage from "@/pages/ranking-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <HomePage />} />
      <ProtectedRoute path="/block/:blockId" component={() => <BlockVariantsPage />} />
      <ProtectedRoute path="/test/:variantId" component={() => <TestPage />} />
      <ProtectedRoute path="/results" component={() => <ResultsPage />} />
      <ProtectedRoute path="/profile" component={() => <ProfilePage />} />
      <ProtectedRoute path="/admin" component={() => <AdminPage />} />
      <ProtectedRoute path="/ranking" component={() => <RankingPage />} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
