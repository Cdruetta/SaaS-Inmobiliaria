import { Link } from 'react-router-dom';
import { Building, Users, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { useDashboardStats } from './useDashboardStats';

const Dashboard = () => {
  const { stats, loading, error } = useDashboardStats();

  const statCards = [
    {
      label: 'Total Propiedades',
      value: stats.totalProperties,
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      label: 'Total Clientes',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      label: 'Transacciones',
      value: stats.totalTransactions,
      icon: FileText,
      color: 'bg-yellow-500'
    },
    {
      label: 'Valor Total',
      value: `$${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Resumen general de tu inmobiliaria
          </p>
        </div>

        <Link
          to="/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Nueva Propiedad
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white shadow rounded-lg p-5">
            <div className="flex items-center">
              <div className={`p-3 rounded-md ${color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-semibold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Acciones rápidas
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            to="/properties/new"
            icon={Building}
            color="text-blue-600"
            title="Agregar Propiedad"
            description="Cargar una nueva propiedad"
          />
          <QuickAction
            to="/clients"
            icon={Users}
            color="text-green-600"
            title="Gestionar Clientes"
            description="Administrar tus clientes"
          />
          <QuickAction
            to="/transactions/new"
            icon={TrendingUp}
            color="text-orange-600"
            title="Nueva Transacción"
            description="Registrar una transacción"
          />
        </div>
      </div>
    </div>
  );
};

const QuickAction = ({ to, icon: Icon, color, title, description }) => (
  <Link
    to={to}
    className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
  >
    <div className="flex items-center">
      <Icon className={`h-8 w-8 ${color}`} />
      <div className="ml-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  </Link>
);

export default Dashboard;
