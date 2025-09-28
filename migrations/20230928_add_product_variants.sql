-- Add product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_value VARCHAR(7) NOT NULL DEFAULT '#000000',
  size VARCHAR(50) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  price_adjustment DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY `unique_variant` (`product_id`, `color_name`, `size`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add variant_id to order_items
ALTER TABLE order_items 
ADD COLUMN variant_id INT NULL AFTER product_id,
ADD FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_variant_product ON product_variants(product_id);
CREATE INDEX idx_variant_sku ON product_variants(sku);

-- Migrate existing data (if any)
-- This is a simplified migration - you might need to adjust based on your actual data structure
INSERT IGNORE INTO product_variants (product_id, color_name, color_value, size, stock)
SELECT 
  p.id as product_id,
  COALESCE(
    (SELECT JSON_UNQUOTE(JSON_EXTRACT(p.colors, '$[0].name')) 
     WHERE JSON_VALID(p.colors) AND JSON_EXTRACT(p.colors, '$[0].name') IS NOT NULL
     LIMIT 1),
    'Default'
  ) as color_name,
  COALESCE(
    (SELECT JSON_UNQUOTE(JSON_EXTRACT(p.colors, '$[0].value')) 
     WHERE JSON_VALID(p.colors) AND JSON_EXTRACT(p.colors, '$[0].value') IS NOT NULL
     LIMIT 1),
    '#000000'
  ) as color_value,
  COALESCE(
    (SELECT JSON_UNQUOTE(JSON_EXTRACT(p.sizes, '$[0]')) 
     WHERE JSON_VALID(p.sizes) AND JSON_EXTRACT(p.sizes, '$[0]') IS NOT NULL
     LIMIT 1),
    'One Size'
  ) as size,
  p.stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE pv.id IS NULL;

-- Update existing order_items with variant_id (simplified - might need adjustment)
UPDATE order_items oi
JOIN product_variants pv ON oi.product_id = pv.product_id
SET oi.variant_id = pv.id
WHERE oi.variant_id IS NULL;
