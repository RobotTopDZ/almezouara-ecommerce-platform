import { useState, useEffect } from "react";
import axios from "axios";

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/products/categories/list");
      
      // Accept both DB mode { success: true, categories: [...] } and mock/fallback modes
      const payload = response.data && response.data.categories ? response.data.categories : [];
      const hasCategories = Array.isArray(payload) && payload.length > 0;

      if (hasCategories) {
        const transformedCategories = payload.map(cat => {
          const name = cat.name || cat.slug || String(cat.id || "').toLowerCase();
          return {
            id: (cat.slug || name).toLowerCase(),
            name: String(name).toUpperCase(),
            originalName: String(name)
          };
        });
        setCategories(transformedCategories);
      } else {
        // Fallback categories
        setCategories([
          { id: "robes", name: "ROBES", originalName: "Robes" },
          { id: "hijabs", name: "HIJABS", originalName: "Hijabs" },
          { id: "abayas", name: "ABAYAS", originalName: "Abayas" },
          { id: "accessoires", name: "ACCESSOIRES", originalName: "Accessoires" },
          { id: "chaussures", name: "CHAUSSURES", originalName: "Chaussures" }
        ]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError(error);
      // Fallback categories
      setCategories([
        { id: "robes", name: "ROBES", originalName: "Robes" },
        { id: "hijabs", name: "HIJABS", originalName: "Hijabs" },
        { id: "abayas", name: "ABAYAS", originalName: "Abayas" },
        { id: "accessoires", name: "ACCESSOIRES", originalName: "Accessoires" },
        { id: "chaussures", name: "CHAUSSURES", originalName: "Chaussures" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    
    // Set up polling to refresh categories every 30 seconds for real-time sync
    const interval = setInterval(fetchCategories, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Expose refresh function for manual updates
  const refreshCategories = () => {
    fetchCategories();
  };

  return { categories, loading, error, refreshCategories };
};
