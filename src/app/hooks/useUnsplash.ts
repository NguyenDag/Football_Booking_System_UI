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

    // Otherwise, create a stable Unsplash URL based on the query
    const searchQuery = encodeURIComponent(query);
    setImageUrl(`https://source.unsplash.com/800x600/?${searchQuery}`);
  }, [query]);

  return imageUrl;
}
