import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  deleteField,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { CartItem, Order } from '../types';

function clampString(val: unknown, fallback: string, minLen: number, maxLen: number): string {
  const clean = typeof val === 'string' ? val.trim() : '';
  const text = clean.length >= minLen ? clean : fallback;
  return text.slice(0, maxLen);
}

function normalizePhone(val: unknown): string {
  const raw = typeof val === 'string' ? val.trim() : '';
  if (raw.length >= 10 && raw.length <= 20) return raw;
  const digits = raw.replace(/\D/g, '').slice(-10);
  return `+91 ${digits.padStart(10, '0')}`.slice(0, 20);
}

function normalizePincode(val: unknown): string {
  const digits = String(val || '').replace(/\D/g, '').slice(0, 6);
  return digits.length === 6 ? digits : '400001';
}

function sanitizeItems(items: CartItem[]): CartItem[] {
  const source = Array.isArray(items) && items.length > 0 ? items.slice(0, 20) : [];
  return source.map(it => ({
    productId: clampString(it.productId, 'the-duo', 1, 64),
    variantId: clampString(it.variantId, 'duo-full', 1, 64),
    productName: clampString(it.productName, 'Hairology Product', 1, 150),
    variantLabel: clampString(it.variantLabel, 'Standard', 1, 100),
    price: Math.max(0, Number(it.price) || 0),
    mrp: Math.max(0, Number(it.mrp) || Number(it.price) || 0),
    quantity: Math.min(50, Math.max(1, Math.round(Number(it.quantity) || 1))),
    image: clampString(it.image, '/assets/aistudio/duo_hero.webp', 1, 300),
  }));
}

