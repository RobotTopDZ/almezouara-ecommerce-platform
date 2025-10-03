// Shared categories data for the application
export const categories = [
  { 
    id: 1, 
    name: "Robes", 
    description: "Robes élégantes pour toutes les occasions", 
    productCount: 15, 
    color: "#FF6B6B", 
    icon: "dress" 
  },
  { 
    id: 2, 
    name: "Hijabs", 
    description: "Hijabs modernes et confortables", 
    productCount: 8, 
    color: "#4ECDC4", 
    icon: "hijab" 
  },
  { 
    id: 3, 
    name: "Abayas", 
    description: "Abayas traditionnelles et modernes", 
    productCount: 12, 
    color: "#45B7D1", 
    icon: "abaya" 
  },
  { 
    id: 4, 
    name: "Accessoires", 
    description: "Accessoires pour compléter votre look", 
    productCount: 6, 
    color: "#96CEB4", 
    icon: "accessories" 
  },
  { 
    id: 5, 
    name: "Chaussures", 
    description: "Chaussures confortables et stylées", 
    productCount: 4, 
    color: "#FFEAA7", 
    icon: "shoes" 
  }
];

export const getCategoryById = (id) => {
  return categories.find(cat => cat.id === id);
};

export const getCategoryByName = (name) => {
  return categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};
