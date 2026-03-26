import React, { useState } from 'react'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop';

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  // If didError or no src provided, show fallback
  if (didError || !src) {
    return (
      <img 
        src={FALLBACK_IMAGE} 
        alt={alt || "Football field fallback"} 
        className={className} 
        style={style} 
        {...rest} 
      />
    )
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      style={style} 
      {...rest} 
      onError={handleError} 
    />
  )
}
