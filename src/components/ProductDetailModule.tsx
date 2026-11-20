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
  PRODUCT_IMAGE_CONDITIONER,
  PRODUCT_IMAGE_CONDITIONER_BACK,
  PRODUCT_IMAGE_DUO,
  PRODUCT_IMAGE_HOT_WATER_ROSEMARY,
  PRODUCT_IMAGE_PROTEIN_ROSEMARY,
  PRODUCT_IMAGE_TRIO,
  PRODUCT_IMAGE_TRIO_HOT_WATER_BACK,
  PRODUCT_IMAGE_TRIO_PROTEIN_BACK
} from '../data/products';

export const ProductDetailModule: React.FC = () => {
  const { addItem, updateQuantity, items, openCart } = useCart();

  const trioProduct = PRODUCTS.find(p => p.id === 'the-trio');

  // Grid Products below the top Trio flagship card (Hot Water+Rosemary at 3rd, Protein+Rosemary at 4th)
  const coreThreeProducts = PRODUCTS.filter(p => 
    p.id === 'the-duo' ||
    p.id === 'hot-water-rosemary-duo' ||
    p.id === 'protein-rosemary-duo' ||
    p.id === 'hot-water-shampoo' ||
    p.id === 'protein-shampoo' ||
    p.id === 'rosemary-conditioner'
  );

  // All 7 launch products for detail view & product switcher
  const allLaunchProducts = trioProduct ? [trioProduct, ...coreThreeProducts] : coreThreeProducts;

  // Active product in view: null shows the product showcase grid; string ID shows the full-screen detailed view
  const [activeDetailProductId, setActiveDetailProductId] = useState<string | null>(null);

  // Current active slide index for gallery
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Selected variant for each product
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'the-trio': 'trio-full',
    'the-duo': 'duo-full',
    'hot-water-rosemary-duo': 'hw-rc-full',
    'protein-rosemary-duo': 'pr-rc-full',
    'hot-water-shampoo': 'hot-full',
    'protein-shampoo': 'protein-full',
    'rosemary-conditioner': 'rosemary-full'
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

  const detailProduct = allLaunchProducts.find(p => p.id === activeDetailProductId);
  const detailVariantId = detailProduct ? (selectedVariants[detailProduct.id] || detailProduct.variants[0].id) : '';
  const detailVariant = detailProduct?.variants.find(v => v.id === detailVariantId) || detailProduct?.variants[0];
  const detailDiscount = detailVariant
    ? detailProduct?.id === 'hot-water-rosemary-duo' || detailProduct?.id === 'protein-rosemary-duo'
      ? 13
      : Math.round(((detailVariant.mrp - detailVariant.price) / detailVariant.mrp) * 100)
    : 0;

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
    ],
    'rosemary-conditioner': [
      {
        type: 'image',
        src: PRODUCT_IMAGE_CONDITIONER,
        label: 'Front Studio Shot',
        caption: 'Rosemary Conditioner • Paraben Free, Sulphate Free & Gluten Free (250 ml)'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_CONDITIONER_BACK,
        label: 'Back Bottle & Directions',
        caption: 'Directions of use, caution & complete ingredients list • 250 ml bottle'
      }
    ],
    'the-trio': [
      {
        type: 'image',
        src: PRODUCT_IMAGE_TRIO,
        label: 'The Hairology Trio Set',
        caption: 'Hot Water Shampoo + Protein Shampoo + Rosemary Conditioner • 250 ml each'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_TRIO_HOT_WATER_BACK,
        label: 'Hot Water Shampoo Back',
        caption: 'Step 1: Hot Water Shampoo — Directions & Ingredients (250 ml)'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_TRIO_PROTEIN_BACK,
        label: 'Protein Shampoo Back',
        caption: 'Step 2: Protein Shampoo — Directions & Ingredients (250 ml)'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_CONDITIONER_BACK,
        label: 'Rosemary Conditioner Back',
        caption: 'Step 3: Rosemary Conditioner — Directions & Ingredients (250 ml)'
      }
    ],
    'hot-water-rosemary-duo': [
      {
        type: 'image',
        src: PRODUCT_IMAGE_HOT_WATER_ROSEMARY,
        label: 'Hot Water Shampoo + Rosemary Conditioner',
        caption: 'Rosemary Conditioner (250 ml) & Hot Water Shampoo (250 ml) Combo'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_CONDITIONER_BACK,
        label: 'Rosemary Conditioner Back',
        caption: 'Rosemary Conditioner — Directions of Use, Caution & Ingredients (250 ml)'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_TRIO_HOT_WATER_BACK,
        label: 'Hot Water Shampoo Back',
        caption: 'Hot Water Shampoo — Directions of Use, Caution & Ingredients (250 ml)'
      }
    ],
    'protein-rosemary-duo': [
      {
        type: 'image',
        src: PRODUCT_IMAGE_PROTEIN_ROSEMARY,
        label: 'Protein + Rosemary Conditioner',
        caption: 'Rosemary Conditioner (250 ml) & Protein Shampoo (250 ml) Combo'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_CONDITIONER_BACK,
        label: 'Rosemary Conditioner Back',
        caption: 'Rosemary Conditioner — Directions of Use, Caution & Ingredients (250 ml)'
      },
      {
        type: 'image',
        src: PRODUCT_IMAGE_TRIO_PROTEIN_BACK,
        label: 'Protein Shampoo Back',
        caption: 'Protein Shampoo — Directions of Use, Caution & Ingredients (250 ml)'
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
    },
    'rosemary-conditioner': {
      categoryPills: 'PARABEN FREE • SULPHATE FREE • GLUTEN FREE • FOR ALL HAIR TYPES',
      subtitleItalic: 'Reduces hair fall & breakage — frizz control & smoothens hair',
      dropBadge: 'NEW LAUNCH',
      ingredients: [
        'Rosmarinus Officinalis (Rosemary) Oil',
        'Paraben Free, Sulphate Free & Gluten Free',
        'Avocado Oil & Coconut Oil',
        'Aloe Barbadensis (Aloe Vera)',
        'Tocopheryl Acetate (Vitamin E)'
      ],
      description: 'Paraben free, sulphate free, and gluten free. Enriched with Rosemary Leaf Oil, Coconut Oil, Aloe Vera, Avocado Oil, and Vitamin E to reduce hair fall and breakage while controlling frizz and smoothening all hair types.',
      faqs: [
        {
          q: 'Q1. What are the key benefits of HAIROLOGY ROSEMARY CONDITIONER?',
          a: 'It reduces hair fall and breakage, calms frizz, and deeply smoothens strands using Rosemary Leaf Oil, Coconut Oil, Aloe Vera, and Avocado Oil—for all hair types.'
        },
        {
          q: 'Q2. How do I use ROSEMARY CONDITIONER after shampooing?',
          a: 'After shampooing, apply conditioner to wet hair and massage gently from roots to ends. Leave on for 5–10 minutes, then rinse thoroughly.'
        },
        {
          q: 'Q3. Is it paraben free, sulphate free, and gluten free?',
          a: 'Yes! ROSEMARY CONDITIONER is 100% paraben free, sulphate free, and gluten free.'
        },
        {
          q: 'Q4. Can I pair it with Hot Water Shampoo or Protein Shampoo?',
          a: 'Yes. Use it immediately after your Hot Water or Protein wash step to lock in moisture, seal cuticles, and maintain silky smooth, frizz-free hair.'
        },
        {
          q: 'Q5. Are there any precautions or storage instructions?',
          a: 'For external use only. Do not use on inflamed skin, and discontinue use if irritation occurs. Store in a cool and dry place out of reach of children.'
        }
      ]
    },
    'the-trio': {
      categoryPills: 'COMPLETE 3-STEP SYSTEM • 250 ML EACH • SAVE 19%',
      subtitleItalic: 'Hot Water Shampoo + Protein Shampoo + Rosemary Conditioner',
      dropBadge: 'COMPLETE TRIO',
      ingredients: [
        'Hot Water Shampoo (Ectoin + Salicylic)',
        'Protein Shampoo (Hydrolyzed Keratin & Biotin)',
        'Rosemary Conditioner (Rosemary, Avocado & Coconut)',
        'Paraben Free & Sulphate Free',
        'Complete Hard-Water Regimen'
      ],
      description: 'The complete 3-bottle Hairology ritual in full 250 ml sizes: clarify hard-water buildup with Hot Water Shampoo, rebuild strand strength with Protein Shampoo, and control frizz & hair fall with Rosemary Conditioner.',
      faqs: [
        {
          q: 'Q1. What comes inside The Hairology Trio?',
          a: 'Three full-size 250 ml bottles: Hot Water Shampoo (250 ml), Protein Shampoo (250 ml), and Rosemary Conditioner (250 ml).'
        },
        {
          q: 'Q2. How do I use all 3 products together?',
          a: 'Wash with Hot Water Shampoo on Day 1 and Protein Shampoo on Day 4, following every wash with Rosemary Conditioner (left on for 5–10 minutes) for soft, frizz-free hair.'
        },
        {
          q: 'Q3. Are all three products free from harsh sulphates and parabens?',
          a: 'Yes, all three formulations are crafted without parabens or harsh sulphates and are gentle on all Indian hair types.'
        }
      ]
    },
    'hot-water-rosemary-duo': {
      categoryPills: 'HEAT SHIELD + FRIZZ CONTROL • 250 ML EACH • SAVE 13%',
      subtitleItalic: 'Hot Water Shampoo + Rosemary Conditioner',
      dropBadge: 'WASH & CONDITION DUO',
      ingredients: [
        'Enriched with Ectoin (Thermal Shield)',
        'Rosmarinus Officinalis (Rosemary) Leaf Oil',
        'Paraben Free & Sulphate Free',
        'Gluten Free & Colour Safe',
        'Niacinamide, Avocado & Coconut Oils'
      ],
      description: 'Cleanse hard-water mineral buildup with Ectoin-enriched Hot Water Shampoo (250 ml), then calm frizz and reduce hair fall & breakage with Rosemary Conditioner (250 ml). Paraben free, sulphate free, and gluten free.',
      faqs: [
        {
          q: 'Q1. What bottles are included in Hot Water Shampoo + Rosemary Conditioner?',
          a: 'You receive two full-size 250 ml bottles: Hot Water Shampoo (250 ml) and Rosemary Conditioner (250 ml).'
        },
        {
          q: 'Q2. How do I use this wash and condition routine?',
          a: 'Wash hair with Hot Water Shampoo on damp scalp and rinse thoroughly, then massage Rosemary Conditioner from roots to ends, leave on for 5–10 minutes, and rinse.'
        },
        {
          q: 'Q3. Are both formulas free from parabens, sulphates, and gluten?',
          a: 'Yes! Both Hot Water Shampoo and Rosemary Conditioner are 100% paraben free, sulphate free, and gluten free.'
        }
      ]
    },
    'protein-rosemary-duo': {
      categoryPills: 'STRENGTH + FRIZZ CONTROL • 250 ML EACH • SAVE 13%',
      subtitleItalic: 'Protein + Rosemary conditioner',
      dropBadge: 'STRENGTH & SMOOTH',
      ingredients: [
        'Hydrolyzed Keratin & Wheat Protein',
        'Rosmarinus Officinalis (Rosemary) Leaf Oil',
        'Biotin & Pro-Vitamin B5 (Panthenol)',
        'No Parabens, SLES or SLS',
        'Avocado, Coconut & Aloe Vera Oils'
      ],
      description: 'Rebuild cortical strand strength with Protein Shampoo (250 ml), then follow with Rosemary Conditioner (250 ml) to reduce hair fall & breakage and smooth frizz for all hair types.',
      faqs: [
        {
          q: 'Q1. What bottles are included in Protein + Rosemary conditioner?',
          a: 'You receive two full-size 250 ml bottles: Protein Shampoo (250 ml) and Rosemary Conditioner (250 ml).'
        },
        {
          q: 'Q2. How do I use Protein Shampoo with Rosemary Conditioner?',
          a: 'Lather Protein Shampoo gently into damp scalp and rinse with cool water, then apply Rosemary Conditioner from roots to ends, leave on for 5–10 minutes, and rinse thoroughly.'
        },
        {
          q: 'Q3. Are both formulas paraben free and sulphate free?',
          a: 'Yes! Both Protein Shampoo and Rosemary Conditioner are free from parabens, SLS, and SLES.'
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
                <span>PHASE 1 LAUNCH PORTFOLIO • COMPLETE TRIO & FORMULATIONS</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold text-[#121110] tracking-tight">
                DISCOVER <span className="italic font-normal text-[#C5A880]">OUR PRODUCTS</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#4A4540] max-w-xl mx-auto leading-relaxed">
                Engineered specifically for Indian municipal & tanker hard water. Tap any product to open the complete full-screen formulation and multi-slide gallery.
              </p>
            </div>

            {/* TOP FLAGSHIP PRODUCT CARD: THE HAIROLOGY TRIO */}
            {trioProduct && (() => {
              const trioVariantId = selectedVariants[trioProduct.id] || trioProduct.variants[0].id;
              const trioVariant = trioProduct.variants.find(v => v.id === trioVariantId) || trioProduct.variants[0];
              const trioCartItem = items.find(it => it.productId === trioProduct.id && it.variantId === trioVariant.id);
              const trioDiscount = Math.round(((trioVariant.mrp - trioVariant.price) / trioVariant.mrp) * 100);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  onClick={() => openProductDetails(trioProduct.id)}
                  className="mb-8 lg:mb-10 bg-white rounded-3xl shadow-[0_18px_50px_-12px_rgba(18,17,16,0.08)] hover:shadow-[0_25px_65px_-12px_rgba(197,168,128,0.3)] p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center transition-all duration-500 hover:-translate-y-1.5 group cursor-pointer border border-[#C5A880]/40 hover:border-[#C5A880]"
                >
                  {/* Left: Full Trio Studio Image */}
                  <div className="lg:col-span-6 relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-b from-[#FAF7F2] to-[#F3EDE2] shadow-inner">
                    <img
                      src={trioProduct.image}
                      alt={trioProduct.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute top-3.5 right-3.5 bg-[#121110]/90 backdrop-blur-md text-[#C5A880] text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full border border-[#C5A880]/40 shadow-md">
                      ★ COMPLETE TRIO • 3 BOTTLES
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 backdrop-blur-md bg-white/90 group-hover:bg-[#121110] p-2.5 rounded-xl transition-all flex items-center justify-between text-xs shadow-md">
                      <span className="font-semibold text-[11px] text-[#121110] group-hover:text-[#C5A880] transition-colors flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Click to view whole screen & 4 slides</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#121110] group-hover:text-[#C5A880] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Right: Trio Details & Add to Bag */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
                    <div>
                      <div className="text-[11px] font-bold tracking-[0.22em] text-[#8A7463] uppercase mb-2">
                        COMPLETE 3-STEP SYSTEM • SAVE {trioDiscount}%
                      </div>

                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#121110] group-hover:text-[#C5A880] transition-colors leading-tight">
                          The Hairology Trio
                        </h3>
                        <span className="inline-flex items-center px-3 py-1 bg-[#F9F7F2] border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#8A7463] shrink-0 select-none">
                          {trioVariant.size}
                        </span>
                      </div>

                      <p className="text-sm sm:text-base text-[#4A4540] leading-relaxed mb-4">
                        Hot Water Shampoo + Protein Shampoo + Rosemary Conditioner (250 ml each). Cleanse hard-water buildup, repair keratin bonds, and tame frizz &amp; hair fall in one complete ritual.
                      </p>

                      <div className="flex items-center gap-2 text-xs mb-4">
                        <Star className="w-4 h-4 fill-[#121110] text-[#121110]" />
                        <span className="font-bold text-[#121110]">{trioProduct.rating}</span>
                        <span className="text-[#8A7463]">({trioProduct.reviewsCount} verified reviews)</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#F3EDE2] space-y-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-3xl sm:text-4xl font-serif font-bold text-[#121110]">
                            ₹{trioVariant.price}
                          </span>
                          <span className="text-base line-through text-[#9CA3AF]">
                            ₹{trioVariant.mrp}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#15803D] bg-[#DCFCE7] px-3 py-1 rounded-full">
                          {trioDiscount}% OFF
                        </span>
                      </div>

                      {trioCartItem && trioCartItem.quantity > 0 ? (
                        <div className="w-full bg-[#121110] text-[#C5A880] border border-[#C5A880]/50 font-extrabold rounded-xl py-3.5 px-5 flex items-center justify-between shadow select-none">
                          <button
                            type="button"
                            onClick={() => updateQuantity(trioProduct.id, trioVariant.id, trioCartItem.quantity - 1)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer text-[#C5A880]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4 stroke-[3]" />
                          </button>
                          <span className="text-sm font-bold font-sans">
                            {trioCartItem.quantity} in Bag
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(trioProduct.id, trioVariant.id, trioCartItem.quantity + 1)}
                            className="p-1 hover:scale-125 transition-transform cursor-pointer text-[#C5A880]"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addItem(trioProduct.id, trioVariant.id, 1)}
                          className="w-full bg-gradient-to-r from-[#D4AF37] via-[#C5A880] to-[#B38F5B] hover:brightness-105 active:scale-[0.98] text-[#121110] font-extrabold text-xs sm:text-sm tracking-wider uppercase py-4 px-6 rounded-xl transition-all shadow-md hover:shadow-xl cursor-pointer text-center border border-[#D4AF37]/40"
                        >
                          ADD TRIO TO BAG — ₹{trioVariant.price}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Luxury Product Boxes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {coreThreeProducts.map((p) => {
                const currentVariantId = selectedVariants[p.id] || p.variants[0].id;
                const currentVariant = p.variants.find(v => v.id === currentVariantId) || p.variants[0];
                const cartItem = items.find(it => it.productId === p.id && it.variantId === currentVariant.id);
                const productImage = p.image;
                const cardDiscount =
                  p.id === 'hot-water-rosemary-duo' || p.id === 'protein-rosemary-duo'
                    ? 13
                    : Math.round(((currentVariant.mrp - currentVariant.price) / currentVariant.mrp) * 100);

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
                          {p.id === 'the-duo'
                            ? '★ BESTSELLER'
                            : p.id === 'hot-water-rosemary-duo'
                            ? '✦ WASH & CONDITION'
                            : p.id === 'protein-rosemary-duo'
                            ? '✦ STRENGTH & SMOOTH'
                            : p.id === 'hot-water-shampoo'
                            ? '⚡ CHELATION'
                            : p.id === 'rosemary-conditioner'
                            ? '🌿 NEW LAUNCH'
                            : '✦ BOND REPAIR'}
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

                      {/* 2. Title Row with Volume Badge */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#121110] group-hover:text-[#C5A880] transition-colors leading-tight">
                          {p.id === 'the-duo'
                            ? 'The Hairology Duo'
                            : p.id === 'hot-water-rosemary-duo'
                            ? 'Hot Water Shampoo + Rosemary Conditioner'
                            : p.id === 'protein-rosemary-duo'
                            ? 'Protein + Rosemary conditioner'
                            : p.id === 'hot-water-shampoo'
                            ? 'Hot Water Shampoo'
                            : p.id === 'rosemary-conditioner'
                            ? 'ROSEMARY CONDITIONER'
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
                        {p.id === 'rosemary-conditioner' && 'Paraben free, sulphate free, gluten free. Reduces hair fall & breakage with frizz control.'}
                        {p.id === 'the-duo' && 'The complete wash-day protocol: Clarify on Day 1, Reconstruct on Day 4 for hard-water hair.'}
                        {p.id === 'hot-water-rosemary-duo' && 'Warm-water Ectoin chelation shampoo paired with paraben & sulphate-free Rosemary Conditioner (250 ml each).'}
                        {p.id === 'protein-rosemary-duo' && 'Strengthening Protein Shampoo paired with paraben & sulphate-free Rosemary Conditioner (250 ml each).'}
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
                          {cardDiscount}% OFF
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

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[#8A7463] font-medium hidden sm:inline">Switch product:</span>
                    {allLaunchProducts.map((cp) => (
                      <button
                        key={cp.id}
                        onClick={() => openProductDetails(cp.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          detailProduct.id === cp.id
                            ? 'bg-[#121110] text-[#C5A880] shadow-md'
                            : 'bg-[#F3EDE2] text-[#3D3A37] hover:bg-[#E8DFD1]'
                        }`}
                      >
                        {cp.id === 'the-trio'
                          ? 'The Trio'
                          : cp.id === 'hot-water-rosemary-duo'
                          ? 'Hot Water + Rosemary'
                          : cp.id === 'protein-rosemary-duo'
                          ? 'Protein + Rosemary'
                          : cp.id === 'hot-water-shampoo'
                          ? 'Hot Water'
                          : cp.id === 'protein-shampoo'
                          ? 'Protein'
                          : cp.id === 'rosemary-conditioner'
                          ? 'Rosemary Conditioner'
                          : 'The Duo'}
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

                    {/* Thumbnail Strip for Slides */}
                    <div
                      className={`grid gap-3 ${
                        currentGallery.length === 2
                          ? 'grid-cols-2'
                          : currentGallery.length === 4
                          ? 'grid-cols-4'
                          : 'grid-cols-3'
                      }`}
                    >
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
