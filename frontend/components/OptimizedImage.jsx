import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { transformImage, getResponsiveSrcSet, getBlurPlaceholder } from '../lib/cloudinary';

/**
 * Optimized Image component with CDN support, lazy loading, and progressive enhancement
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  sizes = '100vw',
  priority = false,
  onLoad,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const optimizedSrc = transformImage(src, { width, height });
  const srcSet = getResponsiveSrcSet(src);
  const blurDataUrl = getBlurPlaceholder(src);

  useEffect(() => {
    if (priority && typeof window !== 'undefined') {
      const img = new Image();
      img.src = optimizedSrc;
    }
  }, [optimizedSrc, priority]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 ${className}`}>
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <>
          <img
            src={blurDataUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"
            />
          </div>
        </>
      )}

      <motion.img
        src={optimizedSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full object-cover"
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;