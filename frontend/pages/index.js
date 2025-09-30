import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/apiClient';
import HeroParallax from '../components/HeroParallax';
import ProductCard from '../components/ProductCard';
import CheckoutForm from '../components/CheckoutForm';

export async function getServerSideProps(context) {
  const { headline = 'variantA' } = context.query;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:4000/api/v1';
    const response = await fetch(`${baseUrl}/products?limit=20&page=1`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();

    return {
      props: {
        initialProducts: data.products || [],
        pagination: data.pagination || null,
        headline: headline === 'variantB' ? 'variantB' : 'variantA'
      }
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      props: {
        initialProducts: [],
        pagination: null,
        headline: headline === 'variantB' ? 'variantB' : 'variantA',
        error: 'Failed to load products'
      }
    };
  }
}

export default function Home({ initialProducts, pagination, headline, error }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const experimentCookie = Cookies.get('ab_experiment');
    if (!experimentCookie) {
      Cookies.set('ab_experiment', headline, { expires: 30 });
    }
  }, [headline]);

  useEffect(() => {
    if (initialProducts.length === 0 && !error) {
      loadProducts();
    }
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.products.getAll({ limit: 20, page: 1 });
      setProducts(response.data.products);
    } catch (err) {
      console.error('Error loading products:', err);
      setNotification({
        type: 'error',
        message: 'Failed to load products. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (orderData) => {
    setNotification({
      type: 'success',
      message: `Order placed successfully! Order ID: ${orderData.orderId}`
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const seedProducts = async () => {
    try {
      await api.products.seed();
      await loadProducts();
      setNotification({
        type: 'success',
        message: 'Sample products added successfully!'
      });
    } catch (err) {
      if (err.response?.status === 401) {
        setNotification({
          type: 'error',
          message: 'Admin access required to seed products'
        });
      }
    }
  };

  return (
    <>
      <Head>
        <title>Eco-Friendly Water Bottles | Save the Planet One Sip at a Time</title>
        <meta name="description" content="Premium eco-friendly water bottles made from 100% recycled materials. Join the sustainable hydration revolution." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Eco-Friendly Water Bottles" />
        <meta property="og:description" content="Premium sustainable water bottles for conscious consumers" />
        <meta property="og:type" content="website" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 pt-20">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } text-white`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <p>{notification.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <HeroParallax headline={headline} />

        <section id="products" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Our Eco Collection
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover our range of sustainable water bottles designed for every lifestyle
              </p>
            </motion.div>

            {error && products.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadProducts}
                  className="btn-primary"
                >
                  Retry Loading Products
                </button>
              </motion.div>
            )}

            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}

            {products.length === 0 && !loading && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-yellow-50 rounded-lg"
              >
                <p className="text-gray-600 mb-4">No products available. Seed sample products?</p>
                <button
                  onClick={seedProducts}
                  className="btn-primary bg-yellow-600 hover:bg-yellow-700"
                >
                  Add Sample Products (Admin Only)
                </button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-12 gap-2"
              >
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.page === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        <section className="py-20 bg-gradient-to-r from-green-400 to-blue-500">
          <div className="max-w-7xl mx-auto px-4 text-center text-white">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-8"
            >
              Join the Sustainable Revolution
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
                <div className="text-5xl mb-4">♻️</div>
                <h3 className="text-2xl font-semibold mb-2">100% Recycled</h3>
                <p className="text-white/90">Made entirely from recycled materials</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
                <div className="text-5xl mb-4">🌍</div>
                <h3 className="text-2xl font-semibold mb-2">Carbon Neutral</h3>
                <p className="text-white/90">Zero carbon footprint production</p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
                <div className="text-5xl mb-4">💧</div>
                <h3 className="text-2xl font-semibold mb-2">Save Water</h3>
                <p className="text-white/90">1% of sales go to water conservation</p>
              </div>
            </motion.div>
          </div>
        </section>

        <AnimatePresence>
          {showCheckout && (
            <CheckoutForm
              selectedProduct={selectedProduct}
              onClose={() => setShowCheckout(false)}
              onSuccess={handleCheckoutSuccess}
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-2">© 2024 Eco-Friendly Water Bottles. All rights reserved.</p>
          <p className="text-sm text-gray-400">
            A/B Testing: Currently viewing {headline === 'variantB' ? 'Variant B' : 'Variant A'} |
            <button
              onClick={() => router.push(`/?headline=${headline === 'variantB' ? 'variantA' : 'variantB'}`)}
              className="ml-2 underline hover:text-white"
            >
              Switch Variant
            </button>
          </p>
        </div>
      </footer>
    </>
  );
}