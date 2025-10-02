import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminLayout = function({ children }) {
  return React.createElement("div", { className: "container mx-auto p-4 pb-16" },
    React.createElement("div", { className: "grid md:grid-cols-4 gap-4" },
      React.createElement("aside", { className: "md:col-span-1 bg-white rounded shadow p-4 space-y-2" },
        React.createElement(Link, { className: "block hover:underline", to: "/admin" }, "Overview"),
        React.createElement(Link, { className: "block hover:underline", to: "/admin/orders" }, "Commandes"),
        React.createElement(Link, { className: "block hover:underline", to: "/admin/fees" }, "Shipping Fees"),
        React.createElement(Link, { className: "block hover:underline", to: "/admin/categories" }, "Categories"),
        React.createElement(Link, { className: "block hover:underline", to: "/admin/products" }, "Products"),
        React.createElement(Link, { className: "block hover:underline", to: "/admin/accounts" }, "Accounts"),
        React.createElement(Link, { className: "block hover:underline", to: "/admin/promotions" }, "Promotions"),
        React.createElement(Link, { className: "block hover:underline", to: "/admin/facebook-pixel" }, "Facebook Pixel")
      ),
      React.createElement("main", { className: "md:col-span-3 bg-white rounded shadow p-4" }, children)
    )
  );
};

