# 🗄️ MYSQL RAILWAY - Post-Deploy Fix

## 🎯 Problème identifié
Le **service MySQL sur Railway** ne lance pas son post-deploy, donc :
- ❌ Base de données MySQL pas complètement initialisée
- ❌ Tables pas créées automatiquement
- ❌ Service MySQL pas prêt pour l'application

## ✅ Solutions Railway MySQL

### Solution 1: Redémarrer le service MySQL

1. **Connectez-vous à Railway** : https://railway.app
2. **Ouvrez votre projet** "almezouara-ecommerce-platform"
3. **Cliquez sur votre service MySQL** (pas l'application principale)
4. **Allez dans "Settings"**
5. **Cliquez sur "Restart Service"**
6. **Attendez** que le service redémarre (2-3 minutes)

### Solution 2: Vérifier les variables MySQL

Dans votre **service MySQL** :
1. **Allez dans "Variables"**
2. **Vérifiez que vous avez** :
```bash
MYSQL_ROOT_PASSWORD=<généré automatiquement>
MYSQL_DATABASE=railway
MYSQL_USER=<généré automatiquement>
MYSQL_PASSWORD=<généré automatiquement>
```

### Solution 3: Forcer la réinitialisation MySQL

1. **Dans votre service MySQL**, allez dans "Data"
2. **Si vous voyez une option "Reset Database"**, utilisez-la
3. **OU** supprimez et recréez le service MySQL :
   - Cliquez sur "Settings" → "Delete Service"
   - Créez un nouveau service MySQL
   - Reconnectez-le à votre application

### Solution 4: Configuration manuelle MySQL

Si Railway ne configure pas MySQL automatiquement :

1. **Connectez-vous au MySQL** via Railway CLI ou interface web
2. **Exécutez ces commandes SQL** :

```sql
-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS railway;
USE railway;

-- Créer les tables nécessaires
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  description TEXT,
  usage_limit INT DEFAULT 1,
  usage_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (phone) REFERENCES accounts(phone) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  phone VARCHAR(20),
  date DATE NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'processing',
  delivery_method ENUM('domicile', 'stopdesk') NOT NULL,
  address TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  yalidine_tracking VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (phone) REFERENCES accounts(phone) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  image VARCHAR(500),
  color VARCHAR(100),
  size VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stopdesk_fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_desk VARCHAR(255) NOT NULL,
  commune VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS domicile_fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commune VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vérifier que les tables sont créées
SHOW TABLES;
```

## 🔧 Diagnostic MySQL Railway

### Vérifier l'état du service MySQL

1. **Dans Railway**, cliquez sur votre service MySQL
2. **Allez dans "Metrics"** - vérifiez que le service est actif
3. **Allez dans "Logs"** - cherchez les erreurs de démarrage
4. **Allez dans "Variables"** - vérifiez les variables d'environnement

### Tester la connexion MySQL

1. **Dans votre service principal**, allez dans "Console" ou "Shell"
2. **Exécutez** :
```bash
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE
```

3. **Si ça marche**, testez :
```sql
SHOW DATABASES;
USE railway;
SHOW TABLES;
```

### Vérifier les variables de connexion

Dans votre **service principal**, vérifiez que :
```bash
DATABASE_URL=${{MySQL.MYSQL_URL}}
```

Le nom "MySQL" doit correspondre **exactement** au nom de votre service MySQL dans Railway.

## 🚨 Solutions d'urgence

### Si MySQL ne démarre pas du tout :

1. **Supprimez le service MySQL**
2. **Créez un nouveau service MySQL** :
   - Cliquez "New Service" → "Database" → "MySQL"
   - Attendez qu'il se configure (5-10 minutes)
   - Notez le nouveau nom du service

3. **Mettez à jour les variables** dans votre service principal :
```bash
DATABASE_URL=${{NouveauNomMySQL.MYSQL_URL}}
```

### Si les tables ne se créent pas :

1. **Connectez-vous au MySQL** manuellement
2. **Exécutez le script SQL** ci-dessus
3. **Ou utilisez l'endpoint** de votre application :
```bash
curl -X POST https://almezouara-ecommerce-platform-production.up.railway.app/api/populate-shipping
```

## 🧪 Test final

Une fois MySQL configuré :

1. **Testez la connexion** :
```bash
curl "https://almezouara-ecommerce-platform-production.up.railway.app/api/debug-database"
```

2. **Testez les données** :
```bash
curl "https://almezouara-ecommerce-platform-production.up.railway.app/api/shipping-fees"
```

3. **Testez une commande** :
```bash
curl -X POST https://almezouara-ecommerce-platform-production.up.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0555123456",
    "items": [{"id": 1, "name": "Test", "price": 2500, "quantity": 1}],
    "total": 3000,
    "deliveryMethod": "domicile",
    "address": "Test",
    "fullName": "Test User",
    "wilaya": "Alger",
    "city": "Alger Centre",
    "shippingCost": 400
  }'
```

## 🎯 Résultat attendu

Après correction MySQL :
- ✅ **Service MySQL actif** et fonctionnel
- ✅ **Tables créées** automatiquement
- ✅ **Connexion établie** entre app et MySQL
- ✅ **Données peuplées** avec vos frais de livraison
- ✅ **Fonctionnalités opérationnelles** (commandes, promotions)

---

**Suivez ces étapes pour corriger le service MySQL sur Railway !** 🚀
