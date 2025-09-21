import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PromotionPopup = ({ isOpen, onClose, promotion, customerName }) => {
  if (!isOpen || !promotion) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-gradient-to-br from-pink-50 via-white to-purple-50 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-pink-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with decorative elements */}
          <div className="relative bg-gradient-to-r from-primary to-pink-500 p-6 text-white">
            <div className="absolute top-2 right-2">
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Decorative stars */}
            <div className="absolute top-4 left-4 text-yellow-300 text-xl animate-pulse">✨</div>
            <div className="absolute top-8 right-8 text-yellow-300 text-lg animate-pulse delay-100">⭐</div>
            <div className="absolute bottom-4 left-8 text-yellow-300 text-sm animate-pulse delay-200">💫</div>
            
            <div className="text-center pt-4">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Félicitations !</h2>
              <p className="text-pink-100 text-sm">Vous êtes un client précieux</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Cher(e) {customerName || 'Client'} 💕
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Nous sommes ravis de vous compter parmi nos clients les plus précieux ! 
                Votre fidélité nous touche énormément et nous souhaitons vous remercier 
                de la plus belle des manières.
              </p>
            </div>

            {/* Promotion highlight */}
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 mb-4 border border-green-200">
              <div className="text-3xl font-bold text-green-700 mb-1">
                -{promotion.percentage}%
              </div>
              <div className="text-green-600 font-medium">
                Réduction spéciale pour vous !
              </div>
              {promotion.description && (
                <div className="text-sm text-green-700 mt-2">
                  {promotion.description}
                </div>
              )}
            </div>

            <div className="text-gray-600 text-sm leading-relaxed mb-6">
              <p>
                Cette offre exclusive est notre façon de vous dire 
                <span className="font-semibold text-primary"> "Merci"</span> pour votre confiance. 
                Nous apprécions énormément votre fidélité et espérons continuer à vous 
                accompagner dans vos plus beaux moments.
              </p>
            </div>

            {/* Decorative elements */}
            <div className="flex justify-center space-x-2 mb-4">
              <span className="text-2xl animate-bounce">🌸</span>
              <span className="text-2xl animate-bounce delay-100">💖</span>
              <span className="text-2xl animate-bounce delay-200">🌸</span>
            </div>

            <p className="text-xs text-gray-500 italic">
              Avec toute notre gratitude,<br />
              L'équipe Almezouara 💕
            </p>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-primary to-pink-500 text-white py-3 px-6 rounded-xl font-medium hover:from-pink-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Merci, j'accepte cette offre ! ✨
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromotionPopup;

