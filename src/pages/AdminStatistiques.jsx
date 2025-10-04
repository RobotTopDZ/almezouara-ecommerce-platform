import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAdminStore from '../store/adminStore';

// Composant pour le layout admin
const AdminLayout = ({ children }) => {
  const { logout } = useAdminStore();
  
  return (
    <div className="container mx-auto p-4 pb-16">
      <div className="grid md:grid-cols-4 gap-4">
        <aside className="md:col-span-1 bg-white rounded shadow p-4 space-y-2">
          <Link className="block hover:underline" to="/admin">Overview</Link>
          <Link className="block hover:underline" to="/admin/orders">Commandes</Link>
          <Link className="block hover:underline" to="/admin/statistiques">Statistiques</Link>
          <Link className="block hover:underline" to="/admin/categories">Categories</Link>
          <Link className="block hover:underline" to="/admin/products">Products</Link>
          <Link className="block hover:underline" to="/admin/accounts">Accounts</Link>
          <Link className="block hover:underline" to="/admin/promotions">Promotions</Link>
          <button
            onClick={() => {
              logout();
              window.location.href = '/admin/login';
            }}
            className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
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
};

// Composant pour les graphiques
const Chart = ({ data, title, type }) => {
  const maxValue = Math.max(...data.map(item => item.value)) * 1.1;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-64 flex items-end space-x-2">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full flex justify-center mb-1">
                <div 
                  className={`rounded-t ${type === 'products' ? 'bg-blue-500' : 'bg-green-500'}`} 
                  style={{ height: `${height}%`, width: '70%' }}
                ></div>
              </div>
              <div className="text-xs font-medium truncate w-full text-center" title={item.label}>
                {item.label.length > 10 ? `${item.label.substring(0, 10)}...` : item.label}
              </div>
              <div className="text-xs text-gray-500">{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Composant principal
const AdminStatistiques = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    topProducts: [],
    salesByMonth: [],
    ordersByStatus: {},
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0
  });
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Récupérer les commandes
      const response = await axios.get('/api/admin/orders');
      const orders = response.data.orders || [];
      
      // Filtrer par période si nécessaire
      const filteredOrders = filterOrdersByTimeRange(orders, timeRange);
      
      // Calculer les statistiques
      const calculatedStats = calculateStats(filteredOrders);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrdersByTimeRange = (orders, range) => {
    const now = new Date();
    let startDate;
    
    switch (range) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return orders; // Retourner toutes les commandes
    }
    
    return orders.filter(order => {
      const orderDate = new Date(order.date || order.createdAt);
      return orderDate >= startDate;
    });
  };

  const calculateStats = (orders) => {
    // Produits les plus vendus
    const productCounts = {};
    orders.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
      items.forEach(item => {
        const productName = item.name || item.product_name;
        if (!productName) return;
        
        const quantity = item.quantity || 1;
        productCounts[productName] = (productCounts[productName] || 0) + quantity;
      });
    });
    
    const topProducts = Object.entries(productCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    // Ventes par mois
    const salesByMonth = {};
    orders.forEach(order => {
      const date = new Date(order.date || order.createdAt);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      salesByMonth[monthYear] = (salesByMonth[monthYear] || 0) + (parseFloat(order.total) || 0);
    });
    
    const salesByMonthArray = Object.entries(salesByMonth)
      .map(([label, value]) => ({ label, value: Math.round(value) }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.label.split('/').map(Number);
        const [bMonth, bYear] = b.label.split('/').map(Number);
        return (aYear - bYear) || (aMonth - bMonth);
      })
      .slice(-6); // Derniers 6 mois
    
    // Commandes par statut
    const ordersByStatus = {};
    orders.forEach(order => {
      const status = order.status || 'pending';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });
    
    // Totaux
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      topProducts,
      salesByMonth: salesByMonthArray,
      ordersByStatus,
      totalRevenue,
      totalOrders,
      averageOrderValue
    };
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-DZ').format(Math.round(price));
  };

  const getStatusText = (status) => {
    const statusMap = {
      'processing': 'En cours',
      'confirmed': 'Confirmée',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      'pending': 'En attente'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <div className="text-lg text-gray-600">Chargement des statistiques...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-pink-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Statistiques et Analyses</h1>
              <p className="text-pink-100">Visualisez les performances de votre boutique</p>
            </div>
            <div>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-white text-gray-800 rounded px-3 py-2 focus:outline-none"
              >
                <option value="all">Toutes les périodes</option>
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="year">12 derniers mois</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500">Chiffre d'affaires total</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatPrice(stats.totalRevenue)} DA
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-500">Nombre de commandes</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalOrders}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="text-sm text-gray-500">Panier moyen</div>
            <div className="text-2xl font-bold text-purple-600">
              {formatPrice(stats.averageOrderValue)} DA
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Chart 
            data={stats.topProducts} 
            title="Top 10 des produits les plus vendus" 
            type="products"
          />
          <Chart 
            data={stats.salesByMonth} 
            title="Évolution des ventes par mois" 
            type="sales"
          />
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des commandes par statut</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.ordersByStatus).map(([status, count]) => (
              <div key={status} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-sm text-gray-500">{getStatusText(status)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Détail des produits les plus vendus</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité vendue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % des ventes totales
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topProducts.map((product, index) => {
                  const totalQuantity = stats.topProducts.reduce((sum, p) => sum + p.value, 0);
                  const percentage = totalQuantity > 0 ? (product.value / totalQuantity) * 100 : 0;
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.value} unités
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="ml-2">{percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStatistiques;