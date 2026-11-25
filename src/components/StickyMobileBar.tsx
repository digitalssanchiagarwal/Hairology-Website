import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const StickyMobileBar: React.FC = () => {
  const { items, subtotal, openCart, openCheckout } = useCart();
  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#E8DFD1] p-3 flex items-center justify-between gap-3 shadow-2xl">
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-[#8A7463] font-bold">
          {totalCount} {totalCount === 1 ? 'Item' : 'Items'} in Bag
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-lg font-bold text-[#121110] tabular-nums">
            ₹{subtotal.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={openCheckout}
          className="px-4 py-2.5 bg-[#121110] text-[#C5A880] text-xs font-bold tracking-wider uppercase rounded-xl shadow cursor-pointer"
        >
          Checkout
        </button>

        <button
          type="button"
          onClick={openCart}
          className="p-2.5 bg-[#F3EDE2] text-[#121110] border border-[#E8DFD1] rounded-xl relative cursor-pointer"
          aria-label="View Bag"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#121110] text-[#FDFBF7] text-[9px] font-bold flex items-center justify-center border border-[#C5A880]">
            {totalCount}
          </span>
        </button>
      </div>
    </div>
  );
};
