/**
 * Shopify Headless Storefront Integration for HAIROLOGY
 * Connects the React SPA to Shopify hosted checkout via Storefront Cart Permalinks
 * and Storefront GraphQL API.
 */

export interface ShopifyConfig {
  storeDomain: string; // e.g. "hairology-haircare.myshopify.com" or "shop.hairology.in"
  storefrontAccessToken?: string;
  isEnabled: boolean;
  productVariantIds: {
    'the-duo': string;
    'hot-water-shampoo': string;
    'protein-shampoo': string;
  };
}

const STORAGE_KEY = 'hairology_shopify_config';

export const DEFAULT_SHOPIFY_CONFIG: ShopifyConfig = {
  storeDomain: import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'hairology-haircare.myshopify.com',
  storefrontAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '',
  isEnabled: true,
  productVariantIds: {
    'the-duo': '46829103845920',
    'hot-water-shampoo': '46829103845921',
    'protein-shampoo': '46829103845922',
  }
};

export function getShopifyConfig(): ShopifyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SHOPIFY_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load Shopify config from storage', e);
  }
  return DEFAULT_SHOPIFY_CONFIG;
}

export function saveShopifyConfig(config: Partial<ShopifyConfig>): ShopifyConfig {
  const current = getShopifyConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('shopify-config-updated', { detail: updated }));
  } catch (e) {
    console.error('Failed to save Shopify config', e);
  }
  return updated;
}

/**
 * Builds the official Shopify Cart Permalink
 * Format: https://{storeDomain}/cart/{variant_id}:{quantity},{variant_id}:{quantity}?discount={code}
 */
export function buildShopifyCartUrl(
  items: Array<{ productId: string; quantity: number }>,
  discountCode?: string
): string {
  const config = getShopifyConfig();
  const cleanDomain = config.storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Map our product IDs to Shopify Variant IDs
  const permalinkItems = items
    .filter(item => item.quantity > 0)
    .map(item => {
      const variantId = config.productVariantIds[item.productId as keyof typeof config.productVariantIds] || '46829103845920';
      return `${variantId}:${item.quantity}`;
    });

  if (permalinkItems.length === 0) {
    return `https://${cleanDomain}/cart`;
  }

  const queryParams = new URLSearchParams();
  if (discountCode) {
    queryParams.set('discount', discountCode);
  }
  queryParams.set('channel', 'hairology_headless');

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return `https://${cleanDomain}/cart/${permalinkItems.join(',')}${queryString}`;
}

/**
 * Redirects the user directly to the Shopify hosted checkout
 */
export function redirectToShopifyCheckout(
  items: Array<{ productId: string; quantity: number }>,
  discountCode?: string
): void {
  const url = buildShopifyCartUrl(items, discountCode);
  window.location.href = url;
}
