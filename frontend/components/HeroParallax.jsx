import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';

const HeroParallax = ({ headline }) => {
  const { scrollY } = useScroll();
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const layer1Y = useTransform(scrollY, [0, 500], [0, -50]);
  const layer2Y = useTransform(scrollY, [0, 500], [0, -100]);
  const layer3Y = useTransform(scrollY, [0, 500], [0, -150]);
  const textY = useTransform(scrollY, [0, 300], [0, -30]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const headlines = {
    variantA: {
      title: "Save the Planet, One Sip at a Time",
      subtitle: "Premium eco-friendly water bottles made from 100% recycled materials"
    },
    variantB: {
      title: "Your Sustainable Hydration Partner",
      subtitle: "Join the revolution against single-use plastics with our eco bottles"
    }
  };

  const currentHeadline = headlines[headline] || headlines.variantA;

  return (
    <section ref={ref} className="relative h-screen overflow-hidden">
      <motion.div
        style={{ y: layer3Y }}
        className="absolute inset-0 z-0"
      >
        <div
          className="w-full h-full bg-gradient-to-b from-blue-100 to-green-50"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1920')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
          alt="Nature background"
        />
      </motion.div>

      <motion.div
        style={{
          y: layer2Y,
          x: mousePosition.x * 0.5,
          rotateY: mousePosition.x * 0.2
        }}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <img
            src="https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600"
            alt="Eco-friendly water bottle"
            className="w-96 h-auto drop-shadow-2xl"
            style={{ transform: 'perspective(1000px) rotateY(15deg)' }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-10 -right-10 w-20 h-20"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-green-500">
              <path
                fill="currentColor"
                d="M50 10 L60 40 L90 40 L65 55 L75 85 L50 65 L25 85 L35 55 L10 40 L40 40 Z"
              />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        style={{
          y: layer1Y,
          x: mousePosition.x,
          opacity
        }}
        className="absolute inset-0 z-20 flex items-center justify-center"
      >
        <div className="text-center px-4 max-w-4xl">
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg"
          >
            {currentHeadline.title}
          </motion.h1>

          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-white mb-8 drop-shadow-md"
          >
            {currentHeadline.subtitle}
          </motion.p>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary bg-green-600 hover:bg-green-700"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Shop Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary bg-white/90"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        style={{ y: textY }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white text-center"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <p className="text-sm mt-2">Scroll to explore</p>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroParallax;