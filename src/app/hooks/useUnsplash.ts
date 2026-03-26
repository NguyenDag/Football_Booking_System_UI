import { useState, useEffect } from 'react';

// Simple hook to handle Unsplash images
export function useUnsplash(query: string): string {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!query) {
      setImageUrl('');
      return;
    }

    // Check if query is already a full URL (e.g., Cloudinary link)
    if (query.startsWith('http://') || query.startsWith('https://')) {
      setImageUrl(query);
      return;
    }

    // Otherwise, create a stable Unsplash URL based on the query or return a static fallback
    if (query.length < 5) {
      setImageUrl('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop');
      return;
    }
    
    // Use a more stable keyword-based Unsplash URL if no direct URL
    const searchQuery = encodeURIComponent(query);
    setImageUrl(`https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop&sig=${searchQuery}`);
  }, [query]);

  return imageUrl;
}
