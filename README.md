# Almezouara E-commerce Platform

A modern, mobile-first e-commerce platform for women's clothing inspired by Made-in-China, built with React and featuring bilingual support (French/Arabic).

## Features

- **Mobile-First Design**: Optimized for mobile shopping experience
- **Bilingual Support**: French and Arabic with RTL support
- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion animations
- **Progressive Web App (PWA)**: Installable on mobile devices
- **Admin Dashboard**: Complete management system for products, orders, and users
- **Real-time Updates**: Dynamic content management
- **Responsive Design**: Works seamlessly across all devices

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **i18next** - Internationalization
- **Zustand** - State management
- **Swiper** - Touch slider component

### Backend
- **Express.js** - Node.js web framework
- **MySQL2** - Database driver
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MySQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/almezouara-ecommerce.git
   cd almezouara-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=almezouara_ecommerce
   
   # Server Configuration
   PORT=3000
   ```

4. **Set up the database**
   - Import the provided SQL schema
   - Update the connection details in your `.env` file

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Start the API server**
   ```bash
   cd api
   npm install
   node index.js
   ```

The application will be available at `http://localhost:5173`

## Project Structure

```
almezouara-ecommerce/
├── api/                    # Backend API
│   ├── index.js           # Main server file
│   ├── orders.js          # Order management
│   ├── admin.js           # Admin functionality
│   ├── promotions.js      # Promotions management
│   └── package.json       # API dependencies
├── src/                   # Frontend source code
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   ├── i18n.js           # Internationalization config
│   └── index.css         # Global styles
├── images/               # Static images
├── index.html           # HTML template
├── package.json         # Frontend dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS config
└── vercel.json          # Vercel deployment config
```

## 🌐 Deployment

This project is configured for deployment on Vercel with detailed instructions available in `DEPLOYMENT_README.md`.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌍 Internationalization

The app supports French and Arabic languages with:
- Dynamic language switching
- RTL layout support for Arabic
- Localized content and UI elements

## 📱 PWA Features

- Installable on mobile devices
- Offline functionality
- App-like experience
- Push notifications ready

## 🛡️ Admin Features

- Product management (CRUD operations)
- Order tracking and management
- User account management
- Promotions and discounts
- Analytics dashboard
- Yalidine shipping integration

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please contact the Almezouara team.

## 🙏 Acknowledgments

- Inspired by Made-in-China's user experience
- Built with modern web technologies
- Designed for the Algerian market

---

**Made with ❤️ by the Almezouara team**
