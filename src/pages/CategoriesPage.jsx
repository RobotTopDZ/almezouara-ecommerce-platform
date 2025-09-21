import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CategoriesPage = () => {
  const { t } = useTranslation();

  const categories = [
    {
      id: 'dresses',
      name: t('categories.dresses'),
      description: 'Découvrez notre collection de robes élégantes',
      image: '/images/IMG_0630-scaled.jpeg',
      icon: '👗',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'hijabs',
      name: t('categories.hijabs'),
      description: 'Hijabs de qualité premium dans tous les styles',
      image: '/images/IMG_6710-scaled.jpeg',
      icon: '🧕',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'shoes',
      name: t('categories.shoes'),
      description: 'Chaussures confortables et tendance',
      image: '/images/IMG_6789-scaled.jpeg',
      icon: '👠',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'accessories',
      name: t('categories.accessories'),
      description: 'Accessoires pour parfaire votre look',
      image: '/images/IMG_9260-scaled.jpeg',
      icon: '💎',
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6 pb-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-text mb-4">Toutes les Catégories</h1>
        <p className="text-gray-600 text-lg">
          Explorez notre collection complète organisée par catégories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-75 group-hover:opacity-85 transition-opacity duration-300`}></div>
            </div>

            {/* Content */}
            <div className="relative p-8 h-48 flex flex-col justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{category.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold group-hover:text-yellow-200 transition-colors duration-300">
                    {category.name}
                  </h3>
                </div>
              </div>

              <div>
                <p className="text-white/90 mb-4 group-hover:text-white transition-colors duration-300">
                  {category.description}
                </p>
                <div className="flex items-center text-yellow-200 font-semibold group-hover:text-yellow-100 transition-colors duration-300">
                  <span>Voir la collection</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Featured Section */}
      <div className="mt-12 bg-gradient-to-r from-primary to-pink-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">✨ Nouveau chez Almezouara ?</h2>
        <p className="text-pink-100 mb-6 max-w-2xl mx-auto">
          Inscrivez-vous à notre newsletter pour recevoir les dernières nouveautés et des offres exclusives directement dans votre boîte mail.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <input
            type="email"
            placeholder="Votre email"
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
            S'abonner
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;

