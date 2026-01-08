import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthCard from './components/AuthCard';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyForm from './pages/PropertyForm';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import Transactions from './pages/Transactions';
import TransactionForm from './pages/TransactionForm';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rutas públicas (solo cuando no está autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={
              <PublicRoute>
                <AuthCard />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <AuthCard />
              </PublicRoute>
            } />

            {/* Rutas protegidas */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/properties" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <Properties />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/properties/new" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <PropertyForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/properties/:id/edit" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <PropertyForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <Clients />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/clients/new" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <ClientForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/clients/:id/edit" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <ClientForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <Transactions />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/transactions/new" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <TransactionForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/transactions/:id/edit" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <TransactionForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="flex">
                  <Sidebar />
                  <main className="flex-1 ml-72 p-6 bg-gray-50 min-h-screen">
                    <Profile />
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>

          {/* Toast Container Global */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
