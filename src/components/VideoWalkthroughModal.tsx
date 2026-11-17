import React from 'react';
import { X, Sparkles, CheckCircle2, Play } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { USER_VIDEO_URL } from '../data/products';

export const VideoWalkthroughModal: React.FC = () => {
  const { isVideoModalOpen, closeVideoModal } = useCart();

  if (!isVideoModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#1C1A18] rounded-3xl border border-[#C5A880]/40 max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-[#121110] border-b border-[#C5A880]/30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <h3 className="font-serif text-lg font-bold">
              Hairology Official Product & Wash-Day Film
            </h3>
          </div>

          <button
            onClick={closeVideoModal}
            className="p-1.5 text-[#E8DFD1]/80 hover:text-white"
            aria-label="Close video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            src={USER_VIDEO_URL}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Footer with key features shown in the film */}
        <div className="p-4 bg-[#121110] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#E8DFD1]/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
            <span>Demonstrates The Duo Wash Routine, Chelating Science, and Frizz Shield.</span>
          </div>

          <button
            onClick={closeVideoModal}
            className="px-4 py-2 bg-[#C5A880] text-[#121110] font-bold uppercase tracking-wider rounded-lg hover:bg-[#B39265]"
          >
            Done Watching
          </button>
        </div>

      </div>
    </div>
  );
};
