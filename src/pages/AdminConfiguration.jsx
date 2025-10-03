import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const AdminLayout = ({ children }) => (
  <div className="container mx-auto p-4 pb-16">
    <div className="grid md:grid-cols-4 gap-4">
      <aside className="md:col-span-1 bg-white rounded shadow p-4 space-y-2">
        <Link className="block hover:underline" to="/admin">Overview</Link>
        <Link className="block hover:underline" to="/admin/orders">Commandes</Link>
        <Link className="block hover:underline text-blue-600 font-medium" to="/admin/orders-yalidine">Commandes + Yalidine</Link>
        <Link className="block hover:underline" to="/admin/fees">Shipping Fees</Link>
        <Link className="block hover:underline" to="/admin/categories">Categories</Link>
        <Link className="block hover:underline" to="/admin/products">Products</Link>
        <Link className="block hover:underline" to="/admin/accounts">Accounts</Link>
        <Link className="block hover:underline" to="/admin/promotions">Promotions</Link>
        <Link className="block hover:underline text-green-600 font-medium" to="/admin/configuration">Configuration</Link>
      </aside>
      <main className="md:col-span-3 bg-white rounded shadow p-4">
        {children}
      </main>
    </div>
  </div>
);

const AdminConfiguration = () => {
  // Yalidine Configuration State
  const [yalidineConfig, setYalidineConfig] = useState({
    apiId: "',
    apiToken: "',
    configured: false
  });
  const [testingYalidine, setTestingYalidine] = useState(false);
  const [yalidineTestResult, setYalidineTestResult] = useState(null);
  const [savingYalidine, setSavingYalidine] = useState(false);

  // Facebook Pixel Configuration State
  const [loading, setLoading] = useState(false);
  const [savingPixel, setSavingPixel] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [pixelConfig, setPixelConfig] = useState({
    enabled: false,
    pixelId: "',
    accessToken: "',
    testEventCode: "',
    trackPageView: true,
    trackAddToCart: true,
    trackInitiateCheckout: true,
    trackPurchase: true
  });

  // Active Tab State
  const [activeTab, setActiveTab] = useState("yalidine");

  useEffect(() => {
    // Load configurations
    loadYalidineConfig();
    loadFacebookPixelConfig();
  }, []);

  // Yalidine Configuration Functions
  const loadYalidineConfig = async () => {
    try {
      const response = await axios.get("/api/admin/yalidine-config");
      if (response.data && response.data.config) {
        setYalidineConfig(response.data.config);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la configuration Yalidine:", err);
    }
  };

  const saveYalidineConfig = async () => {
    setSavingYalidine(true);
    try {
      await axios.post("/api/admin/yalidine-config", { config: yalidineConfig });
      alert("Configuration Yalidine sauvegardée avec succès!");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de la configuration Yalidine:", err);
      alert("Erreur lors de la sauvegarde de la configuration Yalidine");
    } finally {
      setSavingYalidine(false);
    }
  };

  const testYalidineConnection = async () => {
    setTestingYalidine(true);
    setYalidineTestResult(null);
    try {
      const response = await axios.post("/api/yalidine/test-connection", yalidineConfig);
      setYalidineTestResult({
        success: true,
        message: "Connexion réussie avec Yalidine!"
      });
    } catch (err) {
      console.error("Erreur lors du test de connexion Yalidine:", err);
      setYalidineTestResult({
        success: false,
        message: `Erreur de connexion: ${err.response?.data?.message || err.message}`
      });
    } finally {
      setTestingYalidine(false);
    }
  };

  const handleYalidineChange = (e) => {
    const { name, value } = e.target;
    setYalidineConfig({
      ...yalidineConfig,
      [name]: value
    });
  };

  // Facebook Pixel Configuration Functions
  const loadFacebookPixelConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/admin/facebook-pixel");
      if (response.data && response.data.config) {
        setPixelConfig(response.data.config);
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la configuration Facebook Pixel:", err);
      setError("Impossible de charger la configuration");
    } finally {
      setLoading(false);
    }
  };

  const handlePixelChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPixelConfig({
      ...pixelConfig,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const savePixelConfig = async (e) => {
    e.preventDefault();
    setSavingPixel(true);
    setSuccess(false);
    setError(null);

    try {
      await axios.post("/api/admin/facebook-pixel", { config: pixelConfig });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de la configuration Facebook Pixel:", err);
      setError("Impossible de sauvegarder la configuration");
    } finally {
      setSavingPixel(false);
    }
  };

  const testPixelConnection = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/admin/facebook-pixel/test");
      if (response.data.success) {
        alert("Connexion réussie avec Facebook Pixel!");
      } else {
        alert(`Erreur de connexion: ${response.data.error}`);
      }
    } catch (err) {
      console.error("Erreur lors du test de connexion:", err);
      alert(`Erreur de connexion: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Configuration</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("yalidine")}
              className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === "yalidine"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Configuration Yalidine
            </button>
            <button
              onClick={() => setActiveTab("facebook")}
              className={`py-2 px-4 text-center border-b-2 font-medium text-sm ${
                activeTab === "facebook"
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Configuration Facebook Pixel
            </button>
          </nav>
        </div>
      </div>

      {/* Yalidine Configuration Tab */}
      {activeTab === "yalidine" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Configuration Yalidine</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="apiId">
              API ID
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="apiId"
              name="apiId"
              type="text"
              placeholder="Entrez votre API ID Yalidine"
              value={yalidineConfig.apiId}
              onChange={handleYalidineChange}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="apiToken">
              API Token
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="apiToken"
              name="apiToken"
              type="password"
              placeholder="Entrez votre API Token Yalidine"
              value={yalidineConfig.apiToken}
              onChange={handleYalidineChange}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <button
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                testingYalidine ? "opacity-50 cursor-not-allowed" : "'
              }`}
              type="button"
              onClick={testYalidineConnection}
              disabled={testingYalidine}
            >
              {testingYalidine ? "Test en cours..." : "Tester la connexion"}
            </button>
            
            <button
              className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                savingYalidine ? "opacity-50 cursor-not-allowed" : "'
              }`}
              type="button"
              onClick={saveYalidineConfig}
              disabled={savingYalidine}
            >
              {savingYalidine ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
          
          {yalidineTestResult && (
            <div className={`mt-4 p-3 rounded ${yalidineTestResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {yalidineTestResult.message}
            </div>
          )}
        </div>
      )}

      {/* Facebook Pixel Configuration Tab */}
      {activeTab === "facebook" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Configuration Facebook Pixel</h2>
          
          <form onSubmit={savePixelConfig}>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={pixelConfig.enabled}
                  onChange={handlePixelChange}
                  className="mr-2"
                />
                <span className="text-gray-700">Activer Facebook Pixel</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pixelId">
                Pixel ID
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="pixelId"
                name="pixelId"
                type="text"
                placeholder="Entrez votre Pixel ID"
                value={pixelConfig.pixelId}
                onChange={handlePixelChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="accessToken">
                Access Token
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="accessToken"
                name="accessToken"
                type="password"
                placeholder="Entrez votre Access Token"
                value={pixelConfig.accessToken}
                onChange={handlePixelChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="testEventCode">
                Test Event Code (optionnel)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="testEventCode"
                name="testEventCode"
                type="text"
                placeholder="Entrez votre Test Event Code"
                value={pixelConfig.testEventCode}
                onChange={handlePixelChange}
              />
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Événements à suivre</h3>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="trackPageView"
                    checked={pixelConfig.trackPageView}
                    onChange={handlePixelChange}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Vues de page (PageView)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="trackAddToCart"
                    checked={pixelConfig.trackAddToCart}
                    onChange={handlePixelChange}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Ajout au panier (AddToCart)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="trackInitiateCheckout"
                    checked={pixelConfig.trackInitiateCheckout}
                    onChange={handlePixelChange}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Début de paiement (InitiateCheckout)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="trackPurchase"
                    checked={pixelConfig.trackPurchase}
                    onChange={handlePixelChange}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Achat (Purchase)</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="button"
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  loading ? "opacity-50 cursor-not-allowed" : "'
                }`}
                onClick={testPixelConnection}
                disabled={loading || !pixelConfig.enabled || !pixelConfig.pixelId || !pixelConfig.accessToken}
              >
                {loading ? "Test en cours..." : "Tester la connexion"}
              </button>
              
              <button
                type="submit"
                className={`bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  savingPixel ? "opacity-50 cursor-not-allowed" : "'
                }`}
                disabled={savingPixel}
              >
                {savingPixel ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
            
            {success && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
                Configuration sauvegardée avec succès!
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
                {error}
              </div>
            )}
          </form>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminConfiguration;