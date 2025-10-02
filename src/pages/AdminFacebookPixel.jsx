import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AdminLayout = ({ children }) => (
  <div className="container mx-auto p-4 pb-16">
    <div className="grid md:grid-cols-4 gap-4">
      <aside className="md:col-span-1 bg-white rounded shadow p-4 space-y-2">
        <Link className="block hover:underline" to="/admin">Overview</Link>
        <Link className="block hover:underline" to="/admin/orders">Commandes</Link>
        <Link className="block hover:underline" to="/admin/fees">Shipping Fees</Link>
        <Link className="block hover:underline" to="/admin/categories">Categories</Link>
        <Link className="block hover:underline" to="/admin/products">Products</Link>
        <Link className="block hover:underline" to="/admin/accounts">Accounts</Link>
        <Link className="block hover:underline" to="/admin/promotions">Promotions</Link>
        <Link className="block hover:underline" to="/admin/facebook-pixel">Facebook Pixel</Link>
      </aside>
      <main className="md:col-span-3 bg-white rounded shadow p-4">
        {children}
      </main>
    </div>
  </div>
);

const AdminFacebookPixel = () => {
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

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null); // Réinitialiser l'erreur à chaque tentative
      try {
        const response = await axios.get('/api/facebook-pixel');
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPixelConfig({
      ...pixelConfig,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      await axios.post('/api/facebook-pixel', { config: pixelConfig });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la configuration Facebook Pixel:', err);
      setError('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
    }
  };

  const testPixelConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/facebook-pixel/test');
      if (response.data.success) {
        alert('Test réussi ! Événement de test envoyé à Facebook.');
      } else {
        alert('Échec du test. Vérifiez votre configuration et réessayez.');
      }
    } catch (err) {
      console.error('Erreur lors du test de la connexion Facebook Pixel:', err);
      alert('Erreur lors du test de la connexion. Vérifiez votre configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Configuration Facebook Pixel</h1>
          <div className="flex space-x-2">
            <button
              onClick={testPixelConnection}
              disabled={loading || !pixelConfig.pixelId}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Tester la connexion
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2">Chargement...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                Configuration sauvegardée avec succès!
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                checked={pixelConfig.enabled}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600"
              />
              <label htmlFor="enabled" className="ml-2 text-lg font-medium">
                Activer Facebook Pixel
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="pixelId" className="block text-sm font-medium text-gray-700">
                  ID du Pixel Facebook <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="pixelId"
                  name="pixelId"
                  value={pixelConfig.pixelId}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 123456789012345"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Vous pouvez trouver votre Pixel ID dans le Gestionnaire d'événements Facebook.
                </p>
              </div>

              <div>
                <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
                  Token d'accès (pour l'API Conversions)
                </label>
                <input
                  type="text"
                  id="accessToken"
                  name="accessToken"
                  value={pixelConfig.accessToken}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="EAAxxxx..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optionnel. Nécessaire uniquement pour l'API Conversions.
                </p>
              </div>

              <div>
                <label htmlFor="testEventCode" className="block text-sm font-medium text-gray-700">
                  Code d'événement de test
                </label>
                <input
                  type="text"
                  id="testEventCode"
                  name="testEventCode"
                  value={pixelConfig.testEventCode}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="TEST12345"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optionnel. Utilisé pour tester les événements dans Facebook.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-3">Événements à suivre</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="trackPageView"
                      name="trackPageView"
                      checked={pixelConfig.trackPageView}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="trackPageView" className="ml-2">
                      Vues de page (PageView)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="trackAddToCart"
                      name="trackAddToCart"
                      checked={pixelConfig.trackAddToCart}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="trackAddToCart" className="ml-2">
                      Ajout au panier (AddToCart)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="trackInitiateCheckout"
                      name="trackInitiateCheckout"
                      checked={pixelConfig.trackInitiateCheckout}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="trackInitiateCheckout" className="ml-2">
                      Début de paiement (InitiateCheckout)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="trackPurchase"
                      name="trackPurchase"
                      checked={pixelConfig.trackPurchase}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="trackPurchase" className="ml-2">
                      Achat (Purchase)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {saving ? 'Sauvegarde en cours...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Guide d'intégration</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <ol className="list-decimal list-inside space-y-2">
              <li>Créez un compte Facebook Business si vous n'en avez pas déjà un</li>
              <li>Accédez au Gestionnaire d'événements Facebook</li>
              <li>Créez un nouveau pixel et copiez l'ID du pixel</li>
              <li>Collez l'ID du pixel dans le champ ci-dessus</li>
              <li>Activez les événements que vous souhaitez suivre</li>
              <li>Sauvegardez la configuration</li>
              <li>Pour des fonctionnalités avancées, générez un token d'accès dans Facebook</li>
            </ol>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFacebookPixel;