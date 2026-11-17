import React, { useState } from 'react';
import { Star, Plus, Minus, Check, ArrowRight } from 'lucide-react';
import { PRODUCTS, USER_HERO_IMAGE } from '../data/products';
import { useCart } from '../context/CartContext';

export const CrowdFavourites: React.FC = () => {
  const { items, addItem, updateQuantity } = useCart();
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'the-duo': 'duo-full',
    'hot-water-shampoo': 'hot-full',
    'protein-shampoo': 'protein-full'
  });

  const handleVariantChange = (productId: string, variantId: string) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
  };

  return (
    <section id="shop-hero" className="py-16 lg:py-24 bg-[#FDFBF7] border-b border-[#E8DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-semibold tracking-[0.25em] text-[#8A7463] uppercase mb-2">
            CURATED HAIRCUTICALS
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#121110]">
            THE CROWD <span className="italic font-normal text-[#C5A880]">FAVOURITES</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#3D3A37] max-w-xl mx-auto">
            Targeted solutions addressing hard water mineral residue, frizz, and heat damage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map(product => {
            const activeVariantId = selectedVariants[product.id] || product.variants[0].id;
            const currentVariant = product.variants.find(v => v.id === activeVariantId) || product.variants[0];
            const cartItem = items.find(i => i.productId === product.id && i.variantId === activeVariantId);
            const discountPercent = Math.round(((currentVariant.mrp - currentVariant.price) / currentVariant.mrp) * 100);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#E8DFD1] p-5 flex flex-col justify-between hover:border-[#C5A880] hover:shadow-xl transition-all group"
              >
                <div>
                  {/* Image Card Container */}
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gradient-to-b from-[#FDFBF7] to-[#F3EDE2] mb-4 flex items-center justify-center p-4">
                    <img
                      src={USER_HERO_IMAGE}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-md"
                    />

                    {/* Top status badge */}
                    {product.badge && (
                      <div className="absolute top-3 left-3 bg-[#121110] text-[#C5A880] text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded shadow">
                        {product.badge}
                      </div>
                    )}

                    {/* Discount badge */}
                    <div className="absolute top-3 right-3 bg-[#9E3C1B] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      {discountPercent}% OFF
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-[#C5A880] mb-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C5A880]" />
                    ))}
                    <span className="text-xs font-bold text-[#121110] ml-1 tabular-nums">
                      {product.rating}
                    </span>
                    <span className="text-[11px] text-[#8A7463]">
                      ({product.reviewsCount})
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-serif text-lg font-bold text-[#121110] leading-snug mb-1 line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-xs text-[#3D3A37] line-clamp-2 leading-relaxed mb-3">
                    {product.tagline}
                  </p>

                  {/* Variant Size Selector Dropdown / Pill */}
                  {product.variants.length > 1 && (
                    <div className="mb-4">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-[#8A7463] block mb-1">
                        Size Option:
                      </label>
                      <select
                        value={activeVariantId}
                        onChange={e => handleVariantChange(product.id, e.target.value)}
                        className="w-full text-xs bg-[#FDFBF7] border border-[#E8DFD1] rounded-lg px-2.5 py-1.5 text-[#121110] outline-none font-medium"
                      >
                        {product.variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.label} — ₹{v.price}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Pricing row */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-serif font-bold text-[#121110] tabular-nums">
                      ₹{currentVariant.price}
                    </span>
                    <span className="text-xs line-through text-[#8A7463] tabular-nums">
                      ₹{currentVariant.mrp}
                    </span>
                  </div>
                </div>

                {/* Add to Cart button / Active Stepper */}
                <div className="pt-3 border-t border-[#E8DFD1]">
                  {cartItem ? (
                    <div className="flex items-center justify-between bg-[#121110] text-[#C5A880] rounded-xl px-3 py-2">
                      <button
                        onClick={() => updateQuantity(product.id, activeVariantId, cartItem.quantity - 1)}
                        className="p-1 hover:text-white"
                        aria-label="Decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold font-mono">
                        {cartItem.quantity} In Bag
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, activeVariantId, cartItem.quantity + 1)}
                        className="p-1 hover:text-white"
                        aria-label="Increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItem(product.id, activeVariantId, 1)}
                      className="w-full py-2.5 px-4 bg-[#121110] hover:bg-[#3D3A37] text-[#C5A880] text-xs font-bold tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>ADD TO CART</span>
                      <span>•</span>
                      <span>₹{currentVariant.price}</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
