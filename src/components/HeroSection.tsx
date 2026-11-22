import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';

const TRIO_HERO_POSTER = '/assets/aistudio/a8633684-7f74-420c-8486-17b7de796697_df2d7af9.jpg';
const HOT_WATER_HERO_POSTER = '/assets/aistudio/IMG_4059_afc8ca3d.JPG';

export const HeroSection: React.FC = () => {
  const { addItem } = useCart();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollToProducts = () => {
    const el = document.getElementById('products-showcase');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const openProductDetail = (productId: string) => {
    const event = new CustomEvent('open-product-detail', { detail: { productId } });
    window.dispatchEvent(event);
  };

  const slides = [
    {
      id: 'the-trio-slide',
      theme: 'light' as const,
      tabLabel: 'The Hairology Trio',
      posterImage: TRIO_HERO_POSTER,
      posterAlt: 'Your Newest Obsession for Hair — The Hairology Trio Hard-Water Haircare Made for India',
      primaryCtaText: 'CLAIM THE TRIO OFFER — ₹1299',
      primaryAction: () => addItem('the-trio', 'trio-full', 1),
      secondaryCtaText: 'EXPLORE 7 PRODUCTS',
      secondaryAction: scrollToProducts,
      onPosterClick: () => openProductDetail('the-trio'),
    },
    {
      id: 'hot-water-slide',
      theme: 'dark' as const,
      tabLabel: 'Hot Water Shampoo',
      posterImage: HOT_WATER_HERO_POSTER,
      posterAlt: "India's First Ever Hot Water Shampoo — Hard-Water Haircare Made for India",
      primaryCtaText: 'GET HOT WATER SHAMPOO — ₹449',
      primaryAction: () => addItem('hot-water-shampoo', 'hot-full', 1),
      secondaryCtaText: 'EXPLORE FORMULATION',
      secondaryAction: () => openProductDetail('hot-water-shampoo'),
      onPosterClick: () => openProductDetail('hot-water-shampoo'),
    },
  ];

  const currentSlide = slides[currentSlideIndex];
  const isDarkPosterSlide = currentSlide.theme === 'dark';

  // Auto-shift every 10 seconds (10,000 ms)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentSlideIndex, isPaused, slides.length]);

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full min-h-[620px] sm:min-h-[720px] lg:min-h-[800px] flex items-center overflow-hidden border-b transition-colors duration-500 ${
        isDarkPosterSlide
          ? 'bg-[#121110] border-[#C5A880]/20'
          : 'bg-[#FCFAF7] border-[#E8DFD1]/80'
      }`}
    >
      {/* 1. Ambient Background Lighting */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        {isDarkPosterSlide ? (
          <>
            <div className="absolute top-[-12%] left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-[#9E3C1B]/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 w-[680px] h-[420px] bg-[#C5A880]/10 rounded-full blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#121110]/70 via-[#161311]/90 to-[#121110]" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#C5A880]/15 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-3xl bg-[#E11D48]/5" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#FCFAF7]/60 to-[#FCFAF7]" />
          </>
        )}
      </div>

      {/* Floating Side Slide Arrows */}
      <button
        type="button"
        onClick={handlePrevSlide}
        className={`hidden md:flex absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 lg:w-12 lg:h-12 rounded-full shadow-xl items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 group backdrop-blur-sm border ${
          isDarkPosterSlide
            ? 'bg-[#1F1C19]/90 hover:bg-[#C5A880] text-[#FDFBF7] hover:text-[#121110] border-[#C5A880]/30'
            : 'bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] border-[#E8DFD1] hover:border-[#C5A880]'
        }`}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        type="button"
        onClick={handleNextSlide}
        className={`hidden md:flex absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 lg:w-12 lg:h-12 rounded-full shadow-xl items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 group backdrop-blur-sm border ${
          isDarkPosterSlide
            ? 'bg-[#1F1C19]/90 hover:bg-[#C5A880] text-[#FDFBF7] hover:text-[#121110] border-[#C5A880]/30'
            : 'bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] border-[#E8DFD1] hover:border-[#C5A880]'
        }`}
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 2. Main Slideshow Content Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <div className="relative w-full max-w-6xl mx-auto">
              <div
                onClick={currentSlide.onPosterClick}
                className={`relative w-full rounded-3xl overflow-hidden border cursor-pointer group ${
                  isDarkPosterSlide
                    ? 'shadow-[0_30px_90px_rgba(0,0,0,0.85)] border-[#C5A880]/30 bg-[#141210]'
                    : 'shadow-[0_25px_70px_-15px_rgba(140,115,82,0.28)] border-[#E8DFD1] bg-[#F7F1E7]'
                }`}
              >
                <img
                  src={currentSlide.posterImage}
                  alt={currentSlide.posterAlt}
                  className="w-full h-auto object-contain mx-auto block group-hover:scale-[1.015] transition-transform duration-700 ease-out"
                />

                {/* Mobile Slide Navigation Arrows */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevSlide();
                  }}
                  className={`md:hidden absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full border shadow-md flex items-center justify-center transition-all cursor-pointer ${
                    isDarkPosterSlide
                      ? 'bg-[#121110]/85 hover:bg-[#C5A880] text-[#FDFBF7] hover:text-[#121110] border-[#C5A880]/30'
                      : 'bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] border-[#E8DFD1]'
                  }`}
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextSlide();
                  }}
                  className={`md:hidden absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full border shadow-md flex items-center justify-center transition-all cursor-pointer ${
                    isDarkPosterSlide
                      ? 'bg-[#121110]/85 hover:bg-[#C5A880] text-[#FDFBF7] hover:text-[#121110] border-[#C5A880]/30'
                      : 'bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] border-[#E8DFD1]'
                  }`}
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action CTAs below big poster */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
              <button
                onClick={currentSlide.primaryAction}
                className={`px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-bold tracking-widest uppercase rounded-2xl shadow-xl transition-all duration-300 flex items-center gap-3 group cursor-pointer hover:scale-[1.02] ${
                  isDarkPosterSlide
                    ? 'bg-[#C5A880] hover:bg-[#D4BA94] text-[#121110]'
                    : 'bg-[#121110] hover:bg-[#2A2724] text-[#C5A880] border border-[#C5A880]/30 hover:border-[#C5A880]'
                }`}
              >
                <span>{currentSlide.primaryCtaText}</span>
                <ArrowRight
                  className={`w-4 h-4 group-hover:translate-x-1.5 transition-transform ${
                    isDarkPosterSlide ? 'text-[#121110]' : 'text-[#C5A880]'
                  }`}
                />
              </button>

              <button
                onClick={currentSlide.secondaryAction}
                className={`px-6 sm:px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-bold tracking-widest uppercase rounded-2xl transition-all duration-300 shadow-sm cursor-pointer hover:scale-[1.02] border ${
                  isDarkPosterSlide
                    ? 'bg-white/10 hover:bg-white/20 text-[#FDFBF7] border-[#C5A880]/40'
                    : 'bg-white/90 hover:bg-[#F3EDE2] text-[#121110] border-[#E8DFD1] hover:shadow-md'
                }`}
              >
                {currentSlide.secondaryCtaText}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 3. Slideshow Navigation Controls & 10s Timer Progress Bar */}
        <div
          className={`mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t ${
            isDarkPosterSlide ? 'border-[#C5A880]/20' : 'border-[#E8DFD1]/60'
          }`}
        >
          {/* Slide Indicator Tabs */}
          <div className="flex items-center gap-3">
            {slides.map((s, idx) => {
              const isActive = currentSlideIndex === idx;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`group relative py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? isDarkPosterSlide
                        ? 'bg-[#C5A880] text-[#121110] shadow-md border border-[#C5A880]'
                        : 'bg-[#121110] text-[#C5A880] shadow-md border border-[#C5A880]/30'
                      : isDarkPosterSlide
                      ? 'bg-white/10 hover:bg-white/15 text-[#E8DFD1] border border-[#C5A880]/25'
                      : 'bg-white/80 hover:bg-white text-[#71717A] border border-[#E8DFD1]'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-70">0{idx + 1}</span>
                  <span className="uppercase tracking-wider">{s.tabLabel}</span>

                  {/* Active 10-Second Countdown Animation Bar inside Active Pill */}
                  {isActive && !isPaused && (
                    <motion.div
                      key={`progress-${idx}-${currentSlideIndex}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 10, ease: 'linear' }}
                      style={{ originX: 0 }}
                      className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${
                        isDarkPosterSlide ? 'bg-[#121110]' : 'bg-[#C5A880]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Timing Info & Manual Arrows */}
          <div
            className={`flex items-center gap-4 text-xs ${
              isDarkPosterSlide ? 'text-[#C5A880]/80' : 'text-[#8A7463]'
            }`}
          >
            <span className="text-[11px] font-medium hidden md:inline">
              {isPaused ? '⏸ Slideshow paused' : '⏱ Auto-shifts every 10s'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevSlide}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-2xs hover:shadow-sm cursor-pointer border ${
                  isDarkPosterSlide
                    ? 'bg-white/10 border-[#C5A880]/30 hover:border-[#C5A880] text-[#FDFBF7] hover:text-[#C5A880]'
                    : 'bg-white border-[#E8DFD1] hover:border-[#C5A880] text-[#121110] hover:text-[#C5A880]'
                }`}
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextSlide}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-2xs hover:shadow-sm cursor-pointer border ${
                  isDarkPosterSlide
                    ? 'bg-white/10 border-[#C5A880]/30 hover:border-[#C5A880] text-[#FDFBF7] hover:text-[#C5A880]'
                    : 'bg-white border-[#E8DFD1] hover:border-[#C5A880] text-[#121110] hover:text-[#C5A880]'
                }`}
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Scroll Down Arrow Indicator to Products */}
        <div className="flex justify-center pt-7">
          <button
            type="button"
            onClick={scrollToProducts}
            className={`flex flex-col items-center gap-1.5 transition-colors cursor-pointer group ${
              isDarkPosterSlide
                ? 'text-[#C5A880]/80 hover:text-[#FDFBF7]'
                : 'text-[#8A7463] hover:text-[#121110]'
            }`}
            aria-label="Scroll down to products"
          >
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase transition-colors">
              SCROLL TO PRODUCTS
            </span>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-2xs group-hover:scale-110 border ${
                isDarkPosterSlide
                  ? 'border-[#C5A880]/40 bg-white/10 group-hover:bg-[#C5A880] text-[#C5A880] group-hover:text-[#121110]'
                  : 'border-[#E8DFD1] group-hover:border-[#C5A880] bg-white/80 group-hover:bg-[#121110] text-[#121110] group-hover:text-[#C5A880]'
              }`}
            >
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
