import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Pages
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import AccountPage from './pages/AccountPage';
import SearchPage from './pages/SearchPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard, { RequireAdmin, AdminOverview, AdminFees, AdminProducts } from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminCategories from './pages/AdminCategories';
import AdminAccounts from './pages/AdminAccounts';
import AdminPromotions from './pages/AdminPromotions';
import AdminYalidineConfig from './pages/AdminYalidineConfig';

// Components
import Navbar from './components/layout/Navbar';
import BottomNavigation from './components/layout/BottomNavigation';

const App = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [direction, setDirection] = useState('ltr');

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    setDirection(i18n.language === 'ar' ? 'rtl' : 'ltr');
  }, [i18n.language]);

  // Toggle language
  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className={`app min-h-screen flex flex-col ${direction === 'rtl' ? 'font-arabic' : 'font-sans'}`}>
      <Navbar toggleLanguage={toggleLanguage} currentLang={i18n.language} />
      
      <main className="flex-grow pb-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin><AdminOverview /></RequireAdmin>} />
          <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
          <Route path="/admin/yalidine-config" element={<RequireAdmin><AdminYalidineConfig /></RequireAdmin>} />
          <Route path="/admin/fees" element={<RequireAdmin><AdminFees /></RequireAdmin>} />
          <Route path="/admin/categories" element={<RequireAdmin><AdminCategories /></RequireAdmin>} />
          <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
          <Route path="/admin/accounts" element={<RequireAdmin><AdminAccounts /></RequireAdmin>} />
          <Route path="/admin/promotions" element={<RequireAdmin><AdminPromotions /></RequireAdmin>} />
        </Routes>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default App;