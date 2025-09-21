// server.js - Railway/Monolithic deployment entry
// Serves the built React app from /dist and mounts the API from /api

const path = require('path');
const express = require('express');
const appApi = require('./api'); // api/index.js exports the Express app

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy when running behind Railway's proxy
app.set('trust proxy', 1);

// Mount the API app at root; it already registers routes under '/api/*'
app.use(appApi);

// Serve static files from Vite build
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
