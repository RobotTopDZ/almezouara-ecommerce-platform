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
    status: 'active',
    product_type: 'simple' // 'simple' ou 'variable'
  });
  
  // État pour contrôler l'affichage du modal de choix du type de produit
  const [showProductTypeModal, setShowProductTypeModal] = useState(false);
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
  
  // États pour la génération automatique des variations
  const [bulkColors, setBulkColors] = useState([]);
  const [bulkSizes, setBulkSizes] = useState([]);
  const [bulkColorInput, setBulkColorInput] = useState('');
  const [bulkSizeInput, setBulkSizeInput] = useState('');
  const [bulkColorValue, setBulkColorValue] = useState('#FF0000');
  const [generatedVariants, setGeneratedVariants] = useState([]);

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
      } else if (Array.isArray(productsRes.data.products)) {
        // Handle mock products shape from api/index.js (no success flag)
        const transformedProducts = productsRes.data.products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price || 0,
          // No category_id in mock, keep derived fields minimal
          category: product.category || 'Non défini',
          categoryId: product.category_id || null,
          // Mock may have single image field
          images: product.images || (product.image ? [product.image] : []),
          colors: product.colors || [],
          sizes: product.sizes || [],
          status: product.status || 'active',
          stock: product.stock || 0,
          product_type: product.product_type || 'simple'
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

      // Validation et préparation du stock pour les produits simples
      let simpleStock;
      if (formData.product_type === 'simple') {
        const stockInput = document.getElementById('simple-product-stock');
        const defaultStock = stockInput ? stockInput.value : '';
        if (defaultStock === '' || parseInt(defaultStock) < 0) {
          alert('Veuillez spécifier un stock valide pour ce produit');
          return;
        }
        simpleStock = parseInt(defaultStock);
      } else if (formData.product_type === 'variable' && formData.variants.length === 0) {
        alert('⚠️ IMPORTANT: Vous devez configurer le stock pour ce produit!\n\n📋 Étapes à suivre:\n1. Entrez une couleur (ex: Rouge)\n2. Entrez une taille (ex: L)\n3. Entrez la quantité en stock (ex: 10)\n4. Cliquez sur "Ajouter cette combinaison"\n\nRépétez pour toutes les combinaisons disponibles.');
        return;
      }

      const productData = {
        name: formData.name,
        category_id: parseInt(formData.category_id),
        price: parseFloat(formData.price),
        description: formData.description,
        status: formData.status,
        product_type: formData.product_type,
        stock: simpleStock,
        images: processedImages,
        colors: formData.colors.filter(color => color.name && color.name.trim() !== ''),
        sizes: formData.sizes.filter(size => size.trim() !== ''),
        variants: formData.product_type === 'variable' ? formData.variants.map(variant => ({
          color_name: variant.color_name,
          color_value: variant.color_value,
          size: variant.size,
          stock: parseInt(variant.stock) || 0,
          sku: variant.sku,
          barcode: variant.barcode,
          price_adjustment: parseFloat(variant.price_adjustment) || 0
        })) : []
      };

      console.log('Submitting product data:', productData);
      console.log('Variants being sent:', productData.variants);

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
      category_id: '',
      price: '',
      description: '',
      images: [''], // Start with one empty URL field
      colors: [],
      sizes: [],
      variants: [],
      status: 'active',
      product_type: 'simple'
    });
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
    setEditingProduct(null);
    setShowModal(false);
    setShowProductTypeModal(false);
  };
  
  // Fonction pour gérer le choix du type de produit
  const handleProductTypeSelection = (type) => {
    setFormData(prev => ({
      ...prev,
      product_type: type
    }));
    setShowProductTypeModal(false);
    setShowModal(true);
  };

  const handleEdit = async (product) => {
    setEditingProduct(product);
    console.log("Editing product:", product);
    
    // Définir le type de produit en fonction des données existantes
    const isVariableProduct = product.product_type === 'variable' || 
                             (product.variants && product.variants.length > 0) ||
                             (product.colors && product.colors.length > 0 && product.sizes && product.sizes.length > 0);
    
    // Load variants for this product
    try {
      // Forcer le chargement des variantes depuis l'API
      const variantsRes = await axios.get(`/api/product-variants/product/${product.id}`);
      console.log("Variants response:", variantsRes.data);
      
      // Assurez-vous que nous avons des variantes, même si la réponse n'a pas de propriété success
      let variants = [];
      if (variantsRes.data && variantsRes.data.success && Array.isArray(variantsRes.data.variants)) {
        variants = variantsRes.data.variants;
      } else if (variantsRes.data && Array.isArray(variantsRes.data)) {
        variants = variantsRes.data;
      } else if (product.variants && Array.isArray(product.variants)) {
        // Utiliser les variantes déjà présentes dans l'objet produit si l'API ne renvoie rien
        variants = product.variants;
        console.log("Using variants from product object:", variants);
      }
      
      console.log("Variants after processing response:", variants);
      
      // Si aucune variante n'est trouvée mais que le produit est de type variable,
      // créer au moins une variante par défaut
      if (variants.length === 0 && isVariableProduct) {
        console.log("Creating default variant for variable product");
        variants = [{
          id: `default-${Date.now()}`,
          color_name: product.colors && product.colors.length > 0 ? 
                     (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].name) : 'Default',
          color_value: product.colors && product.colors.length > 0 && 
                      typeof product.colors[0] !== 'string' ? product.colors[0].value : '#000000',
          size: product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Default',
          stock: 1,
          sku: '',
          barcode: '',
          price_adjustment: 0
        }];
      }
      
      // Ensure each variant has an id property for proper tracking
      const processedVariants = variants.map(variant => ({
        id: variant.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        color_name: variant.color_name || variant.color || '',
        color_value: variant.color_value || '#000000',
        size: variant.size || '',
        stock: parseInt(variant.stock) || 0,
        sku: variant.sku || '',
        barcode: variant.barcode || '',
        price_adjustment: parseFloat(variant.price_adjustment) || 0
      }));
      
      console.log("Processed variants:", processedVariants);
      
      // Extract unique colors and sizes from variants for bulk editing
      const uniqueColors = [];
      const uniqueSizes = [];
      
      processedVariants.forEach(variant => {
        // Add unique colors with their values
        if (variant.color_name && !uniqueColors.some(c => c.name === variant.color_name)) {
          uniqueColors.push({
            name: variant.color_name,
            value: variant.color_value || '#000000'
          });
        }
        
        // Add unique sizes
        if (variant.size && !uniqueSizes.includes(variant.size)) {
          uniqueSizes.push(variant.size);
        }
      });
      
      // Transform colors to new format if they're strings
      let colors = [];
      if (product.colors && product.colors.length > 0) {
        colors = product.colors.map(color => {
          if (typeof color === 'string') {
            return { name: color, value: '#000000' };
          }
          return color;
        });
      }

      // Ensure sizes is an array
      let sizes = [];
      if (product.sizes) {
        if (typeof product.sizes === 'string') {
          try {
            sizes = JSON.parse(product.sizes);
          } catch (e) {
            sizes = product.sizes.split(',').map(s => s.trim()).filter(s => s);
          }
        } else if (Array.isArray(product.sizes)) {
          sizes = product.sizes;
        }
      }
      
      const formDataToSet = {
        name: product.name,
        category_id: product.categoryId?.toString() || product.category_id?.toString() || '',
        price: product.price.toString(),
        description: product.description,
        images: product.images || [],
        colors: colors,
        sizes: sizes,
        variants: processedVariants,
        status: product.status,
        product_type: product.product_type || 'simple'
      };
      
      console.log("Setting form data:", formDataToSet);
      
      setFormData(formDataToSet);
      
      // Set bulk colors and sizes for the variant generator
      setBulkColors(uniqueColors);
      setBulkSizes(uniqueSizes);
      
      // Générer les variations automatiquement si nécessaire
      // Important: Appeler après setFormData pour s'assurer que les données sont disponibles
      if (processedVariants.length > 0) {
        // Utiliser directement les variants existants au lieu de générer des combinaisons
        setFormData(prevData => ({
          ...prevData,
          variants: processedVariants
        }));
        
        console.log("Variants existants chargés directement:", processedVariants);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
      // Set form data without variants
      setFormData({
        name: product.name,
        category_id: product.categoryId?.toString() || product.category_id?.toString() || '',
        price: product.price.toString(),
        description: product.description,
        images: product.images || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        variants: [],
        status: product.status,
        product_type: product.product_type || 'simple'
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

  // Ajouter une couleur à la liste des couleurs en masse
  const addBulkColor = () => {
    if (!bulkColorInput.trim()) return;
    
    // Vérifier si la couleur existe déjà
    if (!bulkColors.some(c => c.name.toLowerCase() === bulkColorInput.trim().toLowerCase())) {
      setBulkColors([...bulkColors, { 
        name: bulkColorInput.trim(), 
        value: bulkColorValue 
      }]);
    }
    setBulkColorInput('');
  };

  // Ajouter une taille à la liste des tailles en masse
  const addBulkSize = () => {
    if (!bulkSizeInput.trim()) return;
    
    // Vérifier si la taille existe déjà
    if (!bulkSizes.includes(bulkSizeInput.trim())) {
      setBulkSizes([...bulkSizes, bulkSizeInput.trim()]);
    }
    setBulkSizeInput('');
  };

  // Supprimer une couleur de la liste
  const removeBulkColor = (index) => {
    setBulkColors(bulkColors.filter((_, i) => i !== index));
  };

  // Supprimer une taille de la liste
  const removeBulkSize = (index) => {
    setBulkSizes(bulkSizes.filter((_, i) => i !== index));
  };

  // Mettre à jour la valeur de couleur
  const updateColorValue = (index, value) => {
    const newColors = [...bulkColors];
    newColors[index].value = value;
    setBulkColors(newColors);
  };

  // Générer toutes les combinaisons possibles de couleurs et tailles
  const generateVariantCombinations = () => {
    if (bulkColors.length === 0 || bulkSizes.length === 0) {
      alert('Veuillez ajouter au moins une couleur et une taille');
      return;
    }

    const combinations = [];
    
    // Créer toutes les combinaisons possibles
    bulkColors.forEach(color => {
      bulkSizes.forEach(size => {
        combinations.push({
          id: null,
          color_name: color.name,
          color_value: color.value,
          size: size,
          stock: 0,
          sku: '',
          barcode: '',
          price_adjustment: 0
        });
      });
    });
    
    setGeneratedVariants(combinations);
  };

  // Mettre à jour le stock d'une variation générée
  const updateGeneratedVariantStock = (index, stock) => {
    const newVariants = [...generatedVariants];
    newVariants[index].stock = parseInt(stock) || 0;
    setGeneratedVariants(newVariants);
  };

  // Sauvegarder toutes les variations générées
  const saveGeneratedVariants = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, ...generatedVariants]
    }));
    
    // Réinitialiser après sauvegarde
    setGeneratedVariants([]);
    setBulkColors([]);
    setBulkSizes([]);
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
      stock: parseInt(variant.stock) || 0,
      sku: variant.sku || '',
      barcode: variant.barcode || '',
      price_adjustment: parseFloat(variant.price_adjustment) || 0
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
      {/* Modal de choix du type de produit */}
      {showProductTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full">
            <h2 className="text-xl font-semibold mb-4">Choisir le type de produit</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => handleProductTypeSelection('simple')}
                className="bg-blue-100 hover:bg-blue-200 p-4 rounded-lg flex flex-col items-center justify-center transition-colors"
              >
                <div className="text-3xl mb-2">📦</div>
                <div className="font-medium">Produit Simple</div>
                <div className="text-sm text-gray-600 text-center mt-1">Un produit sans variations</div>
              </button>
              <button
                onClick={() => handleProductTypeSelection('variable')}
                className="bg-purple-100 hover:bg-purple-200 p-4 rounded-lg flex flex-col items-center justify-center transition-colors"
              >
                <div className="text-3xl mb-2">🎨</div>
                <div className="font-medium">Produit Variable</div>
                <div className="text-sm text-gray-600 text-center mt-1">Avec couleurs, tailles, etc.</div>
              </button>
            </div>
            <button
              onClick={() => setShowProductTypeModal(false)}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
            <p className="text-gray-600">Gérez votre catalogue de produits</p>
          </div>
          <button
            onClick={() => setShowProductTypeModal(true)}
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
                    {Array.isArray(product.colors) && product.colors.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Couleurs:</span>
                        <div className="flex space-x-1">
                          {product.colors.slice(0, 4).map((color, index) => {
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
                    {Array.isArray(product.sizes) && product.sizes.length > 0 && (
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Conditional Stock/Variant Management */}
                {formData.product_type === 'simple' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input
                      type="number"
                      id="simple-product-stock"
                      defaultValue={editingProduct?.stock ?? formData.variants[0]?.stock ?? ''}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Quantité en stock"
                    />
                  </div>
                ) : (
                  <div className="border-t pt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">📦 Gestion du Stock par Couleur et Taille</h3>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <h4 className="text-sm font-bold text-yellow-800 mb-2">💡 Instructions:</h4>
                      <p className="text-sm text-yellow-700">
                        Définissez le stock pour chaque combinaison couleur/taille. 
                        <strong>Exemple:</strong> Rouge Taille L = 10 pièces, Noir Taille S = 8 pièces, etc.
                      </p>
                    </div>

                    {/* Génération Automatique des Variations */}
                    <div className="bg-white border-2 border-purple-200 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">✨</span>
                        Génération Automatique des Variations
                      </h4>
                      
                      {/* Bulk Colors Input */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ajouter des Couleurs
                        </label>
                        <div className="flex space-x-2 mb-3">
                          <input
                            type="text"
                            value={bulkColorInput}
                            onChange={(e) => setBulkColorInput(e.target.value)}
                            placeholder="Nom de la couleur (ex: Rouge, Bleu...)"
                            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBulkColor())}
                          />
                          <div className="flex flex-col space-y-1">
                            <input
                              type="color"
                              value={bulkColorValue}
                              onChange={(e) => setBulkColorValue(e.target.value)}
                              className="w-12 h-6 border-2 border-gray-300 rounded cursor-pointer"
                              title="Sélectionner la couleur"
                            />
                            <input
                              type="text"
                              value={bulkColorValue}
                              onChange={(e) => setBulkColorValue(e.target.value)}
                              placeholder="#FF0000"
                              className="w-20 text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              pattern="^#[0-9A-Fa-f]{6}$"
                              title="Code couleur hexadécimal (ex: #FF0000)"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={addBulkColor}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                        
                        {/* Color Tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {bulkColors.map((color, index) => (
                            <div 
                              key={index} 
                              className="flex items-center bg-gray-100 rounded-full pl-1 pr-2 py-1"
                            >
                              <input 
                                type="color"
                                value={color.value}
                                onChange={(e) => updateColorValue(index, e.target.value)}
                                className="w-5 h-5 rounded-full mr-1 cursor-pointer"
                              />
                              <span className="text-sm">{color.name}</span>
                              <button 
                                onClick={() => removeBulkColor(index)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Bulk Sizes Input */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ajouter des Tailles
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={bulkSizeInput}
                            onChange={(e) => setBulkSizeInput(e.target.value)}
                            placeholder="Ex: S, M, L, XL..."
                            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBulkSize())}
                          />
                          <button
                            type="button"
                            onClick={addBulkSize}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                        
                        {/* Size Tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {bulkSizes.map((size, index) => (
                            <div 
                              key={index} 
                              className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                            >
                              <span className="text-sm">{size}</span>
                              <button 
                                onClick={() => removeBulkSize(index)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Generate Button */}
                      <button
                        type="button"
                        onClick={generateVariantCombinations}
                        disabled={bulkColors.length === 0 || bulkSizes.length === 0}
                        className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-bold flex items-center justify-center"
                      >
                        <span className="mr-2">✨</span>
                        Générer {bulkColors.length * bulkSizes.length} Variations
                      </button>
                    </div>
                    
                    {/* Generated Variants */}
                    {generatedVariants.length > 0 && (
                      <div className="bg-white border-2 border-purple-200 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-purple-800 mb-4">
                          Variations Générées ({generatedVariants.length})
                        </h4>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left">Couleur</th>
                                <th className="px-4 py-2 text-left">Taille</th>
                                <th className="px-4 py-2 text-right">Stock</th>
                              </tr>
                            </thead>
                            <tbody>
                              {generatedVariants.map((variant, index) => (
                                <tr key={index} className="border-t border-gray-100">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      <div 
                                        className="w-5 h-5 rounded-full mr-2"
                                        style={{ backgroundColor: variant.color_value }}
                                      ></div>
                                      {variant.color_name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">{variant.size}</td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      value={variant.stock}
                                      onChange={(e) => updateGeneratedVariantStock(index, e.target.value)}
                                      min="0"
                                      className="w-20 text-right border border-gray-300 rounded px-2 py-1"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 flex justify-between">
                          <button
                            type="button"
                            onClick={() => setGeneratedVariants([])}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={saveGeneratedVariants}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Ajouter toutes les variations
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Stock Setup */}
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Configuration Manuelle</h4>
                      
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
                                    style={{ backgroundColor: variant.color_value || '#000000' }}
                                    title={variant.color_name}
                                  ></div>
                                  <div>
                                    <div className="font-bold text-gray-900">
                                      {variant.color_name || 'N/A'} - {variant.size || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVariant(index)}
                                  className="text-red-500 hover:text-red-700 text-lg"
                                  title="Supprimer"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-center">
                                <div className="text-sm font-medium">Stock</div>
                                <div className="flex items-center justify-center">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newStock = Math.max(0, parseInt(variant.stock) - 1);
                                      const newVariants = [...formData.variants];
                                      const index = newVariants.findIndex(v => v.id === variant.id);
                                      if (index !== -1) {
                                        newVariants[index] = {...newVariants[index], stock: newStock};
                                        setFormData({...formData, variants: newVariants});
                                      }
                                    }}
                                    className="bg-red-200 hover:bg-red-300 text-red-800 font-bold px-2 rounded-l"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(e) => {
                                      const newStock = Math.max(0, parseInt(e.target.value) || 0);
                                      const newVariants = [...formData.variants];
                                      const index = newVariants.findIndex(v => v.id === variant.id);
                                      if (index !== -1) {
                                        newVariants[index] = {...newVariants[index], stock: newStock};
                                        setFormData({...formData, variants: newVariants});
                                      }
                                    }}
                                    min="0"
                                    className="w-16 text-center text-xl font-bold bg-red-100 border-0 focus:ring-0"
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newStock = parseInt(variant.stock) + 1;
                                      const newVariants = [...formData.variants];
                                      const index = newVariants.findIndex(v => v.id === variant.id);
                                      if (index !== -1) {
                                        newVariants[index] = {...newVariants[index], stock: newStock};
                                        setFormData({...formData, variants: newVariants});
                                      }
                                    }}
                                    className="bg-red-200 hover:bg-red-300 text-red-800 font-bold px-2 rounded-r"
                                  >
                                    +
                                  </button>
                                </div>
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
                )}

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