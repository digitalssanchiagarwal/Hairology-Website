import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { CartItem, AppliedCoupon, Order, OrderAnalytics, ProductSalesMetric } from '../types';
import { PRODUCTS, PRODUCT_IMAGE_DUO, ADMIN_PHONE, USER_UPI_ID } from '../data/products';
import {
  subscribeToFirebaseAuth,
  isAuthorizedFirebaseAdmin,
  signInFounderWithGoogle,
  signOutFounderGoogle,
  fetchAllOrdersAdminOnce,
  subscribeToAllOrdersAdmin,
  verifyOrderPaidInFirestore,
  markOrderFailedInFirestore,
  updateOrderDeliveryStatusInFirestore,
  clearAllOrdersInFirestore,
  createManualOrderInFirestore
} from '../firebase';

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
  if (DELIVERY_RANK[b.orderStatus] > DELIVERY_RANK[a.orderStatus]) return b;
  return a;
}

function mergeOrderLists(primary: Order[], secondary: Order[]): Order[] {
  const map = new Map<string, Order>();
  for (const ord of [...primary, ...secondary]) {
    const existing = map.get(ord.id);
    if (!existing) {
      map.set(ord.id, ord);
    } else {
      map.set(ord.id, pickPreferredOrder(existing, ord));
    }
  }
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
  );
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
  recentAdminAlert: string | null;
  clearAdminAlert: () => void;
  firebaseAdminEmail: string | null;
  isFirebaseCloudConnected: boolean;
  firebaseSyncError: string | null;
  connectFirebaseCloudSync: () => Promise<{ ok: boolean; error?: string }>;
  disconnectFirebaseCloudSync: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY_CART = 'hairology_cart_items_v1';
