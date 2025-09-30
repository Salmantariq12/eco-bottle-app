import '../styles/globals.css';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Navigation from '../components/Navigation';

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

  const showNavigation = !['/login', '/register'].includes(router.pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showNavigation && <Navigation />}
      <Component {...pageProps} key={router.asPath} />
    </AnimatePresence>
  );
}

export default MyApp;