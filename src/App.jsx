import { useEffect } from "react";
import MainLayout from "./components/MainLayout";
import { useAuth } from "./contexts/AuthContext";
import { ConfigProvider } from "./contexts/ConfigContext";
import "./App.css";

function AppContent() {
  const { isAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show message if not authenticated and no token available
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Required</h2>
          <p className="text-gray-600">
            Please access this application through the main portal with a valid authentication token.
          </p>
        </div>
      </div>
    );
  }

  return <MainLayout />;
}

function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  );
}

export default App;