const STORAGE_KEY_ORDERS = 'hairology_orders_v3';

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
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [firestoreOrders, setFirestoreOrders] = useState<Order[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseSyncError, setFirebaseSyncError] = useState<string | null>(null);
  const [serverAnalytics, setServerAnalytics] = useState<OrderAnalytics | null>(null);

  const isFirebaseCloudConnected = useMemo(() => isAuthorizedFirebaseAdmin(firebaseUser), [firebaseUser]);
  const firebaseAdminEmail = isFirebaseCloudConnected ? firebaseUser?.email || null : null;

  const combinedOrders = useMemo(
    () => (firestoreOrders.length > 0 ? mergeOrderLists(firestoreOrders, orders) : orders),
    [firestoreOrders, orders]
  );

  const analytics = useMemo(
    () =>
      isFirebaseCloudConnected && firestoreOrders.length > 0
        ? computeClientAnalytics(combinedOrders)
        : serverAnalytics || computeClientAnalytics(combinedOrders),
    [isFirebaseCloudConnected, firestoreOrders.length, combinedOrders, serverAnalytics]
  );

  useEffect(() => {
    const unsub = subscribeToFirebaseAuth(user => {
      setFirebaseUser(user);
      if (user && !isAuthorizedFirebaseAdmin(user)) {
        setFirebaseSyncError(
          `Signed in as ${user.email}. Please select guddan1102@gmail.com or digitalssanchiagarwal@gmail.com for cloud sync.`
        );
      } else {
        setFirebaseSyncError(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseCloudConnected) return;
    const unsub = subscribeToAllOrdersAdmin(
      cloudOrders => {
        setFirestoreOrders(cloudOrders);
        setOrders(prev => mergeOrderLists(cloudOrders, prev));
        setFirebaseSyncError(null);
      },
      err => {
        setFirebaseSyncError(err.message);
      }
    );
    return () => unsub();
  }, [isFirebaseCloudConnected]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(combinedOrders));
    } catch (e) {
      console.error(e);
    }
  }, [combinedOrders]);

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
    setServerAnalytics(null);
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === order.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = order;
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

  const setOrdersAndAnalytics = useCallback((nextOrders: Order[], nextAnalytics: OrderAnalytics | null) => {
    setOrders(nextOrders);
    setServerAnalytics(nextAnalytics);
  }, []);

  const connectFirebaseCloudSync = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      setFirebaseSyncError(null);
      const user = await signInFounderWithGoogle();
      if (!isAuthorizedFirebaseAdmin(user)) {
        const msg = `Selected account (${user.email || 'unknown'}) is not authorized. Please sign in with guddan1102@gmail.com or digitalssanchiagarwal@gmail.com.`;
        setFirebaseSyncError(msg);
        await signOutFounderGoogle();
        return { ok: false, error: msg };
      }
      try {
        const cloudList = await fetchAllOrdersAdminOnce();
        setFirestoreOrders(cloudList);
        setOrders(prev => mergeOrderLists(cloudList, prev));
      } catch (fetchErr) {
        console.warn('Immediate Firestore fetch notice:', fetchErr);
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to connect Google Cloud Sync.';
      setFirebaseSyncError(msg);
      return { ok: false, error: msg };
    }
  }, []);

  const disconnectFirebaseCloudSync = useCallback(async () => {
    await signOutFounderGoogle();
    setFirestoreOrders([]);
    setFirebaseSyncError(null);
  }, []);

  const fetchFounderOrders = useCallback(async (email: string, code: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      let cloudList = firestoreOrders;
      if (isFirebaseCloudConnected) {
        try {
          cloudList = await fetchAllOrdersAdminOnce();
          setFirestoreOrders(cloudList);
          setOrders(prev => mergeOrderLists(cloudList, prev));
        } catch (err) {
          console.warn('Firestore fetch notice:', err);
        }
      }

      try {
        const res = await fetch('/api/orders', {
          headers: {
            'x-founder-email': email,
            'x-founder-code': code,
          },
        });
        const data = await safeParseJson(res);
        if (data !== null) {
          if (!res.ok) {
            return { ok: false, error: typeof data.error === 'string' ? data.error : 'Failed to fetch live orders.' };
          }
          if (Array.isArray(data.orders)) {
            setOrders(prev => mergeOrderLists(cloudList, mergeOrderLists(data.orders as Order[], prev)));
            setServerAnalytics((data.analytics as OrderAnalytics) || null);
          }
        }
      } catch {
        // Static Vercel hosting: no Express /api server running, Firestore/local state used
      }

      return { ok: true };
    } catch (err) {
      console.error('Fetch founder orders error:', err);
      return { ok: false, error: 'Unable to refresh founder orders.' };
    }
  }, [firestoreOrders, isFirebaseCloudConnected]);

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: Order['orderStatus'],
      founderAuth?: FounderAuthHeaders
    ): Promise<{ ok: boolean; error?: string }> => {
      const targetOrder = combinedOrders.find(o => o.id === orderId);
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

      let firestoreUpdated = false;
      if (isFirebaseCloudConnected) {
        try {
          firestoreUpdated = await updateOrderDeliveryStatusInFirestore(orderId, status);
        } catch (err) {
          return {
            ok: false,
            error: err instanceof Error ? err.message : 'Firestore delivery status update failed.',
          };
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
            body: JSON.stringify({ orderStatus: status }),
          });
          const data = await safeParseJson(res);
          if (data !== null) {
            if (!res.ok) {
              if (firestoreUpdated && res.status === 404) {
                setOrders(prev => prev.map(ord => (ord.id === orderId ? { ...ord, orderStatus: status } : ord)));
                return { ok: true };
              }
              return { ok: false, error: typeof data.error === 'string' ? data.error : 'Could not update delivery status.' };
            }
            if (Array.isArray(data.orders)) {
              setOrders(prev => mergeOrderLists(firestoreOrders, mergeOrderLists(data.orders as Order[], prev)));
              setServerAnalytics((data.analytics as OrderAnalytics) || null);
            }
            return { ok: true };
          }
        } catch (err) {
          console.error('Update order status error:', err);
        }
      }

      setServerAnalytics(null);
      setOrders(prev => prev.map(ord => (ord.id === orderId ? { ...ord, orderStatus: status } : ord)));
      return { ok: true };
    },
    [isFirebaseCloudConnected, firestoreOrders, combinedOrders]
  );

  const founderVerifyUpiPayment = useCallback(
    async (
      orderId: string,
      utrRef: string,
      founderAuth: FounderAuthHeaders
    ): Promise<{ ok: boolean; message?: string }> => {
      const effectiveRef = utrRef.trim() || `UPI-RCVD-${Date.now().toString().slice(-6)}`;
      const verifiedAtIso = new Date().toISOString();

      let firestoreUpdated = false;
      if (isFirebaseCloudConnected) {
        try {
          firestoreUpdated = await verifyOrderPaidInFirestore(orderId, effectiveRef, verifiedAtIso);
        } catch (err) {
          return {
            ok: false,
            message: err instanceof Error ? err.message : 'Could not verify payment in Firebase Firestore.',
          };
        }
      }

      let serverHandled = false;
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/verify-upi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-email': founderAuth.email,
            'x-founder-code': founderAuth.code,
          },
          body: JSON.stringify({ utrRef: effectiveRef }),
        });
        const data = await safeParseJson(res);
        if (data !== null) {
          serverHandled = true;
          if (!res.ok) {
            if (!firestoreUpdated) {
              return { ok: false, message: typeof data.error === 'string' ? data.error : 'Could not verify UPI reference.' };
            }
          } else {
            if (Array.isArray(data.orders)) {
              setOrders(prev => mergeOrderLists(firestoreOrders, mergeOrderLists(data.orders as Order[], prev)));
              setServerAnalytics((data.analytics as OrderAnalytics) || null);
            }
            const confirmedOrder = data.order as Order | undefined;
            const confirmedRef = confirmedOrder?.gatewayTransactionId || effectiveRef;
            return {
              ok: true,
              message: `Order #${orderId} confirmed PAID (Ref: ${confirmedRef})! Customer checkout & Thank You message unlocked.`,
            };
          }
        }
      } catch (err) {
        console.warn('Server UPI verify notice (falling back to Cloud/Local):', err);
      }

      if (!serverHandled || firestoreUpdated) {
        setServerAnalytics(null);
        setOrders(prev =>
          prev.map(ord =>
            ord.id === orderId
              ? {
                  ...ord,
                  paymentStatus: 'PAID',
                  orderStatus:
                    ord.orderStatus === 'PENDING_CONFIRMATION' || ord.orderStatus === 'PAYMENT_FAILED'
                      ? 'CONFIRMED'
                      : ord.orderStatus,
                  gatewayTransactionId: effectiveRef,
                  paymentVerifiedAt: verifiedAtIso,
                  paymentFailureReason: undefined,
                }
              : ord
          )
        );
        return {
          ok: true,
          message: `Order #${orderId} confirmed PAID (Ref: ${effectiveRef})! Customer checkout & Thank You message unlocked.`,
        };
      }

      return { ok: false, message: 'Could not verify UPI transaction reference.' };
    },
    [isFirebaseCloudConnected, firestoreOrders]
  );

  const founderMarkPaymentFailed = useCallback(
    async (
      orderId: string,
      reason: string,
      founderAuth: FounderAuthHeaders
    ): Promise<{ ok: boolean; message?: string }> => {
      let firestoreUpdated = false;
      if (isFirebaseCloudConnected) {
        try {
          firestoreUpdated = await markOrderFailedInFirestore(orderId, reason);
        } catch (err) {
          return {
            ok: false,
            message: err instanceof Error ? err.message : 'Could not update failed status in Firestore.',
          };
        }
      }

      let serverHandled = false;
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/mark-failed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-email': founderAuth.email,
            'x-founder-code': founderAuth.code,
          },
          body: JSON.stringify({ reason }),
        });
        const data = await safeParseJson(res);
        if (data !== null) {
          serverHandled = true;
          if (!res.ok) {
            if (!firestoreUpdated) {
              return { ok: false, message: typeof data.error === 'string' ? data.error : 'Could not mark order as failed.' };
            }
          } else {
            if (Array.isArray(data.orders)) {
              setOrders(prev => mergeOrderLists(firestoreOrders, mergeOrderLists(data.orders as Order[], prev)));
              setServerAnalytics((data.analytics as OrderAnalytics) || null);
            }
            return {
              ok: true,
              message: `Order #${orderId} marked as PAYMENT FAILED.`,
            };
          }
        }
      } catch (err) {
        console.warn('Server mark-failed notice (falling back to Cloud/Local):', err);
      }

      if (!serverHandled || firestoreUpdated) {
        setServerAnalytics(null);
        setOrders(prev =>
          prev.map(ord =>
            ord.id === orderId
              ? { ...ord, paymentStatus: 'FAILED', orderStatus: 'PAYMENT_FAILED', paymentFailureReason: reason }
              : ord
          )
        );
        return { ok: true, message: `Order #${orderId} marked as PAYMENT FAILED.` };
      }

      return { ok: false, message: 'Could not update payment status.' };
    },
    [isFirebaseCloudConnected, firestoreOrders]
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

      if (isFirebaseCloudConnected) {
        try {
          await createManualOrderInFirestore(newOrder);
        } catch (err) {
          return {
            ok: false,
            message: err instanceof Error ? err.message : 'Could not save order to Firebase Firestore.',
          };
        }
      }

      try {
        const res = await fetch('/api/orders/manual-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-email': founderAuth.email,
            'x-founder-code': founderAuth.code,
          },
          body: JSON.stringify({ order: newOrder }),
        });
        const data = await safeParseJson(res);
        if (data !== null) {
          if (!res.ok) {
            if (!isFirebaseCloudConnected) {
              return {
                ok: false,
                message: typeof data.error === 'string' ? data.error : 'Could not record order on server.',
              };
            }
          } else if (Array.isArray(data.orders)) {
            setOrders(prev => mergeOrderLists(firestoreOrders, mergeOrderLists(data.orders as Order[], prev)));
            setServerAnalytics((data.analytics as OrderAnalytics) || null);
            return {
              ok: true,
              order: (data.order as Order) || newOrder,
              message: `Order #${newOrder.id} (₹${newOrder.total}) recorded as ${newOrder.paymentStatus}!`,
            };
          }
        }
      } catch (err) {
        console.warn('Manual order server fallback notice:', err);
      }

      setServerAnalytics(null);
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      return {
        ok: true,
        order: newOrder,
        message: `Order #${newOrder.id} (₹${newOrder.total}) recorded as ${newOrder.paymentStatus}!`,
      };
    },
    [isFirebaseCloudConnected, firestoreOrders]
  );

  const founderResetAllOrders = useCallback(
    async (founderAuth: FounderAuthHeaders): Promise<{ ok: boolean; message?: string }> => {
      try {
        if (isFirebaseCloudConnected) {
          await clearAllOrdersInFirestore();
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
          // Static Vercel hosting: no Express /api server running
        }
        try {
          localStorage.removeItem('hairology_orders_v1');
          localStorage.removeItem('hairology_orders_v2');
          localStorage.removeItem(STORAGE_KEY_ORDERS);
        } catch {
          // ignore storage error
        }
        setOrders([]);
        setFirestoreOrders([]);
        setServerAnalytics(null);
        setRecentAdminAlert(null);
        return {
          ok: true,
          message: 'All previous orders cleared! Founder Panel is now completely fresh.',
        };
      } catch (err) {
        console.error('Founder reset orders error:', err);
        return {
          ok: false,
          message: err instanceof Error ? err.message : 'Unable to clear previous orders.',
        };
      }
    },
    [isFirebaseCloudConnected]
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
        orders: combinedOrders,
        analytics,
        upsertOrder,
        setOrdersAndAnalytics,
        fetchFounderOrders,
        updateOrderStatus,
        founderVerifyUpiPayment,
        founderMarkPaymentFailed,
        founderCreateManualOrder,
        founderResetAllOrders,
        recentAdminAlert,
        clearAdminAlert,
        firebaseAdminEmail,
        isFirebaseCloudConnected,
        firebaseSyncError,
        connectFirebaseCloudSync,
        disconnectFirebaseCloudSync,
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
