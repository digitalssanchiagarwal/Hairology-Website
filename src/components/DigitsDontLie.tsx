import React, { useState, useRef } from 'react';
import { Sliders, Sparkles, CheckCircle2 } from 'lucide-react';

export const DigitsDontLie: React.FC = () => {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [activeTab, setActiveTab] = useState<'hot' | 'protein' | 'duo'>('duo');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerDown = () => {
    isDragging.current = true;
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clamped = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(clamped);
  };

  const scenarios = {
    duo: {
      title: 'The Hairology Cyclical Duo Routine',
      subtitle: 'Day 1 Clarify + Day 4 Reconstruct with Pea Peptides',
      beforeLabel: 'BEFORE (Hard Water Buildup & Frizz)',
      beforeDesc: 'Chalky calcium carbonates weighing down roots, fractured cortical cuticles poofing up in humidity.',
      afterLabel: 'AFTER (Day 3 After Hairology)',
      afterDesc: 'Weightless clarified scalp, aligned prismatic light reflection, 72-hour zero frizz barrier.'
    },
    hot: {
      title: 'Hot Water Shampoo (Thermal Chelation)',
      subtitle: 'Steam-activated detox for Indian municipal tap & tanker water',
      beforeLabel: 'BEFORE (Limp & Mineral Coated)',
      beforeDesc: 'Follicles suffocated by heavy magnesium & iron deposits, lack of natural volume.',
      afterLabel: 'AFTER (Single Wash Detox)',
      afterDesc: '23% root volume lift, clean follicular aeration, featherweight natural movement.'
    },
    protein: {
      title: 'Protein Shampoo (Bio-Identical Pea Peptides)',
      subtitle: 'Reconstructive cuticular bonding and anti-breakage',
      beforeLabel: 'BEFORE (High Breakage & Split Ends)',
      beforeDesc: 'Fissured hair cuticles, brittle snapping during brush strokes, dry porous texture.',
      afterLabel: 'AFTER (72-Hour Frizz Shield)',
      afterDesc: '15x less breakage, silk fibroin light bounce, smooth glossy cuticle alignment.'
    }
  };

  const currentScenario = scenarios[activeTab];

  return (
    <section id="science-section" className="py-16 lg:py-24 bg-[#F3EDE2] border-b border-[#E8DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-semibold tracking-[0.25em] text-[#8A7463] uppercase mb-2">
            CLINICALLY MEASURED TRANSFORMATION
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#121110] tracking-tight">
            DIGITS <span className="italic font-normal text-[#C5A880]">DON'T LIE</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#3D3A37] max-w-xl mx-auto">
            Formulated for the hard mineral reality of Indian water. The numbers behind every single wash day.
          </p>
        </div>

        {/* 3 Prominent Stat Counters (Matching Video) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-[#FDFBF7] p-8 rounded-2xl border border-[#E8DFD1] text-center shadow-sm relative group hover:border-[#C5A880] transition-all">
            <div className="text-4xl sm:text-5xl font-serif font-bold text-[#121110] mb-2 tabular-nums">
              15x
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-[#121110]">
              Less Breakage in 6 Washes*
            </div>
            <div className="text-xs text-[#8A7463] mt-2">
              *vs standard salon shampoo and regular conditioner
            </div>
          </div>

          <div className="bg-[#121110] text-[#FDFBF7] p-8 rounded-2xl border border-[#C5A880]/30 text-center shadow-md relative group hover:border-[#C5A880] transition-all">
            <div className="text-4xl sm:text-5xl font-serif font-bold text-[#C5A880] mb-2 tabular-nums">
              41%
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-white">
              Less Frizz in 6 Washes*
            </div>
            <div className="text-xs text-[#C5A880]/70 mt-2">
              *clinically verified under 85% relative humidity
            </div>
          </div>

          <div className="bg-[#FDFBF7] p-8 rounded-2xl border border-[#E8DFD1] text-center shadow-sm relative group hover:border-[#C5A880] transition-all">
            <div className="text-4xl sm:text-5xl font-serif font-bold text-[#121110] mb-2 tabular-nums">
              23%
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-[#121110]">
              More Voluminous Hair in 3 Washes*
            </div>
            <div className="text-xs text-[#8A7463] mt-2">
              *measured at scalp root baseline after mineral chelation
            </div>
          </div>
        </div>

        {/* Interactive Before & After Slider Module */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-[#E8DFD1] shadow-xl">
          
          {/* Scenario Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab('duo')}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'duo'
                  ? 'bg-[#121110] text-[#C5A880]'
                  : 'bg-[#F3EDE2] text-[#3D3A37] hover:text-[#121110]'
              }`}
            >
              The Hairology Duo
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'hot'
                  ? 'bg-[#121110] text-[#C5A880]'
                  : 'bg-[#F3EDE2] text-[#3D3A37] hover:text-[#121110]'
              }`}
            >
              Hot Water Clarify
            </button>
            <button
              onClick={() => setActiveTab('protein')}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === 'protein'
                  ? 'bg-[#121110] text-[#C5A880]'
                  : 'bg-[#F3EDE2] text-[#3D3A37] hover:text-[#121110]'
              }`}
            >
              Protein Reconstruct
            </button>
          </div>

          <div className="text-center mb-6">
            <h3 className="font-serif text-2xl font-bold text-[#121110]">
              {currentScenario.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#8A7463] mt-1">
              {currentScenario.subtitle} • Drag the slider horizontally to compare
            </p>
          </div>

          {/* Interactive Split Canvas */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-[#E8DFD1] shadow-inner bg-[#121110]"
          >
            {/* "AFTER" Layer (Full background) */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#23201D] to-[#121110] flex flex-col justify-between p-6 sm:p-10 text-white">
              <div className="flex justify-end">
                <div className="backdrop-blur-md bg-emerald-900/60 border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AFTER 3 WASHES</span>
                </div>
              </div>

              <div className="max-w-xs ml-auto text-right">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[#C5A880]">
                  Gleaming, Resilient & Clean
                </div>
                <div className="text-xs text-[#E8DFD1] mt-2 leading-relaxed">
                  {currentScenario.afterDesc}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-[#C5A880]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero Heavy Metal Residue</span>
                </div>
              </div>
            </div>

            {/* "BEFORE" Layer (Clipped to sliderPos width) */}
            <div
              className="absolute inset-0 h-full bg-gradient-to-br from-[#3D3730] to-[#2B2723] overflow-hidden flex flex-col justify-between p-6 sm:p-10 text-white"
              style={{ width: `${sliderPos}%` }}
            >
              <div className="flex justify-start">
                <div className="backdrop-blur-md bg-amber-900/60 border border-amber-400/40 text-amber-200 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full">
                  BEFORE (UNTREATED HARD WATER)
                </div>
              </div>

              <div className="max-w-xs text-left">
                <div className="font-serif text-2xl sm:text-3xl font-bold text-[#E8DFD1]">
                  Brittle, Frizzy & Coated
                </div>
                <div className="text-xs text-[#E8DFD1]/80 mt-2 leading-relaxed">
                  {currentScenario.beforeDesc}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-300">
                  <span>✕ Heavy calcium/magnesium coating</span>
                </div>
              </div>
            </div>

            {/* Draggable Divider Line & Knob */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.8)] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#121110] border-2 border-[#C5A880] text-[#C5A880] flex items-center justify-center shadow-xl">
                <Sliders className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Bottom helper text */}
          <div className="flex items-center justify-between text-xs text-[#8A7463] mt-4 px-2">
            <span>◀ Drag Left to Reveal After</span>
            <span>Drag Right to Inspect Before ▶</span>
          </div>

        </div>

      </div>
    </section>
  );
};
