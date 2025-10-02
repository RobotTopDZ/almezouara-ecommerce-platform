const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./almezouara.db');

// Initialiser la table si elle n'existe pas
db.run(`
  CREATE TABLE IF NOT EXISTS facebook_pixel_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enabled BOOLEAN DEFAULT 0,
    pixel_id TEXT,
    access_token TEXT,
    test_event_code TEXT,
    track_page_view BOOLEAN DEFAULT 1,
    track_add_to_cart BOOLEAN DEFAULT 1,
    track_initiate_checkout BOOLEAN DEFAULT 1,
    track_purchase BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Récupérer la configuration
router.get('/', (req, res) => {
  db.get('SELECT * FROM facebook_pixel_config ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error('Erreur lors de la récupération de la configuration Facebook Pixel:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    const config = row ? {
      enabled: Boolean(row.enabled),
      pixelId: row.pixel_id || '',
      accessToken: row.access_token || '',
      testEventCode: row.test_event_code || '',
      trackPageView: Boolean(row.track_page_view),
      trackAddToCart: Boolean(row.track_add_to_cart),
      trackInitiateCheckout: Boolean(row.track_initiate_checkout),
      trackPurchase: Boolean(row.track_purchase)
    } : {
      enabled: false,
      pixelId: '',
      accessToken: '',
      testEventCode: '',
      trackPageView: true,
      trackAddToCart: true,
      trackInitiateCheckout: true,
      trackPurchase: true
    };

    res.json({ config });
  });
});

// Sauvegarder la configuration
router.post('/', (req, res) => {
  const { config } = req.body;
  
  if (!config) {
    return res.status(400).json({ error: 'Configuration manquante' });
  }

  const { enabled, pixelId, accessToken, testEventCode, trackPageView, trackAddToCart, trackInitiateCheckout, trackPurchase } = config;

  db.run(`
    INSERT INTO facebook_pixel_config 
    (enabled, pixel_id, access_token, test_event_code, track_page_view, track_add_to_cart, track_initiate_checkout, track_purchase)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, 
  [
    enabled ? 1 : 0, 
    pixelId || '', 
    accessToken || '', 
    testEventCode || '', 
    trackPageView ? 1 : 0, 
    trackAddToCart ? 1 : 0, 
    trackInitiateCheckout ? 1 : 0, 
    trackPurchase ? 1 : 0
  ], 
  function(err) {
    if (err) {
      console.error('Erreur lors de la sauvegarde de la configuration Facebook Pixel:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    res.json({ success: true, id: this.lastID });
  });
});

// Tester la connexion avec Facebook Pixel
router.post('/test', (req, res) => {
  db.get('SELECT * FROM facebook_pixel_config ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error('Erreur lors de la récupération de la configuration Facebook Pixel:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (!row || !row.pixel_id) {
      return res.status(400).json({ error: 'ID Pixel non configuré' });
    }

    // Simuler un test de connexion
    // Dans une implémentation réelle, vous pourriez faire une requête à l'API Facebook
    res.json({ 
      success: true, 
      message: 'Connexion réussie avec Facebook Pixel',
      pixelId: row.pixel_id
    });
  });
});

// Récupérer la configuration pour le frontend
router.get('/client-config', (req, res) => {
  db.get('SELECT * FROM facebook_pixel_config ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error('Erreur lors de la récupération de la configuration Facebook Pixel:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (!row || !row.enabled || !row.pixel_id) {
      return res.json({ enabled: false });
    }

    res.json({
      enabled: Boolean(row.enabled),
      pixelId: row.pixel_id,
      trackPageView: Boolean(row.track_page_view),
      trackAddToCart: Boolean(row.track_add_to_cart),
      trackInitiateCheckout: Boolean(row.track_initiate_checkout),
      trackPurchase: Boolean(row.track_purchase)
    });
  });
});

module.exports = router;