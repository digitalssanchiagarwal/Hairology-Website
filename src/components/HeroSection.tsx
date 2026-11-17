import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight, ChevronDown, ShieldCheck, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { PRODUCT_IMAGE_DUO, PRODUCT_IMAGE_HOT_WATER_STANDALONE } from '../data/products';

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
      id: 'the-duo-slide',
      kicker: 'HARD-WATER HAIRCARE • MADE FOR INDIA',
      headline: (
        <>
          YOUR{' '}
          <span className="font-['Cormorant_Garamond',Georgia,serif] italic text-[#E11D48]">
            newest
          </span>
          <br />
          OBSESSION
          <br />
          <span className="font-['Cormorant_Garamond',Georgia,serif] not-italic font-medium text-[#121110]">
            for hair
          </span>
        </>
      ),
      description:
        'Discover a new generation of haircare with innovative shampoo experiences. Formulated specifically to neutralize hard-water heavy metals and reconstruct keratin cuticles against Indian humidity.',
      primaryCtaText: 'CLAIM THE DUO OFFER — ₹849',
      primaryAction: () => addItem('the-duo', 'duo-full', 1),
      secondaryCtaText: 'EXPLORE 3 PRODUCTS',
      secondaryAction: scrollToProducts,
      highlights: [
        { text: 'Steam-Activated Chelation', dotColor: 'bg-[#C5A880]' },
        { text: '72h Anti-Frizz Pea Peptides', dotColor: 'bg-[#C5A880]' },
        { text: 'Complete 2-Step Indian Regimen', dotColor: 'bg-[#15803D]' },
      ],
      image: PRODUCT_IMAGE_DUO,
      imageAlt: 'The Hairology Duo - Hot Water Shampoo and Protein Shampoo',
      badgeText: 'THE COMPLETE SYSTEM • 2 x 250 ML',
      badgeIcon: <Sparkles className="w-3.5 h-3.5 fill-[#C5A880] text-[#C5A880]" />,
      floatingCardTitle: 'The Hairology Duo',
      floatingCardSubtitle: 'Day 1 Clarify ✦ Day 4 Reconstruct',
      floatingCardPrice: '₹849',
      floatingCardDiscount: '15% OFF • TAP TO VIEW',
      onCardClick: () => openProductDetail('the-duo'),
      accentColor: '#E11D48',
    },
    {
      id: 'hot-water-slide',
      kicker: 'HARD-WATER HAIRCARE • MADE FOR INDIA',
      headline: (
        <>
          INDIA'S{' '}
          <span className="font-['Cormorant_Garamond',Georgia,serif] italic text-[#9E3C1B]">
            first ever
          </span>
          <br />
          HOT WATER
          <br />
          <span className="font-['Cormorant_Garamond',Georgia,serif] not-italic font-medium text-[#121110]">
            shampoo
          </span>
        </>
      ),
      description:
        'Engineered for the Indian thermal wash experience. Warm steam activates chelating agents that bind & dissolve calcified mineral hardness, heavy metals, and sebum crust without stripping natural lipids. Finished with extremolyte Ectoin.',
      primaryCtaText: 'GET HOT WATER SHAMPOO — ₹449',
      primaryAction: () => addItem('hot-water-shampoo', 'hot-full', 1),
      secondaryCtaText: 'EXPLORE FORMULATION',
      secondaryAction: () => openProductDetail('hot-water-shampoo'),
      highlights: [
        { text: 'Steam-Activated Thermal Chelation', dotColor: 'bg-[#9E3C1B]' },
        { text: 'Finished with Ectoin Heat Shield', dotColor: 'bg-[#C5A880]' },
        { text: '100% Colour Safe & Sulphate-Free', dotColor: 'bg-[#15803D]' },
      ],
      image: PRODUCT_IMAGE_HOT_WATER_STANDALONE,
      imageAlt: 'Hairology Hot Water Shampoo 250ml with Thermal Steam Chelation',
      badgeText: "INDIA'S 1ST HOT WATER FORMULATION • 250 ML",
      badgeIcon: <Flame className="w-3.5 h-3.5 fill-[#C5A880] text-[#C5A880]" />,
      floatingCardTitle: 'Hot Water Shampoo',
      floatingCardSubtitle: 'Heat Shield + Hair Protection (250 ml)',
      floatingCardPrice: '₹449',
      floatingCardDiscount: '10% OFF • TAP TO VIEW',
      onCardClick: () => openProductDetail('hot-water-shampoo'),
      accentColor: '#9E3C1B',
    },
  ];

  const currentSlide = slides[currentSlideIndex];

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
      className="relative w-full min-h-[620px] sm:min-h-[720px] lg:min-h-[800px] flex items-center overflow-hidden border-b border-[#E8DFD1]/80 bg-[#FCFAF7]"
    >
      {/* 1. Ambient Background Lighting */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#C5A880]/15 rounded-full blur-3xl" />
        <div 
          className={`absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-3xl transition-colors duration-1000 ${
            currentSlideIndex === 0 ? 'bg-[#E11D48]/5' : 'bg-[#9E3C1B]/8'
          }`} 
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#FCFAF7]/60 to-[#FCFAF7]" />
      </div>

      {/* Floating Side Slide Arrows */}
      <button
        type="button"
        onClick={handlePrevSlide}
        className="hidden md:flex absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] border border-[#E8DFD1] hover:border-[#C5A880] shadow-xl items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 group backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        type="button"
        onClick={handleNextSlide}
        className="hidden md:flex absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] border border-[#E8DFD1] hover:border-[#C5A880] shadow-xl items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 group backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 2. Main Slideshow Content Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
          >
            {/* Left Column: Editorial Typography */}
            <div className="lg:col-span-7 text-left space-y-6 sm:space-y-8">
              
              {/* Top Kicker */}
              <div className="inline-block">
                <div className="text-xs sm:text-sm font-semibold tracking-[0.28em] text-[#71717A] uppercase bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-[#E8DFD1]/80 shadow-2xs">
                  {currentSlide.kicker}
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="font-['Cormorant_Garamond',Georgia,serif] text-[2.75rem] sm:text-[3.5rem] lg:text-[4.25rem] xl:text-[5.25rem] font-semibold text-[#121110] leading-[0.98] tracking-[-0.02em]">
                {currentSlide.headline}
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-[#3D3A37] font-normal leading-relaxed max-w-xl">
                {currentSlide.description}
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={currentSlide.primaryAction}
                  className="px-8 py-4 bg-[#121110] hover:bg-[#2A2724] text-[#C5A880] text-xs sm:text-sm font-bold tracking-widest uppercase rounded-2xl shadow-xl transition-all duration-300 flex items-center gap-3 group cursor-pointer border border-[#C5A880]/30 hover:border-[#C5A880] hover:scale-[1.02]"
                >
                  <span>{currentSlide.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4 text-[#C5A880] group-hover:translate-x-1.5 transition-transform" />
                </button>

                <button
                  onClick={currentSlide.secondaryAction}
                  className="px-7 py-4 bg-white/90 hover:bg-[#F3EDE2] text-[#121110] border border-[#E8DFD1] text-xs sm:text-sm font-bold tracking-widest uppercase rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.02]"
                >
                  {currentSlide.secondaryCtaText}
                </button>
              </div>

              {/* Quick Value Highlights */}
              <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-[#6B7280]">
                {currentSlide.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${h.dotColor}`} />
                    <span>{h.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Prominent Bottle Image Card */}
            <div className="lg:col-span-5 relative">
              <div 
                onClick={currentSlide.onCardClick}
                className="relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-[#E8DFD1] bg-[#F7F4EE] group cursor-pointer hover:shadow-[0_25px_60px_-15px_rgba(197,168,128,0.35)] transition-all duration-500 hover:-translate-y-1.5"
              >
                <img
                  src={currentSlide.image}
                  alt={currentSlide.imageAlt}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Gradient Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                {/* Top Luxury Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-[#121110]/90 backdrop-blur-md text-[#C5A880] text-xs font-bold tracking-wider uppercase px-3.5 py-1.5 rounded-full border border-[#C5A880]/30 shadow-lg">
                  {currentSlide.badgeIcon}
                  <span>{currentSlide.badgeText}</span>
                </div>

                {/* Floating Bottom Card */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#E8DFD1]/80 shadow-xl flex items-center justify-between transition-all group-hover:bg-[#121110] group-hover:text-white group-hover:border-[#C5A880]/40">
                  <div>
                    <div className="font-serif font-bold text-base text-[#121110] group-hover:text-[#C5A880] transition-colors">
                      {currentSlide.floatingCardTitle}
                    </div>
                    <div className="text-xs text-[#8A7463] group-hover:text-white/80 transition-colors">
                      {currentSlide.floatingCardSubtitle}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-serif font-bold text-lg text-[#121110] group-hover:text-[#C5A880] transition-colors">
                      {currentSlide.floatingCardPrice}
                    </div>
                    <div className="text-[10px] text-[#15803D] group-hover:text-[#CBF341] font-bold">
                      {currentSlide.floatingCardDiscount}
                    </div>
                  </div>
                </div>

                {/* Mobile Slide Navigation Arrows on Card */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevSlide();
                  }}
                  className="md:hidden absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] shadow-md flex items-center justify-center transition-all cursor-pointer"
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
                  className="md:hidden absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] shadow-md flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

        {/* 3. Slideshow Navigation Controls & 10s Timer Progress Bar */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E8DFD1]/60">
          
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
                      ? 'bg-[#121110] text-[#C5A880] shadow-md border border-[#C5A880]/30'
                      : 'bg-white/80 hover:bg-white text-[#71717A] border border-[#E8DFD1]'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-70">0{idx + 1}</span>
                  <span className="uppercase tracking-wider">
                    {idx === 0 ? 'The Hairology Duo' : 'Hot Water Shampoo'}
                  </span>
                  
                  {/* Active 10-Second Countdown Animation Bar inside Active Pill */}
                  {isActive && !isPaused && (
                    <motion.div
                      key={`progress-${idx}-${currentSlideIndex}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 10, ease: 'linear' }}
                      style={{ originX: 0 }}
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#C5A880] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Timing Info & Manual Arrows */}
          <div className="flex items-center gap-4 text-xs text-[#8A7463]">
            <span className="text-[11px] font-medium hidden md:inline">
              {isPaused ? '⏸ Slideshow paused' : '⏱ Auto-shifts every 10s'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevSlide}
                className="w-9 h-9 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#C5A880] text-[#121110] hover:text-[#C5A880] flex items-center justify-center transition-all shadow-2xs hover:shadow-sm cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextSlide}
                className="w-9 h-9 rounded-xl bg-white border border-[#E8DFD1] hover:border-[#C5A880] text-[#121110] hover:text-[#C5A880] flex items-center justify-center transition-all shadow-2xs hover:shadow-sm cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* 4. Scroll Down Arrow Indicator to Products */}
        <div className="flex justify-center pt-8">
          <button
            type="button"
            onClick={scrollToProducts}
            className="flex flex-col items-center gap-1.5 text-[#8A7463] hover:text-[#121110] transition-colors cursor-pointer group"
            aria-label="Scroll down to products"
          >
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8A7463] group-hover:text-[#121110] transition-colors">
              SCROLL TO PRODUCTS
            </span>
            <div className="w-8 h-8 rounded-full border border-[#E8DFD1] group-hover:border-[#C5A880] bg-white/80 group-hover:bg-[#121110] text-[#121110] group-hover:text-[#C5A880] flex items-center justify-center transition-all shadow-2xs group-hover:scale-110">
              <ChevronDown className="w-4 h-4 animate-bounce text-[#C5A880]" />
            </div>
          </button>
        </div>

      </div>
    </section>
  );
};
