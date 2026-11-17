import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { USER_HERO_IMAGE } from '../data/products';

export const HairologyRoutine: React.FC = () => {
  const { addItem } = useCart();

  const steps = [
    {
      num: 1,
      title: 'CLEANSE',
      productName: 'Hot Water Shampoo',
      action: 'Gently cleanse & dissolve calcified tap water residue',
      badge: 'Day 1 Wash',
      desc: 'Thermal vapor chelation flushes calcium and magnesium carbonates that cause brittleness.',
      productId: 'hot-water-shampoo',
      variantId: 'hot-full',
      price: 449
    },
    {
      num: 2,
      title: 'RECONSTRUCT',
      productName: 'Protein Shampoo',
      action: 'Nourish peptides & reconstruct cortical fractures',
      badge: 'Day 4 Wash',
      desc: 'Hydrolyzed pea peptides and silk fibroin lock into porous fissures for 72h anti-frizz.',
      productId: 'protein-shampoo',
      variantId: 'protein-full',
      price: 449
    },
    {
      num: 3,
      title: 'SHIELD',
      productName: 'Ectoin Humidity Barrier',
      action: 'Seal cuticles & resist monsoon humidity',
      badge: 'Finish Step',
      desc: 'Halophile extremolytes form a light-refracting film that repels ambient atmospheric water.',
      productId: 'the-duo',
      variantId: 'duo-full',
      price: 849
    }
  ];

  return (
    <section id="science-section" className="py-16 lg:py-24 bg-[#F3EDE2] border-b border-[#E8DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-semibold tracking-[0.25em] text-[#8A7463] uppercase mb-2">
            CYCLICAL PROTOCOL
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#121110]">
            THE HAIROLOGY <span className="italic font-normal text-[#C5A880]">ROUTINE</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#3D3A37] max-w-xl mx-auto">
            A proven 4-stage system formulated to counter hard Indian water, humidity, and heat stress.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(step => (
            <div
              key={step.num}
              className="bg-white rounded-2xl border border-[#E8DFD1] p-6 flex flex-col justify-between hover:shadow-xl transition-all relative group"
            >
              <div>
                {/* Step number badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#121110] text-[#C5A880] text-sm font-bold flex items-center justify-center font-serif shadow">
                    {step.num}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-[#F3EDE2] text-[#8A7463] px-2.5 py-1 rounded-full">
                    {step.badge}
                  </span>
                </div>

                {/* Step Title */}
                <div className="text-xs font-bold tracking-widest uppercase text-[#8A7463] mb-1">
                  {step.title}
                </div>
                <h3 className="font-serif text-xl font-bold text-[#121110] mb-2">
                  {step.productName}
                </h3>
                <div className="text-xs font-semibold text-[#9E3C1B] mb-3">
                  {step.action}
                </div>
                <p className="text-xs text-[#3D3A37] leading-relaxed mb-6">
                  {step.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E8DFD1] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#8A7463]">Price</span>
                  <div className="text-sm font-bold text-[#121110] tabular-nums">
                    ₹{step.price}
                  </div>
                </div>

                <button
                  onClick={() => addItem(step.productId, step.variantId, 1)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#121110] text-[#C5A880] hover:bg-[#3D3A37] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Add +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Banner to claim the full routine duo */}
        <div className="mt-12 bg-[#121110] text-white rounded-2xl p-6 sm:p-8 border border-[#C5A880]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full bg-[#C5A880]/20 flex items-center justify-center shrink-0 text-[#C5A880]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[#C5A880] font-semibold">
                Complete System Savings
              </div>
              <div className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                Get The Full Duo (Clarify & Reconstruct)
              </div>
              <div className="text-xs text-[#E8DFD1]/70 mt-1">
                Save ₹150 on the complete launch bundle (Total Value ₹999 for ₹849).
              </div>
            </div>
          </div>

          <button
            onClick={() => addItem('the-duo', 'duo-full', 1)}
            className="px-6 py-3 bg-[#C5A880] hover:bg-[#B39265] text-[#121110] text-xs font-bold tracking-wider uppercase rounded-lg shadow transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>ADD THE DUO (₹849)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
