# 🚀 Vercel + PlanetScale Deployment Guide

## 📋 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **PlanetScale Account** - Sign up at [planetscale.com](https://planetscale.com)

## 🗄️ Step 1: Set up PlanetScale Database

### 1.1 Create PlanetScale Account
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up with GitHub
3. Create a new database: `almezouara-ecommerce`

### 1.2 Get Connection Details
1. Go to your database dashboard
2. Click "Connect" → "Connect with" → "Node.js"
3. Copy the connection details:
   - Host
   - Username
   - Password
   - Database name

### 1.3 Create Database Tables
Run this SQL in PlanetScale's SQL editor:

```sql
-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create promotions table
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

-- Create orders table
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

-- Create order_items table
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

-- Create stopdesk_fees table
CREATE TABLE IF NOT EXISTS stopdesk_fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_desk VARCHAR(255) NOT NULL,
  commune VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create domicile_fees table
CREATE TABLE IF NOT EXISTS domicile_fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commune VARCHAR(100) NOT NULL,
  wilaya VARCHAR(100) NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Step 2: Deploy to Vercel

### 2.1 Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2.2 Connect Vercel to GitHub
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite + Node.js project

### 2.3 Configure Environment Variables
In Vercel dashboard, go to Settings → Environment Variables:

```
DATABASE_HOST=your-planetscale-host
DATABASE_USERNAME=your-planetscale-username
DATABASE_PASSWORD=your-planetscale-password
DATABASE_NAME=almezouara-ecommerce
DATABASE_PORT=3306
NODE_ENV=production
```

### 2.4 Deploy
1. Click "Deploy"
2. Vercel will build and deploy your app
3. You'll get a live URL like: `https://your-app.vercel.app`

## 🔄 Step 3: Automatic Deployments

After initial setup:
1. **Push to GitHub** → Vercel automatically deploys
2. **Database changes** → PlanetScale handles scaling
3. **Zero downtime** updates

## 📊 Step 4: Monitor Your App

### Vercel Dashboard
- View deployments
- Monitor performance
- Check logs
- Manage domains

### PlanetScale Dashboard
- Monitor database performance
- View query metrics
- Manage connections

## 💰 Cost Breakdown

**Free Tier (Starting)**:
- Vercel: $0/month
- PlanetScale: $0/month
- **Total: $0/month**

**When you scale**:
- Vercel Pro: $20/month
- PlanetScale Pro: $29/month
- **Total: $49/month**

## 🛠️ Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check environment variables
   - Verify PlanetScale credentials
   - Ensure database is created

2. **Build Errors**
   - Check Vercel build logs
   - Verify all dependencies are in package.json

3. **API Routes Not Working**
   - Check Vercel function logs
   - Verify route paths in vercel.json

## 📞 Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **PlanetScale Docs**: [planetscale.com/docs](https://planetscale.com/docs)
- **This Project**: Check the code comments for help

---

🎉 **Congratulations!** Your e-commerce app is now live on Vercel with PlanetScale!

