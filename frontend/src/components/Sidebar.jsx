import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Building,
  Users,
  FileText,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeMenus, setActiveMenus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubMenu = (menuKey) => {
    setActiveMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${isOpen ? '' : 'sidebar-closed'}`}>
      <header className="sidebar-header">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="sidebar-logo">
          <span className="text-lg font-semibold text-gray-900">InmoApp</span>
        </div>
      </header>

      <nav className="sidebar-nav">
        <button
          type="button"
          onClick={() => handleNavigation('/dashboard')}
          className={`sidebar-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <Home className="h-5 w-5" />
          <span>Dashboard</span>
        </button>

        <div className="sidebar-group">
          <button
            type="button"
            onClick={() => toggleSubMenu('properties')}
            className={`sidebar-item ${activeMenus.properties ? 'active' : ''}`}
          >
            <Building className="h-5 w-5" />
            <span>Propiedades</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${activeMenus.properties ? 'rotate-180' : ''}`} />
          </button>
          <div className={`sidebar-submenu ${activeMenus.properties ? 'open' : ''}`}>
            <button
              type="button"
              onClick={() => handleNavigation('/properties')}
              className={`sidebar-submenu-item ${isActive('/properties') ? 'active' : ''}`}
            >
              Ver Todas
            </button>
            <button
              type="button"
              onClick={() => handleNavigation('/properties/new')}
              className={`sidebar-submenu-item ${isActive('/properties/new') ? 'active' : ''}`}
            >
              Nueva Propiedad
            </button>
          </div>
        </div>

        <div className="sidebar-group">
          <button
            type="button"
            onClick={() => toggleSubMenu('clients')}
            className={`sidebar-item ${activeMenus.clients ? 'active' : ''}`}
          >
            <Users className="h-5 w-5" />
            <span>Clientes</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${activeMenus.clients ? 'rotate-180' : ''}`} />
          </button>
          <div className={`sidebar-submenu ${activeMenus.clients ? 'open' : ''}`}>
            <button
              type="button"
              onClick={() => handleNavigation('/clients')}
              className={`sidebar-submenu-item ${isActive('/clients') ? 'active' : ''}`}
            >
              Ver Todos
            </button>
            <button
              type="button"
              onClick={() => handleNavigation('/clients/new')}
              className={`sidebar-submenu-item ${isActive('/clients/new') ? 'active' : ''}`}
            >
              Nuevo Cliente
            </button>
          </div>
        </div>

        <div className="sidebar-group">
          <button
            type="button"
            onClick={() => toggleSubMenu('transactions')}
            className={`sidebar-item ${activeMenus.transactions ? 'active' : ''}`}
          >
            <FileText className="h-5 w-5" />
            <span>Transacciones</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${activeMenus.transactions ? 'rotate-180' : ''}`} />
          </button>
          <div className={`sidebar-submenu ${activeMenus.transactions ? 'open' : ''}`}>
            <button
              type="button"
              onClick={() => handleNavigation('/transactions')}
              className={`sidebar-submenu-item ${isActive('/transactions') ? 'active' : ''}`}
            >
              Ver Todas
            </button>
            <button
              type="button"
              onClick={() => handleNavigation('/transactions/new')}
              className={`sidebar-submenu-item ${isActive('/transactions/new') ? 'active' : ''}`}
            >
              Nueva Transacción
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleNavigation('/profile')}
          className={`sidebar-item ${isActive('/profile') ? 'active' : ''}`}
        >
          <User className="h-5 w-5" />
          <span>Perfil</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-item text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;