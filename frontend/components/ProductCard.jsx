import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';

const ProductCard = ({ product, index, onAddToCart }) => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const discountPercentage = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="card overflow-hidden group cursor-pointer"
    >
      <div className="relative h-64 bg-gray-100">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        <motion.img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onLoad={() => setImageLoading(false)}
          style={{ display: imageLoading ? 'none' : 'block' }}
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        />

        {discountPercentage > 0 && (
          <motion.div
            initial={{ rotate: -15, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold"
          >
            -{discountPercentage}%
          </motion.div>
        )}

        {product.category === 'limited-edition' && (
          <motion.div
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase"
          >
            Limited Edition
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium"
            onClick={() => onAddToCart(product)}
          >
            Quick View
          </motion.button>
        </motion.div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'fill-gray-300'}`}
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-600">({product.reviewCount})</span>
        </div>

        <h3 className="text-xl font-semibold mb-2 text-gray-800">{product.name}</h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {product.features?.slice(0, 2).map((feature, idx) => (
            <span
              key={idx}
              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary-600">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                ${product.originalPrice}
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 transition-colors"
            onClick={() => onAddToCart(product)}
            aria-label="Add to cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </motion.button>
        </div>

        {product.stock < 20 && product.stock > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-orange-600 text-sm mt-2 font-medium"
          >
            Only {product.stock} left in stock!
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;