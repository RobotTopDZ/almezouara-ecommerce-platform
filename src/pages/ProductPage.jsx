import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Zoom } from 'swiper/modules';
import { motion } from 'framer-motion';
import axios from 'axios';
// Removed static data import - now using API
import PromotionPopup from '../components/PromotionPopup';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/zoom';

const ProductPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [availableCities, setAvailableCities] = useState([]);
  
  // New state for smart checkout
  const [checkoutStep, setCheckoutStep] = useState('phone'); // 'phone', 'customer-choice', 'form'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerInfo, setCustomerInfo] = useState(null);
  const [customerChoice, setCustomerChoice] = useState(''); // 'use-previous', 'modify', 'new'
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showPreviousInfo, setShowPreviousInfo] = useState(false);
  const [showPromotionPopup, setShowPromotionPopup] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    wilaya: '',
    address: '',
    deliveryMethod: '',
  });

  // Sample product data - in a real app, this would come from an API
  const product = {
    id: 1,
    name: 'Robe Élégante',
    price: 3500,
    description: 'Une robe élégante parfaite pour toutes les occasions. Fabriquée avec des matériaux de haute qualité pour un confort optimal.',
    images: [
      '/images/IMG_0630-scaled.jpeg',
      '/images/IMG_6710-scaled.jpeg',
      '/images/IMG_6789-scaled.jpeg',
    ],
    colors: [
      { name: 'Noir', value: 'black' },
      { name: 'Rouge', value: 'red' },
      { name: 'Bleu', value: 'blue' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
  };

  // Format price with DZD
  const formatPrice = (price) => {
    return `${price.toLocaleString()} DZD`;
  };

  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const discountedPrice = Math.round(product.price * (1 - (discountPercentage || 0) / 100));

  const normalizePhone = (raw) => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    // Convert +213x... to 0x... if detected
    if (digits.startsWith('213') && digits.length >= 10) {
      return '0' + digits.slice(3);
    }
    return digits;
  };

  useEffect(() => {
    const fetchPromotions = async () => {
      // Use phoneNumber from the initial input or formData.phoneNumber
      const phone = normalizePhone(phoneNumber || formData.phoneNumber);
      if (!phone) { setDiscountPercentage(0); return; }
      try {
        setPromoLoading(true);
        const res = await axios.get(`/api/promotions/${phone}`);
        const promos = res.data?.promotions || [];
        const best = promos.reduce((max, p) => Math.max(max, Number(p.percentage) || 0), 0);
        setDiscountPercentage(best);
        
        // Show promotion popup if there's a promotion
        if (best > 0 && promos.length > 0) {
          const bestPromo = promos.find(p => Number(p.percentage) === best);
          setCurrentPromotion(bestPromo);
          setShowPromotionPopup(true);
        }
      } catch (e) {
        setDiscountPercentage(0);
      } finally {
        setPromoLoading(false);
      }
    };
    fetchPromotions();
  }, [phoneNumber, formData.phoneNumber]);

  // Customer search function
  const searchCustomer = async (phone) => {
    if (!phone || phone.length < 10) return;
    
    setIsSearchingCustomer(true);
    setShowPreviousInfo(false); // Reset the show info state
    try {
      const response = await axios.get(`/api/customers/search/${phone}`);

      setCustomerInfo(response.data);
      setCheckoutStep('customer-choice');
    } catch (error) {
      // Customer not found, proceed to form
      setCustomerInfo(null);
      // Set the phone number in form data for new customers
      setFormData({
        ...formData,
        phoneNumber: phone,
      });
      setCheckoutStep('form');
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // Handle phone number input and search
  const handlePhoneInput = (e) => {
    const value = normalizePhone(e.target.value);
    setPhoneNumber(value);
    
    // Auto-search when phone number is complete
    if (value.length === 10) {
      searchCustomer(value);
    }
  };

  // Handle customer choice
  const handleCustomerChoice = async (choice) => {
    setCustomerChoice(choice);
    
    if (choice === 'use-previous' && customerInfo?.lastOrderInfo) {
      // Auto-fill form with previous info
      setFormData({
        ...formData,
        phoneNumber: phoneNumber,
        fullName: customerInfo.lastOrderInfo.fullName,
        wilaya: customerInfo.lastOrderInfo.wilaya,
        address: customerInfo.lastOrderInfo.address,
        deliveryMethod: customerInfo.lastOrderInfo.deliveryMethod,
      });
      setSelectedCity(customerInfo.lastOrderInfo.city);
      await loadCitiesForWilaya(customerInfo.lastOrderInfo.wilaya);
      const cost = await getShippingCost(customerInfo.lastOrderInfo.wilaya, customerInfo.lastOrderInfo.city, customerInfo.lastOrderInfo.deliveryMethod);
      setShippingCost(cost);
      setCheckoutStep('form');
    } else if (choice === 'modify' && customerInfo?.lastOrderInfo) {
      // Pre-fill form but allow modification
      setFormData({
        ...formData,
        phoneNumber: phoneNumber,
        fullName: customerInfo.lastOrderInfo.fullName,
        wilaya: customerInfo.lastOrderInfo.wilaya,
        address: customerInfo.lastOrderInfo.address,
        deliveryMethod: customerInfo.lastOrderInfo.deliveryMethod,
      });
      setSelectedCity(customerInfo.lastOrderInfo.city);
      await loadCitiesForWilaya(customerInfo.lastOrderInfo.wilaya);
      const cost = await getShippingCost(customerInfo.lastOrderInfo.wilaya, customerInfo.lastOrderInfo.city, customerInfo.lastOrderInfo.deliveryMethod);
      setShippingCost(cost);
      setCheckoutStep('form');
    } else {
      // New customer or new info
      setFormData({
        ...formData,
        phoneNumber: phoneNumber,
        fullName: '',
        wilaya: '',
        address: '',
        deliveryMethod: '',
      });
      setSelectedCity('');
      setShippingCost(0);
      setCheckoutStep('form');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'phoneNumber' ? normalizePhone(value) : value,
    });
  };

  // Reset checkout flow
  const resetCheckout = () => {
    setCheckoutStep('phone');
    setPhoneNumber('');
    setCustomerInfo(null);
    setCustomerChoice('');
    setFormData({
      fullName: '',
      phoneNumber: '',
      wilaya: '',
      address: '',
      deliveryMethod: '',
    });
    setSelectedCity('');
    setShippingCost(0);
  };

  // Handle checkout submission
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    try {
      const discountedPrice = Math.round(product.price * (1 - (discountPercentage || 0) / 100));
      const totalProductPrice = discountedPrice * quantity;
      const totalWithShipping = totalProductPrice + shippingCost;
      const orderPayload = {
        phoneNumber: formData.phoneNumber,
        items: [{ id: product.id, name: product.name, price: discountedPrice, quantity: quantity, image: product.images[0], color: selectedColor, size: selectedSize }],
        total: totalWithShipping,
        deliveryMethod: formData.deliveryMethod,
        address: formData.address,
        fullName: formData.fullName,
        wilaya: formData.wilaya,
        city: selectedCity,
        shippingCost: shippingCost,
        productPrice: totalProductPrice,
        discountPercentage: discountPercentage
      };
      const response = await axios.post('/api/orders', orderPayload);
      
      if (response.data.orderType === 'merged') {
        alert('✅ Produit ajouté à votre commande existante pour aujourd\'hui !\n\nVos commandes du même jour sont automatiquement regroupées dans votre panier.');
      } else {
        alert(t('product.order_success'));
      }
      
      // Reset everything
      resetCheckout();
      setSelectedColor(null);
      setSelectedSize(null);
      setQuantity(1);
      setShowCheckout(false);
    } catch (err) {
      alert('Order failed');
    }
  };

  // Load cities for selected wilaya
  const loadCitiesForWilaya = async (wilaya) => {
    if (!wilaya) {
      setAvailableCities([]);
      return;
    }
    try {
      const response = await axios.get(`/api/shipping-fees?wilaya=${encodeURIComponent(wilaya)}`);
      if (response.data.success && response.data.cities) {
        setAvailableCities(response.data.cities.map(c => c.city));
      } else {
        setAvailableCities([]);
      }
    } catch (error) {
      console.error('Error fetching communes:', error);
      setAvailableCities([]);
    }
  };

  // Real Algerian wilayas
  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
    'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
    'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla',
    'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
    'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane'
  ];

  // Shipping cost lookup using API
  const getShippingCost = async (wilaya, commune, deliveryMethod) => {
    if (!wilaya || !commune) return 0;
    
    try {
      const response = await axios.get(`/api/shipping-fees?wilaya=${encodeURIComponent(wilaya)}&city=${encodeURIComponent(commune)}`);
      if (response.data.success && response.data.shippingFee) {
        const fee = response.data.shippingFee;
        return deliveryMethod === 'domicile' ? fee.domicilePrice : fee.stopdeskPrice;
      }
      return 0;
    } catch (error) {
      console.error('Error fetching shipping cost:', error);
      return 0;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-16">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Product Gallery */}
        <div className="lg:flex">
          <div className="lg:w-1/2">
            <Swiper
              modules={[Pagination, Navigation, Zoom]}
              pagination={{
                clickable: true,
              }}
              navigation={true}
              zoom={true}
              className="product-gallery"
            >
              {product.images.map((image, index) => (
                <SwiperSlide key={index}>
                  <div className="swiper-zoom-container">
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-auto" />

                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Product Info */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-text mb-4">{product.name}</h1>
            {discountPercentage > 0 ? (
              <div className="mb-6">
                <p className="text-2xl lg:text-3xl font-bold text-primary">{formatPrice(discountedPrice)}</p>
                <p className="text-lg text-gray-500 line-through">{formatPrice(product.price)}</p>
                <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mt-2">
                  -{discountPercentage}% de réduction
                </div>
              </div>
            ) : (
            <p className="text-2xl lg:text-3xl font-bold text-primary mb-6">{formatPrice(product.price)}</p>
            )}
            
            {product.inStock ? (
              <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-6">
                ✓ {t('product.in_stock')}
              </div>
            ) : (
              <div className="inline-block px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold mb-6">
                ✗ {t('product.out_of_stock')}
              </div>
            )}

            <p className="text-gray-600 mb-8 text-lg leading-relaxed">{product.description}</p>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text mb-3">{t('product.select_color')}</h3>
              <div className="flex space-x-3">
                {product.colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-12 h-12 rounded-full border-4 transition-all duration-300 ${
                      selectedColor === color.value 
                        ? 'border-primary shadow-lg scale-110' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    aria-label={`Select color ${color.name}`}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-text mb-3">{t('product.select_size')}</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 rounded-lg border-2 font-medium transition-all duration-300 ${
                      selectedSize === size
                        ? 'border-primary bg-primary text-white shadow-lg scale-105'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-text mb-3">Quantité</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-xl font-semibold text-text min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={() => {
                resetCheckout();
                setShowCheckout(true);
              }}
              disabled={!product.inStock || !selectedColor || !selectedSize}
              className={`w-full py-4 px-8 rounded-xl font-semibold text-white text-lg transition-all duration-300 ${
                product.inStock && selectedColor && selectedSize 
                  ? 'bg-gradient-to-r from-primary to-pink-600 hover:from-pink-600 hover:to-primary shadow-lg hover:shadow-xl transform hover:-translate-y-1' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {t('product.buy_now')}
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Form */}
      {showCheckout && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCheckout(false);
              resetCheckout();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text">{t('checkout.title')}</h2>
                <button
                  onClick={() => {
                    setShowCheckout(false);
                    resetCheckout();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close checkout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
                <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded" />
                <div className="ml-3">
                  <h3 className="font-medium text-text">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedColor && product.colors.find(c => c.value === selectedColor)?.name} - {selectedSize}
                  </p>
                  <p className="text-sm text-gray-500">Quantité: {quantity}</p>
                  {discountPercentage > 0 ? (
                    <div>
                      <p className="font-bold text-primary">{formatPrice(discountedPrice * quantity)}</p>
                      <p className="text-xs text-gray-500 line-through">{formatPrice(product.price * quantity)}</p>
                    </div>
                  ) : (
                  <p className="font-bold text-primary">{formatPrice(product.price * quantity)}</p>
                  )}
                </div>
              </div>

              {/* Smart Checkout Flow */}
              {checkoutStep === 'phone' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Commencez par votre numéro de téléphone</h3>
                    <p className="text-sm text-gray-600">Nous vérifierons si vous avez déjà commandé chez nous</p>
                  </div>
                  
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-text mb-1">
                      Numéro de téléphone *
                    </label>
                    <div className="relative">
                      <input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneInput}
                        className="w-full border rounded-md px-3 py-2 pr-10"
                        placeholder="Ex: 0555xxxxxx ou +213555xxxxx"
                        required
                        maxLength={10}
                        autoFocus
                      />
                      {isSearchingCustomer && (
                        <span className="absolute inset-y-0 right-3 flex items-center">
                          <span className="h-4 w-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {isSearchingCustomer ? 'Recherche en cours...' : 'Tapez votre numéro pour continuer'}
                    </p>
                    
                    {phoneNumber.length === 10 && !isSearchingCustomer && (
                      <button
                        type="button"
                        onClick={() => searchCustomer(phoneNumber)}
                        className="w-full mt-2 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
                      >
                        🔍 Rechercher
                      </button>
                    )}
                  </div>
                </div>
              )}

              {checkoutStep === 'customer-choice' && customerInfo && (
                <div className="space-y-4">

                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Bonjour {customerInfo.name} !</h3>
                    <p className="text-sm text-gray-600">Nous avons trouvé vos informations de livraison</p>
                  </div>



                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowPreviousInfo(true)}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      ✅ Utiliser mes informations précédentes
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleCustomerChoice('modify')}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Modifier mes informations
                    </button>
                    
                                         <button
                       type="button"
                       onClick={() => handleCustomerChoice('new')}
                       className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                     >
                       🆕 Nouvelle adresse de livraison
                     </button>
                     
                     <button
                       type="button"
                       onClick={() => {
                         setCheckoutStep('phone');
                         setShowPreviousInfo(false);
                       }}
                       className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                     >
                       ← Retour au numéro de téléphone
                     </button>
                   </div>

                   {showPreviousInfo && (
                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                       <h4 className="font-medium text-blue-800 mb-2">Vos informations précédentes :</h4>
                       <div className="text-sm text-blue-700 space-y-1">
                         <p><strong>Nom :</strong> {customerInfo.lastOrderInfo?.fullName}</p>
                         <p><strong>Wilaya :</strong> {customerInfo.lastOrderInfo?.wilaya}</p>
                         <p><strong>Ville :</strong> {customerInfo.lastOrderInfo?.city}</p>
                         <p><strong>Adresse :</strong> {customerInfo.lastOrderInfo?.address}</p>
                       </div>
                       <div className="mt-4 space-y-2">
                         <button
                           type="button"
                           onClick={() => handleCustomerChoice('use-previous')}
                           className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                         >
                           Confirmer et utiliser ces informations
                         </button>
                         <button
                           type="button"
                           onClick={() => setShowPreviousInfo(false)}
                           className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                         >
                           Annuler
                         </button>
                       </div>
                     </div>
                   )}
                </div>
              )}

              {checkoutStep === 'form' && (
                <form onSubmit={handleCheckoutSubmit}>
                  <div className="space-y-4">
                    {customerInfo && customerChoice === 'use-previous' ? (
                      // Direct confirmation for previous info users
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-green-700">
                            ✅ Utilisation de vos informations précédentes - Vous pouvez confirmer directement votre commande
                          </p>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-2">Confirmation de commande</h4>
                          <div className="text-sm text-blue-700 space-y-1">
                            <p><strong>Nom :</strong> {formData.fullName}</p>
                            <p><strong>Téléphone :</strong> {formData.phoneNumber}</p>
                            <p><strong>Wilaya :</strong> {formData.wilaya}</p>
                            <p><strong>Ville :</strong> {selectedCity}</p>
                            <p><strong>Adresse :</strong> {formData.address}</p>
                            <p><strong>Méthode de livraison :</strong> {formData.deliveryMethod === 'domicile' ? 'Livraison à domicile' : 'Stopdesk (Yalidine)'}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between pt-2">
                          <button 
                            type="button" 
                            onClick={() => setCheckoutStep('customer-choice')}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                          >
                            ← Retour
                          </button>
                          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                            ✅ Confirmer la commande
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Regular form for other cases
                      <>
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-text mb-1">
                            {t('checkout.full_name')} *
                          </label>
                          <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2"
                            required
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-text mb-1">
                            {t('checkout.phone')} *
                          </label>
                          <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2 pr-10"
                            placeholder="Ex: 0555xxxxxx ou +213555xxxxx"
                            required
                            readOnly
                          />
                          {promoLoading && (
                            <span className="absolute inset-y-0 right-3 flex items-center">
                              <span className="h-4 w-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></span>
                            </span>
                          )}
                        </div>

                        {/* Delivery Method Selection - FIRST */}
                        <div>
                          <label htmlFor="deliveryMethod" className="block text-sm font-medium text-text mb-1">
                            {t('checkout.delivery_method') || 'Méthode de livraison'} *
                          </label>
                          <select
                            id="deliveryMethod"
                            name="deliveryMethod"
                            value={formData.deliveryMethod}
                            onChange={(e) => {
                              handleInputChange(e);
                              // Reset city and shipping cost when delivery method changes
                              setSelectedCity('');
                              setShippingCost(0);
                              // Also reset wilaya when delivery method changes
                              setFormData(prev => ({ ...prev, wilaya: '' }));
                            }}
                            className="w-full border rounded-md px-3 py-2"
                            required
                          >
                            <option value="">{t('checkout.select_delivery_method') || 'Sélectionnez la méthode de livraison'}</option>
                            <option value="domicile">Livraison à domicile</option>
                            <option value="stopdesk">Livraison Stopdesk (Yalidine)</option>
                          </select>
                        </div>

                        {/* Wilaya Selection - SECOND */}
                        <div>
                          <label htmlFor="wilaya" className="block text-sm font-medium text-text mb-1">
                            {t('checkout.wilaya')} *
                          </label>
                          <select
                            id="wilaya"
                            name="wilaya"
                            value={formData.wilaya}
                            onChange={async (e) => {
                              handleInputChange(e);
                              setSelectedCity('');
                              setShippingCost(0);
                              await loadCitiesForWilaya(e.target.value);
                            }}
                            className="w-full border rounded-md px-3 py-2"
                            required
                            disabled={!formData.deliveryMethod}
                          >
                            <option value="">{formData.deliveryMethod ? (t('checkout.select_wilaya') || 'Sélectionnez la wilaya') : 'Sélectionnez d\'abord la méthode de livraison'}</option>
                            {wilayas.map((w) => (
                              <option key={w} value={w}>{w}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-text mb-1">
                            {t('checkout.city') || 'City'} *
                          </label>
                          <select
                            id="city"
                            name="city"
                            value={selectedCity}
                            onChange={async (e) => {
                              setSelectedCity(e.target.value);
                              const cost = await getShippingCost(formData.wilaya, e.target.value, formData.deliveryMethod);
                              setShippingCost(cost);
                            }}
                            className="w-full border rounded-md px-3 py-2"
                            required
                            disabled={!formData.wilaya}
                          >
                            <option value="">{formData.wilaya ? (t('checkout.select_city') || 'Sélectionnez la ville') : 'Sélectionnez d\'abord la wilaya'}</option>
                            {availableCities.map((city) => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-text mb-1">
                            {t('checkout.address')} *
                          </label>
                          <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full border rounded-md px-3 py-2"
                            rows={3}
                            required
                          />
                        </div>
                        
                        {discountPercentage > 0 && (
                          <div className="p-2 bg-green-50 text-green-700 rounded">
                            Promotion appliquée: {discountPercentage}% — Nouveau prix: {formatPrice(discountedPrice * quantity)}
                          </div>
                        )}

                        {/* Price Summary */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-text mb-2">Résumé de la commande</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Prix du produit (x{quantity}):</span>
                              <span>{discountPercentage > 0 ? (
                                <>
                                  <span className="line-through text-gray-500">{formatPrice(product.price * quantity)}</span>
                                  <span className="ml-2 text-green-600">{formatPrice(discountedPrice * quantity)}</span>
                                </>
                              ) : formatPrice(product.price * quantity)}</span>
                            </div>
                            {discountPercentage > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Réduction ({discountPercentage}%):</span>
                                <span>-{formatPrice((product.price - discountedPrice) * quantity)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Frais de livraison:</span>
                              <span>{shippingCost > 0 ? formatPrice(shippingCost) : 'À calculer'}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold">
                              <span>Total:</span>
                              <span>{shippingCost > 0 ? formatPrice((discountedPrice * quantity) + shippingCost) : 'À calculer'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between pt-2">
                          <button 
                            type="button" 
                            onClick={() => setCheckoutStep('phone')}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                          >
                            ← Retour
                          </button>
                          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md">
                            {t('checkout.confirm_order')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Promotion Popup */}
      <PromotionPopup
        isOpen={showPromotionPopup}
        onClose={() => setShowPromotionPopup(false)}
        promotion={currentPromotion}
        customerName={customerInfo?.name || formData.fullName}
      />
    </div>
  );
};

export default ProductPage;