const AdminFacebookPixel = function() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [pixelConfig, setPixelConfig] = useState({
    enabled: false,
    pixelId: '',
    accessToken: '',
    testEventCode: '',
    trackPageView: true,
    trackAddToCart: true,
    trackInitiateCheckout: true,
    trackPurchase: true
  });

  useEffect(function() {
    const fetchConfig = async function() {
      setLoading(true);
      try {
        const response = await axios.get('/api/facebook-pixel/admin');
        if (response.data && response.data.config) {
          setPixelConfig(response.data.config);
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la configuration Facebook Pixel:', err);
        setError('Erreur lors du chargement de la configuration');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, []);

  const handleChange = function(e) {
    const { name, value, type, checked } = e.target;
    setPixelConfig(function(prev) {
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
    });
  };

  const handleSubmit = async function(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      await axios.post('/api/facebook-pixel/admin', { config: pixelConfig });
      setSuccess(true);
      setTimeout(function() { setSuccess(false); }, 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la configuration Facebook Pixel:', err);
      setError('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPixel = async function() {
    try {
      await axios.post('/api/facebook-pixel/test');
      alert('Événement de test envoyé avec succès!');
    } catch (err) {
      console.error('Erreur lors de l\'envoi de l\'événement de test:', err);
      alert('Erreur lors de l\'envoi de l\'événement de test');
    }
  };

  return React.createElement(AdminLayout, null,
    React.createElement("div", { className: "space-y-6" },
      React.createElement("h1", { className: "text-2xl font-bold" }, "Configuration Facebook Pixel"),
      
      loading ? 
        React.createElement("div", { className: "text-center py-4" }, "Chargement...") : 
        React.createElement("form", { onSubmit: handleSubmit, className: "space-y-6" },
          error && 
            React.createElement("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" }, error),
          
          success && 
            React.createElement("div", { className: "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" }, "Configuration sauvegardée avec succès!"),
          
          React.createElement("div", { className: "flex items-center" },
            React.createElement("input", {
              type: "checkbox",
              id: "enabled",
              name: "enabled",
              checked: pixelConfig.enabled,
              onChange: handleChange,
              className: "mr-2"
            }),
            React.createElement("label", { htmlFor: "enabled", className: "font-medium" }, "Activer Facebook Pixel")
          ),
          
          React.createElement("div", { className: "space-y-4" },
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "pixelId", className: "block font-medium" }, 
                "Pixel ID ", 
                React.createElement("span", { className: "text-red-500" }, "*")
              ),
              React.createElement("input", {
                type: "text",
                id: "pixelId",
                name: "pixelId",
                value: pixelConfig.pixelId,
                onChange: handleChange,
                className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2",
                required: pixelConfig.enabled
              }),
              React.createElement("p", { className: "text-sm text-gray-500 mt-1" },
                "Vous pouvez trouver votre Pixel ID dans Facebook Events Manager"
              )
            ),
            
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "accessToken", className: "block font-medium" }, "Access Token"),
              React.createElement("input", {
                type: "text",
                id: "accessToken",
                name: "accessToken",
                value: pixelConfig.accessToken,
                onChange: handleChange,
                className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              }),
              React.createElement("p", { className: "text-sm text-gray-500 mt-1" },
                "Optionnel: Nécessaire pour les conversions avancées"
              )
            ),
            
            React.createElement("div", null,
              React.createElement("label", { htmlFor: "testEventCode", className: "block font-medium" }, "Test Event Code"),
              React.createElement("input", {
                type: "text",
                id: "testEventCode",
                name: "testEventCode",
                value: pixelConfig.testEventCode,
                onChange: handleChange,
                className: "mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              }),
              React.createElement("p", { className: "text-sm text-gray-500 mt-1" },
                "Optionnel: Utilisé pour tester les événements dans Facebook Events Manager"
              )
            ),
            
            React.createElement("div", { className: "border-t pt-4" },
              React.createElement("h3", { className: "font-medium mb-2" }, "Événements à suivre"),
              
              React.createElement("div", { className: "space-y-2" },
                React.createElement("div", { className: "flex items-center" },
                  React.createElement("input", {
                    type: "checkbox",
                    id: "trackPageView",
                    name: "trackPageView",
                    checked: pixelConfig.trackPageView,
                    onChange: handleChange,
                    className: "mr-2"
                  }),
                  React.createElement("label", { htmlFor: "trackPageView" }, "PageView (Visite de page)")
                ),
                
                React.createElement("div", { className: "flex items-center" },
                  React.createElement("input", {
                    type: "checkbox",
                    id: "trackAddToCart",
                    name: "trackAddToCart",
                    checked: pixelConfig.trackAddToCart,
                    onChange: handleChange,
                    className: "mr-2"
                  }),
                  React.createElement("label", { htmlFor: "trackAddToCart" }, "AddToCart (Ajout au panier)")
                ),
                
                React.createElement("div", { className: "flex items-center" },
                  React.createElement("input", {
                    type: "checkbox",
                    id: "trackInitiateCheckout",
                    name: "trackInitiateCheckout",
                    checked: pixelConfig.trackInitiateCheckout,
                    onChange: handleChange,
                    className: "mr-2"
                  }),
                  React.createElement("label", { htmlFor: "trackInitiateCheckout" }, "InitiateCheckout (Début de commande)")
                ),
                
                React.createElement("div", { className: "flex items-center" },
                  React.createElement("input", {
                    type: "checkbox",
                    id: "trackPurchase",
                    name: "trackPurchase",
                    checked: pixelConfig.trackPurchase,
                    onChange: handleChange,
                    className: "mr-2"
                  }),
                  React.createElement("label", { htmlFor: "trackPurchase" }, "Purchase (Achat complété)")
                )
              )
            )
          ),
          
          React.createElement("div", { className: "flex space-x-4" },
            React.createElement("button", {
              type: "submit",
              disabled: saving,
              className: "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            }, saving ? 'Sauvegarde...' : 'Sauvegarder'),
            
            pixelConfig.enabled && pixelConfig.pixelId && 
              React.createElement("button", {
                type: "button",
                onClick: handleTestPixel,
                className: "bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
              }, "Tester le Pixel")
          )
        ),
      
      React.createElement("div", { className: "mt-8 border-t pt-6" },
        React.createElement("h2", { className: "text-xl font-bold mb-4" }, "Guide d'intégration"),
        
        React.createElement("div", { className: "prose max-w-none" },
          React.createElement("p", null,
            "Le Facebook Pixel est automatiquement intégré dans votre site lorsqu'il est activé. Voici comment les événements sont suivis:"
          ),
          
          React.createElement("ul", { className: "list-disc pl-5 space-y-2 mt-2" },
            React.createElement("li", null, 
              React.createElement("strong", null, "PageView"), 
              ": Déclenché automatiquement sur chaque page"
            ),
            React.createElement("li", null, 
              React.createElement("strong", null, "AddToCart"), 
              ": Déclenché lorsqu'un client ajoute un produit au panier"
            ),
            React.createElement("li", null, 
              React.createElement("strong", null, "InitiateCheckout"), 
              ": Déclenché lorsqu'un client commence le processus de commande"
            ),
            React.createElement("li", null, 
              React.createElement("strong", null, "Purchase"), 
              ": Déclenché lorsqu'une commande est complétée"
            )
          ),
          
          React.createElement("p", { className: "mt-4" },
            "Pour plus d'informations sur Facebook Pixel, consultez la",
            ' ',
            React.createElement("a", {
              href: "https://developers.facebook.com/docs/facebook-pixel",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "text-blue-600 hover:underline"
            }, "documentation officielle"),
            "."
          )
        )
      )
    )
  );
};

export default AdminFacebookPixel;