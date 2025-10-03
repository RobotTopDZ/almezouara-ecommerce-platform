import React, { useEffect, useState } from "react";
import axios from "axios";

const FacebookPixel = () => {
  const [pixelConfig, setPixelConfig] = useState(null);
  // ID du pixel Facebook directement intégré
  const PIXEL_ID = "925399229731159";

  useEffect(() => {
    // Initialiser directement avec l"ID du pixel fixe
    setPixelConfig({
      enabled: true,
      pixelId: PIXEL_ID,
      trackPageView: true,
      trackAddToCart: true,
      trackInitiateCheckout: true,
      trackPurchase: true
    });
    
    // Initialiser le pixel immédiatement
    initPixel(PIXEL_ID);
    
    // Également charger depuis l"API pour compatibilité avec le reste du code
    const loadPixelConfig = async () => {
      try {
        const response = await axios.get("/api/facebook-pixel/client-config");
        if (response.data && response.data.enabled) {
          // Garder notre ID fixe mais prendre les autres configurations
          const mergedConfig = {
            ...response.data,
            pixelId: PIXEL_ID,
            enabled: true
          };
          setPixelConfig(mergedConfig);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la configuration Facebook Pixel:", error);
      }
    };

    loadPixelConfig();
  }, []);

  // Initialiser Facebook Pixel
  const initPixel = (pixelId) => {
    if (!pixelId) return;
    
    console.log("Initialisation du Facebook Pixel avec ID:", pixelId);

    // Ajouter le script Facebook Pixel
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,"script",
    "https://connect.facebook.net/en_US/fbevents.js");
    
    // Initialiser avec l"ID du pixel
    fbq("init", pixelId);
    
    // Envoyer l"événement PageView par défaut
    fbq("track", "PageView");
    
    // Ajouter un noscript pour les navigateurs sans JavaScript
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);
    
    console.log("Facebook Pixel initialisé avec succès");
  };

  // Exposer les fonctions de suivi sur window pour une utilisation globale
  useEffect(() => {
    if (!pixelConfig) return;

    window.fbPixelTrack = (event, data = {}) => {
      if (!window.fbq) return;
      
      switch (event) {
        case "AddToCart":
          if (pixelConfig.trackAddToCart) {
            fbq("track", "AddToCart", data);
          }
          break;
        case "InitiateCheckout":
          if (pixelConfig.trackInitiateCheckout) {
            fbq("track", "InitiateCheckout", data);
          }
          break;
        case "Purchase":
          if (pixelConfig.trackPurchase) {
            fbq("track", "Purchase", data);
          }
          break;
        default:
          fbq("track", event, data);
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