import { useState, useEffect } from 'react';

// Simple hook to handle Unsplash images
export function useUnsplash(query: string): string {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    // Create a stable URL based on the query
    const searchQuery = encodeURIComponent(query);
    setImageUrl(`https://source.unsplash.com/800x600/?${searchQuery}`);
  }, [query]);

  return imageUrl;
}
