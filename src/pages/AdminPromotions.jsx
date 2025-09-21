import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdminLayout = ({ children }) => (
  <div className="container mx-auto p-4 pb-16">
    <div className="grid md:grid-cols-4 gap-4">
      <aside className="md:col-span-1 bg-white rounded shadow p-4 space-y-2">
        <Link className="block hover:underline" to="/admin">Overview</Link>
        <Link className="block hover:underline text-blue-600 font-medium" to="/admin/orders">Commandes + Yalidine</Link>
        <Link className="block hover:underline" to="/admin/fees">Shipping Fees</Link>
        <Link className="block hover:underline" to="/admin/categories">Categories</Link>
        <Link className="block hover:underline" to="/admin/products">Products</Link>
        <Link className="block hover:underline" to="/admin/accounts">Accounts</Link>
        <Link className="block hover:underline text-orange-600 font-medium" to="/admin/promotions">Promotions</Link>
        <Link className="block hover:underline" to="/admin/yalidine-config">Configuration Yalidine</Link>
      </aside>
      <main className="md:col-span-3 bg-white rounded shadow p-4">
        {children}
      </main>
    </div>
  </div>
);

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    percentage: '',
    description: '',
    phone: '',
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: 1
  });

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('/api/admin/promotions');
        const data = await response.json();
        setPromotions(data.promotions || []);
      } catch (error) {
        console.error('Error fetching promotions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const filteredPromotions = promotions
    .filter(promotion => {
      const matchesSearch = 
        promotion.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promotion.phone?.includes(searchTerm) ||
        promotion.percentage?.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && promotion.isActive) ||
        (statusFilter === 'inactive' && !promotion.isActive);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'percentage':
          return b.percentage - a.percentage;
        case 'date':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'phone':
          return (a.phone || '').localeCompare(b.phone || '');
        case 'description':
          return (a.description || '').localeCompare(b.description || '');
        default:
          return 0;
      }
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.percentage || !formData.phone) return;

    try {
      const promotionData = {
        ...formData,
        percentage: parseFloat(formData.percentage),
        phone: formData.phone,
        phoneNumber: formData.phone,
        usageLimit: parseInt(formData.usageLimit) || 1
      };

      if (editingPromotion) {
        // Update existing promotion
        const response = await fetch(`/api/promotions/${editingPromotion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promotionData)
        });
        
        if (response.ok) {
          setPromotions(prev => prev.map(promo => 
            promo.id === editingPromotion.id 
              ? { ...promo, ...promotionData }
              : promo
          ));
        }
      } else {
        // Create new promotion
        const response = await fetch('/api/promotions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promotionData)
        });
        
        if (response.ok) {
          const newPromotion = await response.json();
          setPromotions(prev => [...prev, newPromotion]);
        }
      }

      setShowModal(false);
      setEditingPromotion(null);
      setFormData({
        percentage: '',
        description: '',
        phone: '',
        startDate: '',
        endDate: '',
        isActive: true,
        usageLimit: 1
      });
    } catch (error) {
      console.error('Error saving promotion:', error);
      alert('Erreur lors de la sauvegarde de la promotion');
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      percentage: promotion.percentage || '',
      description: promotion.description || '',
      phone: promotion.phone || '',
      startDate: promotion.startDate || '',
      endDate: promotion.endDate || '',
      isActive: promotion.isActive !== false,
      usageLimit: promotion.usage_limit || 1
    });
    setShowModal(true);
  };

  const handleDelete = async (promotionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      try {
        const response = await fetch(`/api/promotions/${promotionId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setPromotions(prev => prev.filter(promo => promo.id !== promotionId));
        }
      } catch (error) {
        console.error('Error deleting promotion:', error);
        alert('Erreur lors de la suppression de la promotion');
      }
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isExpired = (endDate) => {
    return endDate && new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <div className="text-lg text-gray-600">Chargement des promotions...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gestion des Promotions</h1>
              <p className="text-orange-100">Créez et gérez les promotions clients</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{filteredPromotions.length}</div>
              <div className="text-orange-100 text-sm">Promotion(s) trouvée(s)</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-orange-600 font-bold">T</span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Promotions</div>
                <div className="text-xl font-bold text-orange-600">{promotions.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">A</span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Promotions Actives</div>
                <div className="text-xl font-bold text-green-600">
                  {promotions.filter(promo => promo.isActive).length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">%</span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Réduction Moyenne</div>
                <div className="text-xl font-bold text-blue-600">
                  {Math.round(promotions.reduce((sum, promo) => sum + (promo.percentage || 0), 0) / promotions.length) || 0}%
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold">M</span>
              </div>
              <div>
                <div className="text-sm text-gray-500">Réduction Max</div>
                <div className="text-xl font-bold text-purple-600">
                  {Math.max(...promotions.map(promo => promo.percentage || 0), 0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une promotion..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="date">Trier par date</option>
                <option value="percentage">Trier par pourcentage</option>
                <option value="phone">Trier par téléphone</option>
                <option value="description">Trier par description</option>
              </select>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center"
            >
              <span className="mr-2">➕</span>
              Nouvelle Promotion
            </button>
          </div>
        </div>

        {/* Promotions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promotion) => (
            <div key={promotion.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-orange-600 font-bold text-lg">%</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {promotion.percentage}% de réduction
                      </h3>
                      <p className="text-sm text-gray-500">{promotion.description || 'Aucune description'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(promotion.isActive)}`}>
                    {getStatusText(promotion.isActive)}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{promotion.phone || 'Téléphone non fourni'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Utilisations: {promotion.usage_count || 0} / {promotion.usage_limit || 1}</span>
                    {promotion.usage_count >= promotion.usage_limit && (
                      <span className="ml-2 text-red-600 font-medium">(Épuisée)</span>
                    )}
                  </div>
                  {promotion.startDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Début: {formatDate(promotion.startDate)}</span>
                    </div>
                  )}
                  {promotion.endDate && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={isExpired(promotion.endDate) ? 'text-red-600' : ''}>
                        Fin: {formatDate(promotion.endDate)}
                        {isExpired(promotion.endDate) && ' (Expirée)'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(promotion)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(promotion.id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPromotions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-gray-500 text-lg mb-2">Aucune promotion trouvée</div>
            <div className="text-gray-400 text-sm">Essayez de modifier vos critères de recherche</div>
          </div>
        )}

        {/* Add/Edit Promotion Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPromotion ? 'Modifier la Promotion' : 'Nouvelle Promotion'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pourcentage de réduction
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.percentage}
                    onChange={(e) => setFormData({...formData, percentage: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: 15"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone du client
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: 0550123456"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Description de la promotion..."
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite d'utilisation
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nombre de fois que la promotion peut être utilisée"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Combien de fois cette promotion peut-elle être utilisée ? (ex: 1, 2, 3...)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Promotion active
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    {editingPromotion ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingPromotion(null);
                      setFormData({
                        percentage: '',
                        description: '',
                        phone: '',
                        startDate: '',
                        endDate: '',
                        isActive: true,
                        usageLimit: 1
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPromotions;


