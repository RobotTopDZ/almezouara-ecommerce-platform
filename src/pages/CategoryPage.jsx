import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useCategories } from '../hooks/useCategories';
import axios from 'axios';

const CategoryPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    size: '',
    color: '',
    priceRange: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use the shared categories hook
  const { categories } = useCategories();

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/products');
        
        if (response.data.success && response.data.products) {
          const transformedProducts = response.data.products
            .filter(product => product.status === 'active')
            .map(product => {
              return {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : '/images/IMG_0630-scaled.jpeg',
                category_name: product.category_name || 'General',
                colors: product.colors || [],
                sizes: product.sizes || []
              };
            });
          setAllProducts(transformedProducts);
        } else {
          console.error('Failed to load products from API.');
          setAllProducts([]); // Set to empty array on failure
        }
      } catch (error) {
        console.error('Error loading products:', error);
        setAllProducts([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Filter products by category ID
  const filteredProducts = allProducts.filter(product => {
    // First try to match by category_name (for backward compatibility)
    if (product.category_name && product.category_name.toLowerCase() === id.toLowerCase()) {
      return true;
    }
    // Then try to match by category (new format)
    if (product.category && product.category.toLowerCase() === id.toLowerCase()) {
      return true;
    }
    // If no match, check if this is the 'all' category
    if (id.toLowerCase() === 'all') {
      return true;
    }
    return false;
  });

  // Use infinite scroll hook for the correctly filtered products
  const { displayedItems: displayedProducts, hasMore, isLoading: isLoadingMore } = useInfiniteScroll(filteredProducts, 12);

  // Get category name for the header
  const getCategoryName = () => {
    if (!id || id.toLowerCase() === 'all') return 'Tous les produits';
    
    // First try to find by id
    let category = categories.find(cat => cat.id && cat.id.toLowerCase() === id.toLowerCase());
    
    // If not found by id, try to find by originalName
    if (!category) {
      category = categories.find(cat => 
        cat.originalName && cat.originalName.toLowerCase() === id.toLowerCase()
      );
    }
    
    return category ? category.originalName : id;
  };

  // Format price with DZD
  const formatPrice = (price) => {
    return `${price.toLocaleString()} DZD`;
  };

  // Toggle view mode
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // Toggle filters panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Show loading state while fetching products
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Catégorie non spécifiée</h2>
          <p className="text-gray-600">Aucune catégorie n'a été sélectionnée.</p>
          <Link 
            to="/" 
            className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-16">
      {/* Desktop Hero Header */}
      <div className="hidden md:block text-center mb-12">
        <h1 className="text-5xl font-bold text-text mb-4">
          {getCategoryName()}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Découvrez notre collection exclusive de {getCategoryName().toLowerCase()} 
          soigneusement sélectionnés pour vous
        </p>
        <div className="mt-6 inline-block bg-gradient-to-r from-primary to-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium">
          {filteredProducts.length} produits disponibles
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden mb-6">
        <h1 className="text-2xl font-bold text-text mb-4">{getCategoryName()}</h1>
      </div>

      {/* Filters and View Mode */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={toggleFilters}
          className="flex items-center text-text hover:text-primary transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>{t('category.filters')}</span>
        </button>

        <div className="flex space-x-2">
          <button
            onClick={() => toggleViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-neutral text-text'} rounded-md`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <button
            onClick={() => toggleViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-neutral text-text'} rounded-md`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h2 className="font-medium text-text mb-3">{t('category.filter_products')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Size Filter */}
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-text mb-1">
                {t('category.size')}
              </label>
              <select
                id="size"
                name="size"
                value={filters.size}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t('category.all_sizes')}</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>

            {/* Color Filter */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-text mb-1">
                {t('category.color')}
              </label>
              <select
                id="color"
                name="color"
                value={filters.color}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t('category.all_colors')}</option>
                <option value="black">{t('category.color_black')}</option>
                <option value="white">{t('category.color_white')}</option>
                <option value="red">{t('category.color_red')}</option>
                <option value="blue">{t('category.color_blue')}</option>
                <option value="green">{t('category.color_green')}</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label htmlFor="priceRange" className="block text-sm font-medium text-text mb-1">
                {t('category.price_range')}
              </label>
              <select
                id="priceRange"
                name="priceRange"
                value={filters.priceRange}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">{t('category.all_prices')}</option>
                <option value="0-1000">0 - 1000 DZD</option>
                <option value="1000-2000">1000 - 2000 DZD</option>
                <option value="2000-3000">2000 - 3000 DZD</option>
                <option value="3000-5000">3000 - 5000 DZD</option>
                <option value="5000+">5000+ DZD</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({ size: '', color: '', priceRange: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 mr-2"
            >
              {t('category.reset_filters')}
            </button>
            <button
              onClick={toggleFilters}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-pink-700 transition-colors duration-300"
            >
              {t('category.apply_filters')}
            </button>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {displayedProducts.length > 0 ? (
        <>
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
            {displayedProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 ${viewMode === 'list' ? 'flex' : ''}`}
              >
                <div className={viewMode === 'grid' ? 'aspect-square overflow-hidden' : 'w-1/3'}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={`p-3 ${viewMode === 'list' ? 'w-2/3' : ''}`}>
                  <h4 className="text-text font-medium truncate">{product.name}</h4>
                  <p className="text-primary font-bold mt-1">{formatPrice(product.price)}</p>
                  {viewMode === 'list' && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.colors.map((color) => (
                          <div
                            key={color}
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.sizes.map((size) => (
                          <span key={size} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoadingMore && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* End of products message */}
          {!hasMore && displayedProducts.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Vous avez vu tous les produits de cette catégorie ✨</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('category.no_products')}</p>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;