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
    category_id: '',
    price: '',
    description: '',
    images: [''], // Start with one empty URL field
    colors: [],
    sizes: [],
    variants: [],
    status: 'active'
  });
  
  const [currentVariant, setCurrentVariant] = useState({
    id: null,
    color_name: '',
    color_value: '#000000',
    size: '',
    stock: 0,
    sku: '',
    barcode: '',
    price_adjustment: 0
  });
  const [imageURL, setImageURL] = useState('');

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
        setProducts(productsRes.data.products || []);
      }
      
      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.categories || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set default categories if API fails
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

  // Add image URL
  const addImageURL = (e) => {
    e.preventDefault();
    if (imageURL.trim() !== '') {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageURL.trim()]
      }));
      setImageURL('');
    }
  };

  // Add new URL input field
  const addURLField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

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

  // Remove image URL
  const removeImage = (indexToRemove) => {
    const newImages = formData.images.filter((_, index) => index !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      images: newImages.length > 0 ? newImages : [''] // Always keep at least one URL field
    }));
  };

  // Add color
  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, '']
    }));
  };

  // Update color
  const updateColor = (index, value) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => i === index ? value : color)
    }));
  };

  // Remove color
  const removeColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  // Add size
  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, '']
    }));
  };
  
  // Add or update variant
  const saveVariant = () => {
    if (!currentVariant.color_name || !currentVariant.size) {
      alert('Veuillez remplir la couleur et la taille');
      return;
    }
    
    setFormData(prev => {
      const existingIndex = prev.variants.findIndex(
        v => v.id === currentVariant.id || 
             (v.color_name === currentVariant.color_name && v.size === currentVariant.size)
      );
      
      const newVariant = {
        ...currentVariant,
        stock: parseInt(currentVariant.stock) || 0,
        price_adjustment: parseFloat(currentVariant.price_adjustment) || 0
      };
      
      if (existingIndex >= 0) {
        // Update existing variant
        const newVariants = [...prev.variants];
        newVariants[existingIndex] = newVariant;
        return { ...prev, variants: newVariants };
      } else {
        // Add new variant
        return { 
          ...prev, 
          variants: [...prev.variants, { ...newVariant, id: Date.now() }] 
        };
      }
    });
    
    // Reset the form
    setCurrentVariant({
      id: null,
      color_name: '',
      color_value: '#000000',
      size: '',
      stock: 0,
      sku: '',
      barcode: '',
      price_adjustment: 0
    });
    
    // Show success message
    alert(`✅ Combinaison ajoutée avec succès!\n\n🎨 Couleur: ${newVariant.color_name}\n📏 Taille: ${newVariant.size}\n📦 Stock: ${newVariant.stock} pièces\n\nVous pouvez maintenant ajouter d'autres combinaisons ou créer le produit.`);
  };
  
  // Edit variant
  const editVariant = (variant) => {
    setCurrentVariant({
      id: variant.id,
      color_name: variant.color_name || '',
      color_value: variant.color_value || '#000000',
      size: variant.size,
      stock: variant.stock,
      sku: variant.sku || '',
      barcode: variant.barcode || '',
      price_adjustment: variant.price_adjustment || 0
    });
  };
  
  // Remove variant
  const removeVariant = (variantId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette variante ?')) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.filter(v => v.id !== variantId)
      }));
    }
  };
  
  // Calculate total stock
  const totalStock = formData.variants.reduce((sum, variant) => sum + (parseInt(variant.stock) || 0), 0);

  // Update size
  const updateSize = (index, value) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => i === index ? value : size)
    }));
  };

  // Remove size
  const removeSize = (index) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
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
      
      if (formData.variants.length === 0) {
        alert('⚠️ IMPORTANT: Vous devez configurer le stock pour ce produit!\n\n📋 Étapes à suivre:\n1. Entrez une couleur (ex: Rouge)\n2. Entrez une taille (ex: L)\n3. Entrez la quantité en stock (ex: 10)\n4. Cliquez sur "Ajouter cette combinaison"\n\nRépétez pour toutes les combinaisons disponibles.');
        return;
      }

      const productData = {
        name: formData.name,
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price) || 0,
        description: formData.description,
        status: formData.status,
        images: processedImages,
        colors: formData.colors.filter(color => color.trim() !== ''),
        sizes: formData.sizes.filter(size => size.trim() !== ''),
        variants: formData.variants.map(variant => ({
          ...variant,
          stock: parseInt(variant.stock) || 0,
          price_adjustment: parseFloat(variant.price_adjustment) || 0
        }))
      };

      console.log('Submitting product data:', productData);
      console.log('Variants being sent:', productData.variants);

      const response = editingProduct 
        ? await axios.put(`/api/products/${editingProduct.id}`, productData)
        : await axios.post('/api/products', productData);
      
      // Reload data and close modal
      await loadData();
      resetForm();
      setShowModal(false);
      alert(editingProduct ? 'Produit modifié avec succès!' : 'Produit créé avec succès!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde du produit');
    }
  };

  const editProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      description: product.description || '',
      images: product.images && product.images.length > 0 ? [...product.images] : [''],
      colors: product.colors || [],
      sizes: product.sizes || [],
      variants: product.variants || [],
      status: product.status || 'active'
    });
    
    // Set the first variant as default if exists
    if (product.variants && product.variants.length > 0) {
      setCurrentVariant({
        ...product.variants[0],
        color_name: product.variants[0].color_name || '',
        color_value: product.variants[0].color_value || '#000000',
        size: product.variants[0].size || '',
        stock: product.variants[0].stock || 0,
        sku: product.variants[0].sku || '',
        barcode: product.variants[0].barcode || '',
        price_adjustment: product.variants[0].price_adjustment || 0
      });
    }
    
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

  const resetForm = () => {
    setFormData({
      name: '',
      category_id: '',
      price: '',
      description: '',
      images: [''],
      colors: [],
      sizes: [],
      variants: [],
      status: 'active'
    });
    setCurrentVariant({
      color_name: '',
      color_value: '#000000',
      size: '',
      stock: 0,
      sku: '',
      barcode: '',
      price_adjustment: 0,
      id: null
    });
    setEditingProduct(null);
    setShowModal(false);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Non défini';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#6B7280';
  };

  const formatPrice = (price) => {
    return `${parseFloat(price).toLocaleString()} DA`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement...</div>
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
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            ➕ Nouveau Produit
          </button>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getCategoryColor(product.category_id) }}
                    >
                      {getCategoryName(product.category_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock > 10 ? 'bg-green-100 text-green-800' :
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'active' ? 'Actif' :
                       product.status === 'inactive' ? 'Inactif' : 'Rupture'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => editProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">Aucun produit trouvé</div>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Créer le premier produit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix (DA) *
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Total: {totalStock}
                    </label>
                    <div className="text-xs text-gray-500">
                      {formData.variants.length > 0 
                        ? `Calculé automatiquement à partir de ${formData.variants.length} variante(s)`
                        : 'Ajoutez des variantes ci-dessous pour gérer le stock'
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
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
                  <p className="mt-1 text-xs text-gray-500">Ajoutez les URLs des images du produit</p>
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleurs disponibles
                  </label>
                  {formData.colors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        placeholder="Ex: Rouge, Noir, Bleu"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addColor}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    + Ajouter une couleur
                  </button>
                </div>

                {/* Sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tailles disponibles
                  </label>
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => updateSize(index, e.target.value)}
                        placeholder="Ex: S, M, L, XL"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSize}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    + Ajouter une taille
                  </button>
                </div>

                {/* Stock Management by Color and Size */}
                <div className="border-t pt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">📦 Gestion du Stock par Couleur et Taille</h3>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-bold text-yellow-800 mb-2">💡 Instructions:</h4>
                    <p className="text-sm text-yellow-700">
                      Définissez le stock pour chaque combinaison couleur/taille. 
                      <strong>Exemple:</strong> Rouge Taille L = 10 pièces, Noir Taille S = 8 pièces, etc.
                    </p>
                  </div>

                  {/* Quick Stock Setup */}
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Configuration Rapide du Stock</h4>
                    
                    {/* Color and Size Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Couleur *
                        </label>
                        <input
                          type="text"
                          value={currentVariant.color_name}
                          onChange={(e) => setCurrentVariant({...currentVariant, color_name: e.target.value})}
                          placeholder="Ex: Rouge, Noir, Bleu, Blanc"
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Taille *
                        </label>
                        <input
                          type="text"
                          value={currentVariant.size}
                          onChange={(e) => setCurrentVariant({...currentVariant, size: e.target.value})}
                          placeholder="Ex: S, M, L, XL, XXL"
                          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Stock Quantity */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-red-700 mb-2">
                        🏷️ Quantité en Stock *
                      </label>
                      <input
                        type="number"
                        value={currentVariant.stock}
                        onChange={(e) => setCurrentVariant({...currentVariant, stock: parseInt(e.target.value) || 0})}
                        min="0"
                        placeholder="Ex: 10, 5, 0"
                        className="w-full border-2 border-red-300 rounded-lg px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-red-50"
                      />
                      <p className="text-sm text-red-600 mt-1">Nombre de pièces disponibles pour cette combinaison couleur/taille</p>
                    </div>

                    {/* Color Preview */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aperçu de la couleur
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="color"
                          value={currentVariant.color_value}
                          onChange={(e) => setCurrentVariant({...currentVariant, color_value: e.target.value})}
                          className="w-16 h-16 border-2 border-gray-300 rounded-lg cursor-pointer"
                        />
                        <div className="text-sm text-gray-600">
                          Couleur sélectionnée: <span className="font-medium">{currentVariant.color_name || 'Non définie'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Variant Button */}
                    <button
                      type="button"
                      onClick={saveVariant}
                      disabled={!currentVariant.color_name || !currentVariant.size || currentVariant.stock < 0}
                      className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-bold flex items-center justify-center"
                    >
                      <span className="mr-2">➕</span>
                      Ajouter cette combinaison (Stock: {currentVariant.stock || 0})
                    </button>
                  </div>

                  {/* Current Variants List */}
                  {formData.variants.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                        <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">✓</span>
                        Variantes configurées ({formData.variants.length}) - Stock total: {totalStock}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formData.variants.map((variant, index) => (
                          <div key={variant.id || index} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                                  style={{ backgroundColor: variant.color_value }}
                                  title={variant.color_name}
                                ></div>
                                <div>
                                  <div className="font-bold text-gray-900">
                                    {variant.color_name} - {variant.size}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="text-red-500 hover:text-red-700 text-lg"
                                title="Supprimer"
                              >
                                ✕
                              </button>
                            </div>
                            
                            <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-center">
                              <div className="text-sm font-medium">Stock</div>
                              <div className="text-xl font-bold">{variant.stock}</div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => editVariant(variant)}
                              className="w-full mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              ✏️ Modifier
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Variants Warning */}
                  {formData.variants.length === 0 && (
                    <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
                      <div className="text-red-600 text-lg font-semibold mb-2">⚠️ Aucune variante configurée</div>
                      <p className="text-red-700">
                        Vous devez ajouter au moins une combinaison couleur/taille avec stock pour créer ce produit.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
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
                    {editingProduct ? 'Modifier' : 'Créer'}
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
