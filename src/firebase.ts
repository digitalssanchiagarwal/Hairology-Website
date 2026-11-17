import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  collection,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  deleteField,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Order, CartItem } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const AUTHORIZED_CLOUD_ADMIN_EMAILS = [
  'guddan1102@gmail.com',
  'digitalssanchiagarwal@gmail.com'
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on application boot
async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function isAuthorizedFirebaseAdmin(user: FirebaseUser | null): boolean {
  if (!user || !user.email || !user.emailVerified) return false;
  return AUTHORIZED_CLOUD_ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export function subscribeToFirebaseAuth(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function signInFounderWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFounderGoogle(): Promise<void> {
  await signOut(auth);
}

function clampString(val: unknown, maxLen: number, fallback = ''): string {
  const s = typeof val === 'string' ? val.trim() : fallback;
  return s.slice(0, maxLen);
}

function sanitizeItemsForFirestore(items: CartItem[]): CartItem[] {
  return items.slice(0, 20).map(item => ({
    productId: clampString(item.productId, 64, 'item'),
    variantId: clampString(item.variantId, 64, 'std'),
    productName: clampString(item.productName, 150, 'HAIROLOGY Product'),
    variantLabel: clampString(item.variantLabel, 80, 'Standard'),
    price: Math.max(0, Number(item.price) || 0),
    mrp: Math.max(0, Number(item.mrp) || 0),
    quantity: Math.min(50, Math.max(1, Math.round(Number(item.quantity) || 1))),
    image: clampString(item.image, 300, ''),
  }));
}

export async function persistPendingOrderToFirestore(order: Order): Promise<void> {
  const orderId = clampString(order.id, 32);
  if (!/^[a-zA-Z0-9_-]{6,32}$/.test(orderId)) {
    throw new Error('Invalid order ID format for Firestore persistence.');
  }

  const cleanDigits = order.deliveryAddress.pincode.replace(/\D/g, '').slice(0, 6).padEnd(6, '0');
  const orderDocPayload: Record<string, unknown> = {
    id: orderId,
    createdAtIso: clampString(order.createdAt || new Date().toISOString(), 40),
    customerPhone: clampString(order.customerPhone, 20, '+91 0000000000'),
    deliveryAddress: {
      recipientName: clampString(order.deliveryAddress.recipientName, 100, 'Customer'),
      phoneNumber: clampString(order.deliveryAddress.phoneNumber, 20, order.customerPhone),
      streetAddress: clampString(order.deliveryAddress.streetAddress, 300, 'Address'),
      city: clampString(order.deliveryAddress.city, 80, 'India'),
      state: clampString(order.deliveryAddress.state, 80, 'India'),
      pincode: cleanDigits,
    },
    items: sanitizeItemsForFirestore(order.items),
    subtotal: Math.max(0, Number(order.subtotal) || 0),
    discount: 0,
    shipping: Math.max(0, Number(order.shipping) || 0),
    codFee: 0,
    total: Math.max(1, Number(order.total) || 1),
    paymentMethod: 'UPI_QR',
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING_CONFIRMATION',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (order.payerUpi) orderDocPayload.payerUpi = clampString(order.payerUpi, 64);
  if (order.trackingNumber) orderDocPayload.trackingNumber = clampString(order.trackingNumber, 64);

  const statusDocPayload: Record<string, unknown> = {
    orderId,
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING_CONFIRMATION',
    total: Math.max(1, Number(order.total) || 1),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (order.trackingNumber) statusDocPayload.trackingNumber = clampString(order.trackingNumber, 64);

  const batch = writeBatch(db);
  batch.set(doc(db, 'orders', orderId), orderDocPayload);
  batch.set(doc(db, 'orderStatuses', orderId), statusDocPayload);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
  }
}

export interface PublicOrderStatusSnapshot {
  orderId: string;
  paymentStatus: Order['paymentStatus'];
  orderStatus: Order['orderStatus'];
  gatewayTransactionId?: string;
  trackingNumber?: string;
  paymentFailureReason?: string;
}

export function subscribeToPublicOrderStatus(
  orderId: string,
  onStatus: (status: PublicOrderStatusSnapshot) => void
): Unsubscribe {
  const path = `orderStatuses/${orderId}`;
  return onSnapshot(
    doc(db, 'orderStatuses', orderId),
    snapshot => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      onStatus({
        orderId: String(data.orderId || orderId),
        paymentStatus: (data.paymentStatus as Order['paymentStatus']) || 'PENDING',
        orderStatus: (data.orderStatus as Order['orderStatus']) || 'PENDING_CONFIRMATION',
        gatewayTransactionId: typeof data.gatewayTransactionId === 'string' ? data.gatewayTransactionId : undefined,
        trackingNumber: typeof data.trackingNumber === 'string' ? data.trackingNumber : undefined,
        paymentFailureReason: typeof data.paymentFailureReason === 'string' ? data.paymentFailureReason : undefined,
      });
    },
    error => {
      console.warn(`Firestore public status listener notice on ${path}:`, error?.message || error);
    }
  );
}

export function subscribeToAllOrdersAdmin(
  onOrders: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    snapshot => {
      const mapped: Order[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: String(data.id || d.id),
          createdAt: typeof data.createdAtIso === 'string' ? data.createdAtIso : new Date().toISOString(),
          customerPhone: String(data.customerPhone || ''),
          deliveryAddress: data.deliveryAddress as Order['deliveryAddress'],
          items: Array.isArray(data.items) ? (data.items as CartItem[]) : [],
          subtotal: Number(data.subtotal || 0),
          discount: Number(data.discount || 0),
          shipping: Number(data.shipping || 0),
          codFee: Number(data.codFee || 0),
          total: Number(data.total || 0),
          paymentMethod: (data.paymentMethod as Order['paymentMethod']) || 'UPI_QR',
          paymentStatus: (data.paymentStatus as Order['paymentStatus']) || 'PENDING',
          orderStatus: (data.orderStatus as Order['orderStatus']) || 'PENDING_CONFIRMATION',
          payerUpi: typeof data.payerUpi === 'string' ? data.payerUpi : undefined,
          trackingNumber: typeof data.trackingNumber === 'string' ? data.trackingNumber : undefined,
          gatewayTransactionId:
            typeof data.gatewayTransactionId === 'string' ? data.gatewayTransactionId : undefined,
          paymentVerifiedAt: typeof data.paymentVerifiedAt === 'string' ? data.paymentVerifiedAt : undefined,
          paymentFailureReason:
            typeof data.paymentFailureReason === 'string' ? data.paymentFailureReason : undefined,
        };
      });
      onOrders(mapped);
    },
    error => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function verifyOrderPaidInFirestore(
  orderId: string,
  utrRef: string,
  verifiedAtIso: string
): Promise<boolean> {
  const orderRef = doc(db, 'orders', orderId);
  const statusRef = doc(db, 'orderStatuses', orderId);
  const path = `orders/${orderId}`;

  try {
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return false;

    const cleanUtr = clampString(utrRef, 64, `UPI-RCVD-${Date.now().toString().slice(-6)}`);
    const batch = writeBatch(db);
    batch.update(orderRef, {
      paymentStatus: 'PAID',
      orderStatus: 'CONFIRMED',
      gatewayTransactionId: cleanUtr,
      paymentVerifiedAt: clampString(verifiedAtIso, 40),
      paymentFailureReason: deleteField(),
      updatedAt: serverTimestamp(),
    });
    batch.update(statusRef, {
      paymentStatus: 'PAID',
      orderStatus: 'CONFIRMED',
      gatewayTransactionId: cleanUtr,
      paymentFailureReason: deleteField(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markOrderFailedInFirestore(orderId: string, reason: string): Promise<boolean> {
  const orderRef = doc(db, 'orders', orderId);
  const statusRef = doc(db, 'orderStatuses', orderId);
  const path = `orders/${orderId}`;

  try {
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return false;

    const cleanReason = clampString(reason, 200, 'No UPI payment received for this order.');
    const batch = writeBatch(db);
    batch.update(orderRef, {
      paymentStatus: 'FAILED',
      orderStatus: 'PAYMENT_FAILED',
      paymentFailureReason: cleanReason,
      updatedAt: serverTimestamp(),
    });
    batch.update(statusRef, {
      paymentStatus: 'FAILED',
      orderStatus: 'PAYMENT_FAILED',
      paymentFailureReason: cleanReason,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderDeliveryStatusInFirestore(
  orderId: string,
  nextStatus: Order['orderStatus']
): Promise<boolean> {
  const orderRef = doc(db, 'orders', orderId);
  const statusRef = doc(db, 'orderStatuses', orderId);
  const path = `orders/${orderId}`;

  try {
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return false;

    const batch = writeBatch(db);
    batch.update(orderRef, {
      orderStatus: nextStatus,
      updatedAt: serverTimestamp(),
    });
    batch.update(statusRef, {
      orderStatus: nextStatus,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function clearAllOrdersInFirestore(): Promise<number> {
  try {
    const [ordersSnap, statusSnap] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(collection(db, 'orderStatuses')),
    ]);

    const refsToDelete = [...ordersSnap.docs.map(d => d.ref), ...statusSnap.docs.map(d => d.ref)];
    for (let i = 0; i < refsToDelete.length; i += 400) {
      const batch = writeBatch(db);
      for (const ref of refsToDelete.slice(i, i + 400)) {
        batch.delete(ref);
      }
      await batch.commit();
    }
    return ordersSnap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'orders');
  }
}
