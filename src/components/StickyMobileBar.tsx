import React from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const StickyMobileBar: React.FC = () => {
  const { items, openCart, addItem } = useCart();
  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      {/* Sticky Bottom Bar on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#E8DFD1] p-3 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-[#8A7463] font-bold">
            The Hairology Duo
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-lg font-bold text-[#121110]">₹849</span>
            <span className="text-xs line-through text-[#8A7463]">₹999</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addItem('the-duo', 'duo-full', 1)}
            className="px-4 py-2.5 bg-[#121110] text-[#C5A880] text-xs font-bold tracking-wider uppercase rounded-xl shadow cursor-pointer"
          >
            Add To Bag
          </button>
          
          <button
            onClick={openCart}
            className="p-2.5 bg-[#F3EDE2] text-[#121110] border border-[#E8DFD1] rounded-xl relative"
            aria-label="View Bag"
          >
            <ShoppingBag className="w-4 h-4" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#121110] text-[#FDFBF7] text-[9px] font-bold flex items-center justify-center border border-[#C5A880]">
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
