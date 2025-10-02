import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FacebookPixel = () => {
  const [pixelConfig, setPixelConfig] = useState(null);

  useEffect(() => {
    // Charger la configuration du pixel
    const loadPixelConfig = async () => {
      try {
        const response = await axios.get('/api/facebook-pixel/client-config');
        if (response.data && response.data.enabled && response.data.pixelId) {
          setPixelConfig(response.data);
          initPixel(response.data.pixelId);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration Facebook Pixel:', error);
      }
    };

    loadPixelConfig();
  }, []);

  // Initialiser Facebook Pixel
  const initPixel = (pixelId) => {
    if (!pixelId) return;

    // Ajouter le script Facebook Pixel
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    // Initialiser avec l'ID du pixel
    fbq('init', pixelId);
    
    // Envoyer l'événement PageView par défaut
    if (pixelConfig?.trackPageView) {
      fbq('track', 'PageView');
    }
  };

  // Exposer les fonctions de suivi sur window pour une utilisation globale
  useEffect(() => {
    if (!pixelConfig) return;

    window.fbPixelTrack = (event, data = {}) => {
      if (!window.fbq) return;
      
      switch (event) {
        case 'AddToCart':
          if (pixelConfig.trackAddToCart) {
            fbq('track', 'AddToCart', data);
          }
          break;
        case 'InitiateCheckout':
          if (pixelConfig.trackInitiateCheckout) {
            fbq('track', 'InitiateCheckout', data);
          }
          break;
        case 'Purchase':
          if (pixelConfig.trackPurchase) {
            fbq('track', 'Purchase', data);
          }
          break;
        default:
          fbq('track', event, data);
      }
    };

    return () => {
      delete window.fbPixelTrack;
    };
  }, [pixelConfig]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default FacebookPixel;