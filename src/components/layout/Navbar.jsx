import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories } from "../../hooks/useCategories";

const Navbar = ({ toggleLanguage, currentLang }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("');
  
  // Use database categories
  const { categories } = useCategories();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("'); // Clear search after submission
    }
  };

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
  };

  // Helper function to check if category is active
  const isCategoryActive = (categoryId) => {
    return location.pathname === `/category/${categoryId}`;
  };

  const isHomeActive = () => {
    return location.pathname === "/";
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2">
          {/* Top Section: Hamburger, Logo, Account */}
          <div className="flex items-center justify-between">
            {/* Left: Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-text hover:text-primary transition-colors duration-300 md:hidden"
              aria-label="Toggle menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Center: Logo */}
            <Link to="/" className="flex items-center">
              <img src="/images/logo.png" alt="Almezouara" className="h-10 md:h-9" />
            </Link>

            {/* Right: Account Icon */}
            <Link 
              to="/account" 
              className="p-1.5 text-text hover:text-primary transition-colors duration-300"
              aria-label="Account"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-3 md:hidden">
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchInput}
                placeholder="Rechercher des produits..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 focus:bg-white focus:shadow-md placeholder-gray-400"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 hover:text-primary transition-colors duration-300 group-focus-within:text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:text-gray-600 transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </form>
          </div>

          {/* Mobile Categories */}
          <div className="mt-3 md:hidden">
            <div className="flex items-center space-x-4 overflow-x-auto pb-1 scrollbar-hide">
              <Link
                to="/"
                className={`relative flex-shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 ${
                  isHomeActive()
                    ? "text-white bg-primary shadow-md"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
              >
                TOUT
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.originalName}`}
                  className={`group relative flex-shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ${
                    isCategoryActive(category.originalName)
                      ? "text-white bg-primary shadow-md"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                >
                  {category.name}
                  {!isCategoryActive(category.originalName) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.originalName}`}
                  className="text-text hover:text-primary transition-colors duration-300 font-medium"
                >
                  {category.originalName}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-300"
                aria-label={`Switch to ${currentLang === "fr" ? "Arabic" : "French"}`}
              >
                {currentLang === "fr" ? "العربية" : "Français"}
              </button>
              
              <Link to="/search" className="text-text hover:text-primary transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sliding Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Sliding Menu */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 md:hidden"
            >
              <div className="p-6">
                {/* Menu Header */}
                <div className="flex items-center justify-between mb-8">
                  <img src="/images/logo.png" alt="Almezouara" className="h-10" />
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Categories */}
                <div className="space-y-1 mb-8">
                  <h3 className="text-lg font-semibold text-text mb-4">{t("nav.categories")}</h3>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.originalName}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                    >
                      <span className="text-2xl">📁</span>
                      <span className="font-medium text-text">{category.originalName}</span>
                    </Link>
                  ))}
                </div>

                {/* Menu Footer */}
                <div className="border-t pt-6 space-y-4">
                  <Link
                    to="/search"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="font-medium text-text">{t("nav.search")}</span>
                  </Link>

                  <button
                    onClick={() => {
                      toggleLanguage();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-300 w-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span className="font-medium text-text">
                      {currentLang === "fr" ? "العربية" : "Français"}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;