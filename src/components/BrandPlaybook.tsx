import React from 'react';
import { Droplet, Award, Zap, ShieldCheck } from 'lucide-react';

export const BrandPlaybook: React.FC = () => {
  const pillars = [
    {
      icon: Droplet,
      title: 'FORMULATED FOR INDIAN STRANDS',
      tag: 'Hard-Water Chelating',
      desc: 'Indian municipal and borewell water contains up to 800+ ppm of calcium, magnesium, and rust carbonates. Our formulas encapsulate and eliminate these heavy metals before they cause brittle hair breakage.'
    },
    {
      icon: Award,
      title: 'COSMETIC TRICHOLOGY LAB',
      tag: 'Scientist-Formulated',
      desc: 'Engineered in our Haridwar haute-beauté laboratory under ISO 9001 and GMP standards, pairing botanical extremolytes with clinical amino-peptides for predictable, proven results.'
    },
    {
      icon: Zap,
      title: 'THERMAL & PEPTIDE INNOVATION',
      tag: 'Bio-Identical Bonding',
      desc: 'Steam-activated chelation triggers in the warm shower mist, opening the gateway for bio-identical pea peptides and hydrolyzed silk fibroin to bond with fractured cortex layers.'
    },
    {
      icon: ShieldCheck,
      title: 'SQUEAKY CLEAN CONSTITUTION',
      tag: 'No Nasties Standard',
      desc: 'Zero sulfates, zero parabens, zero silicones, zero phthalates, and zero synthetic dyes. 100% vegan, cruelty-free, and color-safe for all chemically treated hair types.'
    }
  ];

  return (
    <section id="science-section" className="py-20 lg:py-28 bg-[#121110] text-[#FDFBF7] relative overflow-hidden border-b border-[#C5A880]/20">
      
      {/* Background radial gold sheen */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-[#C5A880]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#9E3C1B]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-semibold tracking-[0.25em] text-[#C5A880] uppercase mb-3">
            OUR PRODUCT PLAYBOOK
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            THE ANATOMY OF <br />
            <span className="italic font-normal text-[#C5A880]">HIGH-PERFORMANCE HAIRCARE</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#E8DFD1]/80 max-w-2xl leading-relaxed">
            International cosmetic houses formulate for European soft tap water. We formulated HAIROLOGY strictly for the mineral realities, intense UV, and humidity of the Indian subcontinent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-[#1C1A18] rounded-2xl p-6 sm:p-8 border border-[#C5A880]/20 hover:border-[#C5A880] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#282522] border border-[#C5A880]/30 flex items-center justify-center text-[#C5A880] mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className="text-[10px] font-bold tracking-widest uppercase text-[#C5A880] block mb-1">
                    {pillar.tag}
                  </span>

                  <h3 className="font-serif text-xl font-bold text-white mb-3 leading-snug">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-[#E8DFD1]/70 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 text-[11px] font-mono text-[#8A7463]">
                  Pillar 0{idx + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Clean Badges Row */}
        <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="text-lg font-serif font-bold text-[#C5A880]">Sulphate-Free</div>
            <div className="text-[11px] text-[#E8DFD1]/60 mt-1">Apple Amino Acid Foam</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="text-lg font-serif font-bold text-[#C5A880]">100% Vegan</div>
            <div className="text-[11px] text-[#E8DFD1]/60 mt-1">Bio-Identical Pea Peptides</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="text-lg font-serif font-bold text-[#C5A880]">Cruelty-Free</div>
            <div className="text-[11px] text-[#E8DFD1]/60 mt-1">PETA Certified Lab</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5">
            <div className="text-lg font-serif font-bold text-[#C5A880]">ISO 9001 & GMP</div>
            <div className="text-[11px] text-[#E8DFD1]/60 mt-1">Haridwar Laboratory</div>
          </div>
        </div>

      </div>
    </section>
  );
};
