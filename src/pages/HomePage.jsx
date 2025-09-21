import React from 'react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

const HomePage = () => {
  const { t } = useTranslation();

  // Expanded sample products data - in a real app, this would come from an API
  const allProducts = [
    {
      id: 1,
      name: 'Robe Élégante',
      price: 3500,
      image: '/images/IMG_0630-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 2,
      name: 'Hijab Premium',
      price: 1200,
      image: '/images/IMG_6710-scaled.jpeg',
      category: 'hijabs',
    },
    {
      id: 3,
      name: 'Robe de Soirée',
      price: 4500,
      image: '/images/IMG_6789-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 4,
      name: 'Ensemble Casual',
      price: 2800,
      image: '/images/IMG_9260-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 5,
      name: 'Hijab Moderne',
      price: 1500,
      image: '/images/IMG_0630-scaled.jpeg',
      category: 'hijabs',
    },
    {
      id: 6,
      name: 'Robe Tendance',
      price: 3200,
      image: '/images/IMG_6789-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 7,
      name: 'Chaussures Élégantes',
      price: 4200,
      image: '/images/IMG_9260-scaled.jpeg',
      category: 'shoes',
    },
    {
      id: 8,
      name: 'Accessoire Chic',
      price: 900,
      image: '/images/IMG_6710-scaled.jpeg',
      category: 'accessories',
    },
    {
      id: 9,
      name: 'Robe Moderne',
      price: 3800,
      image: '/images/IMG_0630-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 10,
      name: 'Hijab Collection',
      price: 1800,
      image: '/images/IMG_6789-scaled.jpeg',
      category: 'hijabs',
    },
    {
      id: 11,
      name: 'Ensemble Chic',
      price: 3600,
      image: '/images/IMG_9260-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 12,
      name: 'Sac Designer',
      price: 2500,
      image: '/images/IMG_6710-scaled.jpeg',
      category: 'accessories',
    },
    {
      id: 13,
      name: 'Robe Luxe',
      price: 5200,
      image: '/images/IMG_0630-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 14,
      name: 'Hijab Soie',
      price: 2200,
      image: '/images/IMG_6789-scaled.jpeg',
      category: 'hijabs',
    },
    {
      id: 15,
      name: 'Chaussures Mode',
      price: 3900,
      image: '/images/IMG_9260-scaled.jpeg',
      category: 'shoes',
    },
    {
      id: 16,
      name: 'Bijoux Précieux',
      price: 1600,
      image: '/images/IMG_6710-scaled.jpeg',
      category: 'accessories',
    },
    {
      id: 17,
      name: 'Robe Cocktail',
      price: 4200,
      image: '/images/IMG_0630-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 18,
      name: 'Hijab Brodé',
      price: 1900,
      image: '/images/IMG_6789-scaled.jpeg',
      category: 'hijabs',
    },
    {
      id: 19,
      name: 'Ensemble Designer',
      price: 4800,
      image: '/images/IMG_9260-scaled.jpeg',
      category: 'dresses',
    },
    {
      id: 20,
      name: 'Montre Élégante',
      price: 3200,
      image: '/images/IMG_6710-scaled.jpeg',
      category: 'accessories',
    }
  ];

  // Use infinite scroll hook
  const { displayedItems: displayedProducts, hasMore, isLoading } = useInfiniteScroll(allProducts, 6);

  // Sample slider data
  const sliderItems = [
    {
      id: 1,
      title: t('home.special_offers'),
      image: '/images/IMG_0630-scaled.jpeg',
      link: '/category/dresses',
    },
    {
      id: 2,
      title: t('home.new_arrivals'),
      image: '/images/IMG_6789-scaled.jpeg',
      link: '/category/dresses',
    },
    {
      id: 3,
      title: t('home.trending'),
      image: '/images/IMG_9260-scaled.jpeg',
      link: '/category/dresses',
    },
  ];



  // Format price with DZD
  const formatPrice = (price) => {
    return `${price.toLocaleString()} DZD`;
  };

  return (
    <div className="pb-16">
      {/* Top Slider */}
      <div>
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          className="home-slider"
        >
          {sliderItems.map((item) => (
            <SwiperSlide key={item.id}>
              <Link to={item.link} className="relative block w-full h-48 md:h-64">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                  <h3 className="text-white text-xl font-bold">{item.title}</h3>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Mobile Quick Actions */}
      <div className="md:hidden px-4 pt-2 pb-4">
        <div className="flex justify-between items-center">
          <Link
            to="/categories"
            className="group flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-xs text-gray-700 group-hover:text-primary transition-colors duration-300">Catégories</span>
          </Link>

          <Link
            to="/contact"
            className="group flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700 group-hover:text-primary transition-colors duration-300">Contact</span>
          </Link>

          <a
            href="https://wa.me/+213XXXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-2.462-.996-4.779-2.811-6.598-1.815-1.819-4.145-2.817-6.609-2.817-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.281-.858zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
              </svg>
            </div>
            <span className="text-xs text-gray-700 group-hover:text-primary transition-colors duration-300">WhatsApp</span>
          </a>

          <Link
            to="/faq"
            className="group flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700 group-hover:text-primary transition-colors duration-300">FAQ</span>
          </Link>

          <Link
            to="/refund-policy"
            className="group flex flex-col items-center space-y-2"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.25 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700 group-hover:text-primary transition-colors duration-300">Garantie</span>
          </Link>
        </div>
      </div>



      {/* Desktop Featured Categories */}
      <div className="hidden md:block py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-text text-center mb-12">Catégories Populaires</h2>
          <div className="grid grid-cols-4 gap-8">
            {[
              { id: 'dresses', name: 'Robes', image: '/images/IMG_0630-scaled.jpeg', count: '50+ produits' },
              { id: 'hijabs', name: 'Hijabs', image: '/images/IMG_6710-scaled.jpeg', count: '30+ produits' },
              { id: 'shoes', name: 'Chaussures', image: '/images/IMG_9260-scaled.jpeg', count: '25+ produits' },
              { id: 'accessories', name: 'Accessoires', image: '/images/IMG_6710-scaled.jpeg', count: '40+ produits' }
            ].map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                  <p className="text-sm text-pink-200">{category.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Quick Actions */}
      <div className="hidden md:block py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-5 gap-6">
            {[
              { to: '/categories', icon: '📁', title: 'Toutes Catégories', description: 'Explorez notre collection' },
              { to: '/contact', icon: '📞', title: 'Contact', description: 'Contactez-nous' },
              { href: 'https://wa.me/+213XXXXXXXXX', icon: '💬', title: 'WhatsApp', description: 'Chat en direct' },
              { to: '/faq', icon: '❓', title: 'FAQ', description: 'Questions fréquentes' },
              { to: '/refund-policy', icon: '🛡️', title: 'Garantie', description: 'Politique de remboursement' }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                {item.to ? (
                  <Link to={item.to} className="block">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors duration-300">
                      <span className="text-2xl text-gray-700 group-hover:text-white transition-colors duration-300">{item.icon}</span>
                    </div>
                    <h3 className="font-semibold text-text mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </Link>
                ) : (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors duration-300">
                      <span className="text-2xl text-gray-700 group-hover:text-white transition-colors duration-300">{item.icon}</span>
                    </div>
                    <h3 className="font-semibold text-text mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products with Infinite Scroll */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text mb-4">Nos Produits</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Découvrez notre sélection de produits de qualité, soigneusement choisis pour vous
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayedProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                </div>
                <div className="p-4">
                  <h4 className="text-text font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                    {product.name}
                  </h4>
                  <p className="text-primary font-bold text-lg">{formatPrice(product.price)}</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">En stock</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Chargement des produits...</p>
              </div>
            </div>
          )}

          {/* End of products message */}
          {!hasMore && displayedProducts.length > 0 && (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-primary to-pink-500 text-white rounded-2xl p-8 max-w-md mx-auto">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-bold mb-2">Félicitations !</h3>
                <p className="text-pink-100">Vous avez exploré toute notre collection</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;