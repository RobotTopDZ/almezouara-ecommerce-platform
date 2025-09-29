const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'almezouara.db');
const db = new sqlite3.Database(dbPath);

async function populateVariants() {
    console.log('🔄 Populating product variants...');
    
    return new Promise((resolve, reject) => {
        // First, get all products with their colors and sizes
        db.all(`SELECT id, name, colors, sizes, price FROM products`, [], (err, products) => {
            if (err) {
                console.error('❌ Error fetching products:', err);
                reject(err);
                return;
            }
            
            console.log(`📦 Found ${products.length} products to process`);
            
            let totalVariants = 0;
            let processedProducts = 0;
            
            products.forEach(product => {
                try {
                    const colors = JSON.parse(product.colors || '[]');
                    const sizes = JSON.parse(product.sizes || '[]');
                    
                    console.log(`\n🔍 Processing: ${product.name}`);
                    console.log(`   Colors: ${colors.join(', ')}`);
                    console.log(`   Sizes: ${sizes.join(', ')}`);
                    
                    // Create variants for each color-size combination
                    colors.forEach(color => {
                        sizes.forEach(size => {
                            const sku = `${product.id}-${color.toLowerCase().replace(/\s+/g, '-')}-${size.toLowerCase()}`;
                            const barcode = `${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
                            const stock = Math.floor(Math.random() * 50) + 10; // Random stock between 10-60
                            
                            // Get color hex value (simplified mapping)
                            const colorMap = {
                                'rouge': '#FF0000',
                                'noir': '#000000',
                                'bleu': '#0000FF',
                                'blanc': '#FFFFFF',
                                'marron': '#8B4513',
                                'gris': '#808080',
                                'vert': '#008000',
                                'jaune': '#FFFF00',
                                'rose': '#FFC0CB'
                            };
                            
                            const colorValue = colorMap[color.toLowerCase()] || '#000000';
                            
                            db.run(`
                                INSERT INTO product_variants 
                                (product_id, color_name, color_value, size, stock, sku, barcode, price_adjustment, created_at, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                            `, [
                                product.id,
                                color,
                                colorValue,
                                size,
                                stock,
                                sku,
                                barcode,
                                0.00 // No price adjustment for now
                            ], function(err) {
                                if (err) {
                                    console.error(`❌ Error inserting variant for ${product.name}:`, err);
                                } else {
                                    totalVariants++;
                                    console.log(`   ✅ Added variant: ${color} - ${size} (Stock: ${stock})`);
                                }
                            });
                        });
                    });
                    
                    processedProducts++;
                    
                    // Check if we're done processing all products
                    if (processedProducts === products.length) {
                        setTimeout(() => {
                            console.log(`\n🎉 Successfully created ${totalVariants} product variants!`);
                            
                            // Verify the results
                            db.get(`SELECT COUNT(*) as count FROM product_variants`, [], (err, result) => {
                                if (err) {
                                    console.error('❌ Error counting variants:', err);
                                } else {
                                    console.log(`📊 Total variants in database: ${result.count}`);
                                }
                                
                                db.close();
                                resolve();
                            });
                        }, 1000); // Wait a bit for all inserts to complete
                    }
                    
                } catch (parseError) {
                    console.error(`❌ Error parsing JSON for product ${product.name}:`, parseError);
                    processedProducts++;
                }
            });
        });
    });
}

// Run the population
populateVariants()
    .then(() => {
        console.log('✅ Variant population completed!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed to populate variants:', err);
        process.exit(1);
    });