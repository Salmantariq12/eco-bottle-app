import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '../../lib/apiClient';
import CheckoutForm from '../../components/CheckoutForm';

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:4000/api/v1';
    const response = await fetch(`${baseUrl}/products/${id}`);

    if (!response.ok) {
      return {
        notFound: true
      };
    }

    const data = await response.json();

    return {
      props: {
        product: data.product
      }
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      notFound: true
    };
  }
}

export default function ProductDetail({ product }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h1>
          <Link href="/">
            <a className="btn-primary">Back to Products</a>
          </Link>
        </div>
      </div>
    );
  }

  const images = [
    product.imageUrl,
    product.imageUrl,
    product.imageUrl
  ];

  return (
    <>
      <Head>
        <title>{product.name} | Eco-Friendly Water Bottles</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.imageUrl} />
      </Head>

      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/">
            <a className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Products
            </a>
          </Link>
        </div>
      </nav>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="p-8"
              >
                <div className="mb-4">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="aspect-square bg-gray-100 rounded-xl overflow-hidden"
                  >
                    <img
                      src={images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>

                <div className="flex gap-4 justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-primary-600' : 'border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="p-8"
              >
                {product.category === 'limited-edition' && (
                  <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase mb-4">
                    Limited Edition
                  </span>
                )}

                <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-current' : 'fill-gray-300'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-600">{product.rating} ({product.reviewCount} reviews)</span>
                </div>

                <p className="text-gray-600 text-lg mb-8 leading-relaxed">{product.description}</p>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Features</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {product.features?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <span className="text-sm text-gray-500">Capacity</span>
                    <p className="text-lg font-semibold text-gray-800">{product.capacity}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Material</span>
                    <p className="text-lg font-semibold text-gray-800">{product.material}</p>
                  </div>
                </div>

                {product.colors && product.colors.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Colors</h3>
                    <div className="flex gap-2 flex-wrap">
                      {product.colors.map((color, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:border-primary-600 cursor-pointer transition-colors"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="flex items-end gap-4 mb-6">
                    <div>
                      <span className="text-3xl font-bold text-primary-600">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-lg text-gray-400 line-through ml-3">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    {product.originalPrice && (
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                        Save ${(product.originalPrice - product.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        className="px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-gray-600">
                      Total: ${(product.price * quantity).toFixed(2)}
                    </span>
                  </div>

                  {product.stock < 20 && product.stock > 0 && (
                    <p className="text-orange-600 font-medium mb-4">
                      ⚡ Only {product.stock} left in stock!
                    </p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCheckout(true)}
                    className="w-full btn-primary py-4 text-lg"
                  >
                    Buy Now
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {showCheckout && (
        <CheckoutForm
          selectedProduct={{ ...product, quantity }}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            router.push('/');
          }}
        />
      )}
    </>
  );
}