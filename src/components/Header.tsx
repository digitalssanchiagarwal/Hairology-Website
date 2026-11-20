import React, { useState } from 'react';
import { ShoppingBag, Search, UserCheck, Menu, X, Sparkles, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { USER_LOGO_IMAGE } from '../data/products';

export const Header: React.FC = () => {
  const { items, openCart, openVideoModal } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* 1. Top Announcement Marquee Ticker */}
      <div className="bg-[#121110] text-[#C5A880] py-2 px-4 text-[11px] sm:text-xs font-medium tracking-wider uppercase overflow-hidden border-b border-[#C5A880]/20 select-none">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
          <span className="flex items-center gap-2 font-bold tracking-widest text-[#FDFBF7]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            FIRST 50 ORDERS ONLY
          </span>
          <span className="text-[#C5A880]/40">•</span>
          <span className="text-amber-300 font-semibold tracking-wider">
            LIMITED STOCK
          </span>
          <span className="text-[#C5A880]/40">•</span>
          <span className="font-semibold tracking-wider text-[#C5A880]">
            FREE SHIPPING ON ORDERS ABOVE ₹449
          </span>
          <span className="text-[#C5A880]/40">•</span>
          <span className="flex items-center gap-2 font-bold tracking-widest text-[#FDFBF7]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            FIRST 50 ORDERS ONLY
          </span>
          <span className="text-[#C5A880]/40">•</span>
          <span className="text-amber-300 font-semibold tracking-wider">
            LIMITED STOCK
          </span>
          <span className="text-[#C5A880]/40">•</span>
          <span className="font-semibold tracking-wider text-[#C5A880]">
            FREE SHIPPING ON ORDERS ABOVE ₹449
          </span>
          <span className="text-[#C5A880]/40">•</span>
          <span className="flex items-center gap-2 font-bold tracking-widest text-[#FDFBF7]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            FIRST 50 ORDERS ONLY
          </span>
          <span className="text-[#C5A880]/40">•</span>
          <span className="text-amber-300 font-semibold tracking-wider">
            LIMITED STOCK
          </span>
          <span className="text-[#C5A880]/40">•</span>
          <span className="font-semibold tracking-wider text-[#C5A880]">
            FREE SHIPPING ON ORDERS ABOVE ₹449
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="bg-black border-b border-[#C5A880]/25 text-[#FDFBF7] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Menu Trigger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-[#E8DFD1] hover:text-[#C5A880] transition-colors -ml-2"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Gold Brand Logo Emblem - blended into black background */}
            <a
              href="#"
              className="flex flex-col items-start group py-1 select-none"
              aria-label="HAIROLOGY Home"
            >
              <img
                src={USER_LOGO_IMAGE}
                alt="HAIROLOGY"
                className="h-9 sm:h-11 md:h-12 w-auto object-contain mix-blend-screen drop-shadow-[0_0_15px_rgba(197,168,128,0.25)] transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="text-[7.5px] sm:text-[8.5px] tracking-[0.35em] text-[#C5A880]/80 uppercase font-medium mt-0.5 pl-1">
                HAIR CARE, ELEVATED
              </span>
            </a>
          </div>

          {/* Center: The Four Features from Screenshot */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-10">
            <button
              onClick={() => scrollToSection('products-showcase')}
              className="text-xs lg:text-[13px] font-semibold tracking-[0.22em] text-[#E8DFD1] hover:text-[#C5A880] transition-colors uppercase cursor-pointer"
            >
              COLLECTION
            </button>
            <button
              onClick={() => {
                scrollToSection('products-showcase');
                window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'hot-water-rosemary-duo' } }));
              }}
              className="text-xs lg:text-[13px] font-semibold tracking-[0.18em] text-[#E8DFD1] hover:text-[#C5A880] transition-colors uppercase cursor-pointer whitespace-nowrap"
            >
              HOT WATER + ROSEMARY
            </button>
            <button
              onClick={() => {
                scrollToSection('products-showcase');
                window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'protein-rosemary-duo' } }));
              }}
              className="text-xs lg:text-[13px] font-semibold tracking-[0.18em] text-[#E8DFD1] hover:text-[#C5A880] transition-colors uppercase cursor-pointer whitespace-nowrap"
            >
              PROTEIN + ROSEMARY
            </button>
            <button
              onClick={() => scrollToSection('reviews-section')}
              className="text-xs lg:text-[13px] font-semibold tracking-[0.22em] text-[#E8DFD1] hover:text-[#C5A880] transition-colors uppercase cursor-pointer"
            >
              REVIEWS
            </button>
          </nav>

          {/* Right: Quick actions & BAG (0) Boxed Button matching screenshot */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Icon */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[#E8DFD1]/80 hover:text-[#C5A880] transition-colors cursor-pointer"
              aria-label="Search products"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* BAG (0) Gold Boxed Button */}
            <button
              onClick={openCart}
              className="border border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880] hover:text-black px-4 sm:px-6 py-2 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 rounded-none cursor-pointer flex items-center justify-center select-none"
              aria-label="Shopping bag"
            >
              <span>BAG ({totalItemsCount})</span>
            </button>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        {searchOpen && (
          <div className="border-t border-[#C5A880]/20 bg-[#121110] px-4 py-3">
            {(() => {
              const panelQueries = [
                'founder panel',
                'founder-panel',
                'founderpanel',
                'owner panel',
                'owner-panel',
                'owner portal',
                'founder portal',
                'hairology panel',
                'admin panel',
              ];
              const triggerPanelIfMatched = (raw: string) => {
                const q = raw.trim().toLowerCase();
                if (panelQueries.some(pq => q === pq || q.includes(pq))) {
                  setSearchOpen(false);
                  setSearchQuery('');
                  window.dispatchEvent(new CustomEvent('open-admin-portal'));
                  return true;
                }
                return false;
              };
              const isTypingPanelKeyword = ['founder', 'owner', 'panel', 'admin'].some(kw =>
                searchQuery.toLowerCase().includes(kw)
              );

              return (
                <>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      triggerPanelIfMatched(searchQuery);
                    }}
                    className="max-w-2xl mx-auto flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-[#C5A880]" />
                    <input
                      type="text"
                      placeholder="Search Hot Water Shampoo, Protein, Ingredients, Chelating..."
                      value={searchQuery}
                      onChange={e => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        triggerPanelIfMatched(val);
                      }}
                      autoFocus
                      className="w-full text-sm bg-transparent border-none outline-none text-[#FDFBF7] placeholder-[#8A7463]"
                    />
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="text-xs text-[#8A7463] hover:text-[#C5A880]"
                    >
                      Close
                    </button>
                  </form>
                  {searchQuery && !isTypingPanelKeyword && (
                    <div className="max-w-2xl mx-auto mt-2 pt-2 border-t border-[#C5A880]/15 text-xs text-[#E8DFD1]/80 flex flex-wrap gap-2">
                      <span>Quick results:</span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'the-trio' } }));
                  }}
                  className="font-medium underline hover:text-[#C5A880]"
                >
                  The Hairology Trio (₹1299)
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'the-duo' } }));
                  }}
                  className="font-medium underline hover:text-[#C5A880]"
                >
                  The Hairology Duo (₹849)
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'hot-water-rosemary-duo' } }));
                  }}
                  className="font-medium underline hover:text-[#C5A880]"
                >
                  Hot Water + Rosemary (₹949)
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'protein-rosemary-duo' } }));
                  }}
                  className="font-medium underline hover:text-[#C5A880]"
                >
                  Protein + Rosemary (₹949)
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'hot-water-shampoo' } }));
                  }}
                  className="font-medium underline hover:text-[#C5A880]"
                >
                  Hot Water Clarifying Shampoo (₹449)
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'protein-shampoo' } }));
                  }}
                  className="font-medium underline hover:text-[#C5A880]"
                >
                  Protein Reconstruct Shampoo (₹449)
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'rosemary-conditioner' } }));
                  }}
                  className="font-medium underline hover:text-[#C5A880]"
                >
                  ROSEMARY CONDITIONER (₹549)
                </button>
                      </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* 3. Continuous Tilted Marquee Ribbon */}
      <div className="bg-[#0a0a0a] text-[#C5A880] border-y border-[#C5A880]/20 py-2.5 overflow-hidden select-none">
        <div className="animate-marquee whitespace-nowrap text-[10px] sm:text-[11px] font-semibold tracking-[0.25em] flex items-center gap-8 uppercase">
          <span>NO SILICONS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>NO PARABENS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>NO SULPHATES</span>
          <span className="text-[#C5A880]">✦</span>
          <span>FOR ALL INDIAN HAIRS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>LAB TESTED</span>
          <span className="text-[#C5A880]">✦</span>
          <span>PROTEIN INCLUDED</span>
          <span className="text-[#C5A880]">✦</span>
          <span>NO SILICONS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>NO PARABENS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>NO SULPHATES</span>
          <span className="text-[#C5A880]">✦</span>
          <span>FOR ALL INDIAN HAIRS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>LAB TESTED</span>
          <span className="text-[#C5A880]">✦</span>
          <span>PROTEIN INCLUDED</span>
          <span className="text-[#C5A880]">✦</span>
          <span>NO SILICONS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>NO PARABENS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>NO SULPHATES</span>
          <span className="text-[#C5A880]">✦</span>
          <span>FOR ALL INDIAN HAIRS</span>
          <span className="text-[#C5A880]">✦</span>
          <span>LAB TESTED</span>
          <span className="text-[#C5A880]">✦</span>
          <span>PROTEIN INCLUDED</span>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden flex">
          <div className="w-4/5 max-w-sm bg-[#0c0b0a] text-[#FDFBF7] h-full shadow-2xl p-6 flex flex-col justify-between border-r border-[#C5A880]/20">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#C5A880]/20">
                <div className="flex items-center">
                  <img
                    src={USER_LOGO_IMAGE}
                    alt="HAIROLOGY Logo"
                    className="h-8 w-auto object-contain mix-blend-screen"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#E8DFD1] hover:text-[#C5A880]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6 flex flex-col gap-4 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-[#E8DFD1]">
                <button
                  onClick={() => scrollToSection('products-showcase')}
                  className="text-left py-2 hover:text-[#C5A880] transition-colors"
                >
                  COLLECTION
                </button>
                <button
                  onClick={() => {
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'hot-water-shampoo' } }));
                  }}
                  className="text-left py-2 hover:text-[#C5A880] transition-colors"
                >
                  HOT WATER
                </button>
                <button
                  onClick={() => {
                    scrollToSection('products-showcase');
                    window.dispatchEvent(new CustomEvent('open-product-detail', { detail: { productId: 'protein-shampoo' } }));
                  }}
                  className="text-left py-2 hover:text-[#C5A880] transition-colors"
                >
                  PROTEIN
                </button>
                <button
                  onClick={() => scrollToSection('reviews-section')}
                  className="text-left py-2 hover:text-[#C5A880] transition-colors"
                >
                  REVIEWS
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-[#C5A880]/20 text-xs text-[#8A7463] space-y-1">
              <div className="text-[11px] text-[#C5A880] font-mono">
                Team HAIROLOGY Care: support@hairology.in
              </div>
              <div className="text-[11px]">Hairology Haute-Beauté D2C • Hard Water Haircare</div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}
    </header>
  );
};
