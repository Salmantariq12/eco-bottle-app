/**
 * Cloudinary CDN Integration
 * Provides image optimization, transformation, and CDN delivery
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Transform image URL with Cloudinary optimizations
 * @param {string} imageUrl - Original image URL
 * @param {object} options - Transformation options
 * @returns {string} Optimized image URL
 */
export const transformImage = (imageUrl, options = {}) => {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto'
  } = options;

  // If using Cloudinary
  if (CLOUDINARY_CLOUD_NAME && imageUrl.includes('cloudinary')) {
    const transformations = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (crop) transformations.push(`c_${crop}`);
    if (gravity) transformations.push(`g_${gravity}`);
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);

    const transformString = transformations.join(',');
    return imageUrl.replace('/upload/', `/upload/${transformString}/`);
  }

  // If using Unsplash (fallback for demo)
  if (imageUrl.includes('unsplash')) {
    const params = new URLSearchParams();
    if (width) params.set('w', width);
    if (height) params.set('h', height);
    params.set('auto', 'format');
    params.set('q', quality === 'auto' ? '80' : quality);
    params.set('fit', 'crop');

    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}${params.toString()}`;
  }

  return imageUrl;
};

/**
 * Generate responsive image srcSet
 * @param {string} imageUrl - Original image URL
 * @param {array} sizes - Array of widths for srcSet
 * @returns {string} srcSet string
 */
export const getResponsiveSrcSet = (imageUrl, sizes = [400, 800, 1200, 1600]) => {
  return sizes
    .map(size => `${transformImage(imageUrl, { width: size })} ${size}w`)
    .join(', ');
};

/**
 * Generate blur placeholder for progressive image loading
 * @param {string} imageUrl - Original image URL
 * @returns {string} Blurred thumbnail URL
 */
export const getBlurPlaceholder = (imageUrl) => {
  return transformImage(imageUrl, {
    width: 20,
    quality: 10,
    format: 'webp'
  });
};

/**
 * Preload critical images
 * @param {array} imageUrls - Array of image URLs to preload
 */
export const preloadImages = (imageUrls) => {
  if (typeof window === 'undefined') return;

  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = transformImage(url, { width: 400, quality: 'auto' });
    document.head.appendChild(link);
  });
};

/**
 * Get optimized product image with CDN
 * @param {string} imageUrl - Original product image URL
 * @param {string} size - Size preset ('thumb', 'card', 'large', 'hero')
 * @returns {string} Optimized image URL
 */
export const getProductImage = (imageUrl, size = 'card') => {
  const presets = {
    thumb: { width: 150, height: 150, quality: '80' },
    card: { width: 400, height: 400, quality: 'auto' },
    large: { width: 800, height: 800, quality: 'auto' },
    hero: { width: 1200, height: 600, quality: 'auto', crop: 'fill' }
  };

  return transformImage(imageUrl, presets[size] || presets.card);
};

/**
 * Get cache-friendly image headers
 */
export const getImageHeaders = () => ({
  'Cache-Control': 'public, max-age=31536000, immutable',
  'X-Content-Type-Options': 'nosniff'
});

export default {
  transformImage,
  getResponsiveSrcSet,
  getBlurPlaceholder,
  preloadImages,
  getProductImage,
  getImageHeaders
};