const express = require('express');
const router = express.Router();
const { pool } = require('./config/database');

// Récupérer toutes les wilayas
router.get('/wilayas', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const [wilayas] = await pool.execute('SELECT DISTINCT wilaya FROM shipping_fees ORDER BY wilaya');
    
    if (wilayas.length === 0) {
      // Fallback si aucune wilaya n'est trouvée
      return res.json({
        success: true,
        wilayas: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida']
      });
    }
    
    return res.json({
      success: true,
      wilayas: wilayas.map(w => w.wilaya)
    });
  } catch (error) {
    console.error('Error fetching wilayas:', error);
    return res.status(500).json({ error: 'Failed to fetch wilayas' });
  }
});

// Récupérer toutes les communes pour une wilaya spécifique
router.get('/communes/:wilaya', async (req, res) => {
  try {
    const { wilaya } = req.params;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    const [communes] = await pool.execute(
      'SELECT DISTINCT commune FROM domicile_fees WHERE wilaya = ? ORDER BY commune',
      [wilaya]
    );
    
    if (communes.length === 0) {
      // Fallback si aucune commune n'est trouvée
      return res.json({
        success: true,
        communes: [wilaya]
      });
    }
    
    return res.json({
      success: true,
      communes: communes.map(c => c.commune)
    });
  } catch (error) {
    console.error(`Error fetching communes for wilaya ${req.params.wilaya}:`, error);
    return res.status(500).json({ error: 'Failed to fetch communes' });
  }
});

// Récupérer les frais de livraison pour une wilaya et commune spécifiques
router.get('/fees/:wilaya/:commune', async (req, res) => {
  try {
    const { wilaya, commune } = req.params;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Récupérer les frais de livraison à domicile
    const [domicileFees] = await pool.execute(
      'SELECT prix FROM domicile_fees WHERE wilaya = ? AND commune = ? LIMIT 1',
      [wilaya, commune]
    );
    
    // Récupérer les frais de livraison en point relais
    const [stopdeskFees] = await pool.execute(
      'SELECT prix FROM stopdesk_fees WHERE wilaya = ? AND commune = ? LIMIT 1',
      [wilaya, commune]
    );
    
    const domicilePrice = domicileFees.length > 0 ? parseFloat(domicileFees[0].prix) : 500;
    const stopdeskPrice = stopdeskFees.length > 0 ? parseFloat(stopdeskFees[0].prix) : 300;
    
    return res.json({
      success: true,
      shippingFees: {
        wilaya,
        commune,
        domicilePrice,
        stopdeskPrice
      }
    });
  } catch (error) {
    console.error(`Error fetching shipping fees for ${req.params.wilaya}/${req.params.commune}:`, error);
    return res.status(500).json({ error: 'Failed to fetch shipping fees' });
  }
});

// Récupérer tous les frais de livraison
router.get('/all-fees', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // Récupérer tous les frais de livraison à domicile
    const [domicileFees] = await pool.execute('SELECT * FROM domicile_fees ORDER BY wilaya, commune');
    
    // Récupérer tous les frais de livraison en point relais
    const [stopdeskFees] = await pool.execute('SELECT * FROM stopdesk_fees ORDER BY wilaya, commune');
    
    return res.json({
      success: true,
      domicileFees,
      stopdeskFees
    });
  } catch (error) {
    console.error('Error fetching all shipping fees:', error);
    return res.status(500).json({ error: 'Failed to fetch shipping fees' });
  }
});

module.exports = router;