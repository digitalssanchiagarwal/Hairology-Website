import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  ShoppingBag
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const { 
    isCartOpen, 
    closeCart, 
    items, 
    addItem,
    removeItem, 
    updateQuantity, 
    subtotal, 
    totalSavings, 
    shippingFee, 
    openCheckout
  } = useCart();

  const finalTotal = Math.max(0, subtotal + shippingFee);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/60 backdrop-blur-sm flex justify-end">
      {/* Background click dismiss */}
      <div className="flex-1" onClick={closeCart}></div>

      {/* Cart Container */}
      <div className="w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl flex flex-col justify-between border-l border-[#E8DFD1] animate-in slide-in-from-right duration-300">
        
        {/* ================= 1. HEADER ================= */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#121110]" />
            <h3 className="font-serif text-xl font-bold text-[#121110]">
              Your Shopping Bag
            </h3>
            <span className="text-xs font-bold bg-[#F3EDE2] text-[#8A7463] px-2 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>

          <button
            onClick={closeCart}
            className="p-1.5 text-[#8A7463] hover:text-[#121110] transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>


        {/* ================= 2. SCROLLABLE CART ITEMS ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#F3EDE2] text-[#8A7463] flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#121110]">
                Your Bag is Empty
              </h4>
              <p className="text-xs text-[#8A7463] mt-1 max-w-xs mx-auto">
                Explore our science-backed formulations for Indian hard water.
              </p>
              <button
                type="button"
                onClick={() => addItem('the-trio', 'trio-full', 1)}
                className="mt-6 px-6 py-2.5 bg-[#121110] text-[#C5A880] text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#3D3A37] cursor-pointer"
              >
                Buy Trio
              </button>
            </div>
          ) : (
            items.map(item => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="bg-white rounded-xl border border-[#E8DFD1] p-3.5 flex gap-3 shadow-sm relative group"
              >
                {/* Thumb */}
                <div className="w-16 h-20 rounded-lg bg-[#FDFBF7] border border-[#E8DFD1] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-sm font-bold text-[#121110] line-clamp-1">
                        {item.productName}
                      </h4>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-[#8A7463] hover:text-[#9E3C1B] p-0.5"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[11px] text-[#8A7463] mt-0.5">
                      {item.variantLabel}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-[#E8DFD1] rounded-lg bg-[#FDFBF7] px-1.5 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="p-1 text-[#121110] hover:text-[#C5A880]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="p-1 text-[#121110] hover:text-[#C5A880]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="text-xs line-through text-[#8A7463] tabular-nums">
                        ₹{item.mrp * item.quantity}
                      </div>
                      <div className="text-sm font-bold text-[#121110] tabular-nums">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

        </div>


        {/* ================= 4. SUMMARY & CHECKOUT BUTTON ================= */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-[#E8DFD1] space-y-3">
            
            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs text-[#3D3A37]">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-mono text-[#121110]">₹{subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Express Air Shipping</span>
                <span className="font-mono text-[#121110]">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[11px]">FREE</span>
                  ) : (
                    `₹${shippingFee}`
                  )}
                </span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-[#9E3C1B] font-semibold text-[11px] pt-1 border-t border-dashed border-[#E8DFD1]">
                  <span>Total Launch Savings</span>
                  <span>₹{totalSavings} Saved</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold text-[#121110] pt-2 border-t border-[#E8DFD1]">
                <span>To Pay</span>
                <span className="font-serif text-xl tabular-nums">₹{finalTotal}</span>
              </div>
            </div>

            {/* Primary Fast Checkout Button */}
            <button
              onClick={openCheckout}
              className="w-full py-4 bg-[#121110] hover:bg-[#2A2724] text-[#C5A880] text-xs font-bold tracking-widest uppercase rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-[#C5A880]/30 hover:border-[#C5A880]"
            >
              <span>FAST CHECKOUT (UPI) — ₹{finalTotal}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-4 text-[10px] text-[#8A7463] pt-1 border-t border-[#E8DFD1]/60">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                100% Secure SSL
              </span>
              <span>•</span>
              <span>Any UPI App</span>
              <span>•</span>
              <span>Instant QR Scanner</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
