import React from 'react';
import { Star, Play, CheckCircle2, Video } from 'lucide-react';
import { UGC_STORIES } from '../data/reviews';
import { useCart } from '../context/CartContext';

export const TheyreSpeakingVolumes: React.FC = () => {
  const { openVideoModal } = useCart();

  return (
    <section className="py-16 lg:py-24 bg-[#FDFBF7] border-b border-[#E8DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-[#8A7463] uppercase mb-2">
              REAL VOICES • REAL ROUTINES
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#121110]">
              THEY'RE <span className="italic font-normal text-[#C5A880]">SPEAKING VOLUMES</span>
            </h2>
          </div>

          <button
            onClick={openVideoModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#121110] text-[#C5A880] text-xs font-semibold tracking-wider uppercase hover:bg-[#3D3A37] transition-all self-start md:self-auto cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>PLAY OFFICIAL WALKTHROUGH REEL</span>
          </button>
        </div>

        {/* Story Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {UGC_STORIES.map(item => (
            <div
              key={item.id}
              onClick={openVideoModal}
              className="bg-white rounded-2xl border border-[#E8DFD1] p-4 flex flex-col justify-between hover:shadow-lg hover:border-[#C5A880] transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Top media placeholder simulating UGC video thumbnail */}
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-br from-[#2D2824] via-[#3E3731] to-[#1E1B18] mb-3 flex flex-col justify-between p-3 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[#C5A880]">
                    {item.videoSnippet}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-[11px] text-[#E8DFD1]/80">Before: {item.beforeDesc}</div>
                  <div className="text-xs font-bold text-[#C5A880] mt-0.5">Now: {item.afterDesc}</div>
                </div>
              </div>

              {/* Review details */}
              <div>
                <div className="flex items-center gap-0.5 text-[#C5A880] mb-1.5">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#C5A880]" />
                  ))}
                </div>

                <h4 className="text-xs font-bold text-[#121110] line-clamp-1 mb-1">
                  "{item.quote}"
                </h4>

                <p className="text-[11px] text-[#3D3A37] line-clamp-2 leading-relaxed">
                  {item.sub}
                </p>
              </div>

              {/* Author Footer */}
              <div className="mt-3 pt-2.5 border-t border-[#E8DFD1]/60 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#121110] flex items-center gap-1">
                  {item.author}
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </span>
                <span className="text-[#8A7463]">{item.city}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
