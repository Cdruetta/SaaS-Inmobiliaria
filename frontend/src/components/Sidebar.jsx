import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
      <header>
        <button
          type="button"
          className="sidebar-burger"
          onClick={toggleSidebar}
        >
          <i className="ai-three-line-horizontal"></i>
        </button>
        <div className="logo">
          <span>InmoApp</span>
        </div>
      </header>
      <ul>
        <li>
          <button
            type="button"
            onClick={() => handleNavigation('/dashboard')}
            className={isActive('/dashboard') ? 'active' : ''}
          >
            <i className="ai-home-alt1"></i>
            <p>Dashboard</p>
          </button>
        </li>

        <li>
          <button
            type="button"
            onClick={() => toggleSubMenu('properties')}
            className={activeMenus.properties ? 'active' : ''}
          >
            <i className="ai-shipping-box-v1"></i>
            <p>Propiedades</p>
            <i className="ai-chevron-down-small"></i>
          </button>
          <div className={`sub-menu ${activeMenus.properties ? 'open' : ''}`}>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigation('/properties')}
                  className={isActive('/properties') ? 'active' : ''}
                >
                  Ver Todas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigation('/properties/new')}
                  className={isActive('/properties/new') ? 'active' : ''}
                >
                  Nueva Propiedad
                </button>
              </li>
            </ul>
          </div>
        </li>

        <li>
          <button
            type="button"
            onClick={() => toggleSubMenu('clients')}
            className={activeMenus.clients ? 'active' : ''}
          >
            <i className="ai-person"></i>
            <p>Clientes</p>
            <i className="ai-chevron-down-small"></i>
          </button>
          <div className={`sub-menu ${activeMenus.clients ? 'open' : ''}`}>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigation('/clients')}
                  className={isActive('/clients') ? 'active' : ''}
                >
                  Ver Todos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigation('/clients/new')}
                  className={isActive('/clients/new') ? 'active' : ''}
                >
                  Nuevo Cliente
                </button>
              </li>
            </ul>
          </div>
        </li>

        <li>
          <button
            type="button"
            onClick={() => toggleSubMenu('transactions')}
            className={activeMenus.transactions ? 'active' : ''}
          >
            <i className="ai-cart"></i>
            <p>Transacciones</p>
            <i className="ai-chevron-down-small"></i>
          </button>
          <div className={`sub-menu ${activeMenus.transactions ? 'open' : ''}`}>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigation('/transactions')}
                  className={isActive('/transactions') ? 'active' : ''}
                >
                  Ver Todas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigation('/transactions/new')}
                  className={isActive('/transactions/new') ? 'active' : ''}
                >
                  Nueva Transacción
                </button>
              </li>
            </ul>
          </div>
        </li>

        <li>
          <button
            type="button"
            onClick={() => handleNavigation('/profile')}
            className={isActive('/profile') ? 'active' : ''}
          >
            <i className="ai-lock-on"></i>
            <p>Perfil</p>
          </button>
        </li>

        <li>
          <button
            type="button"
            onClick={handleLogout}
          >
            <i className="ai-log-out"></i>
            <p>Cerrar Sesión</p>
          </button>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;