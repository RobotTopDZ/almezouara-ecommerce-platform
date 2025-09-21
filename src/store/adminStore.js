import { create } from 'zustand';

const HARD_CODED_USERNAME = 'robottopdz';
const HARD_CODED_PASSWORD = 'Osamu13579*+-/';

export const useAdminStore = create((set, get) => ({
  isAuthenticated: false,
  adminUser: null,

  // Basic datasets managed via admin UI
  shippingFees: [], // { id, wilaya, city, domicilePrice, stopdeskPrice }
  categories: [], // { id, name }
  products: [], // { id, name, categoryId, colors:[], sizes:[], price }
  accounts: [], // { id, email, name, ordersCount, totalSpent, promotions:[] }
  promotions: [], // { id, accountId | null, percentage, description }

  login: async (username, password) => {
    if (username === HARD_CODED_USERNAME && password === HARD_CODED_PASSWORD) {
      set({ isAuthenticated: true, adminUser: { username } });
      return { ok: true };
    }
    return { ok: false, error: 'Invalid credentials' };
  },

  logout: () => set({ isAuthenticated: false, adminUser: null }),

  // Shipping fees CRUD
  addShippingFee: (fee) => set({ shippingFees: [...get().shippingFees, { id: crypto.randomUUID(), ...fee }] }),
  updateShippingFee: (id, updates) => set({ shippingFees: get().shippingFees.map(f => (f.id === id ? { ...f, ...updates } : f)) }),
  removeShippingFee: (id) => set({ shippingFees: get().shippingFees.filter(f => f.id !== id) }),

  // Categories CRUD
  addCategory: (category) => set({ categories: [...get().categories, { id: crypto.randomUUID(), ...category }] }),
  updateCategory: (id, updates) => set({ categories: get().categories.map(c => (c.id === id ? { ...c, ...updates } : c)) }),
  removeCategory: (id) => set({ categories: get().categories.filter(c => c.id !== id) }),

  // Products CRUD
  addProduct: (product) => set({ products: [...get().products, { id: crypto.randomUUID(), ...product }] }),
  updateProduct: (id, updates) => set({ products: get().products.map(p => (p.id === id ? { ...p, ...updates } : p)) }),
  removeProduct: (id) => set({ products: get().products.filter(p => p.id !== id) }),

  // Accounts CRUD (basic)
  addAccount: (account) => set({ accounts: [...get().accounts, { id: crypto.randomUUID(), ordersCount: 0, totalSpent: 0, promotions: [], ...account }] }),
  updateAccount: (id, updates) => set({ accounts: get().accounts.map(a => (a.id === id ? { ...a, ...updates } : a)) }),
  removeAccount: (id) => set({ accounts: get().accounts.filter(a => a.id !== id) }),

  // Promotions
  addPromotion: (promo) => set({ promotions: [...get().promotions, { id: crypto.randomUUID(), ...promo }] }),
  removePromotion: (id) => set({ promotions: get().promotions.filter(p => p.id !== id) }),
}));

export default useAdminStore;


