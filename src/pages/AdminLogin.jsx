import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminStore from '../store/adminStore';

const AdminLogin = () => {
  const navigate = useNavigate();
  const login = useAdminStore(s => s.login);
  const isAuthenticated = useAdminStore(s => s.isAuthenticated);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(username, password);
    if (res.ok) {
      navigate('/admin');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  if (isAuthenticated) {
    navigate('/admin');
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-sm mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
            <input id="username" className="w-full border rounded px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input id="password" type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-primary text-white rounded py-2">Sign in</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;


