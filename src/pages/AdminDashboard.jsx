import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import useAdminStore from '../store/adminStore';
import { completeDomicileFees } from '../data/completeDomicileData';

const AdminLayout = ({ children }) => (
  <div className="container mx-auto p-4 pb-16">
    <div className="grid md:grid-cols-4 gap-4">
      <aside className="md:col-span-1 bg-white rounded shadow p-4 space-y-2">
        <Link className="block hover:underline" to="/admin">Overview</Link>
        <Link className="block hover:underline text-blue-600 font-medium" to="/admin/orders">Commandes + Yalidine</Link>
        <Link className="block hover:underline text-pink-600 font-medium" to="/admin/statistiques">Statistiques</Link>
        <Link className="block hover:underline" to="/admin/fees">Shipping Fees</Link>
        <Link className="block hover:underline text-green-600 font-medium" to="/admin/categories">Categories</Link>
        <Link className="block hover:underline" to="/admin/products">Products</Link>
        <Link className="block hover:underline text-purple-600 font-medium" to="/admin/accounts">Accounts</Link>
        <Link className="block hover:underline text-orange-600 font-medium" to="/admin/promotions">Promotions</Link>
        <Link className="block hover:underline" to="/admin/yalidine-config">Configuration Yalidine</Link>
        <button 
          className="block w-full mt-6 py-2 text-center bg-red-600 hover:bg-red-700 text-white font-bold rounded" 
          onClick={() => {
            const logout = useAdminStore.getState().logout;
            logout();
            window.location.href = '/admin/login';
          }}
        >
          Déconnecter
        </button>
      </aside>
      <main className="md:col-span-3 bg-white rounded shadow p-4">
        {children}
      </main>
    </div>
  </div>
);

export const RequireAdmin = ({ children }) => {
  const isAuthenticated = useAdminStore(s => s.isAuthenticated);
  const initAuth = useAdminStore(s => s.initAuth);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Initialize auth from localStorage
    initAuth();
    setIsLoading(false);
  }, [initAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="bg-white rounded shadow p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p>Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/admin/login');
    return null;
  }

  return children;
};

