import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyForm from './pages/PropertyForm';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import Transactions from './pages/Transactions';
import TransactionForm from './pages/TransactionForm';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
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
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* Rutas protegidas */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/properties" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Properties />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/properties/new" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <PropertyForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/properties/:id/edit" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <PropertyForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Clients />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/clients/new" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <ClientForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/clients/:id/edit" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <ClientForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <Transactions />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/transactions/new" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <TransactionForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/transactions/:id/edit" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <TransactionForm />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <div>
                  <Navbar />
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
