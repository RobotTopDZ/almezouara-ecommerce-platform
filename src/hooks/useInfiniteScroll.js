import { useState, useEffect, useCallback } from "react";

export const useInfiniteScroll = (initialItems = [], itemsPerPage = 6) => {
  const [displayedItems, setDisplayedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize displayed items
  useEffect(() => {
    if (initialItems.length > 0) {
      const firstBatch = initialItems.slice(0, itemsPerPage);
      setDisplayedItems(firstBatch);
      setHasMore(initialItems.length > itemsPerPage);
      setCurrentPage(1);
    }
  }, [initialItems, itemsPerPage]);

  // Load more items
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    // Simulate network delay for smooth UX
    setTimeout(() => {
      const startIndex = currentPage * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newItems = initialItems.slice(startIndex, endIndex);
      
      if (newItems.length > 0) {
        setDisplayedItems(prev => [...prev, ...newItems]);
        setCurrentPage(prev => prev + 1);
        setHasMore(endIndex < initialItems.length);
      } else {
        setHasMore(false);
      }
      
      setIsLoading(false);
    }, 500);
  }, [initialItems, currentPage, itemsPerPage, isLoading, hasMore]);

  // Scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || !hasMore) return;
      
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Load more when user is near bottom (200px threshold)
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore, isLoading, hasMore]);

  return {
    displayedItems,
    hasMore,
    isLoading,
    loadMore
  };
};

