import '../styles/globals.css';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navigation from '../components/Navigation';
import ErrorBoundary from '../components/ErrorBoundary';

function MyApp({ Component, pageProps, router }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('Service worker registration failed:', err);
        });
      });
    }
  }, []);

  useEffect(() => {
    // Global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const showNavigation = !['/login', '/register'].includes(router.pathname);

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait" initial={false}>
        {showNavigation && <Navigation />}
        <Component {...pageProps} key={router.asPath} />
      </AnimatePresence>
    </ErrorBoundary>
  );
}

export default MyApp;