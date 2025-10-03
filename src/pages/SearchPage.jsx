import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";

const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Expanded sample products data - in a real app, this would come from an API
  const allProducts = [
    {
      id: 1,
      name: "Robe Élégante",
      price: 3500,
      image: "/images/IMG_0630-scaled.jpeg",
      category: "dresses",
    },
    {
      id: 2,
      name: "Hijab Premium",
      price: 1200,
      image: "/images/IMG_6710-scaled.jpeg",
      category: "hijabs",
    },
    {
      id: 3,
      name: "Robe de Soirée",
      price: 4500,
      image: "/images/IMG_6789-scaled.jpeg",
      category: "dresses",
    },
    {
      id: 4,
      name: "Ensemble Casual",
      price: 2800,
      image: "/images/IMG_9260-scaled.jpeg",
      category: "dresses",
    },
    {
      id: 5,
      name: "Hijab Moderne",
      price: 1500,
      image: "/images/IMG_0630-scaled.jpeg",
      category: "hijabs",
    },
    {
      id: 6,
      name: "Robe Tendance",
      price: 3200,
      image: "/images/IMG_6789-scaled.jpeg",
      category: "dresses",
    },
    {
      id: 7,
      name: "Chaussures Élégantes",
      price: 4200,
      image: "/images/IMG_9260-scaled.jpeg",
      category: "shoes",
    },
    {
      id: 8,
      name: "Accessoire Chic",
      price: 900,
      image: "/images/IMG_6710-scaled.jpeg",
      category: "accessories",
    },
    {
      id: 9,
      name: "Robe Moderne",
      price: 3800,
      image: "/images/IMG_0630-scaled.jpeg",
      category: "dresses",
    },
    {
      id: 10,
      name: "Hijab Collection",
      price: 1800,
      image: "/images/IMG_6789-scaled.jpeg",
      category: "hijabs",
    }
  ];

  // Effect to handle URL search params
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  // Use infinite scroll hook for search results
  const { displayedItems: displayedResults, hasMore, isLoading: infiniteLoading } = useInfiniteScroll(searchResults, 6);

  // Perform search function
  const performSearch = (query) => {
    setIsSearching(true);

    // Simulate API search delay
    setTimeout(() => {
      // Filter products based on search query
      const results = allProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
      performSearch(searchQuery);
    }
  };

  // Format price with DZD
  const formatPrice = (price) => {
    return `${price.toLocaleString()} DZD`;
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-16">
      {/* Desktop Hero Header */}
      <div className="hidden md:block text-center mb-12">
        <h1 className="text-5xl font-bold text-text mb-6">{t("search.title")}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Trouvez rapidement les produits qui correspondent à vos besoins
        </p>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden mb-6">
        <h1 className="text-2xl font-bold text-text mb-6">{t("search.title")}</h1>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex shadow-lg rounded-xl overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("search.placeholder")}
              className="flex-grow px-6 py-4 text-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-primary to-pink-600 text-white hover:from-pink-600 hover:to-primary transition-all duration-300 font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </form>

      {/* Search Results */}
      <div className="space-y-4">
        {isSearching ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : searchQuery && searchResults.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("search.no_results")}</p>
          </div>
        ) : searchQuery ? (
          <div>
            <h2 className="text-lg font-medium text-text mb-4">
              {t("search.results_for")} "{searchQuery}" ({searchResults.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedResults.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="text-text font-medium truncate">{product.name}</h4>
                    <p className="text-primary font-bold mt-1">{formatPrice(product.price)}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Loading indicator for infinite scroll */}
            {infiniteLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* End of results message */}
            {!hasMore && displayedResults.length > 0 && displayedResults.length === searchResults.length && (
              <div className="text-center py-8">
                <p className="text-gray-500">Vous avez vu tous les résultats ✨</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{t("search.start_searching")}</p>
          </div>
        )}
      </div>

      {/* Popular Searches */}
      {!searchQuery && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-text mb-4">{t("search.popular_searches")}</h2>
          <div className="flex flex-wrap gap-2">
            {["Robe", "Hijab", "Été", "Soirée", "Casual"].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  setSearchParams({ q: term });
                  performSearch(term);
                }}
                className="px-3 py-1 bg-neutral text-text rounded-full hover:bg-gray-200 transition-colors duration-300"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;