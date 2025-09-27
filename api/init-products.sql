-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50) DEFAULT 'category',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  category_id INT,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  description TEXT,
  images JSON,
  colors JSON,
  sizes JSON,
  status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Insert default categories
INSERT IGNORE INTO categories (id, name, description, color, icon) VALUES
(1, 'Robes', 'Robes élégantes pour toutes les occasions', '#FF6B6B', 'dress'),
(2, 'Hijabs', 'Hijabs modernes et confortables', '#4ECDC4', 'hijab'),
(3, 'Abayas', 'Abayas traditionnelles et modernes', '#45B7D1', 'abaya'),
(4, 'Accessoires', 'Accessoires pour compléter votre look', '#96CEB4', 'accessories'),
(5, 'Chaussures', 'Chaussures confortables et stylées', '#FFEAA7', 'shoes');

-- Insert sample product
INSERT IGNORE INTO products (id, name, category_id, price, stock, description, images, colors, sizes, status) VALUES
(1, 'Robe Élégante Rouge', 1, 3500.00, 15, 'Une robe élégante parfaite pour toutes les occasions. Fabriquée avec des matériaux de haute qualité pour un confort optimal.', 
'["/images/IMG_0630-scaled.jpeg", "/images/IMG_6710-scaled.jpeg", "/images/IMG_6789-scaled.jpeg"]', 
'["Rouge", "Noir", "Bleu"]', 
'["S", "M", "L", "XL"]', 
'active');
