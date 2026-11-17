import { Product } from '../types';

export const PRODUCT_IMAGE_HOT_WATER = '/assets/aistudio/hot_water_front.webp';
export const PRODUCT_IMAGE_HOT_WATER_STANDALONE = '/assets/aistudio/hot_water_standalone.webp';
export const PRODUCT_IMAGE_HOT_WATER_BACK = '/assets/aistudio/hot_water_back.webp';
export const PRODUCT_IMAGE_PROTEIN = '/assets/aistudio/protein_front.webp';
export const PRODUCT_IMAGE_PROTEIN_BACK = '/assets/aistudio/protein_back.webp';
export const PRODUCT_IMAGE_DUO = '/assets/aistudio/duo_hero.webp';
export const USER_HERO_IMAGE = PRODUCT_IMAGE_DUO;
export const USER_LOGO_IMAGE = '/assets/aistudio/hairology_logo.webp';
export const USER_VIDEO_URL = '/assets/aistudio/hairology_walkthrough.mp4';
export const ADMIN_PHONE = '+91 8104559706';
export const ADMIN_EMAIL = 'admin@hairology.in';
export const USER_UPI_QR_IMAGE = '/assets/aistudio/WhatsApp_Image_2026-11-10_at_1.29.33_PM_468b58e1.jpeg';
export const USER_UPI_ID = 'guddan1102@okhdfcbank';
export const USER_UPI_NAME = 'HAIROLOGY';

