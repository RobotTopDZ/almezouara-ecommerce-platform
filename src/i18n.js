import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translations
const resources = {
  fr: {
    translation: {
      // Navigation
      "nav.home": "Accueil",
      "nav.categories": "Catégories",
      "nav.account": "Compte",
      "nav.search": "Rechercher",
      
      // Home page
      "home.categories_title": "Catégories",
      "home.selections_title": "Nos Sélections",
      "home.trending": "Produits Tendance",
      "home.special_offers": "Promotions Spéciales",
      "home.new_arrivals": "Nouveautés",
      "home.popular": "Populaire en Algérie",
      "home.articles_title": "Articles",
      
      // Categories
      "categories.dresses": "Robes",
      "categories.hijabs": "Hijabs",
      "categories.shoes": "Chaussures",
      "categories.accessories": "Accessoires",
      
      // Product page
      "product.in_stock": "En stock",
      "product.out_of_stock": "Rupture de stock",
      "product.select_color": "Sélectionnez une couleur",
      "product.select_size": "Sélectionnez une taille",
      "product.buy_now": "Acheter maintenant",
      "product.order_success": "Votre commande a été passée avec succès!",
      
      // Checkout
      "checkout.title": "Finaliser la commande",
      "checkout.full_name": "Nom complet",
      "checkout.phone_number": "Numéro de téléphone",
      "checkout.wilaya": "Wilaya",
      "checkout.select_wilaya": "Sélectionnez votre wilaya",
      "checkout.address": "Adresse de livraison",
      "checkout.delivery_method": "Méthode de livraison",
      "checkout.delivery_home": "Livraison à domicile",
      "checkout.delivery_stopdesk": "Stopdesk Yalidine",
      "checkout.order_now": "Commander maintenant",
      "checkout.confirm_order": "Confirmer la commande",
      "checkout.phone": "Numéro de téléphone",
      "checkout.city": "Ville",
      "checkout.select_city": "Sélectionnez votre ville",
      
      // Account
      "account.my_orders": "Mes commandes",
      "account.profile": "Mon profil",
      "account.logout": "Déconnexion",
      "account.login": "Connexion",
      "account.register": "Inscription",
      "account.password": "Mot de passe",
      "account.confirm_password": "Confirmer le mot de passe",
      "account.update_profile": "Mettre à jour le profil",
      "account.no_orders": "Aucune commande trouvée",
      "account.total": "Total",
      "account.status_delivered": "Livré",
      "account.status_processing": "En cours",
      "account.status_shipped": "Expédié",
      "account.status_cancelled": "Annulé",
      
      // Search
      "search.title": "Recherche",
      "search.placeholder": "Rechercher des produits...",
      "search.no_results": "Aucun résultat trouvé",
      "search.results_for": "Résultats pour",
      "search.start_searching": "Commencez à taper pour rechercher des produits",
      "search.popular_searches": "Recherches populaires",
    },
  },
  ar: {
    translation: {
      // Navigation
      "nav.home": "الرئيسية",
      "nav.categories": "الفئات",
      "nav.account": "الحساب",
      "nav.search": "بحث",
      
      // Home page
      "home.categories_title": "الفئات",
      "home.selections_title": "اختياراتنا",
      "home.trending": "المنتجات الرائجة",
      "home.special_offers": "عروض خاصة",
      "home.new_arrivals": "وصل حديثاً",
      "home.popular": "شائع في الجزائر",
      "home.articles_title": "المنتجات",
      
      // Categories
      "categories.dresses": "فساتين",
      "categories.hijabs": "حجابات",
      "categories.shoes": "أحذية",
      "categories.accessories": "إكسسوارات",
      
      // Product page
      "product.in_stock": "متوفر",
      "product.out_of_stock": "غير متوفر",
      "product.select_color": "اختر اللون",
      "product.select_size": "اختر المقاس",
      "product.buy_now": "اشتر الآن",
      "product.order_success": "تم تقديم طلبك بنجاح!",
      
      // Checkout
      "checkout.title": "إتمام الطلب",
      "checkout.full_name": "الاسم الكامل",
      "checkout.phone_number": "رقم الهاتف",
      "checkout.wilaya": "الولاية",
      "checkout.select_wilaya": "اختر ولايتك",
      "checkout.address": "عنوان التوصيل",
      "checkout.delivery_method": "طريقة التوصيل",
      "checkout.delivery_home": "توصيل للمنزل",
      "checkout.delivery_stopdesk": "ستوب ديسك ياليدين",
      "checkout.order_now": "اطلب الآن",
      "checkout.confirm_order": "تأكيد الطلب",
      "checkout.phone": "رقم الهاتف",
      "checkout.city": "المدينة",
      "checkout.select_city": "اختر مدينتك",
      
      // Account
      "account.my_orders": "طلباتي",
      "account.profile": "ملفي الشخصي",
      "account.logout": "تسجيل الخروج",
      "account.login": "تسجيل الدخول",
      "account.register": "إنشاء حساب",
      "account.password": "كلمة المرور",
      "account.confirm_password": "تأكيد كلمة المرور",
      "account.update_profile": "تحديث الملف الشخصي",
      "account.no_orders": "لا توجد طلبات",
      "account.total": "المجموع",
      "account.status_delivered": "تم التوصيل",
      "account.status_processing": "قيد المعالجة",
      "account.status_shipped": "تم الشحن",
      "account.status_cancelled": "ملغي",
      
      // Search
      "search.title": "البحث",
      "search.placeholder": "البحث عن المنتجات...",
      "search.no_results": "لا توجد نتائج",
      "search.results_for": "النتائج لـ",
      "search.start_searching": "ابدأ الكتابة للبحث عن المنتجات",
      "search.popular_searches": "البحثات الشائعة",
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr", // Default language
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;