import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CartItem, AppliedCoupon, Order, OrderAnalytics, ProductSalesMetric } from '../types';
import { PRODUCTS, PRODUCT_IMAGE_DUO, ADMIN_PHONE, USER_UPI_ID } from '../data/products';
import { auth, isAuthorizedFounderUser } from '../firebase';
import {
  fsWatchAllOrders,
  fsConfirmOrderPaid,
  fsMarkOrderFailed,
  fsUpdateDeliveryStatus,
  fsDeleteUnpaidOrder,
  fsClearAllUnpaidOrders,
  fsCreateManualOrder,
  fsSyncPaidOrdersToCloud,
} from '../services/firestoreOrders';

async function safeParseJson(res: Response): Promise<Record<string, unknown> | null> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

interface FounderAuthHeaders {
  email: string;
  code: string;
}

const DELIVERY_RANK: Record<Order['orderStatus'], number> = {
  PAYMENT_FAILED: 0,
  PENDING_CONFIRMATION: 1,
  CONFIRMED: 2,
  DISPATCHED: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
};

function pickPreferredOrder(a: Order, b: Order): Order {
  if (a.paymentStatus === 'PAID' && b.paymentStatus !== 'PAID') return a;
  if (b.paymentStatus === 'PAID' && a.paymentStatus !== 'PAID') return b;
  if (a.paymentStatus === 'PAID' && b.paymentStatus === 'PAID') {
    if (DELIVERY_RANK[b.orderStatus] > DELIVERY_RANK[a.orderStatus]) return b;
    if (DELIVERY_RANK[a.orderStatus] > DELIVERY_RANK[b.orderStatus]) return a;
    if (!a.gatewayTransactionId && b.gatewayTransactionId) return b;
    return a;
  }
  if (a.paymentStatus === 'FAILED' && b.paymentStatus === 'PENDING') return a;
  if (b.paymentStatus === 'FAILED' && a.paymentStatus === 'PENDING') return b;
  if (DELIVERY_RANK[b.orderStatus] > DELIVERY_RANK[a.orderStatus]) return b;
  return a;
}

interface CartContextType {
  items: CartItem[];
  addItem: (productId: string, variantId: string, quantity?: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalMrp: number;
  totalSavings: number;
  tieredDiscount: number;
  couponDiscount: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  shippingFee: number;
  freeShippingUnlocked: boolean;
  extraTenPercentUnlocked: boolean;
  nextMilestone: {
    target: number;
    title: string;
    remaining: number;
    progressPercent: number;
  } | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  isAdminOpen: boolean;
  openAdmin: () => void;
  closeAdmin: () => void;
  isSpinWheelOpen: boolean;
  openSpinWheel: () => void;
  closeSpinWheel: () => void;
  isVideoModalOpen: boolean;
  openVideoModal: () => void;
  closeVideoModal: () => void;
  orders: Order[];
  analytics: OrderAnalytics;
  upsertOrder: (order: Order) => void;
  setOrdersAndAnalytics: (orders: Order[], analytics: OrderAnalytics | null) => void;
  fetchFounderOrders: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  updateOrderStatus: (
    orderId: string,
    status: Order['orderStatus'],
    founderAuth?: FounderAuthHeaders
  ) => Promise<{ ok: boolean; error?: string }>;
  founderVerifyUpiPayment: (
    orderId: string,
    utrRef: string,
    founderAuth: FounderAuthHeaders
  ) => Promise<{ ok: boolean; message?: string }>;
  founderMarkPaymentFailed: (
    orderId: string,
    reason: string,
    founderAuth: FounderAuthHeaders
  ) => Promise<{ ok: boolean; message?: string }>;
  founderCreateManualOrder: (
    payload: {
      recipientName: string;
      phoneNumber: string;
      streetAddress?: string;
      city?: string;
      state?: string;
      pincode?: string;
      items: CartItem[];
      total: number;
      utrRef?: string;
      paymentStatus: 'PAID' | 'PENDING';
    },
    founderAuth: FounderAuthHeaders
  ) => Promise<{ ok: boolean; order?: Order; message?: string }>;
  founderResetAllOrders: (
    founderAuth: FounderAuthHeaders
  ) => Promise<{ ok: boolean; message?: string }>;
  founderDeleteUnpaidOrder: (
    orderId: string,
    founderAuth: FounderAuthHeaders
  ) => Promise<{ ok: boolean; message?: string }>;
  founderClearUnpaidOrders: (
    founderAuth: FounderAuthHeaders
  ) => Promise<{ ok: boolean; message?: string }>;
  recentAdminAlert: string | null;
  clearAdminAlert: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY_CART = 'hairology_cart_items_v1';
const STORAGE_KEY_ORDERS = 'hairology_orders_v3';
const STORAGE_KEY_VERIFIED_ORDERS = 'hairology_verified_orders_forever_v1';
const STORAGE_KEY_DISMISSED_IDS = 'hairology_dismissed_order_ids_v1';

function readVerifiedOrdersForever(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VERIFIED_ORDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]).filter(o => o && o.paymentStatus === 'PAID') : [];
  } catch {
    return [];
  }
}