export const AdminOverview = () => {
  const { products, categories, accounts } = useAdminStore();
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          // If stats endpoint doesn't exist, use mock data
          setStats({
            totalOrders: 0,
            totalRevenue: 0,
            totalProducts: products.length,
            totalCustomers: accounts.length
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Use mock data as fallback
        setStats({
          totalOrders: 0,
          totalRevenue: 0,
          totalProducts: products.length,
          totalCustomers: accounts.length
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [products.length, accounts.length]);

  const formatPrice = (price) => {
    return `${price.toLocaleString()} DZD`;
  };

  if (loading) {
  return (
    <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-pink-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Dashboard Administrateur</h1>
          <p className="text-pink-100">Vue d'ensemble de votre boutique Almezouara</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commandes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.totalRevenue || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalAccounts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Promotions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPromotions || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des Commandes</h3>
            <div className="space-y-3">
              {stats?.ordersByStatus && Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      status === 'processing' ? 'bg-blue-500' :
                      status === 'shipped' ? 'bg-yellow-500' :
                      status === 'delivered' ? 'bg-green-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Methods */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthodes de Livraison</h3>
            <div className="space-y-3">
              {stats?.ordersByDelivery && Object.entries(stats.ordersByDelivery).map(([method, count]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      method === 'domicile' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {method === 'domicile' ? 'Livraison à domicile' : 'Stopdesk'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du Chiffre d'Affaires (6 derniers mois)</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {stats?.monthlyRevenue && Object.entries(stats.monthlyRevenue).map(([month, revenue]) => {
              const maxRevenue = Math.max(...Object.values(stats.monthlyRevenue));
              const height = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
              return (
                <div key={month} className="flex flex-col items-center flex-1">
                  <div className="w-full bg-gray-200 rounded-t relative">
                    <div 
                      className="bg-gradient-to-t from-primary to-pink-500 rounded-t transition-all duration-500"
                      style={{ height: `${height}%`, minHeight: revenue > 0 ? '8px' : '0px' }}
                    ></div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-600">{month}</p>
                    <p className="text-xs text-gray-500">{formatPrice(revenue)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité Récente</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-600">{stats?.recentOrdersCount || 0} nouvelles commandes cette semaine</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-600">{products.length} produits en catalogue</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span className="text-gray-600">{categories.length} catégories actives</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export const AdminOrders = () => {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filteredOrders, setFilteredOrders] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/admin/orders');
        const data = await response.json();
        setOrders(data.orders || []);
        setFilteredOrders(data.orders || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  React.useEffect(() => {
    let filtered = orders;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phoneNumber.includes(searchTerm) ||
        order.wilaya.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm]);

  const formatPrice = (price) => {
    return `${price.toLocaleString()} DZD`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = [
      'ID Commande',
      'Date',
      'Client',
      'Téléphone',
      'Wilaya',
      'Ville',
      'Adresse',
      'Méthode Livraison',
      'Produits',
      'Prix Produits',
      'Frais Livraison',
      'Total',
      'Statut',
      'Réduction'
    ];

    const csvData = filteredOrders.map(order => [
      order.id,
      formatDate(order.createdAt),
      order.fullName,
      order.phoneNumber,
      order.wilaya,
      order.city,
      order.address,
      order.deliveryMethod === 'domicile' ? 'Livraison à domicile' : 'Stopdesk',
      order.items.map(item => `${item.name} (${item.color}, ${item.size})`).join('; '),
      formatPrice(order.productPrice || 0),
      formatPrice(order.shippingCost || 0),
      formatPrice(order.total),
      order.status,
      order.discountPercentage ? `${order.discountPercentage}%` : '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      processing: 'En cours',
      shipped: 'Expédié',
      delivered: 'Livré',
      cancelled: 'Annulé'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exporter CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
            <input
              type="text"
              placeholder="ID commande, nom, téléphone, wilaya..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="processing">En cours</option>
              <option value="shipped">Expédié</option>
              <option value="delivered">Livré</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Commandes</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">Résultats filtrés</p>
            <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">CA Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-600">CA Moyen</p>
            <p className="text-2xl font-bold text-gray-900">
              {filteredOrders.length > 0 ? formatPrice(Math.round(filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0) / filteredOrders.length)) : '0 DZD'}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livraison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
                        <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.fullName}</div>
                        <div className="text-sm text-gray-500">{order.phoneNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{order.wilaya}, {order.city}</div>
                        <div className="text-sm text-gray-500">
                          {order.deliveryMethod === 'domicile' ? 'À domicile' : 'Stopdesk'}
                          {order.shippingCost && ` • ${formatPrice(order.shippingCost)}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.map((item, index) => (
                          <div key={index} className="mb-1">
                            {item.name} 
                            {item.quantity && ` x${item.quantity}`}
                            <span className="text-gray-500 text-xs">
                              {item.color && ` • ${item.color}`}
                              {item.size && ` • ${item.size}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatPrice(order.total)}</div>
                        {order.discountPercentage > 0 && (
                          <div className="text-xs text-green-600">-{order.discountPercentage}%</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande trouvée</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Essayez de modifier vos filtres de recherche.' 
                  : 'Les commandes apparaîtront ici une fois créées.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export const AdminFees = () => {
  const { shippingFees, addShippingFee, removeShippingFee } = useAdminStore();
  const [form, setForm] = React.useState({ wilaya: '', city: '', domicilePrice: '', stopdeskPrice: '' });
  const [editingId, setEditingId] = React.useState(null);
  const [editForm, setEditForm] = React.useState({});

  // Real Algerian shipping data
  const [stopdeskFees, setStopdeskFees] = React.useState([
    { id: 1, nomDesk: 'Agence de Adrar', commune: 'Adrar', wilaya: 'Adrar', prix: 850 },
    { id: 2, nomDesk: 'Agence de Timimoun', commune: 'Timimoun', wilaya: 'Adrar', prix: 850 },
    { id: 3, nomDesk: 'Agence de Chlef', commune: 'Chlef', wilaya: 'Chlef', prix: 400 },
    { id: 4, nomDesk: 'Agence de Ténès', commune: 'Ténès', wilaya: 'Chlef', prix: 400 },
    { id: 5, nomDesk: 'Agence de Laghouat', commune: 'Laghouat', wilaya: 'Laghouat', prix: 600 },
    { id: 6, nomDesk: 'Agence de Aflou', commune: 'Aflou', wilaya: 'Laghouat', prix: 600 },
    { id: 7, nomDesk: 'Agence de Oum el Bouaghi', commune: 'Oum el Bouaghi', wilaya: 'Oum El Bouaghi', prix: 400 },
    { id: 8, nomDesk: 'Agence de Aïn M\'lila', commune: 'Aïn M\'lila', wilaya: 'Oum El Bouaghi', prix: 400 },
    { id: 9, nomDesk: 'Agence de Batna', commune: 'Batna', wilaya: 'Batna', prix: 400 },
    { id: 10, nomDesk: 'Agence de Barika', commune: 'Barika', wilaya: 'Batna', prix: 400 },
    { id: 11, nomDesk: 'Agence de Béjaïa', commune: 'Béjaïa', wilaya: 'Béjaïa', prix: 400 },
    { id: 12, nomDesk: 'Agence de Akbou', commune: 'Akbou', wilaya: 'Béjaïa', prix: 400 },
    { id: 13, nomDesk: 'Agence de El Kseur', commune: 'El Kseur', wilaya: 'Béjaïa', prix: 400 },
    { id: 14, nomDesk: 'Agence de Biskra', commune: 'Biskra', wilaya: 'Biskra', prix: 600 },
    { id: 15, nomDesk: 'Agence de Ouled Djellal', commune: 'Ouled Djellal', wilaya: 'Biskra', prix: 600 },
    { id: 16, nomDesk: 'Agence de Tolga', commune: 'Tolga', wilaya: 'Biskra', prix: 650 },
    { id: 17, nomDesk: 'Agence de Béchar', commune: 'Béchar', wilaya: 'Béchar', prix: 600 },
    { id: 18, nomDesk: 'Agence de Blida', commune: 'Blida', wilaya: 'Blida', prix: 400 },
    { id: 19, nomDesk: 'Agence de Bouarfa', commune: 'Bouarfa', wilaya: 'Blida', prix: 400 },
    { id: 20, nomDesk: 'Agence de Boufarik', commune: 'Boufarik', wilaya: 'Blida', prix: 400 },
    { id: 21, nomDesk: 'Agence de Larbaa', commune: 'Larbaa', wilaya: 'Blida', prix: 400 },
    { id: 22, nomDesk: 'Agence de Bouira', commune: 'Bouira', wilaya: 'Bouira', prix: 400 },
    { id: 23, nomDesk: 'Agence de Lakhdaria', commune: 'Lakhdaria', wilaya: 'Bouira', prix: 400 },
    { id: 24, nomDesk: 'Agence de Sour El Ghouzlane', commune: 'Sour El Ghouzlane', wilaya: 'Bouira', prix: 400 },
    { id: 25, nomDesk: 'Agence de Tamanrasset', commune: 'Tamanrasset', wilaya: 'Tamanrasset', prix: 1000 },
    { id: 26, nomDesk: 'Agence de In Salah', commune: 'In Salah', wilaya: 'Tamanrasset', prix: 1000 },
    { id: 27, nomDesk: 'Agence de Tébessa', commune: 'Tébessa', wilaya: 'Tébessa', prix: 600 },
    { id: 28, nomDesk: 'Agence de Skanska', commune: 'Tébessa', wilaya: 'Tébessa', prix: 600 },
    { id: 29, nomDesk: 'Agence de Tlemcen', commune: 'Tlemcen', wilaya: 'Tlemcen', prix: 300 },
    { id: 30, nomDesk: 'Agence de Maghnia', commune: 'Maghnia', wilaya: 'Tlemcen', prix: 300 },
    { id: 31, nomDesk: 'Agence de Mansourah', commune: 'Mansourah', wilaya: 'Tlemcen', prix: 300 },
    { id: 32, nomDesk: 'Agence Chetouane', commune: 'Chetouane', wilaya: 'Tlemcen', prix: 300 },
    { id: 33, nomDesk: 'Agence Remchi', commune: 'Remchi', wilaya: 'Tlemcen', prix: 300 },
    { id: 34, nomDesk: 'Agence de Frenda', commune: 'Frenda', wilaya: 'Tiaret', prix: 400 },
    { id: 35, nomDesk: 'Agence de Tiaret', commune: 'Tiaret', wilaya: 'Tiaret', prix: 400 },
    { id: 36, nomDesk: 'Agence de Bekkar', commune: 'Tizi Ouzou', wilaya: 'Tizi Ouzou', prix: 400 },
    { id: 37, nomDesk: 'Agence de nouvelle ville', commune: 'Tizi Ouzou', wilaya: 'Tizi Ouzou', prix: 400 },
    { id: 38, nomDesk: 'Agence de Tizi Gheniff', commune: 'Tizi Gheniff', wilaya: 'Tizi Ouzou', prix: 400 },
    { id: 39, nomDesk: 'Agence de Azazga', commune: 'Azazga', wilaya: 'Tizi Ouzou', prix: 400 },
    { id: 40, nomDesk: 'Agence de Draâ Ben Khedda', commune: 'Draâ Ben Khedda', wilaya: 'Tizi Ouzou', prix: 400 },
    { id: 41, nomDesk: 'Agence de Alger Centre', commune: 'Alger Centre', wilaya: 'Alger', prix: 350 },
    { id: 42, nomDesk: 'Agence de Birkhadem', commune: 'Birkhadem', wilaya: 'Alger', prix: 350 },
    { id: 43, nomDesk: 'Agence de Bordj El Kiffan', commune: 'Bordj El Kiffan', wilaya: 'Alger', prix: 350 },
    { id: 44, nomDesk: 'Agence de Aïn Benian', commune: 'Aïn Benian', wilaya: 'Alger', prix: 350 },
    { id: 45, nomDesk: 'Agence de Birtouta', commune: 'Birtouta', wilaya: 'Alger', prix: 350 },
    { id: 46, nomDesk: 'Agence de Zeralda', commune: 'Zeralda', wilaya: 'Alger', prix: 350 },
    { id: 47, nomDesk: 'Agence de Dar Diaf', commune: 'Cheraga', wilaya: 'Alger', prix: 350 },
    { id: 48, nomDesk: 'Agence de Draria', commune: 'Draria', wilaya: 'Alger', prix: 350 },
    { id: 49, nomDesk: 'Agence de Oued Tarfa', commune: 'Draria', wilaya: 'Alger', prix: 350 },
    { id: 50, nomDesk: 'Agence de Bordj El Bahri', commune: 'Bordj El Bahri', wilaya: 'Alger', prix: 350 },
    { id: 51, nomDesk: 'Agence de Hussein Dey', commune: 'Hussein Dey', wilaya: 'Alger', prix: 350 },
    { id: 52, nomDesk: 'Agence Les Eucalyptus', commune: 'Les Eucalyptus', wilaya: 'Alger', prix: 350 },
    { id: 53, nomDesk: 'Agence de DNC', commune: 'Reghaïa', wilaya: 'Alger', prix: 350 },
    { id: 54, nomDesk: 'Agence de Signa', commune: 'Reghaïa', wilaya: 'Alger', prix: 350 },
    { id: 55, nomDesk: 'Agence de Rouiba', commune: 'Rouiba', wilaya: 'Alger', prix: 350 },
    { id: 56, nomDesk: 'Agence de Aïn Oussara', commune: 'Aïn Oussara', wilaya: 'Djelfa', prix: 600 },
    { id: 57, nomDesk: 'Agence de Djelfa', commune: 'Djelfa', wilaya: 'Djelfa', prix: 600 },
    { id: 58, nomDesk: 'Agence de Jijel', commune: 'Jijel', wilaya: 'Jijel', prix: 400 },
    { id: 59, nomDesk: 'Agence de Taher', commune: 'Taher', wilaya: 'Jijel', prix: 400 },
    { id: 60, nomDesk: 'Agence de Aïn Oulmene', commune: 'Aïn Oulmene', wilaya: 'Sétif', prix: 400 },
    { id: 61, nomDesk: 'Agence de Bougaa', commune: 'Bougaa', wilaya: 'Sétif', prix: 400 },
    { id: 62, nomDesk: 'Agence de El Eulma', commune: 'El Eulma', wilaya: 'Sétif', prix: 400 },
    { id: 63, nomDesk: 'El Hidhab', commune: 'Sétif', wilaya: 'Sétif', prix: 400 },
    { id: 64, nomDesk: 'Maabouda', commune: 'Sétif', wilaya: 'Sétif', prix: 400 },
    { id: 65, nomDesk: 'Agence de Saïda', commune: 'Saïda', wilaya: 'Saïda', prix: 400 },
    { id: 66, nomDesk: 'Agence de Azzaba', commune: 'Azzaba', wilaya: 'Skikda', prix: 400 },
    { id: 67, nomDesk: 'Agence de Collo', commune: 'Collo', wilaya: 'Skikda', prix: 400 },
    { id: 68, nomDesk: 'Agence de El Harrouch', commune: 'El Harrouch', wilaya: 'Skikda', prix: 400 },
    { id: 69, nomDesk: 'Agence de Skikda', commune: 'Skikda', wilaya: 'Skikda', prix: 400 },
    { id: 70, nomDesk: 'Agence de Sidi Bel Abbes', commune: 'Sidi Bel Abbes', wilaya: 'Sidi Bel Abbès', prix: 350 },
    { id: 71, nomDesk: 'Benhamouda', commune: 'Sidi Bel Abbes', wilaya: 'Sidi Bel Abbès', prix: 350 },
    { id: 72, nomDesk: 'Agence de Gassiot', commune: 'Annaba', wilaya: 'Annaba', prix: 400 },
    { id: 73, nomDesk: 'Agence de Sidi Brahim', commune: 'Annaba', wilaya: 'Annaba', prix: 400 },
    { id: 74, nomDesk: 'Agence de El Bouni', commune: 'El Bouni', wilaya: 'Annaba', prix: 400 },
    { id: 75, nomDesk: 'Agence de Guelma', commune: 'Guelma', wilaya: 'Guelma', prix: 400 },
    { id: 76, nomDesk: 'Agence de Oued Zenati', commune: 'Oued Zenati', wilaya: 'Guelma', prix: 400 },
    { id: 77, nomDesk: 'Agence Belle vue', commune: 'Constantine', wilaya: 'Constantine', prix: 400 },
    { id: 78, nomDesk: 'Agence Sidi Mabrouk', commune: 'Constantine', wilaya: 'Constantine', prix: 400 },
    { id: 79, nomDesk: 'Agence de Didouche Mourad', commune: 'Didouche Mourad', wilaya: 'Constantine', prix: 400 },
    { id: 80, nomDesk: 'Agence de El Khroub', commune: 'El Khroub', wilaya: 'Constantine', prix: 400 },
    { id: 81, nomDesk: 'Agence Ali Mendjeli', commune: 'El Khroub', wilaya: 'Constantine', prix: 400 },
    { id: 82, nomDesk: 'Agence de Médéa [El Koutab]', commune: 'Médéa', wilaya: 'Médéa', prix: 400 },
    { id: 83, nomDesk: 'Agence de Médéa [Pole Urbain]', commune: 'Médéa', wilaya: 'Médéa', prix: 400 },
    { id: 84, nomDesk: 'Agence de Salamandre', commune: 'Mostaganem', wilaya: 'Mostaganem', prix: 400 },
    { id: 85, nomDesk: 'Agence de Kharouba', commune: 'Mostaganem', wilaya: 'Mostaganem', prix: 400 },
    { id: 86, nomDesk: 'Agence de Berhoum', commune: 'Berhoum', wilaya: 'M\'Sila', prix: 400 },
    { id: 87, nomDesk: 'Agence de Bou Saâda', commune: 'Bou Saâda', wilaya: 'M\'Sila', prix: 400 },
    { id: 88, nomDesk: 'Agence de M\'Sila', commune: 'M\'Sila', wilaya: 'M\'Sila', prix: 400 },
    { id: 89, nomDesk: 'Agence de Mascara', commune: 'Mascara', wilaya: 'Mascara', prix: 400 },
    { id: 90, nomDesk: 'Agence de Hassi Messaoud', commune: 'Hassi Messaoud', wilaya: 'Ouargla', prix: 600 },
    { id: 91, nomDesk: 'Agence de Ouargla', commune: 'Ouargla', wilaya: 'Ouargla', prix: 600 },
    { id: 92, nomDesk: 'Agence de Touggourt', commune: 'Touggourt', wilaya: 'Ouargla', prix: 600 },
    { id: 93, nomDesk: 'El Morchid', commune: 'Bir El Djir', wilaya: 'Oran', prix: 400 },
    { id: 94, nomDesk: 'Agence Fernand Ville', commune: 'Bir El Djir', wilaya: 'Oran', prix: 400 },
    { id: 95, nomDesk: 'Saint Hubert', commune: 'Oran', wilaya: 'Oran', prix: 400 },
    { id: 96, nomDesk: 'Cité Djamel', commune: 'Oran', wilaya: 'Oran', prix: 400 },
    { id: 97, nomDesk: 'Agence de Arzew', commune: 'Arzew', wilaya: 'Oran', prix: 400 },
    { id: 98, nomDesk: 'Agence de Gambetta', commune: 'Oran', wilaya: 'Oran', prix: 400 },
    { id: 99, nomDesk: 'Agence de El Bayadh', commune: 'El Bayadh', wilaya: 'El Bayadh', prix: 850 },
    { id: 100, nomDesk: 'Agence de Illizi', commune: 'Illizi', wilaya: 'Illizi', prix: 1000 },
    { id: 101, nomDesk: 'Agence de El Djebasse', commune: 'Bordj Bou Arreridj', wilaya: 'Bordj Bou Arreridj', prix: 400 },
    { id: 102, nomDesk: 'Agence Cité Soualem', commune: 'Bordj Bou Arreridj', wilaya: 'Bordj Bou Arreridj', prix: 400 },
    { id: 103, nomDesk: 'Agence de Boumerdes', commune: 'Boumerdes', wilaya: 'Boumerdès', prix: 400 },
    { id: 104, nomDesk: 'Agence de Bordj Menaiel', commune: 'Bordj Menaiel', wilaya: 'Boumerdès', prix: 400 },
    { id: 105, nomDesk: 'Agence de Ben Mehidi', commune: 'Ben Mehidi', wilaya: 'El Tarf', prix: 400 },
    { id: 106, nomDesk: 'Agence de El Tarf', commune: 'El Tarf', wilaya: 'El Tarf', prix: 400 },
    { id: 107, nomDesk: 'Agence de Tindouf', commune: 'Tindouf', wilaya: 'Tindouf', prix: 1000 },
    { id: 108, nomDesk: 'Agence de Tissemsilt', commune: 'Tissemsilt', wilaya: 'Tissemsilt', prix: 400 },
    { id: 109, nomDesk: 'Agence de El Oued', commune: 'El Oued', wilaya: 'El Oued', prix: 600 },
    { id: 110, nomDesk: 'Agence de El M\'Ghair', commune: 'El M\'Ghair', wilaya: 'El Oued', prix: 600 },
    { id: 111, nomDesk: 'Agence de Djamaa', commune: 'Djamaa', wilaya: 'El Oued', prix: 600 },
    { id: 112, nomDesk: 'Agence de Khenchela', commune: 'Khenchela', wilaya: 'Khenchela', prix: 400 },
    { id: 113, nomDesk: 'Agence de Souk Ahras', commune: 'Souk Ahras', wilaya: 'Souk Ahras', prix: 400 },
    { id: 114, nomDesk: 'Agence de Tipaza', commune: 'Tipaza', wilaya: 'Tipaza', prix: 400 },
    { id: 115, nomDesk: 'Agence Rue du stade', commune: 'Tipaza', wilaya: 'Tipaza', prix: 400 },
    { id: 116, nomDesk: 'Agence de Chelghoum Laid', commune: 'Chelghoum Laid', wilaya: 'Mila', prix: 400 },
    { id: 117, nomDesk: 'Agence de Mila', commune: 'Mila', wilaya: 'Mila', prix: 400 },
    { id: 118, nomDesk: 'Agence de Aïn Defla', commune: 'Aïn Defla', wilaya: 'Aïn Defla', prix: 400 },
    { id: 119, nomDesk: 'Agence de Khemis Miliana', commune: 'Khemis Miliana', wilaya: 'Aïn Defla', prix: 400 },
    { id: 120, nomDesk: 'Agence de Mecheria', commune: 'Mecheria', wilaya: 'Naâma', prix: 600 },
    { id: 121, nomDesk: 'Agence de Aïn Témouchent', commune: 'Aïn Témouchent', wilaya: 'Aïn Témouchent', prix: 350 },
    { id: 122, nomDesk: 'Agence de Beni Saf', commune: 'Beni Saf', wilaya: 'Aïn Témouchent', prix: 350 },
    { id: 123, nomDesk: 'Agence de El Menia', commune: 'El Menia', wilaya: 'Ghardaïa', prix: 600 },
    { id: 124, nomDesk: 'Agence de Ghardaïa', commune: 'Ghardaïa', wilaya: 'Ghardaïa', prix: 500 },
    { id: 125, nomDesk: 'Agence de Metlili', commune: 'Metlili', wilaya: 'Ghardaïa', prix: 600 },
    { id: 126, nomDesk: 'El Guerrara', commune: 'El Guerrara', wilaya: 'Ghardaïa', prix: 600 },
    { id: 127, nomDesk: 'Agence de Bouhraoua', commune: 'Ghardaïa', wilaya: 'Ghardaïa', prix: 500 },
    { id: 128, nomDesk: 'Agence d\'Oued Rhiou', commune: 'Oued Rhiou', wilaya: 'Relizane', prix: 400 },
    { id: 129, nomDesk: 'Agence de Relizane', commune: 'Relizane', wilaya: 'Relizane', prix: 400 }
  ]);

  // Complete Algerian domicile shipping data from communes-wilayas (ALMEZOUARA).xlsx
  // Filter out communes with 0 DZD pricing as they are invalid
  const [domicileFees, setDomicileFees] = React.useState(
    completeDomicileFees.filter(fee => fee.prix > 0)
  );

  const handleEdit = (id, type) => {
    setEditingId(id);
    const data = type === 'stopdesk' ? stopdeskFees : domicileFees;
    const item = data.find(d => d.id === id);
    setEditForm({ ...item, type });
  };

  const handleSave = (type) => {
    if (type === 'stopdesk') {
      setStopdeskFees(prev => prev.map(item => 
        item.id === editingId ? { ...item, prix: Number(editForm.prix) } : item
      ));
    } else {
      setDomicileFees(prev => prev.map(item => 
        item.id === editingId ? { ...item, prix: Number(editForm.prix) } : item
      ));
    }
    setEditingId(null);
    setEditForm({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Shipping Fees Management</h2>
      
      {/* Stopdesk Delivery Fees */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-blue-600">Livraison Stopdesk (Yalidine)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Nom Desk</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Commune</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Wilaya</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Prix (DZD)</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stopdeskFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{fee.nomDesk}</td>
                  <td className="border border-gray-300 px-4 py-2">{fee.commune}</td>
                  <td className="border border-gray-300 px-4 py-2">{fee.wilaya}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {editingId === fee.id && editForm.type === 'stopdesk' ? (
                      <input
                        type="number"
                        value={editForm.prix}
                        onChange={(e) => setEditForm({ ...editForm, prix: e.target.value })}
                        className="w-20 border rounded px-2 py-1"
                      />
                    ) : (
                      <span>{fee.prix}</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {editingId === fee.id && editForm.type === 'stopdesk' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave('stopdesk')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(fee.id, 'stopdesk')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domicile Delivery Fees */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-green-600">Livraison à Domicile</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Commune</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Wilaya</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Prix (DZD)</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {domicileFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{fee.commune}</td>
                  <td className="border border-gray-300 px-4 py-2">{fee.wilaya}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {editingId === fee.id && editForm.type === 'domicile' ? (
                      <input
                        type="number"
                        value={editForm.prix}
                        onChange={(e) => setEditForm({ ...editForm, prix: e.target.value })}
                        className="w-20 border rounded px-2 py-1"
                      />
                    ) : (
                      <span>{fee.prix}</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {editingId === fee.id && editForm.type === 'domicile' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave('domicile')}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(fee.id, 'domicile')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export const AdminCategories = () => {
  const { categories, addCategory, removeCategory } = useAdminStore();
  const [name, setName] = React.useState('');
  return (
    <AdminLayout>
      <h2 className="text-lg font-semibold mb-3">Categories</h2>
      <form className="flex gap-2 mb-4" onSubmit={(e)=>{ e.preventDefault(); if(name.trim()){ addCategory({ name }); setName(''); } }}>
        <input className="border rounded px-2 py-1 flex-1" placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} />
        <button className="bg-primary text-white rounded px-3">Add</button>
      </form>
      <ul className="space-y-2">
        {categories.map(c => (
          <li key={c.id} className="flex justify-between items-center border rounded px-3 py-2">
            <span>{c.name}</span>
            <button className="text-red-600" onClick={()=>removeCategory(c.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
};

export const AdminProducts = () => {
  // Real API data instead of store
  const [products, setProducts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  const [form, setForm] = React.useState({ 
    name: '', 
    categoryId: '', 
    description: '',
    price: '', 
    inStock: true 
  });
  const [colors, setColors] = React.useState([]);
  const [sizes, setSizes] = React.useState([]);
  const [images, setImages] = React.useState([]);
  const [newColor, setNewColor] = React.useState({ name: '', value: '', image: '' });
  const [newSize, setNewSize] = React.useState('');
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [uploadingColorImage, setUploadingColorImage] = React.useState(false);

  // Load data from API
  React.useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addProduct = async (productData) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (response.ok) {
        fetchProducts(); // Refresh list
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const removeProduct = async (productId) => {
    if (window.confirm('Supprimer ce produit ?')) {
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchProducts(); // Refresh list
        }
      } catch (error) {
        console.error('Error removing product:', error);
      }
    }
  };

  const addColor = () => {
    if (newColor.name && newColor.value) {
      setColors([...colors, { ...newColor, id: Date.now() }]);
      setNewColor({ name: '', value: '', image: '' });
    }
  };

  const removeColor = (id) => {
    setColors(colors.filter(c => c.id !== id));
  };

  const addSize = () => {
    if (newSize.trim()) {
      setSizes([...sizes, newSize.trim()]);
      setNewSize('');
    }
  };

  const removeSize = (size) => {
    setSizes(sizes.filter(s => s !== size));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImages(prevImages => [...prevImages, ...data.urls]);
      } else {
        alert('Failed to upload images');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleColorImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingColorImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setNewColor({ ...newColor, image: data.url });
      } else {
        alert('Failed to upload color image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload color image');
    } finally {
      setUploadingColorImage(false);
    }
  };

  const removeImage = (image) => {
    setImages(images.filter(img => img !== image));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.categoryId && form.price) {
      addProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        categoryId: form.categoryId,
        colors: colors.map(c => c.name), // Convert to simple array
        sizes: sizes,
        images: images,
        stockQuantity: form.inStock ? 100 : 0, // Convert inStock to quantity
        isActive: form.inStock
      });
      // Reset form
      setForm({ name: '', categoryId: '', description: '', price: '', inStock: true });
      setColors([]);
      setSizes([]);
      setImages([]);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des produits...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h2 className="text-lg font-semibold mb-3">Products</h2>
      
      <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Product Name" 
            value={form.name} 
            onChange={e=>setForm({ ...form, name: e.target.value })} 
            required
          />
          <select 
            className="border rounded px-3 py-2" 
            value={form.categoryId} 
            onChange={e=>setForm({ ...form, categoryId: e.target.value })} 
            required
          >
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <textarea 
          className="w-full border rounded px-3 py-2" 
          placeholder="Product Description" 
          value={form.description} 
          onChange={e=>setForm({ ...form, description: e.target.value })} 
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Price (DZD)" 
            type="number"
            value={form.price} 
            onChange={e=>setForm({ ...form, price: e.target.value })} 
            required
          />
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="inStock" 
              checked={form.inStock} 
              onChange={e=>setForm({ ...form, inStock: e.target.checked })} 
              className="mr-2"
            />
            <label htmlFor="inStock">In Stock</label>
          </div>
        </div>

        {/* Colors Section */}
        <div className="border rounded p-4">
          <h4 className="font-medium mb-3">Colors</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input 
              className="border rounded px-3 py-2" 
              placeholder="Color Name" 
              value={newColor.name} 
              onChange={e=>setNewColor({ ...newColor, name: e.target.value })} 
            />
            <input 
              className="border rounded px-3 py-2" 
              placeholder="Color Value (e.g., #000000)" 
              value={newColor.value} 
              onChange={e=>setNewColor({ ...newColor, value: e.target.value })} 
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2">Color Image</label>
            <input 
              type="file"
              accept="image/*"
              onChange={handleColorImageUpload}
              className="w-full border rounded px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-500 mt-1">Upload an image for this color variant</p>
            
            {uploadingColorImage && (
              <div className="mt-2 text-sm text-blue-600">
                Uploading color image...
          </div>
            )}
            
            {newColor.image && (
              <div className="mt-2">
                <img 
                  src={newColor.image} 
                  alt="Color preview" 
                  className="w-20 h-20 object-cover rounded border"
                />
              </div>
            )}
          </div>
          
          <button 
            type="button" 
            onClick={addColor} 
            disabled={!newColor.name || !newColor.value}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Color
          </button>
          
          <div className="mt-3 space-y-2">
            {colors.map(color => (
              <div key={color.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded border" 
                    style={{ backgroundColor: color.value }}
                  ></div>
                  <span>{color.name}</span>
                  {color.image && (
                    <img 
                      src={color.image} 
                      alt={color.name} 
                      className="w-8 h-8 object-cover rounded border" 
                    />
                  )}
                </div>
                <button type="button" onClick={() => removeColor(color.id)} className="text-red-600 text-sm">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sizes Section */}
        <div className="border rounded p-4">
          <h4 className="font-medium mb-3">Sizes</h4>
          <div className="flex gap-3 mb-3">
            <input 
              className="border rounded px-3 py-2 flex-1" 
              placeholder="Size (e.g., S, M, L, XL)" 
              value={newSize} 
              onChange={e=>setNewSize(e.target.value)} 
            />
            <button type="button" onClick={addSize} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
              Add Size
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => (
              <div key={size} className="flex items-center bg-gray-50 px-3 py-1 rounded">
                <span>{size}</span>
                <button type="button" onClick={() => removeSize(size)} className="ml-2 text-red-600 text-sm">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Images Section */}
        <div className="border rounded p-4">
          <h4 className="font-medium mb-3">Product Images</h4>
          <div className="mb-3">
            <input 
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="w-full border rounded px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-sm text-gray-500 mt-1">Select multiple images (max 5MB each)</p>
          </div>
          
          {uploadingImages && (
            <div className="mb-3 text-sm text-blue-600">
              Uploading images...
            </div>
          )}
          
          <div className="grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img src={image} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded" />
                <button 
                  type="button" 
                  onClick={() => removeImage(image)} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="w-full bg-primary text-white rounded py-3 font-medium">
          Add Product
        </button>
      </form>

      {/* Products List */}
      <div className="space-y-3">
        <h3 className="font-medium">Existing Products ({products.length})</h3>
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun produit trouvé</p>
            <p className="text-sm">Créez votre premier produit ci-dessus</p>
          </div>
        ) : (
          products.map(p => (
            <div key={p.id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{p.name}</h4>
                  <p className="text-sm text-gray-600">{p.description}</p>
                  <p className="text-sm font-medium">{p.price} DZD</p>
                  <p className="text-xs text-gray-500">
                    Catégorie: {p.category_name || 'Sans catégorie'} | 
                    Stock: {p.stock_quantity || 0} | 
                    {p.is_active ? 'Actif' : 'Inactif'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 text-sm" onClick={()=>alert('Modification à venir')}>
                    Modifier
                  </button>
                  <button className="text-red-600 text-sm" onClick={()=>removeProduct(p.id)}>
                    Supprimer
                  </button>
                </div>
              </div>
            
            {p.images && p.images.length > 0 && (
              <div className="flex gap-2 mb-2">
                {p.images.map((img, index) => (
                  <img key={index} src={img} alt={`${p.name} ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                ))}
              </div>
            )}
            
            {p.colors && p.colors.length > 0 && (
              <div className="flex gap-2 mb-2">
                {p.colors.map(color => (
                  <div key={color.id} className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded border" 
                      style={{ backgroundColor: color.value }}
                    ></div>
                    <span className="text-sm">{color.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {p.sizes && p.sizes.length > 0 && (
              <div className="flex gap-2">
                {p.sizes.map(size => (
                  <span key={size} className="text-sm bg-gray-100 px-2 py-1 rounded">{size}</span>
                ))}
              </div>
            )}
          </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export const AdminAccounts = () => {
  const { accounts, addAccount, removeAccount } = useAdminStore();
  const [form, setForm] = React.useState({ email: '', name: '' });
  return (
    <AdminLayout>
      <h2 className="text-lg font-semibold mb-3">Accounts</h2>
      <form className="flex gap-2 mb-4" onSubmit={(e)=>{ e.preventDefault(); if(form.email){ addAccount(form); setForm({ email: '', name: '' }); } }}>
        <input className="border rounded px-2 py-1" placeholder="Email" value={form.email} onChange={e=>setForm({ ...form, email: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Name" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} />
        <button className="bg-primary text-white rounded px-3">Add</button>
      </form>
      <ul className="space-y-2">
        {accounts.map(a => (
          <li key={a.id} className="flex justify-between items-center border rounded px-3 py-2">
            <span>{a.email} — orders: {a.ordersCount}, spent: {a.totalSpent} DZD</span>
            <button className="text-red-600" onClick={()=>removeAccount(a.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
};

export const AdminPromotions = () => {
  const { promotions, addPromotion, removePromotion, accounts } = useAdminStore();
  const [form, setForm] = React.useState({ accountId: '', percentage: '', description: '' });
  return (
    <AdminLayout>
      <h2 className="text-lg font-semibold mb-3">Promotions</h2>
      <form className="grid grid-cols-3 gap-2 mb-4" onSubmit={async (e)=>{ e.preventDefault(); try { await fetch('/api/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneNumber: form.accountId, percentage: Number(form.percentage), description: form.description }) }); addPromotion({ accountId: form.accountId, percentage: Number(form.percentage), description: form.description }); setForm({ accountId: '', percentage: '', description: '' }); } catch(e) {} }}>
        <input className="border rounded px-2 py-1" placeholder="Phone number" value={form.accountId} onChange={e=>setForm({ ...form, accountId: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Percentage" value={form.percentage} onChange={e=>setForm({ ...form, percentage: e.target.value })} />
        <input className="border rounded px-2 py-1" placeholder="Description" value={form.description} onChange={e=>setForm({ ...form, description: e.target.value })} />
        <button className="col-span-3 bg-primary text-white rounded py-2">Add</button>
      </form>
      <ul className="space-y-2">
        {promotions.map(p => (
          <li key={p.id} className="flex justify-between items-center border rounded px-3 py-2">
            <span>{p.description || 'Promo'} — {p.percentage}% {p.accountId ? `for ${accounts.find(a=>a.id===p.accountId)?.email}` : '(All)'}</span>
            <button className="text-red-600" onClick={()=>removePromotion(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
};

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminDashboard;