function buildOrderCreateDoc(order: Order) {
  const createdAtIso = clampString(order.createdAt, new Date().toISOString(), 10, 40);
  const safePhone = normalizePhone(order.customerPhone || order.deliveryAddress?.phoneNumber);
  const paymentMethod = order.paymentMethod === 'UPI' ? 'UPI' : 'UPI_QR';

  const payload: Record<string, unknown> = {
    id: clampString(order.id, `HR-2026-${Math.floor(1000 + Math.random() * 9000)}`, 6, 32),
    createdAtIso,
    customerPhone: safePhone,
    deliveryAddress: {
      recipientName: clampString(order.deliveryAddress?.recipientName, 'Customer', 2, 100),
      phoneNumber: normalizePhone(order.deliveryAddress?.phoneNumber || safePhone),
      streetAddress: clampString(order.deliveryAddress?.streetAddress, 'Delivery Address', 5, 300),
      city: clampString(order.deliveryAddress?.city, 'India', 2, 80),
      state: clampString(order.deliveryAddress?.state, 'India', 2, 80),
      pincode: normalizePincode(order.deliveryAddress?.pincode),
    },
    items: sanitizeItems(order.items),
    subtotal: Math.max(0, Number(order.subtotal) || Number(order.total) || 1),
    discount: 0,
    shipping: Math.max(0, Number(order.shipping) || 0),
    codFee: 0,
    total: Math.max(1, Number(order.total) || 1),
    paymentMethod,
    paymentStatus: order.paymentStatus || 'PENDING',
    orderStatus: order.orderStatus || 'PENDING_CONFIRMATION',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (typeof order.paymentInitiated === 'boolean') {
    payload.paymentInitiated = order.paymentInitiated;
  }
  if (order.payerUpi) {
    payload.payerUpi = clampString(order.payerUpi, 'guddan1102@okhdfcbank', 3, 64);
  }
  if (order.trackingNumber) {
    payload.trackingNumber = clampString(order.trackingNumber, 'DELHIVERY-PENDING', 3, 64);
  }
  if (order.gatewayTransactionId) {
    payload.gatewayTransactionId = clampString(order.gatewayTransactionId, 'FOUNDER-CONFIRMED', 3, 64);
  }
  if (order.paymentVerifiedAt) {
    payload.paymentVerifiedAt = clampString(order.paymentVerifiedAt, new Date().toISOString(), 10, 40);
  }
  if (order.paymentFailureReason) {
    payload.paymentFailureReason = clampString(order.paymentFailureReason, 'Payment not received', 1, 200);
  }

  return payload;
}

function buildPublicStatusCreateDoc(order: Order) {
  const payload: Record<string, unknown> = {
    orderId: clampString(order.id, '', 6, 32),
    paymentStatus: order.paymentStatus || 'PENDING',
    orderStatus: order.orderStatus || 'PENDING_CONFIRMATION',
    total: Math.max(1, Number(order.total) || 1),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (order.trackingNumber) {
    payload.trackingNumber = clampString(order.trackingNumber, 'DELHIVERY-PENDING', 3, 64);
  }
  if (order.gatewayTransactionId) {
    payload.gatewayTransactionId = clampString(order.gatewayTransactionId, 'FOUNDER-CONFIRMED', 3, 64);
  }
  if (order.paymentFailureReason) {
    payload.paymentFailureReason = clampString(order.paymentFailureReason, 'Payment not received', 1, 200);
  }

  return payload;
}

export function parseFirestoreOrder(raw: Record<string, unknown>): Order {
  let createdAt = typeof raw.createdAtIso === 'string' ? raw.createdAtIso : '';
  if (!createdAt && raw.createdAt instanceof Timestamp) {
    createdAt = raw.createdAt.toDate().toISOString();
  }
  if (!createdAt) {
    createdAt = new Date().toISOString();
  }

  const addr = (raw.deliveryAddress || {}) as Record<string, unknown>;
  return {
    id: String(raw.id || ''),
    createdAt,
    customerPhone: String(raw.customerPhone || addr.phoneNumber || ''),
    deliveryAddress: {
      recipientName: String(addr.recipientName || ''),
      phoneNumber: String(addr.phoneNumber || raw.customerPhone || ''),
      streetAddress: String(addr.streetAddress || ''),
      city: String(addr.city || ''),
      state: String(addr.state || ''),
      pincode: String(addr.pincode || ''),
    },
    items: Array.isArray(raw.items) ? (raw.items as CartItem[]) : [],
    subtotal: Number(raw.subtotal ?? raw.total ?? 0),
    discount: Number(raw.discount ?? 0),
    shipping: Number(raw.shipping ?? 0),
    codFee: Number(raw.codFee ?? 0),
    total: Number(raw.total ?? 0),
    paymentMethod: raw.paymentMethod === 'UPI' ? 'UPI' : 'UPI_QR',
    paymentStatus: (raw.paymentStatus as Order['paymentStatus']) || 'PENDING',
    orderStatus: (raw.orderStatus as Order['orderStatus']) || 'PENDING_CONFIRMATION',
    ...(typeof raw.paymentInitiated === 'boolean' ? { paymentInitiated: raw.paymentInitiated } : {}),
    ...(typeof raw.payerUpi === 'string' ? { payerUpi: raw.payerUpi } : {}),
    ...(typeof raw.trackingNumber === 'string' ? { trackingNumber: raw.trackingNumber } : {}),
    ...(typeof raw.gatewayTransactionId === 'string'
      ? { gatewayTransactionId: raw.gatewayTransactionId }
      : {}),
    ...(typeof raw.paymentVerifiedAt === 'string' ? { paymentVerifiedAt: raw.paymentVerifiedAt } : {}),
    ...(typeof raw.paymentFailureReason === 'string'
      ? { paymentFailureReason: raw.paymentFailureReason }
      : {}),
  };
}

export async function fsCreatePendingOrder(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    const strictPending: Order = {
      ...order,
      discount: 0,
      codFee: 0,
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_CONFIRMATION',
      paymentInitiated: false,
      gatewayTransactionId: undefined,
      paymentVerifiedAt: undefined,
      paymentFailureReason: undefined,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', strictPending.id), buildOrderCreateDoc(strictPending));
    batch.set(doc(db, 'orderStatuses', strictPending.id), buildPublicStatusCreateDoc(strictPending));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function fsWatchOrderStatus(
  orderId: string,
  onStatus: (status: {
    paymentStatus: Order['paymentStatus'];
    orderStatus: Order['orderStatus'];
    gatewayTransactionId?: string;
    trackingNumber?: string;
    paymentFailureReason?: string;
  }) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `orderStatuses/${orderId}`;
  return onSnapshot(
    doc(db, 'orderStatuses', orderId),
    snapshot => {
      if (!snapshot.exists()) return;
      const d = snapshot.data() as Record<string, unknown>;
      onStatus({
        paymentStatus: (d.paymentStatus as Order['paymentStatus']) || 'PENDING',
        orderStatus: (d.orderStatus as Order['orderStatus']) || 'PENDING_CONFIRMATION',
        ...(typeof d.gatewayTransactionId === 'string'
          ? { gatewayTransactionId: d.gatewayTransactionId }
          : {}),
        ...(typeof d.trackingNumber === 'string' ? { trackingNumber: d.trackingNumber } : {}),
        ...(typeof d.paymentFailureReason === 'string'
          ? { paymentFailureReason: d.paymentFailureReason }
          : {}),
      });
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function fsWatchAllOrders(
  onOrders: (orders: Order[], firestoreMap: Map<string, Order>) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'orders';
  return onSnapshot(
    collection(db, 'orders'),
    snapshot => {
      const fsMap = new Map<string, Order>();
      const list: Order[] = [];
      snapshot.forEach(docSnap => {
        const parsed = parseFirestoreOrder(docSnap.data() as Record<string, unknown>);
        if (parsed.id) {
          fsMap.set(parsed.id, parsed);
          list.push(parsed);
        }
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onOrders(list, fsMap);
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function fsConfirmOrderPaid(
  order: Order,
  confirmationRef: string,
  existsInFirestore: boolean
): Promise<void> {
  const path = `orders/${order.id}`;
  const nowIso = new Date().toISOString();
  const nextOrderStatus: Order['orderStatus'] =
    order.orderStatus === 'PENDING_CONFIRMATION' || order.orderStatus === 'PAYMENT_FAILED'
      ? 'CONFIRMED'
      : order.orderStatus;

  try {
    const batch = writeBatch(db);
    if (!existsInFirestore) {
      const paidOrder: Order = {
        ...order,
        paymentStatus: 'PAID',
        orderStatus: nextOrderStatus,
        paymentInitiated: true,
        gatewayTransactionId: confirmationRef,
        paymentVerifiedAt: nowIso,
        paymentFailureReason: undefined,
      };
      batch.set(doc(db, 'orders', order.id), buildOrderCreateDoc(paidOrder));
      batch.set(doc(db, 'orderStatuses', order.id), buildPublicStatusCreateDoc(paidOrder));
    } else {
      batch.update(doc(db, 'orders', order.id), {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        gatewayTransactionId: confirmationRef,
        paymentVerifiedAt: nowIso,
        paymentInitiated: true,
        paymentFailureReason: deleteField(),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'orderStatuses', order.id), {
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        gatewayTransactionId: confirmationRef,
        paymentFailureReason: deleteField(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsMarkOrderFailed(
  order: Order,
  reason: string,
  existsInFirestore: boolean
): Promise<void> {
  const path = `orders/${order.id}`;
  const cleanReason = clampString(reason, 'No UPI payment received for this order.', 1, 200);
  try {
    const batch = writeBatch(db);
    if (!existsInFirestore) {
      const pendingOrder: Order = {
        ...order,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_CONFIRMATION',
      };
      batch.set(doc(db, 'orders', order.id), buildOrderCreateDoc(pendingOrder));
      batch.set(doc(db, 'orderStatuses', order.id), buildPublicStatusCreateDoc(pendingOrder));
      await batch.commit();
      // Then mark failed cleanly on existing doc
      const failBatch = writeBatch(db);
      failBatch.update(doc(db, 'orders', order.id), {
        paymentStatus: 'FAILED',
        orderStatus: 'PAYMENT_FAILED',
        paymentFailureReason: cleanReason,
        updatedAt: serverTimestamp(),
      });
      failBatch.update(doc(db, 'orderStatuses', order.id), {
        paymentStatus: 'FAILED',
        orderStatus: 'PAYMENT_FAILED',
        paymentFailureReason: cleanReason,
        updatedAt: serverTimestamp(),
      });
      await failBatch.commit();
    } else {
      batch.update(doc(db, 'orders', order.id), {
        paymentStatus: 'FAILED',
        orderStatus: 'PAYMENT_FAILED',
        paymentFailureReason: cleanReason,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'orderStatuses', order.id), {
        paymentStatus: 'FAILED',
        orderStatus: 'PAYMENT_FAILED',
        paymentFailureReason: cleanReason,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsUpdateDeliveryStatus(
  order: Order,
  nextStatus: Order['orderStatus'],
  existsInFirestore: boolean
): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    const batch = writeBatch(db);
    if (!existsInFirestore) {
      const updatedOrder: Order = { ...order, orderStatus: nextStatus };
      batch.set(doc(db, 'orders', order.id), buildOrderCreateDoc(updatedOrder));
      batch.set(doc(db, 'orderStatuses', order.id), buildPublicStatusCreateDoc(updatedOrder));
    } else {
      batch.update(doc(db, 'orders', order.id), {
        orderStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'orderStatuses', order.id), {
        orderStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsDeleteUnpaidOrder(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'orders', orderId));
    batch.delete(doc(db, 'orderStatuses', orderId));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fsClearAllUnpaidOrders(unpaidIds: string[]): Promise<void> {
  if (unpaidIds.length === 0) return;
  const path = 'orders';
  try {
    // Firestore batch supports up to 500 writes (250 orders * 2 docs)
    for (let i = 0; i < unpaidIds.length; i += 200) {
      const chunk = unpaidIds.slice(i, i + 200);
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, 'orders', id));
        batch.delete(doc(db, 'orderStatuses', id));
      }
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fsCreateManualOrder(order: Order): Promise<void> {
  const path = `orders/${order.id}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', order.id), buildOrderCreateDoc(order));
    batch.set(doc(db, 'orderStatuses', order.id), buildPublicStatusCreateDoc(order));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fsSyncPaidOrdersToCloud(
  paidOrdersToHeal: Order[],
  firestoreMap: Map<string, Order>
): Promise<void> {
  if (paidOrdersToHeal.length === 0) return;
  const path = 'orders';
  try {
    for (let i = 0; i < paidOrdersToHeal.length; i += 200) {
      const chunk = paidOrdersToHeal.slice(i, i + 200);
      const batch = writeBatch(db);
      let hasWrites = false;

      for (const ord of chunk) {
        if (ord.paymentStatus !== 'PAID') continue;
        const existingFs = firestoreMap.get(ord.id);
        if (!existingFs) {
          batch.set(doc(db, 'orders', ord.id), buildOrderCreateDoc(ord));
          batch.set(doc(db, 'orderStatuses', ord.id), buildPublicStatusCreateDoc(ord));
          hasWrites = true;
        } else if (existingFs.paymentStatus !== 'PAID') {
          const ref = ord.gatewayTransactionId || `FOUNDER-CONFIRMED-${Date.now().toString().slice(-6)}`;
          const verifiedAt = ord.paymentVerifiedAt || new Date().toISOString();
          batch.update(doc(db, 'orders', ord.id), {
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
            gatewayTransactionId: ref,
            paymentVerifiedAt: verifiedAt,
            paymentInitiated: true,
            paymentFailureReason: deleteField(),
            updatedAt: serverTimestamp(),
          });
          batch.update(doc(db, 'orderStatuses', ord.id), {
            paymentStatus: 'PAID',
            orderStatus: 'CONFIRMED',
            gatewayTransactionId: ref,
            paymentFailureReason: deleteField(),
            updatedAt: serverTimestamp(),
          });
          hasWrites = true;
        } else if (ord.orderStatus !== existingFs.orderStatus) {
          batch.update(doc(db, 'orders', ord.id), {
            orderStatus: ord.orderStatus,
            updatedAt: serverTimestamp(),
          });
          batch.update(doc(db, 'orderStatuses', ord.id), {
            orderStatus: ord.orderStatus,
            updatedAt: serverTimestamp(),
          });
          hasWrites = true;
        }
      }

      if (hasWrites) {
        await batch.commit();
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
