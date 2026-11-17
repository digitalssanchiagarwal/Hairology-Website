import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ExternalLink, RefreshCw, ShoppingBag, ArrowRight, ShieldCheck, Key, Globe } from 'lucide-react';
import { getShopifyConfig, saveShopifyConfig, ShopifyConfig, buildShopifyCartUrl } from '../services/shopify';
import { useCart } from '../context/CartContext';

interface ShopifyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopifyConnectModal: React.FC<ShopifyConnectModalProps> = ({ isOpen, onClose }) => {
  const { items, appliedCoupon } = useCart();
  const [config, setConfig] = useState<ShopifyConfig>(getShopifyConfig());
  const [storeDomain, setStoreDomain] = useState(config.storeDomain);
  const [storefrontToken, setStorefrontToken] = useState(config.storefrontAccessToken || '');
  const [theDuoVariant, setTheDuoVariant] = useState(config.productVariantIds['the-duo'] || '');
  const [hotWaterVariant, setHotWaterVariant] = useState(config.productVariantIds['hot-water-shampoo'] || '');
  const [proteinVariant, setProteinVariant] = useState(config.productVariantIds['protein-shampoo'] || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getShopifyConfig();
      setConfig(current);
      setStoreDomain(current.storeDomain);
      setStorefrontToken(current.storefrontAccessToken || '');
      setTheDuoVariant(current.productVariantIds['the-duo'] || '');
      setHotWaterVariant(current.productVariantIds['hot-water-shampoo'] || '');
      setProteinVariant(current.productVariantIds['protein-shampoo'] || '');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveShopifyConfig({
      storeDomain: storeDomain.trim(),
      storefrontAccessToken: storefrontToken.trim(),
      isEnabled: true,
      productVariantIds: {
        'the-duo': theDuoVariant.trim() || '46829103845920',
        'hot-water-shampoo': hotWaterVariant.trim() || '46829103845921',
        'protein-shampoo': proteinVariant.trim() || '46829103845922',
      }
    });
    setConfig(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const sampleItems = items.length > 0 ? items : [{ productId: 'the-duo', quantity: 1 }];
  const previewCartUrl = buildShopifyCartUrl(sampleItems, appliedCoupon?.code);

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] rounded-3xl border border-[#C5A880]/40 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-5 bg-[#121110] text-[#FDFBF7] border-b border-[#C5A880]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#95BF47] text-black font-extrabold flex items-center justify-center shadow-md">
              {/* Shopify Bag Icon */}
              <ShoppingBag className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FDFBF7]">
                  Shopify Store Connection
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              </div>
              <p className="text-xs text-[#C5A880]">
                Sync your Hairology custom storefront with your Shopify Admin & Checkout
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#E8DFD1]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs text-[#121110] overflow-y-auto max-h-[75vh]">
          
          {/* Active Connection Status Card */}
          <div className="p-4 rounded-2xl bg-[#F4EFEB] border border-[#E8DFD1] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A7463]">
                Target Shopify Checkout Domain
              </div>
              <div className="font-mono text-sm font-bold text-[#121110] mt-0.5">
                https://{storeDomain || 'hairology-haircare.myshopify.com'}
              </div>
            </div>
            <a
              href={previewCartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#121110] hover:bg-[#2A2724] text-[#C5A880] rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Test Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Setting 1: Store Domain */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#121110] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Shopify Store Domain (myshopify.com or custom domain)</span>
            </label>
            <input
              type="text"
              required
              value={storeDomain}
              onChange={e => setStoreDomain(e.target.value)}
              placeholder="e.g. your-store.myshopify.com or shop.hairology.in"
              className="w-full p-3 rounded-xl border border-[#E8DFD1] bg-white font-mono text-xs focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
            />
            <p className="text-[11px] text-[#8A7463]">
              Customers will be seamlessly transferred to this Shopify store checkout when clicking "Checkout with Shopify".
            </p>
          </div>

          {/* Setting 2: Storefront Access Token (Optional) */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#121110] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Storefront Access Token (Optional for GraphQL / Discounts)</span>
            </label>
            <input
              type="text"
              value={storefrontToken}
              onChange={e => setStorefrontToken(e.target.value)}
              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx or public storefront token"
              className="w-full p-3 rounded-xl border border-[#E8DFD1] bg-white font-mono text-xs focus:ring-2 focus:ring-[#C5A880] focus:border-transparent outline-none"
            />
            <p className="text-[11px] text-[#8A7463]">
              Generated from your Shopify Admin → Settings → Apps and sales channels → Headless.
            </p>
          </div>

          {/* Setting 3: Product Variant ID Mappings */}
          <div className="space-y-3 pt-2 border-t border-[#E8DFD1]">
            <div className="font-bold text-[#121110] uppercase tracking-wider text-[11px]">
              Shopify Product Variant IDs (3 Core Launch Products)
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-[#8A7463]">The Hairology Duo (Variant ID)</label>
                <input
                  type="text"
                  value={theDuoVariant}
                  onChange={e => setTheDuoVariant(e.target.value)}
                  placeholder="e.g. 46829103845920"
                  className="w-full p-2.5 rounded-lg border border-[#E8DFD1] bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8A7463]">Hot Water Shampoo (Variant ID)</label>
                <input
                  type="text"
                  value={hotWaterVariant}
                  onChange={e => setHotWaterVariant(e.target.value)}
                  placeholder="e.g. 46829103845921"
                  className="w-full p-2.5 rounded-lg border border-[#E8DFD1] bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8A7463]">Protein Shampoo (Variant ID)</label>
                <input
                  type="text"
                  value={proteinVariant}
                  onChange={e => setProteinVariant(e.target.value)}
                  placeholder="e.g. 46829103845922"
                  className="w-full p-2.5 rounded-lg border border-[#E8DFD1] bg-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] rounded-xl flex items-center gap-2 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Shopify configuration saved & live on storefront!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-[#E8DFD1] rounded-xl font-bold text-[#3D3A37] hover:bg-[#F3EDE2] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#121110] hover:bg-[#2A2724] text-[#C5A880] rounded-xl font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer border border-[#C5A880]/30 hover:border-[#C5A880]"
            >
              Save Shopify Connection
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
