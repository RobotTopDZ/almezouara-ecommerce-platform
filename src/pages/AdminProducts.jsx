import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminLayout = ({ children }) => (
  <div className="container mx-auto p-4 pb-16">
    <div className="grid md:grid-cols-4 gap-4">
      <aside className="md:col-span-1 bg-white rounded shadow p-4 space-y-2">
        <Link className="block hover:underline" to="/admin">Overview</Link>
        <Link className="block hover:underline" to="/admin/orders">Commandes + Yalidine</Link>
        <Link className="block hover:underline" to="/admin/fees">Shipping Fees</Link>
        <Link className="block hover:underline" to="/admin/categories">Categories</Link>
        <Link className="block hover:underline text-purple-600 font-medium" to="/admin/products">Products</Link>
        <Link className="block hover:underline" to="/admin/accounts">Accounts</Link>
        <Link className="block hover:underline" to="/admin/promotions">Promotions</Link>
        <Link className="block hover:underline" to="/admin/yalidine-config">Configuration Yalidine</Link>
      </aside>
      <main className="md:col-span-3 bg-white rounded shadow p-4">
        {children}
      </main>
    </div>
  </div>
);

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    stock: '',
    description: '',
    images: [''], // Start with one empty URL field
    colors: [{ name: '', value: '#000000' }],
    sizes: [''],
    status: 'active'
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products and categories in parallel
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/products/categories/list')
      ]);
      
      if (productsRes.data.success) {
        const transformedProducts = productsRes.data.products.map(product => ({
          ...product,
          category: product.category_name || 'Non défini',
          categoryId: product.category_id,
          colors: product.colors || [],
          sizes: product.sizes || [],
          images: product.images || []
        }));
        setProducts(transformedProducts);
      }
      
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.categories || []);
      } else {
        // Fallback categories
        setCategories([
          { id: 1, name: 'Robes', color: '#FF6B6B' },
          { id: 2, name: 'Hijabs', color: '#4ECDC4' },
          { id: 3, name: 'Abayas', color: '#45B7D1' },
          { id: 4, name: 'Accessoires', color: '#96CEB4' },
          { id: 5, name: 'Chaussures', color: '#FFEAA7' }
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set fallback categories
      setCategories([
        { id: 1, name: 'Robes', color: '#FF6B6B' },
        { id: 2, name: 'Hijabs', color: '#4ECDC4' },
        { id: 3, name: 'Abayas', color: '#45B7D1' },
        { id: 4, name: 'Accessoires', color: '#96CEB4' },
        { id: 5, name: 'Chaussures', color: '#FFEAA7' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || product.categoryId.toString() === filterCategory;
      const matchesStatus = !filterStatus || product.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });

  // Convert Google Drive URL to direct image link
  const processImageURL = (url) => {
    if (!url) return '';
    
    // Handle Google Drive URL
    if (url.includes('drive.google.com')) {
      // Handle Google Drive shareable link format
      const fileIdMatch = url.match(/[\w\-]{20,}/);
      if (fileIdMatch && fileIdMatch[0]) {
        return `https://drive.google.com/uc?export=view&id=${fileIdMatch[0]}`;
      }
    }
    
    return url;
  };

  // Handle URL input change
  const handleURLChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  // Add new URL input field
  const addURLField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  // Remove image URL
  const removeImage = (indexToRemove) => {
    const newImages = formData.images.filter((_, index) => index !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      images: newImages.length > 0 ? newImages : [''] // Always keep at least one URL field
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Process all image URLs before submitting
      const processedImages = formData.images
        .filter(img => img.trim() !== '')
        .map(img => processImageURL(img));

      if (processedImages.length === 0) {
        alert('Veuillez ajouter au moins une image');
        return;
      }

      const productData = {
        name: formData.name,
        category_id: parseInt(formData.categoryId),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        description: formData.description,
        status: formData.status,
        images: processedImages,
        colors: formData.colors.filter(color => color.name && color.name.trim() !== ''),
        sizes: formData.sizes.filter(size => size.trim() !== '')
      };

      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct.id}`, productData);
      } else {
        await axios.post('/api/products', productData);
      }
      
      // Reload data and close modal
      await loadData();
      resetForm();
      alert(editingProduct ? 'Produit modifié avec succès!' : 'Produit créé avec succès!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde du produit');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      price: '',
      stock: '',
      description: '',
      images: [''], // Start with one empty URL field
      colors: [{ name: '', value: '#000000' }],
      sizes: [''],
      status: 'active'
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    
    // Transform colors to new format if they're strings
    let colors = [{ name: '', value: '#000000' }];
    if (product.colors && product.colors.length > 0) {
      colors = product.colors.map(color => {
        if (typeof color === 'string') {
          return { name: color, value: '#000000' };
        }
        return color;
      });
    }
    
    setFormData({
      name: product.name,
      categoryId: product.categoryId.toString(),
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
      images: product.images || [],
      colors: colors,
      sizes: product.sizes.length > 0 ? product.sizes : [''],
      status: product.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await axios.delete(`/api/products/${id}`);
        await loadData();
        alert('Produit supprimé avec succès!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erreur lors de la suppression du produit');
      }
    }
  };

  const addArrayField = (field) => {
    if (field === 'colors') {
      setFormData({
        ...formData,
        colors: [...formData.colors, { name: '', value: '#000000' }]
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...formData[field], '']
      });
    }
  };

  const updateArrayField = (field, index, value, colorProperty = null) => {
    if (field === 'colors' && colorProperty) {
      const newColors = [...formData.colors];
      newColors[index][colorProperty] = value;
      setFormData({
        ...formData,
        colors: newColors
      });
    } else {
      const newArray = [...formData[field]];
      newArray[index] = value;
      setFormData({
        ...formData,
        [field]: newArray
      });
    }
  };

  const removeArrayField = (field, index) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData({
        ...formData,
        [field]: newArray
      });
    }
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || '#6B7280';
  };

  const formatPrice = (price) => {
    return `${price.toLocaleString()} DA`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Chargement des produits...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
            <p className="text-gray-600">Gérez votre catalogue de produits</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Nouveau Produit</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rechercher</label>
              <input
                type="text"
                placeholder="Nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="out_of_stock">Rupture de stock</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {filteredProducts.length} produit(s) trouvé(s)
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const category = categories.find(cat => cat.id === product.categoryId);
            return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* Product Image */}
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-gray-400">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Category Badge */}
                  {category && (
                    <div className="mb-2">
                      <span
                        className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    </div>
                  )}

                  {/* Price and Stock */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold text-purple-600">{formatPrice(product.price)}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      product.stock > 10 ? 'bg-green-100 text-green-800' :
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Stock: {product.stock}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{product.description}</p>

                  {/* Colors and Sizes */}
                  <div className="space-y-2">
                    {product.colors.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Couleurs:</span>
                        <div className="flex space-x-1">
                          {product.colors.slice(0, 4).map((color, index) => {
                            // Handle both old string format and new object format
                            const colorValue = typeof color === 'string' ? '#000000' : color.value;
                            const colorName = typeof color === 'string' ? color : color.name;
                            return (
                              <div key={index} className="flex items-center space-x-1">
                                <div 
                                  className="w-3 h-3 rounded-full border border-gray-300" 
                                  style={{ backgroundColor: colorValue }}
                                  title={colorName}
                                ></div>
                                <span className="text-xs text-gray-600">{colorName}</span>
                              </div>
                            );
                          })}
                          {product.colors.length > 4 && (
                            <span className="text-xs text-gray-400">+{product.colors.length - 4}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {product.sizes.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Tailles:</span>
                        <div className="flex space-x-1">
                          {product.sizes.map((size, index) => (
                            <span key={index} className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? '✅ Actif' :
                       product.status === 'inactive' ? '⏸️ Inactif' :
                       '❌ Rupture de stock'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-500 mb-4">Essayez de modifier vos filtres ou ajoutez un nouveau produit.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ajouter un produit
            </button>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DA) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="out_of_stock">Rupture de stock</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Images URLs */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images URLs (supports Google Drive links)
                  </label>
                  <div className="space-y-4">
                    {formData.images.map((url, index) => {
                      const processedUrl = processImageURL(url);
                      const isGoogleDrive = url.includes('drive.google.com');
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={url}
                              onChange={(e) => handleURLChange(index, e.target.value)}
                              placeholder="https://drive.google.com/... or direct image URL"
                              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 whitespace-nowrap"
                              disabled={formData.images.length <= 1}
                              title="Remove image"
                            >
                              Remove
                            </button>
                          </div>
                          
                          {/* Image Preview */}
                          {processedUrl && (
                            <div className="relative border rounded p-2 bg-gray-50">
                              <div className="text-xs text-gray-500 mb-1">Preview:</div>
                              <div className="flex items-center space-x-2 overflow-x-auto">
                                <img 
                                  src={processedUrl} 
                                  alt={`Preview ${index + 1}`}
                                  className="h-24 w-auto object-contain border rounded"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%22100%22%20y%3D%22100%22%20font-family%3D%22Arial%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20fill%3D%22%239ca3af%22%3EImage%20not%20found%3C%2Ftext%3E%3C%2Fsvg%3E';
                                  }}
                                />
                                {isGoogleDrive && (
                                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    <div className="font-medium">Google Drive Detected</div>
                                    <div className="text-xs text-gray-500">Link will be converted automatically</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={addURLField}
                      className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add another image URL
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: Paste Google Drive shareable links directly. They'll be converted automatically.
                    </p>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.images.filter(url => url.trim() !== '').map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={processImageURL(url)}
                            alt={`Preview ${index}`}
                            className="h-20 w-20 object-cover rounded border border-gray-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2280%22%20height%3D%2280%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2280%22%20height%3D%2280%22%20fill%3D%22%23f3f4f6%22%2F%3E%3Ctext%20x%3D%2240%22%20y%3D%2240%22%20font-family%3D%22Arial%22%20font-size%3D%2210%22%20text-anchor%3D%22middle%22%20alignment-baseline%3D%22middle%22%20fill%3D%22%239ca3af%22%3EImage%3C%2Ftext%3E%3C%2Fsvg%3E';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleurs disponibles</label>
                  {formData.colors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="color"
                        value={color.value || '#000000'}
                        onChange={(e) => updateArrayField('colors', index, e.target.value, 'value')}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        title="Choisir la couleur"
                      />
                      <input
                        type="text"
                        value={color.name || ''}
                        onChange={(e) => updateArrayField('colors', index, e.target.value, 'name')}
                        placeholder="Nom de la couleur (ex: Rouge)"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {formData.colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('colors', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('colors')}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    + Ajouter une couleur
                  </button>
                </div>

                {/* Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tailles disponibles</label>
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => updateArrayField('sizes', index, e.target.value)}
                        placeholder="Ex: S, M, L, XL"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {formData.sizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('sizes', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('sizes')}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    + Ajouter une taille
                  </button>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingProduct ? 'Modifier' : 'Créer'} le Produit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;