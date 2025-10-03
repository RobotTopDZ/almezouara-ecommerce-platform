import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const AdminLayout = ({ children }) => (
  <div className="container mx-auto p-4 pb-16">
    <div className="grid md:grid-cols-4 gap-4">
      <aside className="md:col-span-1 bg-white rounded shadow p-4 space-y-2">
        <Link className="block hover:underline" to="/admin">Overview</Link>
        <Link className="block hover:underline" to="/admin/orders">Commandes</Link>
        <Link className="block hover:underline" to="/admin/fees">Shipping Fees</Link>
        <Link className="block hover:underline" to="/admin/categories">Categories</Link>
        <Link className="block hover:underline" to="/admin/products">Products</Link>
        <Link className="block hover:underline" to="/admin/accounts">Accounts</Link>
        <Link className="block hover:underline" to="/admin/promotions">Promotions</Link>
      </aside>
      <main className="md:col-span-3 bg-white rounded shadow p-4">
        {children}
      </main>
    </div>
  </div>
);

const AdminOrdersWithYalidine = () => {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filteredOrders, setFilteredOrders] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchTerm, setSearchTerm] = React.useState("');
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [showOrderModal, setShowOrderModal] = React.useState(false);
  const [sortBy, setSortBy] = React.useState("date");
  const [sortOrder, setSortOrder] = React.useState("desc");
  const [yalidineCenters, setYalidineCenters] = React.useState([]);
  const [sendingToYalidine, setSendingToYalidine] = React.useState({});
  const [yalidineConfig, setYalidineConfig] = React.useState({
    apiId: "',
    apiToken: "',
    configured: false
  });

  React.useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders");
        const data = await response.json();
        setOrders(data.orders || []);
        setFilteredOrders(data.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  React.useEffect(() => {
    let filtered = [...orders];
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phoneNumber?.includes(searchTerm) ||
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort orders
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.date || a.createdAt);
          bValue = new Date(b.date || b.createdAt);
          break;
        case "total":
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case "name":
          aValue = a.fullName || "';
          bValue = b.fullName || "';
          break;
        default:
          aValue = a[sortBy] || "';
          bValue = b[sortBy] || "';
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm, sortBy, sortOrder]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Show success message
      alert(`Statut de la commande ${orderId} mis à jour vers: ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const sendToYalidine = async (orderId, stopdeskId = null) => {
    try {
      setSendingToYalidine(prev => ({ ...prev, [orderId]: true }));
      
      const response = await axios.post("/api/yalidine/send-order", {
        orderId,
        stopdeskId
      });

      if (response.data.success) {
        // Update order status to shipped
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: "shipped", 
                yalidineTracking: response.data.tracking 
              } 
            : order
        ));
        
        alert(`✅ Commande envoyée à Yalidine avec succès!\n\nNuméro de suivi: ${response.data.tracking}\n\nVous pouvez imprimer l"étiquette depuis le lien fourni.`);
      } else {
        alert(`❌ Erreur lors de l"envoi à Yalidine: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Error sending to Yalidine:", error);
      alert(`❌ Erreur lors de l"envoi à Yalidine: ${error.response?.data?.error || error.message}`);
    } finally {
      setSendingToYalidine(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "processing": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped": return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "processing": return "En cours de traitement";
      case "confirmed": return "Confirmée";
      case "shipped": return "Expédiée";
      case "delivered": return "Livrée";
      case "cancelled": return "Annulée";
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "processing": return "⏳";
      case "confirmed": return "✅";
      case "shipped": return "🚚";
      case "delivered": return "📦";
      case "cancelled": return "❌";
      default: return "📋";
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("fr-FR").format(price || 0);
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  const canSendToYalidine = (order) => {
    return order.status === "confirmed" || order.status === "processing";
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <div className="text-lg text-gray-600">Chargement des commandes...</div>
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
              <h1 className="text-3xl font-bold mb-2">Gestion des Commandes + Yalidine</h1>
              <p className="text-pink-100">Interface professionnelle avec intégration Yalidine</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{filteredOrders.length}</div>
              <div className="text-pink-100 text-sm">Commande(s) trouvée(s)</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="text-2xl mr-3">⏳</div>
              <div>
                <div className="text-sm text-gray-500">En cours</div>
                <div className="text-xl font-bold text-yellow-600">
                  {orders.filter(o => o.status === "processing").length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <div className="text-sm text-gray-500">Confirmées</div>
                <div className="text-xl font-bold text-blue-600">
                  {orders.filter(o => o.status === "confirmed").length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🚚</div>
              <div>
                <div className="text-sm text-gray-500">Expédiées</div>
                <div className="text-xl font-bold text-purple-600">
                  {orders.filter(o => o.status === "shipped").length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📦</div>
              <div>
                <div className="text-sm text-gray-500">Livrées</div>
                <div className="text-xl font-bold text-green-600">
                  {orders.filter(o => o.status === "delivered").length}
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
                placeholder="Nom, téléphone, ID, adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="processing">En cours de traitement</option>
                <option value="confirmed">Confirmée</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="date">Date</option>
                <option value="total">Montant</option>
                <option value="name">Nom client</option>
                <option value="status">Statut</option>
              </select>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {sortOrder === "asc" ? "↑" : "↓"} {sortOrder === "asc" ? "Croissant" : "Décroissant"}
              </button>
              <button
                onClick={() => {
                  setSearchTerm("');
                  setStatusFilter("all");
                  setSortBy("date");
                  setSortOrder("desc");
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livraison
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.date || order.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                        {order.yalidineTracking && (
                          <div className="text-xs text-blue-600 mt-1">
                            📦 Yalidine: {order.yalidineTracking}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.fullName}</div>
                        <div className="text-sm text-gray-500">{order.phoneNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{order.wilaya}, {order.city}</div>
                        <div className="text-gray-500 truncate max-w-xs">{order.address}</div>
                        <div className="text-xs text-blue-600">
                          {order.deliveryMethod === "domicile" ? "🏠 Domicile" : "📦 Stopdesk"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items?.length || 0} article(s)
                        {order.items && order.items.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {order.items[0].name}
                            {order.items.length > 1 && ` +${order.items.length - 1} autres`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(order.total)} DA
                      </div>
                      {order.discountPercentage > 0 && (
                        <div className="text-xs text-green-600">
                          -{order.discountPercentage}% promo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        <span className="mr-1">{getStatusIcon(order.status)}</span>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="text-primary hover:text-primary-dark transition-colors text-xs"
                            title="Voir les détails"
                          >
                            👁️ Détails
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="processing">En cours</option>
                            <option value="confirmed">Confirmée</option>
                            <option value="shipped">Expédiée</option>
                            <option value="delivered">Livrée</option>
                            <option value="cancelled">Annulée</option>
                          </select>
                        </div>
                        {canSendToYalidine(order) && (
                          <button
                            onClick={() => sendToYalidine(order.id)}
                            disabled={sendingToYalidine[order.id]}
                            className={`w-full text-xs py-1 px-2 rounded transition-colors ${
                              sendingToYalidine[order.id]
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                          >
                            {sendingToYalidine[order.id] ? "⏳ Envoi..." : "🚚 Envoyer à Yalidine"}
                          </button>
                        )}
                        {order.yalidineTracking && (
                          <div className="text-xs text-blue-600 text-center">
                            ✅ Envoyé à Yalidine
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📋</div>
            <div className="text-gray-500 text-lg mb-2">Aucune commande trouvée</div>
            <div className="text-gray-400 text-sm">Essayez de modifier vos critères de recherche</div>
          </div>
        )}

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Détails de la commande {selectedOrder.id}
                  </h2>
                  <button
                    onClick={closeOrderModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Order Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Statut de la commande</h3>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedOrder.status)}`}>
                      <span className="mr-2">{getStatusIcon(selectedOrder.status)}</span>
                      {getStatusText(selectedOrder.status)}
                    </span>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => {
                        updateOrderStatus(selectedOrder.id, e.target.value);
                        setSelectedOrder({...selectedOrder, status: e.target.value});
                      }}
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="processing">En cours de traitement</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="shipped">Expédiée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                  
                  {canSendToYalidine(selectedOrder) && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          sendToYalidine(selectedOrder.id);
                          closeOrderModal();
                        }}
                        disabled={sendingToYalidine[selectedOrder.id]}
                        className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                          sendingToYalidine[selectedOrder.id]
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {sendingToYalidine[selectedOrder.id] ? "⏳ Envoi en cours..." : "🚚 Envoyer à Yalidine"}
                      </button>
                    </div>
                  )}
                  
                  {selectedOrder.yalidineTracking && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Numéro de suivi Yalidine:</div>
                      <div className="text-lg font-mono text-blue-700">{selectedOrder.yalidineTracking}</div>
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-900">Informations client</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nom:</strong> {selectedOrder.fullName}</div>
                      <div><strong>Téléphone:</strong> {selectedOrder.phoneNumber}</div>
                      <div><strong>Date de commande:</strong> {new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString("fr-FR")}</div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 text-green-900">Adresse de livraison</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Wilaya:</strong> {selectedOrder.wilaya}</div>
                      <div><strong>Ville:</strong> {selectedOrder.city}</div>
                      <div><strong>Adresse:</strong> {selectedOrder.address}</div>
                      <div><strong>Méthode:</strong> {selectedOrder.deliveryMethod === "domicile" ? "Livraison à domicile" : "Stopdesk (Yalidine)"}</div>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Produits commandés</h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-gray-400">📦</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Quantité: {item.quantity} | Prix: {formatPrice(item.price)} DA
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatPrice(item.price * item.quantity)} DA</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Résumé de la commande</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sous-total:</span>
                      <span>{formatPrice(selectedOrder.productPrice || selectedOrder.total)} DA</span>
                    </div>
                    {selectedOrder.discountPercentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction ({selectedOrder.discountPercentage}%):</span>
                        <span>-{formatPrice((selectedOrder.productPrice || selectedOrder.total) * selectedOrder.discountPercentage / 100)} DA</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Frais de livraison:</span>
                      <span>{formatPrice(selectedOrder.shippingCost || 0)} DA</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatPrice(selectedOrder.total)} DA</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeOrderModal}
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

export default AdminOrdersWithYalidine;

