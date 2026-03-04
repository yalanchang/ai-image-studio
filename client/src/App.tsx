import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { useAuth0 } from '@auth0/auth0-react';
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Generate from "./pages/Generate";
import Gallery from "./pages/Gallery";
import MyImages from "./pages/MyImages";
import Credits from "./pages/Credits";
import Admin from "./pages/Admin";
import AppLayout from "./components/AppLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  
  console.log('ProtectedRoute - Auth state:', { isAuthenticated, isLoading });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login...');
    loginWithRedirect({
      appState: { returnTo: window.location.pathname }
    });
    return null;
  }
  
  console.log('✅ Authenticated, rendering children');
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      <Route path="/generate">
        <ProtectedRoute>
          <AppLayout><Generate /></AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/gallery">
        <ProtectedRoute>
          <AppLayout><Gallery /></AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/my-images">
        <ProtectedRoute>
          <AppLayout><MyImages /></AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/credits">
        <ProtectedRoute>
          <AppLayout><Credits /></AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute>
          <AppLayout><Admin /></AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isLoading, error } = useAuth0();
  
  console.log('App - Auth0 state:', { isLoading, error });
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Authentication Error</h1>
          <p className="text-red-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
