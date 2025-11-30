import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEBDD] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4d0011]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#EDEBDD] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4d0011]" />
      </div>
    );
  }

  return <Component />;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/");
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDEBDD] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4d0011]" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-[#EDEBDD] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4d0011]" />
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/auth" component={() => <PublicRoute component={AuthPage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
