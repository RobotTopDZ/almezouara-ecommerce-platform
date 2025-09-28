// Simple development server to run the API standalone and mount under /api for Vite proxy
const express = require('express');
const apiApp = require('./index');

const app = express();
app.use('/api', apiApp);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT} (mounted at /api)`);
});
