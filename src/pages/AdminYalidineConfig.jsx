import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
        <Link className="block hover:underline text-green-600 font-medium" to="/admin/yalidine-config">Configuration Yalidine</Link>
      </aside>
      <main className="md:col-span-3 bg-white rounded shadow p-4">
        {children}
      </main>
    </div>
  </div>
);

const AdminYalidineConfig = () => {
  const [config, setConfig] = useState({
    apiId: '',
    apiToken: '',
    configured: false
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load current configuration
    loadConfig();
  }, []);

  const loadConfig = () => {
    // In a real app, you'd load this from your backend
    const savedConfig = localStorage.getItem('yalidineConfig');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // In a real app, you'd save this to your backend
      localStorage.setItem('yalidineConfig', JSON.stringify(config));
      setConfig(prev => ({ ...prev, configured: true }));
      alert('Configuration Yalidine sauvegardée avec succès!');
    } catch (error) {
      alert('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.apiId || !config.apiToken) {
      alert('Veuillez d\'abord configurer votre API ID et Token');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Temporarily set the API credentials for testing
      const originalApiId = process.env.YALIDINE_API_ID;
      const originalApiToken = process.env.YALIDINE_API_TOKEN;
      
      process.env.YALIDINE_API_ID = config.apiId;
      process.env.YALIDINE_API_TOKEN = config.apiToken;

      const response = await axios.get('/api/yalidine/test');
      
      if (response.data.success) {
        setTestResult({
          success: true,
          message: 'Connexion à Yalidine réussie!',
          data: response.data.data
        });
      } else {
        setTestResult({
          success: false,
          message: 'Échec de la connexion: ' + response.data.error
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erreur de connexion: ' + (error.response?.data?.error || error.message)
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
      configured: false
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Configuration Yalidine</h1>
              <p className="text-green-100">Configurez votre intégration avec l'API Yalidine</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">🚚</div>
              <div className="text-green-100 text-sm">API Yalidine</div>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres API</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API ID Yalidine
              </label>
              <input
                type="text"
                value={config.apiId}
                onChange={(e) => handleInputChange('apiId', e.target.value)}
                placeholder="Votre API ID Yalidine"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Trouvez votre API ID dans votre tableau de bord Yalidine
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Token Yalidine
              </label>
              <input
                type="password"
                value={config.apiToken}
                onChange={(e) => handleInputChange('apiToken', e.target.value)}
                placeholder="Votre API Token Yalidine"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Gardez votre API Token secret et ne le partagez jamais
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={testConnection}
                disabled={testing || !config.apiId || !config.apiToken}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  testing || !config.apiId || !config.apiToken
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {testing ? '⏳ Test en cours...' : '🧪 Tester la connexion'}
              </button>

              <button
                onClick={saveConfig}
                disabled={saving || !config.apiId || !config.apiToken}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  saving || !config.apiId || !config.apiToken
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className={`rounded-lg p-4 ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className={`text-2xl mr-3 ${
                testResult.success ? 'text-green-500' : 'text-red-500'
              }`}>
                {testResult.success ? '✅' : '❌'}
              </div>
              <div>
                <h4 className={`font-medium ${
                  testResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {testResult.success ? 'Connexion réussie!' : 'Échec de la connexion'}
                </h4>
                <p className={`text-sm ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                </p>
                {testResult.data && (
                  <div className="mt-2 text-xs text-green-600">
                    <pre className="bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut de la configuration</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">API ID configuré:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                config.apiId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {config.apiId ? '✅ Configuré' : '❌ Non configuré'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">API Token configuré:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                config.apiToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {config.apiToken ? '✅ Configuré' : '❌ Non configuré'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Configuration complète:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                config.configured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {config.configured ? '✅ Prêt' : '⚠️ En attente'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Instructions de configuration</h3>
          
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Connectez-vous à votre tableau de bord Yalidine</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Allez dans la section "Développement" ou "API"</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Générez votre API ID et API Token</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Copiez et collez les identifiants dans les champs ci-dessus</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">5.</span>
              <span>Testez la connexion pour vérifier que tout fonctionne</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">6.</span>
              <span>Sauvegardez la configuration</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Une fois configuré, vous pourrez envoyer automatiquement 
              vos commandes confirmées à Yalidine depuis la page "Commandes + Yalidine".
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/admin/orders-yalidine"
              className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="text-2xl mr-3">🚚</div>
                <div>
                  <div className="font-medium text-blue-900">Gérer les commandes</div>
                  <div className="text-sm text-blue-700">Envoyer les commandes à Yalidine</div>
                </div>
              </div>
            </Link>

            <a
              href="https://yalidine.app"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="text-2xl mr-3">🌐</div>
                <div>
                  <div className="font-medium text-green-900">Tableau de bord Yalidine</div>
                  <div className="text-sm text-green-700">Ouvrir dans un nouvel onglet</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminYalidineConfig;