function saveVerifiedOrdersForever(ordersList: Order[]): void {
  try {
    const existing = readVerifiedOrdersForever();
    const map = new Map<string, Order>();
    for (const ord of [...existing, ...ordersList.filter(o => o && o.paymentStatus === 'PAID')]) {
      const prev = map.get(ord.id);
      map.set(ord.id, prev ? pickPreferredOrder(prev, ord) : ord);
    }
    const sorted = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    localStorage.setItem(STORAGE_KEY_VERIFIED_ORDERS, JSON.stringify(sorted));
  } catch {
    // ignore storage quota errors
  }
}

function readDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISMISSED_IDS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function addDismissedIds(ids: string[]): void {
  if (ids.length === 0) return;
  try {
    const current = readDismissedIds();
    for (const id of ids) current.add(id);
    localStorage.setItem(STORAGE_KEY_DISMISSED_IDS, JSON.stringify(Array.from(current)));
  } catch {
    // ignore
  }
}

function removeDismissedId(id: string): void {
  try {
    const current = readDismissedIds();
    if (current.delete(id)) {
      localStorage.setItem(STORAGE_KEY_DISMISSED_IDS, JSON.stringify(Array.from(current)));
    }
  } catch {
    // ignore
  }
}

function mergeAuthoritativeOrders(
  authoritativeOrders: Order[],
  localOrders: Order[]
): { merged: Order[]; needsServerHeal: Order[] } {
  const verifiedForever = readVerifiedOrdersForever();
  const dismissedIds = readDismissedIds();
  const authMap = new Map<string, Order>();
  for (const s of authoritativeOrders) {
    if (s && typeof s.id === 'string') authMap.set(s.id, s);
  }

  const combined = new Map<string, Order>();
  // Authoritative source (Firestore or API) dictates all orders, including PENDING/FAILED lifecycle.
  for (const ord of authoritativeOrders) {
    if (!ord || typeof ord.id !== 'string') continue;
    const prev = combined.get(ord.id);
    combined.set(ord.id, prev ? pickPreferredOrder(prev, ord) : ord);
  }

  // Only PAID orders (plus very recent <2m client-only drafts not yet synced) may heal upward from localStorage;
  // dismissed/deleted PENDING orders are NEVER resurrected from localStorage across logins or devices.
  const twoMinutesAgo = Date.now() - 120_000;
  for (const ord of [...localOrders, ...verifiedForever]) {
    if (!ord || typeof ord.id !== 'string') continue;
    const isFreshClientDraft =
      ord.paymentStatus === 'PENDING' &&
      !dismissedIds.has(ord.id) &&
      new Date(ord.createdAt).getTime() > twoMinutesAgo;
    if (ord.paymentStatus !== 'PAID' && !isFreshClientDraft) continue;
    const prev = combined.get(ord.id);
    combined.set(ord.id, prev ? pickPreferredOrder(prev, ord) : ord);
  }

  const merged = Array.from(combined.values())
    .filter(ord => ord.paymentStatus === 'PAID' || !dismissedIds.has(ord.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  saveVerifiedOrdersForever(merged);

  const needsServerHeal = merged.filter(ord => {
    const srv = authMap.get(ord.id);
    if (!srv) return ord.paymentStatus === 'PAID';
    if (ord.paymentStatus === 'PAID' && srv.paymentStatus !== 'PAID') return true;
    return ord.paymentStatus === 'PAID' && DELIVERY_RANK[ord.orderStatus] > DELIVERY_RANK[srv.orderStatus];
  });

  return { merged, needsServerHeal };
}

export function computeClientAnalytics(orders: Order[]): OrderAnalytics {
  let totalSales = 0;
  let successfulPaymentsCount = 0;
  let successfulPaymentsAmount = 0;
  let failedPaymentsCount = 0;
  let failedPaymentsAmount = 0;
  let pendingOrdersCount = 0;
  let pendingOrdersAmount = 0;

  const deliveryStatusBreakdown: Record<Order['orderStatus'], number> = {
    PENDING_CONFIRMATION: 0,
    CONFIRMED: 0,
    DISPATCHED: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    PAYMENT_FAILED: 0,
  };

  const productMap = new Map<string, ProductSalesMetric>();
  for (const prod of PRODUCTS) {
    productMap.set(prod.id, {
      productId: prod.id,
      productName: prod.name,
      unitsSold: 0,
      revenue: 0,
      paidOrdersCount: 0,
      pendingUnits: 0,
      failedUnits: 0,
    });
  }

  for (const ord of orders) {
    if (ord.orderStatus in deliveryStatusBreakdown) {
      deliveryStatusBreakdown[ord.orderStatus] += 1;
    }

    const isPaid = ord.paymentStatus === 'PAID';
    const isFailed = ord.paymentStatus === 'FAILED' || ord.orderStatus === 'PAYMENT_FAILED';
    const isPending = !isPaid && !isFailed && ord.paymentStatus !== 'REFUNDED';

    if (isPaid) {
      totalSales += ord.total;
      successfulPaymentsCount += 1;
      successfulPaymentsAmount += ord.total;
    } else if (isFailed) {
      failedPaymentsCount += 1;
      failedPaymentsAmount += ord.total;
    } else if (isPending) {
      pendingOrdersCount += 1;
      pendingOrdersAmount += ord.total;
    }

    const seenProducts = new Set<string>();
    for (const item of ord.items) {
      let metric = productMap.get(item.productId);
      if (!metric) {
        metric = {
          productId: item.productId,
          productName: item.productName,
          unitsSold: 0,
          revenue: 0,
          paidOrdersCount: 0,
          pendingUnits: 0,
          failedUnits: 0,
        };
        productMap.set(item.productId, metric);
      }

      if (isPaid) {
        metric.unitsSold += item.quantity;
        metric.revenue += item.price * item.quantity;
        if (!seenProducts.has(item.productId)) {
          metric.paidOrdersCount += 1;
          seenProducts.add(item.productId);
        }
      } else if (isFailed) {
        metric.failedUnits += item.quantity;
      } else if (isPending) {
        metric.pendingUnits += item.quantity;
      }
    }
  }

  return {
    totalSales,
    totalOrders: orders.length,
    successfulPaymentsCount,
    successfulPaymentsAmount,
    failedPaymentsCount,
    failedPaymentsAmount,
    pendingOrdersCount,
    pendingOrdersAmount,
    productWiseSales: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
    deliveryStatusBreakdown,
  };
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        productId: 'the-duo',
        variantId: 'duo-full',
        productName: 'The Hairology Duo (Clarify & Reconstruct)',
        variantLabel: 'Full Size Duo (2 x 250 ml)',
        price: 849,
        mrp: 999,
        quantity: 1,
        image: PRODUCT_IMAGE_DUO,
      }
    ];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const safeDecode = (s: string) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    };
    const pathname = safeDecode(window.location.pathname).toLowerCase().replace(/\/+$/, '');
    const search = safeDecode(window.location.search).toLowerCase();
    const hash = safeDecode(window.location.hash).toLowerCase();
    const matchedKeywords = ['owner', 'founder', 'panel', 'admin', 'orders'];
    return (
      matchedKeywords.some(kw => pathname.includes(kw)) ||
      matchedKeywords.some(kw => search.includes(kw)) ||
      matchedKeywords.some(kw => hash.includes(kw))
    );
  });
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [recentAdminAlert, setRecentAdminAlert] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      localStorage.removeItem('hairology_orders_v1');
      localStorage.removeItem('hairology_orders_v2');
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      const parsed = saved ? JSON.parse(saved) : [];
      const localList = Array.isArray(parsed) ? (parsed as Order[]) : [];
      const verifiedForever = readVerifiedOrdersForever();
      const dismissedIds = readDismissedIds();
      const map = new Map<string, Order>();
      for (const ord of [...localList, ...verifiedForever]) {
        if (!ord || typeof ord.id !== 'string') continue;
        const prev = map.get(ord.id);
        map.set(ord.id, prev ? pickPreferredOrder(prev, ord) : ord);
      }
      return Array.from(map.values())
        .filter(ord => ord.paymentStatus === 'PAID' || !dismissedIds.has(ord.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      // fallback
    }
    return [];
  });

  const ordersRef = useRef<Order[]>(orders);
  ordersRef.current = orders;

  const firestoreMapRef = useRef<Map<string, Order>>(new Map());
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseAuthReady, setIsFirebaseAuthReady] = useState(false);

  const isCloudSyncActive = Boolean(firebaseUser && isAuthorizedFounderUser(firebaseUser));
  const isCloudSyncActiveRef = useRef<boolean>(isCloudSyncActive);
  isCloudSyncActiveRef.current = isCloudSyncActive;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setFirebaseUser(user);
      setIsFirebaseAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Attach real-time Firestore orders listener silently if founder Firebase session exists
  useEffect(() => {
    if (!isFirebaseAuthReady || !isCloudSyncActive) return;

    const unsub = fsWatchAllOrders(
      (cloudOrders, fsMap) => {
        firestoreMapRef.current = fsMap;
        const { merged, needsServerHeal } = mergeAuthoritativeOrders(cloudOrders, ordersRef.current);
        setOrders(merged);
        if (needsServerHeal.length > 0) {
          void fsSyncPaidOrdersToCloud(needsServerHeal, fsMap).catch(err => {
            console.warn('Firestore PAID-order sync warning:', err);
          });
        }
      },
      err => {
        console.warn('Firestore listener notice:', err);
      }
    );

    return () => unsub();
  }, [isFirebaseAuthReady, isCloudSyncActive]);

  const analytics = useMemo(() => computeClientAnalytics(orders), [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
      saveVerifiedOrdersForever(orders);
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    const handleOpenAdmin = () => setIsAdminOpen(true);
    window.addEventListener('open-admin-portal', handleOpenAdmin);
    return () => window.removeEventListener('open-admin-portal', handleOpenAdmin);
  }, []);

  const addItem = (productId: string, variantId: string, quantity = 1) => {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    const variant = product.variants.find(v => v.id === variantId) || product.variants[0];

    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === productId && item.variantId === variant.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantLabel: variant.label,
          price: variant.price,
          mrp: variant.mrp,
          quantity,
          image: product.image
        }
      ];
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: string, variantId: string) => {
    setItems(prev => prev.filter(item => !(item.productId === productId && item.variantId === variantId)));
  };

  const updateQuantity = (productId: string, variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMrp = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const totalSavings = Math.max(0, totalMrp - subtotal);

  // Milestones
  const freeShippingUnlocked = subtotal >= 449;
  const extraTenPercentUnlocked = false;

  const tieredDiscount = 0;
  const couponDiscount = 0;

  const shippingFee = freeShippingUnlocked || subtotal === 0 ? 0 : 70;

  let nextMilestone = null;
  if (subtotal < 449) {
    nextMilestone = {
      target: 449,
      title: 'Free Express Shipping Across India (Orders Above ₹449)',
      remaining: 449 - subtotal,
      progressPercent: Math.min(100, Math.round((subtotal / 449) * 100))
    };
  }

  const applyCoupon = (_code: string) => {
    setAppliedCoupon(null);
    return { success: false, message: 'Coupons are not applicable.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const upsertOrder = useCallback((order: Order) => {
    removeDismissedId(order.id);
    if (order.paymentStatus === 'PAID') {
      saveVerifiedOrdersForever([order]);
    }
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === order.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = pickPreferredOrder(prev[idx], order);
        return next;
      }
      return [order, ...prev];
    });

    if (order.paymentStatus === 'PAID') {
      const alertMessage = `✨ UPI PAYMENT VERIFIED: #${order.id}\nUPI Ref: ${order.gatewayTransactionId || 'Verified'}\nItems: ${order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}\nTotal: ₹${order.total} (PAID)\nCustomer: ${order.deliveryAddress.recipientName} (${order.customerPhone})\nPincode: ${order.deliveryAddress.pincode} (${order.deliveryAddress.city})\nSynced to Founder ${ADMIN_PHONE}.`;
      setRecentAdminAlert(alertMessage);

      clearCart();
    }
  }, []);

  const setOrdersAndAnalytics = useCallback((nextOrders: Order[], _nextAnalytics: OrderAnalytics | null) => {
    saveVerifiedOrdersForever(nextOrders);
    setOrders(nextOrders);
  }, []);

  const fetchFounderOrders = useCallback(async (email: string, code: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'x-founder-email': email,
          'x-founder-code': code,
        },
      });
      const data = await safeParseJson(res);
      if (data === null) {
        if (isCloudSyncActiveRef.current) {
          return { ok: true };
        }
        return {
          ok: false,
          error: 'Orders server is unavailable right now. Showing locally saved orders.',
        };
      }
      if (!res.ok) {
        return { ok: false, error: typeof data.error === 'string' ? data.error : 'Failed to fetch live orders.' };
      }
      if (Array.isArray(data.dismissedIds)) {
        const srvDismissed = (data.dismissedIds as unknown[]).filter((x): x is string => typeof x === 'string');
        addDismissedIds(srvDismissed);
      }
      if (Array.isArray(data.orders)) {
        const serverOrders = data.orders as Order[];
        if (isCloudSyncActiveRef.current) {
          const paidFromServer = serverOrders.filter(o => o && o.paymentStatus === 'PAID');
          const { needsServerHeal } = mergeAuthoritativeOrders(
            Array.from(firestoreMapRef.current.values()),
            [...paidFromServer, ...ordersRef.current]
          );
          if (needsServerHeal.length > 0) {
            void fsSyncPaidOrdersToCloud(needsServerHeal, firestoreMapRef.current).catch(() => {});
          }
          return { ok: true };
        }

        const { merged, needsServerHeal } = mergeAuthoritativeOrders(serverOrders, ordersRef.current);
        setOrders(merged);

        if (needsServerHeal.length > 0) {
          try {
            const syncRes = await fetch('/api/orders/sync-cloud', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-founder-email': email,
                'x-founder-code': code,
              },
              body: JSON.stringify({ orders: needsServerHeal }),
            });
            const syncData = await safeParseJson(syncRes);
            if (syncRes.ok && syncData && Array.isArray(syncData.orders)) {
              const { merged: afterSync } = mergeAuthoritativeOrders(
                syncData.orders as Order[],
                ordersRef.current
              );
              setOrders(afterSync);
            }
          } catch {
            // ignore transient network error
          }
        }
      }
      return { ok: true };
    } catch (err) {
      console.error('Fetch founder orders error:', err);
      if (isCloudSyncActiveRef.current) return { ok: true };
      return { ok: false, error: 'Unable to refresh founder orders.' };
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: Order['orderStatus'],
      founderAuth?: FounderAuthHeaders
    ): Promise<{ ok: boolean; error?: string }> => {
      const targetOrder = ordersRef.current.find(o => o.id === orderId) || firestoreMapRef.current.get(orderId);
      if (
        targetOrder &&
        (status === 'DISPATCHED' || status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') &&
        targetOrder.paymentStatus !== 'PAID'
      ) {
        return {
          ok: false,
          error: 'Safety block: Cannot mark an unpaid order as Dispatched/Delivered until UPI payment is verified as PAID.',
        };
      }

      if (isCloudSyncActiveRef.current && targetOrder) {
        try {
          await fsUpdateDeliveryStatus(targetOrder, status, firestoreMapRef.current.has(orderId));
        } catch (err) {
          console.error('Firestore status update error:', err);
          return { ok: false, error: 'Unable to update delivery status in Cloud Sync.' };
        }
      }

      if (founderAuth) {
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-founder-email': founderAuth.email,
              'x-founder-code': founderAuth.code,
            },
            body: JSON.stringify({ orderStatus: status, order: targetOrder }),
          });
          const data = await safeParseJson(res);
          if (data !== null && !res.ok) {
            if (!isCloudSyncActiveRef.current) {
              return { ok: false, error: typeof data.error === 'string' ? data.error : 'Could not update delivery status.' };
            }
          }
        } catch (err) {
          console.error('Update order status error:', err);
        }
      }

      setOrders(prev => {
        const next = prev.map(ord => (ord.id === orderId ? { ...ord, orderStatus: status } : ord));
        saveVerifiedOrdersForever(next);
        return next;
      });
      return { ok: true };
    },
    []
  );

  const founderVerifyUpiPayment = useCallback(
    async (
      orderId: string,
      utrRef: string,
      founderAuth: FounderAuthHeaders
    ): Promise<{ ok: boolean; message?: string }> => {
      const effectiveRef = utrRef.trim() || `FOUNDER-CONFIRMED-${Date.now().toString().slice(-6)}`;
      const verifiedAtIso = new Date().toISOString();
      removeDismissedId(orderId);

      const targetOrder = ordersRef.current.find(o => o.id === orderId) || firestoreMapRef.current.get(orderId);

      if (isCloudSyncActiveRef.current && targetOrder) {
        try {
          await fsConfirmOrderPaid(targetOrder, effectiveRef, firestoreMapRef.current.has(orderId));
        } catch (err) {
          console.warn('Firestore confirm order notice:', err);
        }
      }

      const confirmedLocalOrder: Order | undefined = targetOrder
        ? {
            ...targetOrder,
            paymentStatus: 'PAID',
            paymentInitiated: true,
            orderStatus:
              targetOrder.orderStatus === 'PENDING_CONFIRMATION' || targetOrder.orderStatus === 'PAYMENT_FAILED'
                ? 'CONFIRMED'
                : targetOrder.orderStatus,
            gatewayTransactionId: targetOrder.gatewayTransactionId || effectiveRef,
            paymentVerifiedAt: targetOrder.paymentVerifiedAt || verifiedAtIso,
            paymentFailureReason: undefined,
          }
        : undefined;

      let serverSynced = false;
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/verify-upi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-email': founderAuth.email,
            'x-founder-code': founderAuth.code,
          },
          body: JSON.stringify({ order: targetOrder }),
        });
        const data = await safeParseJson(res);
        if (data !== null && res.ok) {
          serverSynced = true;
          const confirmedOrder = data.order as Order | undefined;
          if (confirmedOrder) {
            saveVerifiedOrdersForever([confirmedOrder]);
          }
        }
      } catch (err) {
        console.warn('Server UPI verify notice:', err);
      }

      if (!serverSynced && confirmedLocalOrder) {
        try {
          await fetch('/api/orders/sync-cloud', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-founder-email': founderAuth.email,
              'x-founder-code': founderAuth.code,
            },
            body: JSON.stringify({ orders: [confirmedLocalOrder] }),
          });
        } catch {
          // ignore
        }
      }

      setOrders(prev => {
        const next = prev.map(ord =>
          ord.id === orderId
            ? {
                ...ord,
                paymentStatus: 'PAID' as const,
                paymentInitiated: true,
                orderStatus:
                  ord.orderStatus === 'PENDING_CONFIRMATION' || ord.orderStatus === 'PAYMENT_FAILED'
                    ? ('CONFIRMED' as const)
                    : ord.orderStatus,
                gatewayTransactionId: ord.gatewayTransactionId || effectiveRef,
                paymentVerifiedAt: ord.paymentVerifiedAt || verifiedAtIso,
                paymentFailureReason: undefined,
              }
            : ord
        );
        saveVerifiedOrdersForever(next);
        return next;
      });

      return {
        ok: true,
        message: `Order #${orderId} confirmed PAID & synced across all your founder panels!`,
      };
    },
    []
  );

  const founderMarkPaymentFailed = useCallback(
    async (
      orderId: string,
      reason: string,
      founderAuth: FounderAuthHeaders
    ): Promise<{ ok: boolean; message?: string }> => {
      const targetOrder = ordersRef.current.find(o => o.id === orderId) || firestoreMapRef.current.get(orderId);
      if (isCloudSyncActiveRef.current && targetOrder) {
        try {
          await fsMarkOrderFailed(targetOrder, reason, firestoreMapRef.current.has(orderId));
        } catch (err) {
          console.warn('Firestore mark-failed notice:', err);
        }
      }

      try {
        await fetch(`/api/orders/${encodeURIComponent(orderId)}/mark-failed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-email': founderAuth.email,
            'x-founder-code': founderAuth.code,
          },
          body: JSON.stringify({ reason, order: targetOrder }),
        });
      } catch (err) {
        console.warn('Server mark-failed notice:', err);
      }

      setOrders(prev =>
        prev.map(ord =>
          ord.id === orderId
            ? { ...ord, paymentStatus: 'FAILED', orderStatus: 'PAYMENT_FAILED', paymentFailureReason: reason }
            : ord
        )
      );
      return { ok: true, message: `Order #${orderId} marked as PAYMENT FAILED.` };
    },
    []
  );

  const founderCreateManualOrder = useCallback(
    async (
      payload: {
        recipientName: string;
        phoneNumber: string;
        streetAddress?: string;
        city?: string;
        state?: string;
        pincode?: string;
        items: CartItem[];
        total: number;
        utrRef?: string;
        paymentStatus: 'PAID' | 'PENDING';
      },
      founderAuth: FounderAuthHeaders
    ): Promise<{ ok: boolean; order?: Order; message?: string }> => {
      const cleanName = payload.recipientName.trim();
      const digits = payload.phoneNumber.replace(/\D/g, '');
      const cleanDigits = digits.length > 10 ? digits.slice(-10) : digits;
      const formattedPhone = cleanDigits.length === 10 ? `+91 ${cleanDigits}` : payload.phoneNumber.trim();
      const total = Math.round(Number(payload.total) || 0);

      if (!cleanName || cleanDigits.length < 10 || !Number.isFinite(total) || total <= 0 || payload.items.length === 0) {
        return {
          ok: false,
          message: 'Please enter customer name, 10-digit mobile number, product, and amount (> ₹0).',
        };
      }

      const isPaid = payload.paymentStatus === 'PAID';
      const nowIso = new Date().toISOString();
      const cleanPincode = (payload.pincode || '400001').replace(/\D/g, '').slice(0, 6).padEnd(6, '0');
      const effectiveRef = payload.utrRef?.trim() || (isPaid ? `UPI-RCVD-${Date.now().toString().slice(-6)}` : undefined);

      const newOrder: Order = {
        id: `HR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: nowIso,
        customerPhone: formattedPhone,
        deliveryAddress: {
          recipientName: cleanName,
          phoneNumber: formattedPhone,
          streetAddress: payload.streetAddress?.trim() || 'Direct UPI Order',
          city: payload.city?.trim() || 'India',
          state: payload.state?.trim() || 'India',
          pincode: cleanPincode,
        },
        items: payload.items,
        subtotal: total,
        discount: 0,
        shipping: 0,
        codFee: 0,
        total,
        paymentMethod: 'UPI_QR',
        paymentStatus: isPaid ? 'PAID' : 'PENDING',
        orderStatus: isPaid ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
        payerUpi: USER_UPI_ID,
        trackingNumber: `DELHIVERY-AWB-${Math.floor(100000000 + Math.random() * 900000000)}`,
        ...(isPaid
          ? {
              gatewayTransactionId: effectiveRef,
              paymentVerifiedAt: nowIso,
            }
          : {}),
      };

      if (isCloudSyncActiveRef.current) {
        try {
          await fsCreateManualOrder(newOrder);
        } catch (err) {
          console.error('Firestore manual order create error:', err);
          return { ok: false, message: 'Could not save manual order to Cloud Sync.' };
        }
      }

      try {
        await fetch('/api/orders/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-email': founderAuth.email,
            'x-founder-code': founderAuth.code,
          },
          body: JSON.stringify({ order: newOrder }),
        });
      } catch (err) {
        console.warn('Manual order server fallback notice:', err);
      }

      if (isPaid) saveVerifiedOrdersForever([newOrder]);
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      return {
        ok: true,
        order: newOrder,
        message: `Order #${newOrder.id} (₹${newOrder.total}) recorded as ${newOrder.paymentStatus}!`,
      };
    },
    []
  );

  const founderResetAllOrders = useCallback(
    async (founderAuth: FounderAuthHeaders): Promise<{ ok: boolean; message?: string }> => {
      try {
        if (isCloudSyncActiveRef.current) {
          const unpaidIds = Array.from(
            new Set([
              ...ordersRef.current.filter(o => o.paymentStatus !== 'PAID').map(o => o.id),
              ...Array.from(firestoreMapRef.current.values())
                .filter(o => o.paymentStatus !== 'PAID')
                .map(o => o.id),
            ])
          );
          if (unpaidIds.length > 0) {
            await fsClearAllUnpaidOrders(unpaidIds);
          }
        }
        try {
          const res = await fetch('/api/orders/reset', {
            method: 'POST',
            headers: {
              'x-founder-email': founderAuth.email,
              'x-founder-code': founderAuth.code,
            },
          });
          const data = await safeParseJson(res);
          if (data !== null && !res.ok) {
            return { ok: false, message: typeof data.error === 'string' ? data.error : 'Could not reset server orders.' };
          }
        } catch {
          // ignore offline error
        }
        setOrders(prev => prev.filter(o => o.paymentStatus === 'PAID'));
        setRecentAdminAlert(null);
        return {
          ok: true,
          message: 'Unpaid orders cleared! Verified PAID orders preserved.',
        };
      } catch (err) {
        console.error('Founder reset orders error:', err);
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Unable to clear previous orders.',
        };
      }
    },
    []
  );

  const founderDeleteUnpaidOrder = useCallback(
    async (orderId: string, founderAuth: FounderAuthHeaders): Promise<{ ok: boolean; message?: string }> => {
      const target = ordersRef.current.find(o => o.id === orderId) || firestoreMapRef.current.get(orderId);
      if (target?.paymentStatus === 'PAID') {
        return { ok: false, message: 'Safety block: Cannot delete a verified PAID customer order.' };
      }
      addDismissedIds([orderId]);

      if (isCloudSyncActiveRef.current && firestoreMapRef.current.has(orderId)) {
        try {
          await fsDeleteUnpaidOrder(orderId);
        } catch (err) {
          console.error('Firestore delete unpaid order error:', err);
          return { ok: false, message: 'Could not remove awaiting order from Cloud Sync.' };
        }
      }

      try {
        await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          method: 'DELETE',
          headers: {
            'x-founder-email': founderAuth.email,
            'x-founder-code': founderAuth.code,
          },
        });
      } catch (err) {
        console.warn('Delete unpaid order notice:', err);
      }

      setOrders(prev => prev.filter(o => o.id !== orderId || o.paymentStatus === 'PAID'));
      return { ok: true, message: `Permanently removed awaiting entry #${orderId}.` };
    },
    []
  );

  const founderClearUnpaidOrders = useCallback(
    async (founderAuth: FounderAuthHeaders): Promise<{ ok: boolean; message?: string }> => {
      const unpaidIds = Array.from(
        new Set([
          ...ordersRef.current.filter(o => o.paymentStatus !== 'PAID').map(o => o.id),
          ...Array.from(firestoreMapRef.current.values())
            .filter(o => o.paymentStatus !== 'PAID')
            .map(o => o.id),
        ])
      );
      addDismissedIds(unpaidIds);

      if (isCloudSyncActiveRef.current && unpaidIds.length > 0) {
        try {
          await fsClearAllUnpaidOrders(unpaidIds);
        } catch (err) {
          console.error('Firestore clear unpaid orders error:', err);
          return { ok: false, message: 'Could not clear awaiting list from Cloud Sync.' };
        }
      }

      try {
        await fetch('/api/orders/clear-unpaid', {
          method: 'POST',
          headers: {
            'x-founder-email': founderAuth.email,
            'x-founder-code': founderAuth.code,
          },
        });
      } catch (err) {
        console.warn('Clear unpaid orders notice:', err);
      }

      setOrders(prev => prev.filter(o => o.paymentStatus === 'PAID'));
      return { ok: true, message: 'Permanently cleared awaiting list across all devices. Paid customers preserved.' };
    },
    []
  );

  const clearAdminAlert = () => setRecentAdminAlert(null);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalMrp,
        totalSavings,
        tieredDiscount,
        couponDiscount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        shippingFee,
        freeShippingUnlocked,
        extraTenPercentUnlocked,
        nextMilestone,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        isCheckoutOpen,
        openCheckout: () => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        },
        closeCheckout: () => setIsCheckoutOpen(false),
        isAdminOpen,
        openAdmin: () => setIsAdminOpen(true),
        closeAdmin: () => setIsAdminOpen(false),
        isSpinWheelOpen,
        openSpinWheel: () => setIsSpinWheelOpen(true),
        closeSpinWheel: () => setIsSpinWheelOpen(false),
        isVideoModalOpen,
        openVideoModal: () => setIsVideoModalOpen(true),
        closeVideoModal: () => setIsVideoModalOpen(false),
        orders,
        analytics,
        upsertOrder,
        setOrdersAndAnalytics,
        fetchFounderOrders,
        updateOrderStatus,
        founderVerifyUpiPayment,
        founderMarkPaymentFailed,
        founderCreateManualOrder,
        founderResetAllOrders,
        founderDeleteUnpaidOrder,
        founderClearUnpaidOrders,
        recentAdminAlert,
        clearAdminAlert,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
