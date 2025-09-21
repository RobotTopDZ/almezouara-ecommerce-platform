import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';

const AccountPage = () => {
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [loginForm, setLoginForm] = useState({
    phoneNumber: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!loginForm.phoneNumber) return;
        const response = await axios.get(`/api/accounts/${loginForm.phoneNumber}`);
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn]);

  // Handle login form input changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({
      ...loginForm,
      [name]: value,
    });
  };

  // Handle register form input changes
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm({
      ...registerForm,
      [name]: value,
    });
  };

  // Handle login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/login', { phoneNumber: loginForm.phoneNumber, password: loginForm.password });
    setIsLoggedIn(true);
    } catch (err) {
      alert('Login failed');
    }
  };

  // Handle register submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', { fullName: registerForm.fullName, phoneNumber: registerForm.phoneNumber, password: registerForm.password });
      // Auto switch to login with provided phone
      setLoginForm({ phoneNumber: registerForm.phoneNumber, password: registerForm.password });
    setIsLoggedIn(true);
    } catch (err) {
      alert('Registration failed');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Format price with DZD
  const formatPrice = (price) => {
    return `${price.toLocaleString()} DZD`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return t('account.status_delivered');
      case 'processing':
        return t('account.status_processing');
      case 'shipped':
        return t('account.status_shipped');
      case 'cancelled':
        return t('account.status_cancelled');
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-16">
      <h1 className="text-2xl font-bold text-text mb-6">{t('nav.account')}</h1>

      {isLoggedIn && userData ? (
        <div>
          {/* User Info */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold">
                {userData.name.charAt(0)}
              </div>
              <div className="ml-4">
                <h2 className="font-medium text-text">{userData.name}</h2>
                <p className="text-sm text-gray-500">{userData.phoneNumber}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto text-sm text-primary hover:text-pink-700 transition-colors duration-300"
              >
                {t('account.logout')}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'orders' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
              >
                {t('account.my_orders')}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'profile' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
              >
                {t('account.profile')}
              </button>
            </div>

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="p-4">
                {userData.orders.length > 0 ? (
                  <div className="space-y-4">
                    {userData.orders.map((order) => (
                      <div key={order.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium text-text">{order.id}</span>
                            <span className="text-sm text-gray-500 ml-2">{order.date}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(order.status)}`}>
                            {getStatusText(order.status)}
                          </div>
                        </div>
                        <div className="p-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center py-2 border-b last:border-b-0">
                              <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                              <div className="ml-3">
                                <h3 className="font-medium text-text">{item.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {item.color} - {item.size}
                                </p>
                                <p className="font-bold text-primary">{formatPrice(item.price)}</p>
                              </div>
                            </div>
                          ))}
                          <div className="mt-3 flex justify-between items-center">
                            <span className="font-medium text-text">{t('account.total')}:</span>
                            <span className="font-bold text-primary">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">{t('account.no_orders')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-4">
                <form className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-text mb-1">
                      {t('checkout.full_name')}
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={userData.name}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      readOnly
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-text mb-1">
                      {t('checkout.phone_number')}
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={userData.phoneNumber}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      readOnly
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      className="w-full py-3 px-6 bg-primary hover:bg-pink-700 text-white font-medium rounded-md transition-colors duration-300"
                    >
                      {t('account.update_profile')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'login' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            >
              {t('account.login')}
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'register' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            >
              {t('account.register')}
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <div className="p-4">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="loginPhoneNumber" className="block text-sm font-medium text-text mb-1">
                    {t('checkout.phone_number')}
                  </label>
                  <input
                    type="tel"
                    id="loginPhoneNumber"
                    name="phoneNumber"
                    value={loginForm.phoneNumber}
                    onChange={handleLoginChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="loginPassword" className="block text-sm font-medium text-text mb-1">
                    {t('account.password')}
                  </label>
                  <input
                    type="password"
                    id="loginPassword"
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-primary hover:bg-pink-700 text-white font-medium rounded-md transition-colors duration-300"
                  >
                    {t('account.login')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <div className="p-4">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label htmlFor="registerFullName" className="block text-sm font-medium text-text mb-1">
                    {t('checkout.full_name')}
                  </label>
                  <input
                    type="text"
                    id="registerFullName"
                    name="fullName"
                    value={registerForm.fullName}
                    onChange={handleRegisterChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="registerPhoneNumber" className="block text-sm font-medium text-text mb-1">
                    {t('checkout.phone_number')}
                  </label>
                  <input
                    type="tel"
                    id="registerPhoneNumber"
                    name="phoneNumber"
                    value={registerForm.phoneNumber}
                    onChange={handleRegisterChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="registerPassword" className="block text-sm font-medium text-text mb-1">
                    {t('account.password')}
                  </label>
                  <input
                    type="password"
                    id="registerPassword"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="registerConfirmPassword" className="block text-sm font-medium text-text mb-1">
                    {t('account.confirm_password')}
                  </label>
                  <input
                    type="password"
                    id="registerConfirmPassword"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-3 px-6 bg-primary hover:bg-pink-700 text-white font-medium rounded-md transition-colors duration-300"
                  >
                    {t('account.register')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountPage;