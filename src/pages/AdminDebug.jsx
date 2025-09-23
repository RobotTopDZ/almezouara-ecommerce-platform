import React, { useState, useEffect } from 'react';
import useAdminStore from '../store/adminStore';

const AdminDebug = () => {
  const { isAuthenticated, adminUser, token } = useAdminStore();
  const [apiTest, setApiTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAPI = async () => {
      try {
        // Test basic API
        const apiResponse = await fetch('/api/');
        const apiData = await apiResponse.json();
        
        // Test admin stats
        const statsResponse = await fetch('/api/admin/stats');
        const statsData = await statsResponse.json();
        
        setApiTest({
          api: { status: apiResponse.status, data: apiData },
          stats: { status: statsResponse.status, data: statsData }
        });
      } catch (error) {
        setApiTest({
          error: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Debug Information</h1>
        
        {/* Authentication Status */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Admin User:</strong> {adminUser ? JSON.stringify(adminUser) : 'None'}</p>
            <p><strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}</p>
            <p><strong>LocalStorage Token:</strong> {localStorage.getItem('adminToken') ? '✅ Present' : '❌ Missing'}</p>
          </div>
        </div>

        {/* API Test Results */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">API Test Results</h2>
          <div className="bg-gray-100 p-4 rounded">
            {loading ? (
              <p>Testing API endpoints...</p>
            ) : (
              <pre className="text-sm overflow-auto">
                {JSON.stringify(apiTest, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Environment Information</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Current URL:</strong> {window.location.href}</p>
            <p><strong>User Agent:</strong> {navigator.userAgent}</p>
            <p><strong>Local Storage:</strong> {Object.keys(localStorage).length} items</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
          <div className="space-x-2">
            <button 
              onClick={() => {
                localStorage.setItem('adminToken', 'admin-token');
                window.location.reload();
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Set Admin Token
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Storage
            </button>
            <button 
              onClick={() => window.location.href = '/admin/login'}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;
