import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight,
  Plus, 
  Minus, 
  ArrowLeft,
  Sparkles,
  Zap,
  Eye,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { 
  PRODUCTS, 
  PRODUCT_IMAGE_HOT_WATER, 
  PRODUCT_IMAGE_HOT_WATER_BACK,
  PRODUCT_IMAGE_PROTEIN, 
  PRODUCT_IMAGE_PROTEIN_BACK,
  PRODUCT_IMAGE_DUO 
} from '../data/products';

export const ProductDetailModule: React.FC = () => {
  const { addItem, updateQuantity, items, openCart } = useCart();

  // Strictly the 3 Core Launch Products
  const coreThreeProducts = PRODUCTS.filter(p => 
    p.id === 'the-duo' || p.id === 'hot-water-shampoo' || p.id === 'protein-shampoo'
  );

  // Active product in view: null shows the 3-cards showcase; string ID shows the full-screen detailed view
  const [activeDetailProductId, setActiveDetailProductId] = useState<string | null>(null);

  // Current active slide index for gallery
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Selected variant for each product
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'the-duo': 'duo-full',
    'hot-water-shampoo': 'hot-full',
    'protein-shampoo': 'protein-full'
  });

  // Quantity stepper inside the opened detail view
  const [detailQuantity, setDetailQuantity] = useState(1);

  // FAQ accordion state inside the opened detail view (first FAQ open by default)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const openProductDetails = (prodId: string) => {
    setActiveDetailProductId(prodId);
    setActiveSlideIndex(0);
    setDetailQuantity(1);
    const el = document.getElementById('products-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const closeProductDetails = () => {
    setActiveDetailProductId(null);
    const el = document.getElementById('products-showcase');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Event listener from header links ('HOT WATER', 'PROTEIN', 'COLLECTION')
  useEffect(() => {
    const handleOpenDetail = (e: Event) => {
      const customEvent = e as CustomEvent<{ productId: string }>;
      if (customEvent.detail?.productId) {
        openProductDetails(customEvent.detail.productId);
      }
    };
    window.addEventListener('open-product-detail', handleOpenDetail);
    return () => window.removeEventListener('open-product-detail', handleOpenDetail);
  }, []);

  const detailProduct = coreThreeProducts.find(p => p.id === activeDetailProductId);
  const detailVariantId = detailProduct ? (selectedVariants[detailProduct.id] || detailProduct.variants[0].id) : '';
  const detailVariant = detailProduct?.variants.find(v => v.id === detailVariantId) || detailProduct?.variants[0];
  const detailDiscount = detailVariant ? Math.round(((detailVariant.mrp - detailVariant.price) / detailVariant.mrp) * 100) : 0;

  // Multi-slide gallery featuring the authentic user-uploaded photographs
  const productGalleries: Record<string, Array<{
    type: 'image';
    src: string;
    label: string;
    caption: string;
  }>> = {
    'hot-water-shampoo': [
      {
        type: 'image',
        src: PRODUCT_IMAGE_HOT_WATER,
        label: 'Front Studio Shot',
        caption: 'Hot Water Shampoo on stone podium • Thermal steam chelation'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_HOT_WATER_BACK,
        label: 'Back Bottle & Directions',
        caption: 'Directions of use, caution & ingredients • 250 ml bottle'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_DUO,
        label: 'The Hairology Duo Set',
        caption: 'Pairs with Protein Shampoo for weekly cyclical protocol'
      }
    ],
    'protein-shampoo': [
      {
        type: 'image',
        src: PRODUCT_IMAGE_PROTEIN,
        label: 'Front Studio Shot',
        caption: 'Protein Shampoo • Cortical bond repair & silk fibroin'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_PROTEIN_BACK,
        label: 'Back Bottle & Directions',
        caption: 'Directions of use, Just The Good Stuff & ingredients • 250 ml'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_DUO,
        label: 'The Hairology Duo Set',
        caption: 'Complete wash system with Hot Water Shampoo'
      }
    ],
    'the-duo': [
      {
        type: 'image',
        src: PRODUCT_IMAGE_DUO,
        label: 'The Duo Set',
        caption: 'Both bottles side-by-side • 2 x 250 ml system'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_HOT_WATER_BACK,
        label: 'Hot Water Shampoo Back',
        caption: 'Step 1: Hot Water Shampoo back bottle & directions'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_PROTEIN_BACK,
        label: 'Protein Shampoo Back',
        caption: 'Step 2: Protein Shampoo back bottle & directions'
      }
    ]
  };

  const currentGallery = detailProduct ? (productGalleries[detailProduct.id] || productGalleries['the-duo']) : [];

  const nextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % currentGallery.length);
  };

  const prevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + currentGallery.length) % currentGallery.length);
  };

  // Custom metadata for each product
  const productMeta: Record<string, {
    categoryPills: string;
    subtitleItalic: string;
    dropBadge: string;
    ingredients: string[];
    description: string;
    faqs: Array<{ q: string; a: string }>;
  }> = {
    'hot-water-shampoo': {
      categoryPills: 'PARABEN FREE • SULPHATE FREE • GLUTEN FREE • ENRICHED WITH ECTOIN',
      subtitleItalic: 'Paraben free, sulphate free, gluten free, enriched with ectoin',
      dropBadge: 'HOT DROP',
      ingredients: [
        'Enriched with Ectoin (Thermal Shield)',
        'Paraben Free & Sulphate Free Cleanse',
        'Gluten Free & Colour Safe',
        'Niacinamide Barrier Complex',
        'Salicylic Acid (BHA)'
      ],
      description: 'Paraben free, sulphate free, gluten free, and enriched with Ectoin. A steam-activated chelating shampoo engineered for Indian tap water that protects cuticle moisture while dissolving mineral buildup and sebum.',
      faqs: [
        {
          q: 'Q1. What makes HAIROLOGY Hot Water Shampoo different from regular shampoos?',
          a: 'Warm and hot water can open up the hair cuticle and strip natural lipids, leading to dryness and frizz. Our formula combines Ectoin (a thermal hydration shield), Niacinamide, and Salicylic Acid with mild, sulphate-free cleansers to cleanse the scalp while locking moisture into the hair fibre.'
        },
        {
          q: 'Q2. How do I use this shampoo for the best results?',
          a: 'Thoroughly wet your hair with water, pour a generous amount onto your palm, and apply from roots to ends. Massage gently into your scalp using your fingertips to build a lather, then rinse thoroughly with water and pat dry.'
        },
        {
          q: 'Q3. Is it safe for daily use and colour-treated hair?',
          a: 'Yes. Because it uses gentle cleansers like Sodium Lauroyl Sarcosinate and Coco-Betaine instead of harsh sulphates, it cleanses effectively without stripping colour or over-drying your scalp.'
        },
        {
          q: 'Q4. Can this help with oily scalp buildup or flakes?',
          a: 'Yes. The inclusion of Salicylic Acid helps dissolve excess sebum and scalp buildup, while Niacinamide supports a balanced, healthy scalp barrier.'
        },
        {
          q: 'Q5. Are there any precautions I should keep in mind?',
          a: 'This product is for external use only and is not intended for children under three years of age. Avoid applying on broken or inflamed skin, and discontinue use if any irritation occurs. Store in a cool, dry place away from direct sunlight.'
        }
      ]
    },
    'protein-shampoo': {
      categoryPills: 'DAMAGED BONDS, FRIZZY HAIR, HUMIDITY SHIELD, SPLIT ENDS',
      subtitleItalic: 'Cortical bond repair with bio-identical peptides',
      dropBadge: 'RECONSTRUCT',
      ingredients: [
        'Hydrolyzed Pea Peptides',
        'Silk Fibroin',
        'Plant Keratin Matrix',
        'Biotin Infusion',
        'Cold-Pressed Argan & Camellia'
      ],
      description: 'A bio-identical restructuring formula with hydrolyzed pea peptides, silk fibroin, and plant keratin. Fills micro-fractures in the hair cortex caused by chemical styling and mineral deposits, creating an invisible 72-hour moisture and anti-frizz shield.',
      faqs: [
        {
          q: 'Q1. What makes HAIROLOGY Protein Shampoo different from regular shampoos?',
          a: 'Engineered with bio-identical hydrolyzed pea peptides and silk fibroin to reconstruct damaged disulfide bonds within the cortex, locking in moisture and defending against 80%+ Indian monsoon and coastal humidity.'
        },
        {
          q: 'Q2. How do I use Protein Shampoo for the best results?',
          a: 'Apply to damp hair from roots to ends. Gently massage into the scalp and mid-lengths, leave on for 2 minutes to allow reconstructive peptides to penetrate micro-fractures, then rinse thoroughly with cool water.'
        },
        {
          q: 'Q3. Will this cause protein overload or stiffness?',
          a: 'No. The micro-peptide molecular weight is calibrated specifically to penetrate the inner cortex rather than depositing stiff coating layers on the cuticle, preserving bouncy elasticity and natural movement.'
        },
        {
          q: 'Q4. Is it safe for colour-treated or keratin-treated hair?',
          a: 'Yes. It is 100% sulphate-free, paraben-free, and silicone-free, specifically balanced to prolong salon color life and keratin treatment longevity.'
        },
        {
          q: 'Q5. How often should I use it?',
          a: 'We recommend using Protein Shampoo on Day 4 of your wash routine, alternating with Hot Water Shampoo on Day 1 for optimal moisture-protein equilibrium.'
        }
      ]
    },
    'the-duo': {
      categoryPills: 'THE COMPLETE INDIAN WASH-DAY PROTOCOL, HARD WATER + NOURISH',
      subtitleItalic: 'The weekly cyclical regimen: Clarify & Reconstruct',
      dropBadge: 'DUO SET',
      ingredients: [
        'Steam-Activated Chelating Matrix',
        'Bio-Identical Pea Peptides',
        '72-Hour Anti-Frizz Humidity Shield',
        'Scalp Follicular Stimulation',
        'Ectoin Thermal Protection'
      ],
      description: 'The weekly cyclical regimen: Clarify on Day 1, Reconstruct on Day 4. Engineered specifically for Indian tap water to permanently resolve frizz, mineral brittleness, and scalp congestion.',
      faqs: [
        {
          q: 'Q1. What is the Hairology Cyclical Wash Protocol?',
          a: 'Indian hard water deposits calcium and magnesium that block hair absorption. Day 1: Hot Water Shampoo chelates and dissolves minerals. Day 4: Protein Shampoo reconstructs inner keratin chains and seals cuticles.'
        },
        {
          q: 'Q2. How do I alternate the two shampoos?',
          a: 'Use Hot Water Shampoo for your primary detox wash on Day 1, then follow with Protein Shampoo on Day 4 for reconstructive bond nourishment, creating an optimal weekly balance.'
        },
        {
          q: 'Q3. Are both formulas sulphate-free and paraben-free?',
          a: 'Yes. Both shampoos use gentle, non-stripping cleansers like Sodium Lauroyl Sarcosinate, Coco-Betaine, and botanical glucosides that clean deeply without stripping natural moisture.'
        },
        {
          q: 'Q4. Is this suitable for all Indian hair textures and hard water cities?',
          a: 'Yes. Calibrated for municipal & tanker water across Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, and Kolkata (testing up to 750+ PPM mineral hardness).'
        },
        {
          q: 'Q5. How long does the Duo system last?',
          a: 'Each 250 ml bottle provides approximately 35–45 washes, offering over 3 months of complete cyclical scalp and hair therapy.'
        }
      ]
    }
  };

  return (
    <section id="products-showcase" className="py-16 sm:py-24 bg-[#FCFAF7] border-b border-[#E8DFD1]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= VIEW 1: BIG LUXURY PRODUCT BOXES (BORDERLESS / MINIMAL BORDER) ================= */}
        {!activeDetailProductId ? (
          <div>
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
              <div className="inline-flex items-center gap-2 mb-3 text-xs font-semibold tracking-[0.25em] text-[#C5A880] uppercase bg-[#121110] px-4 py-1.5 rounded-full shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>PHASE 1 LAUNCH PORTFOLIO • THREE SCIENTIFIC FORMULATIONS</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#121110] tracking-tight">
                DISCOVER <span className="italic font-normal text-[#C5A880]">OUR PRODUCTS</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#4A4540] max-w-xl mx-auto leading-relaxed">
                Engineered specifically for Indian municipal & tanker hard water. Tap any product to open the complete full-screen formulation and multi-slide gallery.
              </p>
            </div>

            {/* 3 Large Luxury Product Boxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-stretch">
              {coreThreeProducts.map((p) => {
                const currentVariantId = selectedVariants[p.id] || p.variants[0].id;
                const currentVariant = p.variants.find(v => v.id === currentVariantId) || p.variants[0];
                const cartItem = items.find(it => it.productId === p.id && it.variantId === currentVariant.id);
                const productImage = p.image;

                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    onClick={() => openProductDetails(p.id)}
                    className="bg-white rounded-3xl shadow-[0_15px_45px_-12px_rgba(18,17,16,0.06)] hover:shadow-[0_25px_65px_-12px_rgba(197,168,128,0.25)] p-6 sm:p-7 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 group cursor-pointer border border-[#F3EDE2]/60 hover:border-[#C5A880]/50"
                  >
                    <div>
                      {/* 1. Large Authentic Product Bottle Image Container */}
                      <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-b from-[#FAF7F2] to-[#F3EDE2] mb-6 shadow-inner">
                        <img
                          src={productImage}
                          alt={p.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        
                        {/* Vignette Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                        {/* Top-Right Badge */}
                        <div className="absolute top-3.5 right-3.5 bg-[#121110]/85 backdrop-blur-md text-[#C5A880] text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-[#C5A880]/30 shadow-md">
                          {p.id === 'the-duo' ? '★ BESTSELLER' : p.id === 'hot-water-shampoo' ? '⚡ CHELATION' : '✦ BOND REPAIR'}
                        </div>

                        {/* Interactive Click Prompt Pill */}
                        <div className="absolute bottom-3.5 left-3.5 right-3.5 backdrop-blur-md bg-white/90 group-hover:bg-[#121110] p-2.5 rounded-xl transition-all flex items-center justify-between text-xs shadow-md">
                          <span className="font-semibold text-[11px] text-[#121110] group-hover:text-[#C5A880] transition-colors flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Click to view whole screen & slides</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#121110] group-hover:text-[#C5A880] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>

                      {/* 2. Title Row with Volume Dropdown Pill */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <h3 className="font-serif text-2xl font-bold text-[#121110] group-hover:text-[#C5A880] transition-colors leading-tight">
                          {p.id === 'the-duo' 
                            ? 'The Hairology Duo' 
                            : p.id === 'hot-water-shampoo' 
                            ? 'Hot Water Shampoo' 
                            : 'Protein Shampoo'}
                        </h3>

                        {/* Static Size Badge */}
                        <span className="inline-flex items-center px-2.5 py-1 bg-[#F9F7F2] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#8A7463] shrink-0 select-none">
                          {currentVariant.size}
                        </span>
                      </div>

                      {/* 3. Subtitle / Product Role Description */}
                      <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed mb-3 line-clamp-2">
                        {p.id === 'hot-water-shampoo' && 'Paraben free, sulphate free, gluten free, enriched with ectoin. Steam-activated chelation for hard-water hair.'}
                        {p.id === 'protein-shampoo' && 'Paraben free, sulphate free. Cortical bond repair with hydrolyzed pea & silk peptides.'}
                        {p.id === 'the-duo' && 'The complete wash-day protocol: Clarify on Day 1, Reconstruct on Day 4 for hard-water hair.'}
                      </p>

                      {/* 4. Rating Row */}
                      <div className="flex items-center gap-1.5 mb-5 text-xs">
                        <Star className="w-3.5 h-3.5 fill-[#121110] text-[#121110]" />
                        <span className="font-bold text-[#121110]">{p.rating}</span>
                        <span className="text-[#8A7463]">({p.reviewsCount} verified reviews)</span>
                      </div>
                    </div>

                    {/* 5. Pricing & ADD TO CART / Stepper Row */}
                    <div className="pt-4 border-t border-[#F3EDE2] space-y-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-serif font-bold text-[#121110]">
                            ₹{currentVariant.price}
                          </span>
                          <span className="text-sm line-through text-[#9CA3AF]">
                            ₹{currentVariant.mrp}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#15803D] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                          {Math.round(((currentVariant.mrp - currentVariant.price) / currentVariant.mrp) * 100)}% OFF
                        </span>
                      </div>

                      {/* LUXURY CHAMPAGNE GOLD ADD TO BAG / STEPPER BUTTON */}
                      {cartItem && cartItem.quantity > 0 ? (
                        <div className="w-full bg-[#121110] text-[#C5A880] border border-[#C5A880]/50 font-extrabold rounded-xl py-3 px-4 flex items-center justify-between shadow select-none">
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, currentVariant.id, cartItem.quantity - 1)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer text-[#C5A880]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4 stroke-[3]" />
                          </button>
                          <span className="text-sm font-bold font-sans">
                            {cartItem.quantity} in Bag
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(p.id, currentVariant.id, cartItem.quantity + 1)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer text-[#C5A880]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addItem(p.id, currentVariant.id, 1)}
                          className="w-full bg-gradient-to-r from-[#D4AF37] via-[#C5A880] to-[#B38F5B] hover:brightness-105 active:scale-[0.98] text-[#121110] font-extrabold text-xs tracking-wider uppercase py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-xl cursor-pointer text-center border border-[#D4AF37]/40"
                        >
                          ADD TO BAG — ₹{currentVariant.price}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================= VIEW 2: FULL-SCREEN DEDICATED PRODUCT VIEW WITH MULTI-SLIDE GALLERY ================= */
          detailProduct && (
            <AnimatePresence mode="wait">
              <motion.div
                key={detailProduct.id}
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(18,17,16,0.12)] p-6 sm:p-10 lg:p-14"
              >
                {/* Sticky/Prominent Top Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-10 border-b border-[#E8DFD1]">
                  <button
                    onClick={closeProductDetails}
                    className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#F3EDE2] text-[#121110] hover:bg-[#121110] hover:text-[#C5A880] text-xs font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer group shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span>Back to all products</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8A7463] font-medium hidden sm:inline">Switch product:</span>
                    {coreThreeProducts.map((cp) => (
                      <button
                        key={cp.id}
                        onClick={() => openProductDetails(cp.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          detailProduct.id === cp.id
                            ? 'bg-[#121110] text-[#C5A880] shadow-md'
                            : 'bg-[#F3EDE2] text-[#3D3A37] hover:bg-[#E8DFD1]'
                        }`}
                      >
                        {cp.id === 'hot-water-shampoo' ? 'Hot Water' : cp.id === 'protein-shampoo' ? 'Protein' : 'The Duo'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main 2-Column Product Detail Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-20">
                  
                  {/* Left Column: MULTI-SLIDE PICTURE CAROUSEL (As requested: "IN THIS PICTURE ADD MORE SLIDE PICTURE THAT I SHARE WITH YOU") */}
                  <div className="lg:col-span-5 relative space-y-4">
                    
                    {/* Main Active Slide Display */}
                    <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-b from-[#FBF9F6] to-[#F3EDE2] shadow-2xl border border-[#E8DFD1]/60">
                      
                      <img
                        src={currentGallery[activeSlideIndex]?.src}
                        alt={`${detailProduct.name} - Slide ${activeSlideIndex + 1}`}
                        className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 ease-out"
                      />

                      {/* Pill Badge on Top-Left */}
                      <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#121110] text-[#C5A880] border border-[#C5A880]/30 text-xs font-bold tracking-wider shadow-lg">
                        <Zap className="w-3.5 h-3.5 fill-[#C5A880]" />
                        <span>{productMeta[detailProduct.id]?.dropBadge || 'EXCLUSIVE'}</span>
                      </div>

                      {/* Slide Indicator Tag on Top-Right */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-[#121110] text-[10px] font-bold px-2.5 py-1 rounded-full shadow border border-white/60">
                        {activeSlideIndex + 1} / {currentGallery.length}
                      </div>

                      {/* Left Arrow Button */}
                      <button
                        type="button"
                        onClick={prevSlide}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] flex items-center justify-center shadow-lg transition-all cursor-pointer"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Right Arrow Button */}
                      <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-[#121110] text-[#121110] hover:text-[#C5A880] flex items-center justify-center shadow-lg transition-all cursor-pointer"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Caption Bar on Bottom of Active Slide */}
                      <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-xl text-center">
                        {currentGallery[activeSlideIndex]?.caption}
                      </div>
                    </div>

                    {/* Thumbnail Strip for Slides - 3 Authentic Photo Thumbnails */}
                    <div className="grid grid-cols-3 gap-3">
                      {currentGallery.map((slide, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlideIndex(idx)}
                          className={`relative aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            activeSlideIndex === idx
                              ? 'border-[#121110] shadow-md scale-102 ring-2 ring-[#C5A880]'
                              : 'border-[#E8DFD1] opacity-75 hover:opacity-100 hover:border-[#C5A880]/60'
                          }`}
                        >
                          <img src={slide.src} alt={slide.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                  </div>

                  {/* Right Column: Detailed Product Info */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Category Tags at Top */}
                    <div className="text-[11px] sm:text-xs font-bold tracking-[0.25em] text-[#8A7463] uppercase">
                      {productMeta[detailProduct.id]?.categoryPills}
                    </div>

                    {/* Product Name */}
                    <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#121110] tracking-tight">
                      {detailProduct.name}
                    </h1>

                    {/* Subheading in Italic Serif */}
                    <div className="font-serif italic text-lg sm:text-2xl text-[#8A7463]">
                      {productMeta[detailProduct.id]?.subtitleItalic}
                    </div>

                    {/* Rating Row */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center text-[#121110]">
                        <Star className="w-4 h-4 fill-[#121110] text-[#121110]" />
                      </div>
                      <span className="font-bold text-[#121110]">{detailProduct.rating}</span>
                      <span className="text-[#8A7463]">({detailProduct.reviewsCount} verified customer reviews)</span>
                    </div>

                    {/* Pricing Row with Green Discount Badge */}
                    <div className="flex items-center gap-4">
                      <span className="text-3xl sm:text-5xl font-serif font-bold text-[#121110]">
                        ₹{detailVariant?.price}
                      </span>
                      <span className="text-lg sm:text-xl line-through text-[#9CA3AF]">
                        ₹{detailVariant?.mrp}
                      </span>
                      <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] text-xs font-bold rounded-full">
                        {detailDiscount}% OFF
                      </span>
                    </div>

                    {/* Paragraph Description */}
                    <p className="text-sm sm:text-base text-[#374151] leading-relaxed">
                      {productMeta[detailProduct.id]?.description}
                    </p>

                    {/* Active Ingredients / Bio-Active Pills with Green Checkmarks */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {productMeta[detailProduct.id]?.ingredients.map((ing, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quantity Selector + Lime ADD TO CART Button Row */}
                    <div className="pt-4 flex flex-col sm:flex-row items-stretch gap-3">
                      {/* Stepper */}
                      <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-2xl px-5 py-3.5 sm:w-40 shadow-xs">
                        <button
                          type="button"
                          onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                          className="p-1 text-[#374151] hover:text-black cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-base font-sans">{detailQuantity}</span>
                        <button
                          type="button"
                          onClick={() => setDetailQuantity(detailQuantity + 1)}
                          className="p-1 text-[#374151] hover:text-black cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Luxury Champagne Gold ADD TO BAG CTA */}
                      <button
                        type="button"
                        onClick={() => {
                          if (detailVariant) {
                            addItem(detailProduct.id, detailVariant.id, detailQuantity);
                            openCart();
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-[#D4AF37] via-[#C5A880] to-[#B38F5B] hover:brightness-105 active:scale-[0.98] text-[#121110] font-extrabold text-sm tracking-wider uppercase py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl cursor-pointer text-center border border-[#D4AF37]/50"
                      >
                        ADD TO BAG — ₹{(detailVariant?.price || 449) * detailQuantity}
                      </button>
                    </div>

                    {/* Secondary BUY NOW CTA */}
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (detailVariant) {
                            addItem(detailProduct.id, detailVariant.id, detailQuantity);
                            openCart();
                          }
                        }}
                        className="w-full bg-[#121110] hover:bg-[#2A2724] text-white font-bold text-xs tracking-widest uppercase py-4 px-6 rounded-2xl transition-all shadow-md cursor-pointer text-center"
                      >
                        BUY NOW — ₹{(detailVariant?.price || 449) * detailQuantity}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ================= SECTION BELOW: OFFICIAL PRODUCT FAQS (Q1 - Q5) ================= */}
                <div className="pt-14 border-t border-[#E8DFD1]">
                  <div className="text-center max-w-2xl mx-auto mb-10">
                    <div className="text-[11px] font-bold tracking-[0.25em] text-[#8A7463] uppercase mb-1">
                      FREQUENTLY ASKED QUESTIONS
                    </div>
                    <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#121110]">
                      EVERYTHING <span className="font-serif italic font-normal text-[#E11D48]">you need to know</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B7280] mt-2">
                      Answers to common questions about usage, formula science, and results.
                    </p>
                  </div>

                  {/* Clean, Elegant FAQ Accordion List */}
                  <div className="max-w-3xl mx-auto space-y-3">
                    {productMeta[detailProduct.id]?.faqs.map((faq, index) => {
                      const isOpen = openFaqIndex === index;
                      return (
                        <div 
                          key={index}
                          className="bg-white rounded-2xl border border-[#E8DFD1] overflow-hidden transition-all duration-300 shadow-2xs hover:border-[#C5A880]/60"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                            className="w-full flex items-center justify-between text-left p-5 sm:p-6 font-serif text-base sm:text-lg font-bold text-[#121110] hover:text-[#C5A880] transition-colors cursor-pointer gap-4"
                          >
                            <span className="leading-snug">{faq.q}</span>
                            <div className="w-8 h-8 rounded-full bg-[#F9F7F2] border border-[#E8DFD1] flex items-center justify-center shrink-0 text-[#8A7463]">
                              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-1 text-sm sm:text-base text-[#4B5563] leading-relaxed border-t border-[#F3EDE2]">
                              <p>{faq.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )
        )}
      </div>
    </section>
  );
};