export const PRODUCTS: Product[] = [
  {
    id: 'the-duo',
    name: 'The Hairology Duo (Clarify & Reconstruct)',
    tagline: 'Hot Water Shampoo (250 ml) + Protein Shampoo (250 ml)',
    subtitle: 'The Complete Cyclical Wash-Day Routine for Hard Indian Water',
    category: 'System Kits & Duos',
    description: 'A revolutionary dual-action wash system engineered specifically for Indian municipal water. Day 1: Thermal steam-activated chelating shampoo neutralizes calcium, magnesium, and heavy metal deposits. Day 4: Bio-identical hydrolyzed pea peptides and silk fibroin reconstruct fractured cuticles, sealing moisture for 72 hours.',
    badge: '★ BESTSELLER DUO',
    rating: 4.9,
    reviewsCount: 382,
    accentColor: '#C5A880',
    image: PRODUCT_IMAGE_DUO,
    variants: [
      {
        id: 'duo-full',
        label: 'Full Size Duo (2 x 250 ml)',
        size: '500 ml total',
        mrp: 999,
        price: 849,
      },
      {
        id: 'duo-travel',
        label: 'Travel Discovery Set (2 x 100 ml)',
        size: '200 ml total',
        mrp: 899,
        price: 549,
      }
    ],
    activeComplex: 'Thermal Chelation Matrix + Bio-Identical Pea Peptides & Silk Fibroin',
    benefits: [
      {
        title: 'Hard Water Metal Chelation',
        description: 'Binds and lifts calcium and magnesium salts from tap water that cause brittleness and scalp chalkiness.'
      },
      {
        title: 'Cuticle Reconstruction',
        description: 'Hydrolyzed silk fibroin fills porous cortical micro-tears, restoring hair tensile elasticity.'
      },
      {
        title: '72-Hour Anti-Frizz Humidity Shield',
        description: 'Creates a weightless breathable moisture barrier resisting intense Indian coastal and monsoon humidity.'
      },
      {
        title: 'Thermal Steam Chelation',
        description: 'Vapor-activated botanical complexes dissolve heavy metal carbonates from municipal and tanker water.'
      }
    ],
    howToUse: [
      {
        step: 1,
        title: 'Day 1 — Clarify with Hot Water Shampoo',
        instructions: 'Squeeze a coin-sized amount into palms. Massage with warm water into damp scalp for 2 minutes to activate steam chelators. Rinse thoroughly.'
      },
      {
        step: 2,
        title: 'Day 4 — Reconstruct with Protein Shampoo',
        instructions: 'Lather through roots and mid-lengths. Allow peptides to absorb for 90 seconds before cool-water rinse to lock cuticle shine.'
      },
      {
        step: 3,
        title: 'Scalp Activation',
        instructions: 'Gently massage into the scalp using circular fingertip motions during both wash steps to enhance microcirculation.'
      }
    ],
    ingredients: [
      {
        name: 'Tetrasodium Glutamate Diacetate',
        role: 'Advanced eco-chelator that neutralizes calcium, chlorine & iron salts',
        source: 'Plant-derived amino acid complex'
      },
      {
        name: 'Hydrolyzed Pea Peptides',
        role: 'Bio-identical plant keratin substitute with 22 essential amino acids',
        source: 'Cold-pressed Pisum Sativum'
      },
      {
        name: 'Hydrolyzed Silk Fibroin',
        role: 'Microscopic cuticle smoothing & prismatic light-reflecting shine',
        source: 'Sustainable biopolymer silk proteins'
      },
      {
        name: 'Ectoin Extremolyte',
        role: 'Thermal heat shield & membrane cellular stabilizer against UV/heat',
        source: 'Halophilic natural bio-protectant'
      }
    ],
    faqs: [
      {
        q: 'Why do I need two different shampoos in a cyclical routine?',
        a: 'Indian tap water continuously deposits mineral carbonates that coat the hair shaft, blocking standard conditioners and proteins. The Hot Water Shampoo first unstrips and purges these heavy metals on Day 1. The Protein Shampoo can then penetrate deep into the cortex on Day 4 to reconstruct broken bonds.'
      },
      {
        q: 'Is this formula safe for chemically treated or colored hair?',
        a: 'Yes! Both formulas are 100% sulphate-free, silicone-free, and pH-balanced (5.2 - 5.5). In clinical trials, color retention was 2.4x higher compared to standard salon shampoos.'
      },
      {
        q: 'How often should I use each shampoo in the Duo?',
        a: 'We recommend alternating between Hot Water Shampoo on Day 1 for clarifying thermal chelation and Protein Shampoo on Day 4 for restorative peptide repair.'
      }
    ],
    additionalInfo: {
      shelfLife: '36 Months from date of manufacturing',
      manufacturer: 'Hairology Haute-Beauté Lab, ISO 9001 & GMP Certified Facility, Sector 6A, Haridwar 249403',
      origin: 'India',
      supportContact: 'Team HAIROLOGY Care',
      supportEmail: 'support@hairology.in',
      licenseNo: 'COS-UK-08/2026/04'
    },
    galleryImages: [
      { id: 'g1', title: 'Luxury Duo Bottles', type: 'bottle', badge: 'HAUTE FORMULATION' },
      { id: 'g2', title: 'Bio-Identical Peptides & Chelation', type: 'ingredients', badge: 'ACTIVE COMPLEX' },
      { id: 'g3', title: 'Real Results on Indian Water', type: 'stats', badge: '98% REPORTED FRESHNESS' },
      { id: 'g4', title: 'Targeted Follicular Benefits', type: 'benefits', badge: 'CLINICALLY PROVEN' },
      { id: 'g5', title: 'The Hairology Clean Promise', type: 'promise', badge: '100% VEGAN & CLEAN' },
      { id: 'g6', title: 'Real Customer Endorsements', type: 'reviews', badge: 'VERIFIED REVIEWS' }
    ]
  },
  {
    id: 'hot-water-shampoo',
    name: 'Hot Water Shampoo (Heat Shield + Clarify)',
    tagline: 'Thermal Steam Activated Hard-Water Chelating Follicular Detox',
    subtitle: 'Paraben Free • Sulphate Free • Gluten Free • Enriched with Ectoin (250 ml)',
    category: 'Clarifying Cleanser',
    description: 'Paraben free, sulphate free, gluten free, and enriched with Ectoin. Designed specifically for the thermal wash experience in Indian households. Steam activates gentle chelating agents that bind and dissolve calcified water hardness, heavy metals, and particulate pollution without stripping the natural lipid barrier.',
    badge: '🔥 HOT DROP',
    rating: 4.9,
    reviewsCount: 284,
    accentColor: '#9E3C1B',
    image: PRODUCT_IMAGE_HOT_WATER,
    variants: [
      {
        id: 'hot-full',
        label: 'Full Size (250 ml)',
        size: '250 ml',
        mrp: 499,
        price: 449,
      },
      {
        id: 'hot-travel',
        label: 'Travel Mini (100 ml)',
        size: '100 ml',
        mrp: 449,
        price: 299,
      }
    ],
    activeComplex: 'Thermal Steam Chelation Matrix + Ectoin Cellular Shield',
    benefits: [
      {
        title: 'Thermal Steam Chelation',
        description: 'Vapor-activated botanical complexes dissolve heavy metal carbonates from municipal and tanker water.'
      },
      {
        title: 'Scalp Follicular Detox',
        description: 'Unclogs congested sebum channels and removes stubborn pollution particulate matter (PM 2.5).'
      },
      {
        title: 'Instant Volumizing Root Lift',
        description: 'Rids strands of heavy calcium residue, restoring 23% immediate bouncy root volume.'
      },
      {
        title: 'Finished with Ectoin',
        description: 'Creates a thermal barrier defending keratin structures up to 230°C blow-dry temperatures.'
      }
    ],
    howToUse: [
      {
        step: 1,
        title: 'Warm Water Rinse',
        instructions: 'Drench hair with comfortably warm water for 60 seconds to open hair cuticles and prepare the thermal catalyst.'
      },
      {
        step: 2,
        title: 'Scalp Lather',
        instructions: 'Dispense 1-2 pumps. Work into a dense micro-foam at the roots, massaging with pads of fingers for 2 minutes.'
      },
      {
        step: 3,
        title: 'Rinse Clean',
        instructions: 'Rinse thoroughly until water runs completely clear. Strands will feel featherweight and weightlessly clean.'
      }
    ],
    ingredients: [
      {
        name: 'Tetrasodium Glutamate Diacetate',
        role: 'Advanced biodegradable chelating agent for calcium & magnesium',
        source: 'Sustainable plant bio-fermentation'
      },
      {
        name: 'Ectoin Extremolyte',
        role: 'Thermal and dehydration cell protector',
        source: 'Desert salt-lake halophile micro-organisms'
      },
      {
        name: 'Rosemary Leaf Terpenes',
        role: 'Micro-vascular scalp stimulation and sebum balancer',
        source: 'Steam-distilled Rosmarinus officinalis'
      },
      {
        name: 'Sodium Cocoyl Apple Amino Acids',
        role: 'Ultra-gentle sulfate-free lather with baby-soft foam density',
        source: 'Apple fruit juice amino acids'
      }
    ],
    faqs: [
      {
        q: 'Does it strip chemically straightened or keratin-treated hair?',
        a: 'No. Unlike harsh clarifying shampoos formulated with SLS/SLES, Hairology uses apple amino acid surfactants and amino chelation that target minerals exclusively, leaving keratin chains intact.'
      },
      {
        q: 'Can I use this if I take cool or cold showers?',
        a: 'Yes! While steam accelerates the chelating binding rate, lukewarm or room-temperature water will still effectively capture and rinse away mineral ions.'
      }
    ],
    additionalInfo: {
      shelfLife: '36 Months',
      manufacturer: 'Hairology Haute-Beauté Lab, Haridwar',
      origin: 'India',
      supportContact: 'Team HAIROLOGY Care',
      supportEmail: 'support@hairology.in',
      licenseNo: 'COS-UK-08/2026/04'
    },
    galleryImages: [
      { id: 'h1', title: 'Hot Water Shampoo Fluted Bottle', type: 'bottle', badge: 'FLUTED GLASS FINISH' },
      { id: 'h2', title: 'Hard Water Chelation Mechanism', type: 'ingredients', badge: 'CHELATING COMPLEX' },
      { id: 'h3', title: 'Scalp Detox & Root Lift', type: 'stats', badge: '15X LESS BREAKAGE' },
      { id: 'h4', title: 'Usage Guide & Water Temp', type: 'benefits', badge: 'THERMAL STEAM RITUAL' },
      { id: 'h5', title: 'Cleanse Clean Promise', type: 'promise', badge: 'NO SULPHATES' },
      { id: 'h6', title: 'Customer Feedback', type: 'reviews', badge: 'VERIFIED RATINGS' }
    ]
  },
  {
    id: 'protein-shampoo',
    name: 'Protein Shampoo (Strength in Every Strand)',
    tagline: 'Bio-Identical Hydrolyzed Pea Peptides + Silk Fibroin Reconstructive Wash',
    subtitle: 'Fluted Glass Finish Bottle (250 ml)',
    category: 'Reconstructive Cleanser',
    description: 'A luxurious reconstructing wash infused with bio-identical micro-peptides and silk fibroin. Restores tensile strength to weakened, heat-styled, or pollution-compromised hair, delivering an unbroken 72-hour anti-frizz humidity shield.',
    badge: '♥ MOST RE-ORDERED',
    rating: 4.8,
    reviewsCount: 247,
    accentColor: '#8A7463',
    image: PRODUCT_IMAGE_PROTEIN,
    variants: [
      {
        id: 'protein-full',
        label: 'Full Size (250 ml)',
        size: '250 ml',
        mrp: 499,
        price: 449,
      },
      {
        id: 'protein-travel',
        label: 'Travel Mini (100 ml)',
        size: '100 ml',
        mrp: 449,
        price: 299,
      }
    ],
    activeComplex: 'Hydrolyzed Pea Peptides + Silk Fibroin + Biotin Vitamin Matrix',
    benefits: [
      {
        title: 'Bio-Identical Peptide Bonding',
        description: 'Micro-peptides mimic human hair keratin to repair fissures in the cuticle layer.'
      },
      {
        title: '41% Clinical Frizz Reduction',
        description: 'Seals moisture inside the cortex while blocking external humidity intrusion.'
      },
      {
        title: 'High-Gloss Prismatic Silk Finish',
        description: 'Reflective fibroin polymers align hair fibers for salon-grade mirror gloss.'
      },
      {
        title: 'Tensile Strength Reinforcement',
        description: 'Increases resistance against brush snagging and elastic snapping by 15x.'
      }
    ],
    howToUse: [
      {
        step: 1,
        title: 'Lather & Penetrate',
        instructions: 'Apply to damp hair from roots to ends. Massage into a rich creamy froth and leave on for 90 seconds to allow peptide absorption.'
      },
      {
        step: 2,
        title: 'Cool Water Finish',
        instructions: 'Rinse with cool water to contract the hair cuticle and lock in amino peptides and light-reflecting silk.'
      }
    ],
    ingredients: [
      {
        name: 'Hydrolyzed Pisum Sativum (Pea) Peptide',
        role: 'Complete amino acid chain for cortex bond reconstruction',
        source: 'Upcycled green pea isolate'
      },
      {
        name: 'Hydrolyzed Silk Fibroin',
        role: 'High-adhesion biomimetic gloss shield',
        source: 'Cold-extracted silk protein'
      },
      {
        name: 'D-Panthenol (Pro-Vitamin B5)',
        role: 'Long-lasting cortex moisture binder',
        source: 'Vitamin B complex'
      },
      {
        name: 'Biotin (Vitamin B7)',
        role: 'Strengthens keratin infrastructure and follicular anchoring',
        source: 'Nutritional bio-factor'
      }
    ],
    faqs: [
      {
        q: 'Will protein shampoo make my hair stiff or brittle?',
        a: 'No! Unlike harsh synthetic keratin treatments that cause protein overload, our pea peptides are enzymatically micro-sheared to match human hair moisture ratios, keeping hair supple and fluid.'
      },
      {
        q: 'Is it suitable for fine, curly, or coarse hair?',
        a: 'Yes, it works exceptionally well on wavy (2A-2C), curly (3A-3C), and coily textures prone to humidity poofiness.'
      }
    ],
    additionalInfo: {
      shelfLife: '36 Months',
      manufacturer: 'Hairology Haute-Beauté Lab, Haridwar',
      origin: 'India',
      supportContact: 'Team HAIROLOGY Care',
      supportEmail: 'support@hairology.in',
      licenseNo: 'COS-UK-08/2026/04'
    },
    galleryImages: [
      { id: 'p1', title: 'Protein Shampoo Bottle', type: 'bottle', badge: 'FLUTED GLASS FINISH' },
      { id: 'p2', title: 'Cuticle Micro-Repair Peptides', type: 'ingredients', badge: 'PEA PEPTIDES' },
      { id: 'p3', title: '41% Frizz Reduction Proof', type: 'stats', badge: 'CLINICAL PROOF' },
      { id: 'p4', title: 'Usage & Leave-in Routine', type: 'benefits', badge: 'RECONSTRUCT RITUAL' },
      { id: 'p5', title: 'Cruelty-Free & Vegan', type: 'promise', badge: '100% VEGAN' },
      { id: 'p6', title: 'Customer Testimonials', type: 'reviews', badge: 'HIGH REPEAT' }
    ]
  }
];
