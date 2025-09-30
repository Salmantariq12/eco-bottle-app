const logger = require('../logger');

class ImageService {
  constructor() {
    this.cloudinaryUrl = process.env.CLOUDINARY_URL || '';
    this.defaultImages = {
      product: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
      hero: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200'
    };
  }

  transformImage(imageUrl, options = {}) {
    const { width, height, quality = 'auto', format = 'auto' } = options;

    if (this.cloudinaryUrl && imageUrl.includes('cloudinary')) {
      const transformations = [];
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      transformations.push(`q_${quality}`, `f_${format}`);

      const transformString = transformations.join(',');
      return imageUrl.replace('/upload/', `/upload/${transformString}/`);
    }

    if (imageUrl.includes('unsplash')) {
      const params = new URLSearchParams();
      if (width) params.set('w', width);
      if (height) params.set('h', height);
      params.set('auto', 'format');
      params.set('q', quality === 'auto' ? '80' : quality);

      const separator = imageUrl.includes('?') ? '&' : '?';
      return `${imageUrl}${separator}${params.toString()}`;
    }

    return imageUrl;
  }

  getPlaceholder(imageUrl) {
    return this.transformImage(imageUrl, {
      width: 20,
      height: 20,
      quality: 10,
      format: 'webp'
    });
  }

  getResponsiveImageSet(imageUrl, sizes = [400, 800, 1200]) {
    return sizes.map(size => ({
      src: this.transformImage(imageUrl, { width: size }),
      width: size
    }));
  }

  getCacheHeaders(maxAge = 86400) {
    return {
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge * 2}, stale-while-revalidate=${maxAge}`,
      'Vary': 'Accept-Encoding',
      'X-Content-Type-Options': 'nosniff'
    };
  }

  serveImage(req, res, imageUrl) {
    try {
      const { w, h, q } = req.query;
      const transformedUrl = this.transformImage(imageUrl, {
        width: w,
        height: h,
        quality: q
      });

      const cacheHeaders = this.getCacheHeaders();
      Object.entries(cacheHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.redirect(transformedUrl);
    } catch (error) {
      logger.error('Error serving image', { error: error.message, imageUrl });
      res.redirect(this.defaultImages.product);
    }
  }

  validateImageUrl(url) {
    try {
      const parsed = new URL(url);
      const allowedHosts = [
        'images.unsplash.com',
        'res.cloudinary.com',
        'cdn.pixabay.com',
        'images.pexels.com'
      ];

      return allowedHosts.some(host => parsed.hostname.includes(host));
    } catch (error) {
      return false;
    }
  }
}

module.exports = new ImageService();