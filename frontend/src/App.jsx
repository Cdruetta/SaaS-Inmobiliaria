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
import Sidebar from './components/Sidebar';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Componente Layout para páginas protegidas
const ProtectedLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-72 p-6 bg-gray-50 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {children}
      </main>
    </div>
  );
};

// Componente para rutas protegidas
const ProtectedRoute = ({ children, title }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? (
    <ProtectedLayout title={title}>{children}</ProtectedLayout>
  ) : (
    <Navigate to="/login" />
  );
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
              <ProtectedRoute title="Dashboard">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/properties" element={
              <ProtectedRoute title="Propiedades">
                <Properties />
              </ProtectedRoute>
            } />
            <Route path="/properties/new" element={
              <ProtectedRoute title="Nueva Propiedad">
                <PropertyForm />
              </ProtectedRoute>
            } />
            <Route path="/properties/:id/edit" element={
              <ProtectedRoute title="Editar Propiedad">
                <PropertyForm />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute title="Clientes">
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/clients/new" element={
              <ProtectedRoute title="Nuevo Cliente">
                <ClientForm />
              </ProtectedRoute>
            } />
            <Route path="/clients/:id/edit" element={
              <ProtectedRoute title="Editar Cliente">
                <ClientForm />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute title="Transacciones">
                <Transactions />
              </ProtectedRoute>
            } />
            <Route path="/transactions/new" element={
              <ProtectedRoute title="Nueva Transacción">
                <TransactionForm />
              </ProtectedRoute>
            } />
            <Route path="/transactions/:id/edit" element={
              <ProtectedRoute title="Editar Transacción">
                <TransactionForm />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute title="Perfil">
                <Profile />
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
