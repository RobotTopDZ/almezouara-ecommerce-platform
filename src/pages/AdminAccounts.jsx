import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AdminLayout = ({ children }) => (
  <div className="container mx-auto p-4 pb-16">
    <div className="grid md:grid-cols-4 gap-4">
      <aside className="md:col-span-1 bg-white rounded shadow p-4 space-y-2">
        <Link className="block hover:underline" to="/admin">Overview</Link>
        <Link className="block hover:underline text-blue-600 font-medium" to="/admin/orders">Commandes + Yalidine</Link>
        <Link className="block hover:underline" to="/admin/fees">Shipping Fees</Link>
        <Link className="block hover:underline" to="/admin/categories">Categories</Link>
        <Link className="block hover:underline" to="/admin/products">Products</Link>
        <Link className="block hover:underline text-purple-600 font-medium" to="/admin/accounts">Accounts</Link>
        <Link className="block hover:underline" to="/admin/promotions">Promotions</Link>
        <Link className="block hover:underline" to="/admin/yalidine-config">Configuration Yalidine</Link>
        <Link className="block hover:underline text-pink-600 font-medium" to="/admin/facebook-pixel">Facebook Pixel</Link>
      </aside>
      <main className="md:col-span-3 bg-white rounded shadow p-4">
        {children}
      </main>
    </div>
  </div>
);

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("');
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch("/api/admin/accounts");
        const data = await response.json();
        setAccounts(data.accounts || []);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts
    .filter(account => {
      const matchesSearch = 
        account.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.phone?.includes(searchTerm) ||
        account.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || account.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "').localeCompare(b.name || "');
        case "phone":
          return (a.phone || "').localeCompare(b.phone || "');
        case "orders":
          return (b.orderCount || 0) - (a.orderCount || 0);
        case "total":
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        case "date":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        default:
          return 0;
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "inactive": return "bg-gray-100 text-gray-800 border-gray-200";
      case "suspended": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active": return "Actif";
      case "inactive": return "Inactif";
      case "suspended": return "Suspendu";
      default: return "Nouveau";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR").format(price || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <div className="text-lg text-gray-600">Chargement des comptes...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion des Comptes</h1>
              <p className="text-purple-100">Gérez les comptes clients et leurs informations</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{filteredAccounts.length}</div>
              <div className="text-purple-100 text-sm">Compte(s) trouvé(s)</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="text-2xl mr-3">👥</div>
              <div>
                <div className="text-sm text-gray-500">Total Comptes</div>
                <div className="text-xl font-bold text-green-600">{accounts.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <div className="text-sm text-gray-500">Comptes Actifs</div>
                <div className="text-xl font-bold text-blue-600">
                  {accounts.filter(acc => acc.status === "active").length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💰</div>
              <div>
                <div className="text-sm text-gray-500">Chiffre d"Affaires</div>
                <div className="text-xl font-bold text-purple-600">
                  {formatPrice(accounts.reduce((sum, acc) => sum + (acc.totalSpent || 0), 0))} DA
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📦</div>
              <div>
                <div className="text-sm text-gray-500">Commandes Moyennes</div>
                <div className="text-xl font-bold text-orange-600">
                  {Math.round(accounts.reduce((sum, acc) => sum + (acc.orderCount || 0), 0) / accounts.length) || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres et Recherche</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
              <input
                type="text"
                placeholder="Nom, téléphone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="name">Nom</option>
                <option value="phone">Téléphone</option>
                <option value="orders">Nombre de commandes</option>
                <option value="total">Montant total</option>
                <option value="date">Date d"inscription</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("');
                  setStatusFilter("all");
                  setSortBy("name");
                }}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commandes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Dépensé
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id || account.phone} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium text-sm">
                              {(account.name || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {account.name || "Nom non fourni"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {account.id || account.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{account.phone || "N/A"}</div>
                      <div className="text-sm text-gray-500">{account.email || "Email non fourni"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {account.orderCount || 0} commande(s)
                      </div>
                      <div className="text-sm text-gray-500">
                        Dernière: {account.lastOrder ? formatDate(account.lastOrder) : "Jamais"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(account.totalSpent || 0)} DA
                      </div>
                      <div className="text-sm text-gray-500">
                        Moyenne: {formatPrice((account.totalSpent || 0) / Math.max(account.orderCount || 1, 1))} DA
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(account.status || "active")}`}>
                        {getStatusText(account.status || "active")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(account.createdAt || new Date())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 transition-colors"
                          title="Voir les détails"
                        >
                          👁️ Détails
                        </button>
                        <button
                          onClick={() => {
                            // Handle account status change
                            const newStatus = account.status === "active" ? "suspended" : "active";
                            setAccounts(prev => prev.map(acc => 
                              acc.id === account.id || acc.phone === account.phone
                                ? { ...acc, status: newStatus }
                                : acc
                            ));
                          }}
                          className={`transition-colors ${
                            account.status === "active" 
                              ? "text-red-600 hover:text-red-900" 
                              : "text-green-600 hover:text-green-900"
                          }`}
                          title={account.status === "active" ? "Suspendre" : "Activer"}
                        >
                          {account.status === "active" ? "⏸️ Suspendre" : "▶️ Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">👥</div>
            <div className="text-gray-500 text-lg mb-2">Aucun compte trouvé</div>
            <div className="text-gray-400 text-sm">Essayez de modifier vos critères de recherche</div>
          </div>
        )}

        {/* Account Details Modal */}
        {showModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Détails du Compte
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Account Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Informations du Compte</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Nom complet</div>
                      <div className="font-medium">{selectedAccount.name || "Non fourni"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Téléphone</div>
                      <div className="font-medium">{selectedAccount.phone || "Non fourni"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{selectedAccount.email || "Non fourni"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Date d"inscription</div>
                      <div className="font-medium">{formatDate(selectedAccount.createdAt || new Date())}</div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedAccount.orderCount || 0}</div>
                    <div className="text-sm text-blue-800">Commandes</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{formatPrice(selectedAccount.totalSpent || 0)} DA</div>
                    <div className="text-sm text-green-800">Total Dépensé</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatPrice((selectedAccount.totalSpent || 0) / Math.max(selectedAccount.orderCount || 1, 1))} DA
                    </div>
                    <div className="text-sm text-purple-800">Moyenne/Commande</div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Commandes Récentes</h3>
                  <div className="text-sm text-gray-500">
                    {selectedAccount.orderCount > 0 
                      ? `Dernière commande: ${formatDate(selectedAccount.lastOrder || new Date())}`
                      : "Aucune commande passée"
                    }
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAccounts;

