# 🗄️ Configuration Base de Données Railway - Guide Complet

Votre application fonctionne en mode "mock" car la base de données MySQL n'est pas configurée sur Railway. Voici comment la configurer.

## 🚀 Étapes pour configurer MySQL sur Railway

### 1. Ajouter un service MySQL à votre projet Railway

1. **Connectez-vous à Railway** : https://railway.app
2. **Ouvrez votre projet** Almezouara
3. **Cliquez sur "New Service"** ou le bouton "+"
4. **Sélectionnez "Database"**
5. **Choisissez "MySQL"**
6. Railway va créer automatiquement une instance MySQL

### 2. Récupérer les informations de connexion

Une fois MySQL créé :

1. **Cliquez sur le service MySQL** dans votre projet
2. **Allez dans l'onglet "Variables"**
3. Vous verrez ces variables automatiquement créées :
   - `MYSQL_URL` (URL de connexion complète)
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### 3. Configurer les variables d'environnement

Dans votre service **principal** (celui qui contient votre application) :

1. **Allez dans "Variables"**
2. **Ajoutez ces variables** :

```bash
# Option 1: URL complète (RECOMMANDÉ)
DATABASE_URL=${{MySQL.MYSQL_URL}}

# Option 2: Variables séparées (alternative)
DATABASE_HOST=${{MySQL.MYSQL_HOST}}
DATABASE_PORT=${{MySQL.MYSQL_PORT}}
DATABASE_USER=${{MySQL.MYSQL_USER}}
DATABASE_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DATABASE_NAME=${{MySQL.MYSQL_DATABASE}}

# Configuration SSL pour Railway
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

**Important** : Remplacez `MySQL` par le nom exact de votre service MySQL dans Railway.

### 4. Variables d'environnement complètes pour Railway

Voici toutes les variables que vous devriez avoir :

```bash
# Base de données
DATABASE_URL=${{MySQL.MYSQL_URL}}
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false

# Configuration générale
NODE_ENV=production
PORT=${{PORT}}

# CORS
CORS_ORIGIN=https://almezouara-ecommerce-platform-production.up.railway.app

# Admin (optionnel - déjà codé en dur)
ADMIN_USERNAME=robottopdz
ADMIN_PASSWORD=Osamu13579*+-/
```

## 🔧 Vérification de la configuration

### 1. Vérifier les logs de déploiement

Après avoir ajouté la base de données :

1. **Redéployez** votre application
2. **Consultez les logs** dans Railway
3. Vous devriez voir :
   ```
   ✅ Database connected successfully
   📊 Connected to: [host]:[port]/[database]
   ✅ Database tables initialized successfully
   ```

### 2. Tester les endpoints

Une fois la DB configurée, testez :

```bash
# Test de création de commande
curl -X POST https://votre-app.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0123456789",
    "items": [{"id": 1, "name": "Test", "price": 2500, "quantity": 1}],
    "total": 3000,
    "deliveryMethod": "domicile",
    "address": "Test Address",
    "fullName": "Test User",
    "wilaya": "Alger",
    "city": "Alger Centre",
    "shippingCost": 500
  }'

# Test de création de promotion
curl -X POST https://votre-app.railway.app/api/promotions \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "0123456789",
    "percentage": 10,
    "description": "Test Promotion",
    "usageLimit": 5
  }'
```

## 🗃️ Structure de la base de données

Votre application créera automatiquement ces tables :

### Tables principales :
- **accounts** - Comptes clients
- **orders** - Commandes
- **order_items** - Articles des commandes
- **promotions** - Promotions clients
- **domicile_fees** - Frais de livraison domicile
- **stopdesk_fees** - Frais de livraison stopdesk

### Schéma simplifié :
```sql
accounts (phone, name, password)
├── orders (id, phone, total, status, address, wilaya, city)
│   └── order_items (order_id, product_name, price, quantity)
└── promotions (phone, percentage, description, usage_limit)
```

## 🚨 Résolution des problèmes courants

### Problème 1: "Access denied for user"
**Solution** : Vérifiez que `DATABASE_URL` utilise la bonne syntaxe Railway
```bash
DATABASE_URL=${{MySQL.MYSQL_URL}}
```

### Problème 2: "Connection timeout"
**Solution** : Ajoutez les paramètres SSL
```bash
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

### Problème 3: Variables non reconnues
**Solution** : Vérifiez le nom exact de votre service MySQL dans Railway

### Problème 4: Tables non créées
**Solution** : Les tables se créent automatiquement au premier démarrage avec DB connectée

## 🎯 Étapes de déploiement final

1. **Créer service MySQL** sur Railway ✅
2. **Configurer variables d'environnement** ✅
3. **Redéployer l'application** ✅
4. **Vérifier les logs** pour connexion DB ✅
5. **Tester commandes et promotions** ✅

## 🎉 Résultat attendu

Une fois configuré, vous devriez voir dans les logs :
```
🚀 Starting Almezouara E-Commerce Server...
🔄 Starting database initialization...
✅ Database connected successfully
📊 Connected to: [railway-host]:3306/railway
✅ Database tables initialized successfully
✅ API routes mounted successfully
🎉 SERVER STARTED SUCCESSFULLY!
```

Et vos commandes/promotions fonctionneront en mode production avec persistance réelle !

---

**⚠️ Important** : N'oubliez pas de redéployer après avoir configuré les variables d'environnement.
