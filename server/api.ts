import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { Order, OrderAnalytics, ProductSalesMetric } from '../src/types/index.ts';

export const AUTHORIZED_FOUNDER_EMAILS = [
  'guddan1102@gmail.com',
  'digitalssanchiagarwal@gmail.com',
];
const DEFAULT_FOUNDER_CODE = process.env.FOUNDER_ACCESS_CODE || '4448989';
const CONNECTED_UPI_ID = 'guddan1102@okhdfcbank';
const CONNECTED_UPI_NAME = 'HAIROLOGY';
const OWNER_WHATSAPP_DIGITS = (process.env.OWNER_WHATSAPP_NUMBER || '918104559706').replace(/\D/g, '');

const SEED_DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_DIR = process.env.VERCEL ? '/tmp/hairology-data' : SEED_DATA_DIR;
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const ORDERS_BACKUP_FILE = path.join(DATA_DIR, 'orders.backup.json');
const CONFIG_FILE = path.join(DATA_DIR, 'founder_config.json');

interface FounderConfig {
  accessCode?: string;
  cardPaymentLink?: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  // When running on serverless ephemeral storage (/tmp), seed from bundled .data/ committed in GitHub
  if (DATA_DIR !== SEED_DATA_DIR) {
    const seedOrders = path.join(SEED_DATA_DIR, 'orders.json');
    const seedBackup = path.join(SEED_DATA_DIR, 'orders.backup.json');
    const seedConfig = path.join(SEED_DATA_DIR, 'founder_config.json');
    if (!fs.existsSync(ORDERS_FILE) && fs.existsSync(seedOrders)) {
      fs.copyFileSync(seedOrders, ORDERS_FILE);
    }
    if (!fs.existsSync(ORDERS_BACKUP_FILE) && fs.existsSync(seedBackup)) {
      fs.copyFileSync(seedBackup, ORDERS_BACKUP_FILE);
    }
    if (!fs.existsSync(CONFIG_FILE) && fs.existsSync(seedConfig)) {
      fs.copyFileSync(seedConfig, CONFIG_FILE);
    }
  }
}

function readOrders(): Order[] {
  try {
    ensureDataDir();
    let mainOrders: Order[] = [];
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      mainOrders = Array.isArray(parsed) ? parsed : [];
    }

    if (fs.existsSync(ORDERS_BACKUP_FILE)) {
      try {
        const backupRaw = fs.readFileSync(ORDERS_BACKUP_FILE, 'utf-8');
        const backupParsed = JSON.parse(backupRaw);
        const backupPaid = Array.isArray(backupParsed)
          ? (backupParsed as Order[]).filter(o => o && o.paymentStatus === 'PAID')
          : [];
        if (backupPaid.length > 0) {
          const map = new Map<string, Order>();
          for (const ord of mainOrders) {
            if (ord && typeof ord.id === 'string') map.set(ord.id, ord);
          }
          let restored = false;
          for (const paidOrd of backupPaid) {
            const existing = map.get(paidOrd.id);
            if (!existing || existing.paymentStatus !== 'PAID') {
              map.set(paidOrd.id, paidOrd);
              restored = true;
            }
          }
          if (restored) {
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            fs.writeFileSync(ORDERS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
            return merged;
          }
        }
      } catch {
        // ignore backup read error
      }
    }

    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    return mainOrders;
  } catch (err) {
    console.error('Error reading orders file:', err);
    return [];
  }
}

function writeOrders(orders: Order[]): void {
  try {
    ensureDataDir();
    const tempFile = `${ORDERS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(orders, null, 2), 'utf-8');
    fs.renameSync(tempFile, ORDERS_FILE);

    const paidOrders = orders.filter(o => o && o.paymentStatus === 'PAID');
    if (paidOrders.length > 0) {
      let existingBackup: Order[] = [];
      if (fs.existsSync(ORDERS_BACKUP_FILE)) {
        try {
          const rawB = fs.readFileSync(ORDERS_BACKUP_FILE, 'utf-8');
          const parsedB = JSON.parse(rawB);
          if (Array.isArray(parsedB)) existingBackup = parsedB as Order[];
        } catch {
          // ignore
        }
      }
      const backupMap = new Map<string, Order>();
      for (const ord of [...existingBackup, ...paidOrders]) {
        if (ord && typeof ord.id === 'string' && ord.paymentStatus === 'PAID') {
          backupMap.set(ord.id, ord);
        }
      }
      const backupTemp = `${ORDERS_BACKUP_FILE}.tmp`;
      fs.writeFileSync(
        backupTemp,
        JSON.stringify(Array.from(backupMap.values()), null, 2),
        'utf-8'
      );
      fs.renameSync(backupTemp, ORDERS_BACKUP_FILE);
    }
  } catch (err) {
    console.error('Error writing orders file:', err);
  }
}

function readFounderConfig(): FounderConfig {
  try {
    ensureDataDir();
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const cfg = JSON.parse(raw) as FounderConfig;
      if (cfg && typeof cfg === 'object') return cfg;
    }
  } catch (err) {
    console.error('Error reading founder config:', err);
  }
  return {};
}

function writeFounderConfig(patch: Partial<FounderConfig>): void {
  ensureDataDir();
  const current = readFounderConfig();
  const next: FounderConfig = { ...current, ...patch };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
}

function getFounderAccessCode(): string {
  const cfg = readFounderConfig();
  if (typeof cfg.accessCode === 'string' && cfg.accessCode.trim().length >= 4) {
    return cfg.accessCode.trim();
  }
  return DEFAULT_FOUNDER_CODE;
}

function setFounderAccessCode(newCode: string): void {
  writeFounderConfig({ accessCode: newCode.trim() });
}

function getCardPaymentLink(): string {
  const cfg = readFounderConfig();
  if (typeof cfg.cardPaymentLink === 'string' && /^https?:\/\//i.test(cfg.cardPaymentLink.trim())) {
    return cfg.cardPaymentLink.trim();
  }
  const envLink = (process.env.CARD_PAYMENT_LINK || process.env.VITE_CARD_PAYMENT_LINK || '').trim();
  if (/^https?:\/\//i.test(envLink)) return envLink;
  return '';
}

function buildOwnerOrderAlertMessage(order: Order): string {
  const itemsList = order.items
    .map(it => `• ${it.quantity}x ${it.productName} (${it.variantLabel}) — ₹${it.price * it.quantity}`)
    .join('\n');

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `🛍️ NEW HAIROLOGY ORDER (#${order.id})\n📅 Date: ${formattedDate}\n\n👤 WHO ORDERED:\n• Name: ${order.deliveryAddress.recipientName}\n• Phone: ${order.customerPhone}\n\n📍 FULL DELIVERY ADDRESS:\n${order.deliveryAddress.streetAddress}\n${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}\n\n📦 WHAT WAS ORDERED:\n${itemsList}\n\n💰 BILLING & PAYMENT:\n• Subtotal: ₹${order.subtotal}${order.discount > 0 ? `\n• Discount${order.couponApplied ? ` (${order.couponApplied})` : ''}: -₹${order.discount}` : ''}\n• Shipping: ${order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}\n• Grand Total: ₹${order.total}\n• Payment Method: ${order.paymentMethod}\n• Payment Status: ${order.paymentStatus}\n• UPI ID: ${CONNECTED_UPI_ID}\n• Order Status: ${order.orderStatus.replace(/_/g, ' ')}\n• AWB Tracking: ${order.trackingNumber || 'Pending'}`;
}

function getOwnerWhatsAppUrl(order: Order): string {
  const msg = buildOwnerOrderAlertMessage(order);
  return `https://wa.me/${OWNER_WHATSAPP_DIGITS}?text=${encodeURIComponent(msg)}`;
}

function buildCustomerThankYouMessage(order: Order): string {
  const itemsList = order.items
    .map(it => `• ${it.quantity}x ${it.productName} (${it.variantLabel}) - ₹${it.price * it.quantity}`)
    .join('\n');

  return `✨ THANK YOU FOR YOUR HAIROLOGY ORDER! ✨\n\nDear ${order.deliveryAddress.recipientName},\nThank you for shopping with HAIROLOGY Haute-Beauté Haircare! Your payment of ₹${order.total} has been confirmed.\n\n📦 ORDER SUMMARY:\n• Order ID: #${order.id}\n• Amount Paid: ₹${order.total} (PAID)\n• Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}\n\n🛍️ ITEMS ORDERED:\n${itemsList}\n\n📍 DELIVERY ADDRESS:\n${order.deliveryAddress.recipientName}\n${order.deliveryAddress.streetAddress}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode} (${order.deliveryAddress.state})\nMobile: ${order.customerPhone}\n\n🚚 DISPATCH & TRACKING:\n• Courier Partner: Delhivery Express\n• AWB Tracking: ${order.trackingNumber}\n• Delivery Window: 2-4 business days across India\n\nHairology team personally packing your order.\n\nThank you for choosing Hairology! 🌿`;
}

async function dispatchOwnerOrderNotification(order: Order): Promise<void> {
  const message = buildOwnerOrderAlertMessage(order);

  const callMeBotKey = (process.env.CALLMEBOT_API_KEY || '').trim();
  if (callMeBotKey && OWNER_WHATSAPP_DIGITS) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(OWNER_WHATSAPP_DIGITS)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(callMeBotKey)}`;
      await fetch(url);
    } catch (err) {
      console.warn('CallMeBot WhatsApp webhook warning:', err);
    }
  }

  const customWebhook = (process.env.WHATSAPP_WEBHOOK_URL || '').trim();
  if (customWebhook) {
    try {
      await fetch(customWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: OWNER_WHATSAPP_DIGITS,
          message,
          order,
        }),
      });
    } catch (err) {
      console.warn('Custom WhatsApp webhook warning:', err);
    }
  }
}

async function dispatchCustomerThankYouNotification(order: Order): Promise<void> {
  const customerWebhook = (process.env.CUSTOMER_WHATSAPP_WEBHOOK_URL || '').trim();
  if (!customerWebhook) return;

  const digits = order.customerPhone.replace(/\D/g, '');
  const toDigits = digits.startsWith('91') ? digits : `91${digits.slice(-10)}`;
  const message = buildCustomerThankYouMessage(order);

  try {
    await fetch(customerWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toDigits,
        message,
        order,
      }),
    });
  } catch (err) {
    console.warn('Customer WhatsApp webhook warning:', err);
  }
}

function computeOrderAnalytics(orders: Order[]): OrderAnalytics {
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

    const seenProductsForOrder = new Set<string>();
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
        if (!seenProductsForOrder.has(item.productId)) {
          metric.paidOrdersCount += 1;
          seenProductsForOrder.add(item.productId);
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

function isAuthorizedFounderEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  return AUTHORIZED_FOUNDER_EMAILS.includes(email.trim().toLowerCase());
}

function requireFounderAuth(req: Request, res: Response, next: NextFunction): void {
  const email = req.headers['x-founder-email'];
  const code = req.headers['x-founder-code'];

  if (!isAuthorizedFounderEmail(email)) {
    res.status(403).json({ error: 'Access denied. Unauthorized founder email.' });
    return;
  }

  if (typeof code !== 'string' || code.trim() !== getFounderAccessCode()) {
    res.status(401).json({ error: 'Invalid founder security access code.' });
    return;
  }

  next();
}

export function attachApiRoutes(app: express.Express): void {
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', upiId: CONNECTED_UPI_ID });
  });

  app.get('/api/payment-config', (_req, res) => {
    res.json({
      upiId: CONNECTED_UPI_ID,
      upiName: CONNECTED_UPI_NAME,
      cardPaymentLink: getCardPaymentLink(),
    });
  });

  // ================= FOUNDER TWO-STEP AUTHENTICATION =================
  app.post('/api/founder/verify-email', (req, res) => {
    const email = req.body?.email;
    if (isAuthorizedFounderEmail(email)) {
      res.json({ valid: true });
    } else {
      res.status(403).json({
        valid: false,
        error: 'Access denied. This Gmail address is not authorized for this panel.',
      });
    }
  });

  app.post('/api/founder/login', (req, res) => {
    const email = req.body?.email;
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';

    if (!isAuthorizedFounderEmail(email)) {
      res.status(403).json({
        authenticated: false,
        error: 'Unauthorized Gmail address.',
      });
      return;
    }

    if (code !== getFounderAccessCode()) {
      res.status(401).json({
        authenticated: false,
        error: 'Incorrect security code. Please check and try again.',
      });
      return;
    }

    res.json({
      authenticated: true,
      email: String(email).trim().toLowerCase(),
      cardPaymentLink: getCardPaymentLink(),
    });
  });

  app.post('/api/founder/change-code', requireFounderAuth, (req, res) => {
    const newCode = typeof req.body?.newCode === 'string' ? req.body.newCode.trim() : '';
    if (newCode.length < 4) {
      res.status(400).json({ error: 'Access code must be at least 4 characters.' });
      return;
    }
    setFounderAccessCode(newCode);
    res.json({ success: true });
  });

  app.post('/api/founder/payment-links', requireFounderAuth, (req, res) => {
    const rawLink = typeof req.body?.cardPaymentLink === 'string' ? req.body.cardPaymentLink.trim() : '';
    if (rawLink && !/^https?:\/\//i.test(rawLink)) {
      res.status(400).json({ error: 'Card payment link must start with https:// or http://' });
      return;
    }
    writeFounderConfig({ cardPaymentLink: rawLink });
    res.json({ success: true, cardPaymentLink: getCardPaymentLink() });
  });

  // ================= CUSTOMER CHECKOUT STEP 2: CREATE PENDING ORDER =================
  app.post('/api/orders/upi-create', (req, res) => {
    try {
      const { deliveryAddress, items, subtotal, discount = 0, shipping = 0, total, couponApplied, paymentMethod } = req.body || {};

      if (!deliveryAddress?.recipientName || !deliveryAddress?.phoneNumber || !deliveryAddress?.streetAddress || !deliveryAddress?.city || !deliveryAddress?.state || !deliveryAddress?.pincode) {
        res.status(400).json({ error: 'Complete delivery address is required before checkout.' });
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Cart items are required.' });
        return;
      }
      if (typeof total !== 'number' || total <= 0) {
        res.status(400).json({ error: 'Valid payable amount is required.' });
        return;
      }

      const orders = readOrders();

      // Deduplicate rapid accidental re-submissions of the same phone + total within 90 seconds
      const normalizedPhone = String(deliveryAddress.phoneNumber).trim();
      const nowMs = Date.now();
      const recentCutoffMs = nowMs - 90_000;
      for (const ord of orders) {
        if (
          ord.paymentStatus === 'PENDING' &&
          ord.customerPhone === normalizedPhone &&
          Number(ord.total) === Number(total) &&
          new Date(ord.createdAt).getTime() > recentCutoffMs
        ) {
          const upiAmountParam = total > 2000 ? '' : `&am=${total.toFixed(2)}`;
          const upiDeepLink = `upi://pay?pa=${encodeURIComponent(CONNECTED_UPI_ID)}&pn=${encodeURIComponent(CONNECTED_UPI_NAME)}${upiAmountParam}&cu=INR&tn=${encodeURIComponent(`Hairology #${ord.id}`)}`;
          res.json({ order: ord, upiId: CONNECTED_UPI_ID, upiDeepLink });
          return;
        }
      }

      const allowedMethods: Array<Order['paymentMethod']> = ['UPI_QR', 'UPI', 'CARD', 'NETBANKING'];
      const chosenMethod: Order['paymentMethod'] = allowedMethods.includes(paymentMethod) ? paymentMethod : 'UPI_QR';

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const orderId = `HR-2026-${randomNum}`;
      const newOrder: Order = {
        id: orderId,
        createdAt: new Date().toISOString(),
        customerPhone: normalizedPhone,
        deliveryAddress: {
          recipientName: String(deliveryAddress.recipientName),
          phoneNumber: normalizedPhone,
          streetAddress: String(deliveryAddress.streetAddress),
          city: String(deliveryAddress.city),
          state: String(deliveryAddress.state),
          pincode: String(deliveryAddress.pincode),
        },
        items,
        subtotal,
        discount,
        shipping,
        codFee: 0,
        total,
        couponApplied,
        paymentMethod: chosenMethod,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_CONFIRMATION',
        payerUpi: CONNECTED_UPI_ID,
        paymentInitiated: false,
        trackingNumber: `DELHIVERY-AWB-${Math.floor(100000000 + Math.random() * 900000000)}`,
      };

      writeOrders([newOrder, ...orders]);
      const upiAmountParam = total > 2000 ? '' : `&am=${total.toFixed(2)}`;
      const upiDeepLink = `upi://pay?pa=${encodeURIComponent(CONNECTED_UPI_ID)}&pn=${encodeURIComponent(CONNECTED_UPI_NAME)}${upiAmountParam}&cu=INR&tn=${encodeURIComponent(`Hairology #${orderId}`)}`;

      res.json({
        order: newOrder,
        upiId: CONNECTED_UPI_ID,
        upiDeepLink,
      });
    } catch (err) {
      console.error('Create UPI order error:', err);
      res.status(500).json({ error: 'Unable to prepare payment order.' });
    }
  });

  // ================= CUSTOMER POLLING: ORDER PAYMENT STATUS =================
  app.get('/api/orders/:id/status', (req, res) => {
    const orderId = req.params.id;
    const orders = readOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (ord.paymentStatus === 'PAID') {
      res.json({
        paid: true,
        paymentStatus: 'PAID',
        orderStatus: ord.orderStatus,
        order: ord,
      });
      return;
    }

    res.json({
      paid: false,
      paymentStatus: ord.paymentStatus,
      orderStatus: ord.orderStatus,
      paymentFailureReason: ord.paymentFailureReason,
    });
  });

  // Customer notifies which payment method was opened (UPI App, QR Code, Card, or Netbanking) — strictly stays PENDING until founder confirms
  app.post('/api/orders/:id/payment-initiated', (req, res) => {
    try {
      const orderId = req.params.id;
      const requestedMethod = req.body?.paymentMethod as Order['paymentMethod'] | undefined;
      const rawNote = typeof req.body?.paymentDetailNote === 'string' ? req.body.paymentDetailNote.trim() : '';
      // Strip any accidental long digit sequences (8+ digits) so full card numbers/CVVs are never stored
      const safeDetailNote = rawNote
        .replace(/\d{8,}/g, '••••')
        .slice(0, 100);
      const allowedMethods: Array<Order['paymentMethod']> = ['UPI_QR', 'UPI', 'CARD', 'NETBANKING'];
      const orders = readOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      orders[idx] = {
        ...orders[idx],
        paymentInitiated: true,
        ...(requestedMethod && allowedMethods.includes(requestedMethod) ? { paymentMethod: requestedMethod } : {}),
        ...(safeDetailNote ? { paymentDetailNote: safeDetailNote } : {}),
      };
      writeOrders(orders);
      res.json({
        ok: true,
        paymentInitiated: true,
        paymentMethod: orders[idx].paymentMethod,
        paymentDetailNote: orders[idx].paymentDetailNote,
      });
    } catch (err) {
      console.error('Payment initiated mark error:', err);
      res.status(500).json({ error: 'Unable to record payment method selection.' });
    }
  });

  // ================= PROTECTED FOUNDER ORDERS & ANALYTICS ROUTES =================
  // Returns all verified PAID orders and all Step 2 PENDING orders awaiting founder confirmation
  app.get('/api/orders', requireFounderAuth, (_req, res) => {
    const orders = readOrders().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const analytics = computeOrderAnalytics(orders);
    res.json({ orders, analytics, cardPaymentLink: getCardPaymentLink() });
  });

  app.post('/api/orders/reset', requireFounderAuth, (_req, res) => {
    const paidOnly = readOrders()
      .filter(o => o.paymentStatus === 'PAID')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    writeOrders(paidOnly);
    const analytics = computeOrderAnalytics(paidOnly);
    res.json({ success: true, orders: paidOnly, analytics });
  });

  app.post('/api/orders/sync-cloud', requireFounderAuth, (req, res) => {
    try {
      const incomingOrders = Array.isArray(req.body?.orders) ? (req.body.orders as Order[]) : [];
      const currentOrders = readOrders();
      const deliveryRank: Record<Order['orderStatus'], number> = {
        PAYMENT_FAILED: 0,
        PENDING_CONFIRMATION: 1,
        CONFIRMED: 2,
        DISPATCHED: 3,
        OUT_FOR_DELIVERY: 4,
        DELIVERED: 5,
      };
      const map = new Map<string, Order>();
      for (const ord of [...incomingOrders, ...currentOrders]) {
        if (!ord || typeof ord.id !== 'string' || !ord.id) continue;
        const existing = map.get(ord.id);
        if (!existing) {
          map.set(ord.id, ord);
        } else if (ord.paymentStatus === 'PAID' && existing.paymentStatus !== 'PAID') {
          map.set(ord.id, ord);
        } else if (
          ord.paymentStatus === 'PAID' &&
          existing.paymentStatus === 'PAID' &&
          deliveryRank[ord.orderStatus] > deliveryRank[existing.orderStatus]
        ) {
          map.set(ord.id, ord);
        }
      }

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      writeOrders(merged);
      res.json({
        success: true,
        orders: merged,
        analytics: computeOrderAnalytics(merged),
      });
    } catch (err) {
      console.error('Cloud order sync error:', err);
      res.status(500).json({ error: 'Unable to sync orders with server.' });
    }
  });

  const handleManualOrderCreate = (req: Request, res: Response) => {
    try {
      const orderInput = req.body?.order as Partial<Order> | undefined;
      if (!orderInput?.deliveryAddress?.recipientName || !orderInput?.customerPhone || typeof orderInput.total !== 'number' || orderInput.total <= 0) {
        res.status(400).json({ error: 'Recipient name, phone number, items, and valid amount are required.' });
        return;
      }

      const isPaid = orderInput.paymentStatus === 'PAID';
      const nowIso = new Date().toISOString();
      const orderId = orderInput.id || `HR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const allowedMethods: Array<Order['paymentMethod']> = ['UPI_QR', 'UPI', 'CARD', 'NETBANKING'];
      const chosenMethod: Order['paymentMethod'] = allowedMethods.includes(orderInput.paymentMethod as Order['paymentMethod'])
        ? (orderInput.paymentMethod as Order['paymentMethod'])
        : 'UPI_QR';

      const newOrder: Order = {
        id: orderId,
        createdAt: orderInput.createdAt || nowIso,
        customerPhone: String(orderInput.customerPhone),
        deliveryAddress: {
          recipientName: String(orderInput.deliveryAddress.recipientName),
          phoneNumber: String(orderInput.customerPhone),
          streetAddress: String(orderInput.deliveryAddress.streetAddress || 'Direct Order'),
          city: String(orderInput.deliveryAddress.city || 'India'),
          state: String(orderInput.deliveryAddress.state || 'India'),
          pincode: String(orderInput.deliveryAddress.pincode || '400001'),
        },
        items: Array.isArray(orderInput.items) && orderInput.items.length > 0 ? orderInput.items : [],
        subtotal: Number(orderInput.subtotal ?? orderInput.total),
        discount: Number(orderInput.discount ?? 0),
        shipping: Number(orderInput.shipping ?? 0),
        codFee: 0,
        total: Number(orderInput.total),
        paymentMethod: chosenMethod,
        paymentStatus: isPaid ? 'PAID' : 'PENDING',
        orderStatus: isPaid ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
        payerUpi: CONNECTED_UPI_ID,
        trackingNumber: orderInput.trackingNumber || `DELHIVERY-AWB-${Math.floor(100000000 + Math.random() * 900000000)}`,
        ...(isPaid
          ? {
              gatewayTransactionId: `FOUNDER-CONFIRMED-${Date.now().toString().slice(-6)}`,
              paymentVerifiedAt: nowIso,
            }
          : {}),
      };

      const existing = readOrders().filter(o => o.id !== newOrder.id);
      const updated = [newOrder, ...existing].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      writeOrders(updated);
      res.json({ order: newOrder, orders: updated, analytics: computeOrderAnalytics(updated) });
    } catch (err) {
      console.error('Manual order create error:', err);
      res.status(500).json({ error: 'Unable to log manual order.' });
    }
  };

  app.post('/api/orders/manual', requireFounderAuth, handleManualOrderCreate);
  app.post('/api/orders/manual-create', requireFounderAuth, handleManualOrderCreate);

  app.patch('/api/orders/:id/status', requireFounderAuth, (req, res) => {
    const orderId = req.params.id;
    const nextStatus = req.body?.orderStatus as Order['orderStatus'];
    const allowedStatuses: Order['orderStatus'][] = [
      'PENDING_CONFIRMATION',
      'CONFIRMED',
      'DISPATCHED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'PAYMENT_FAILED',
    ];

    if (!allowedStatuses.includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid delivery status.' });
      return;
    }

    const orders = readOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (
      (nextStatus === 'DISPATCHED' || nextStatus === 'OUT_FOR_DELIVERY' || nextStatus === 'DELIVERED') &&
      orders[idx].paymentStatus !== 'PAID'
    ) {
      res.status(400).json({
        error: 'Safety block: Cannot mark an unpaid order as Dispatched/Delivered until payment is confirmed as PAID.',
      });
      return;
    }

    orders[idx] = { ...orders[idx], orderStatus: nextStatus };
    writeOrders(orders);

    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ order: orders[idx], orders: sorted, analytics: computeOrderAnalytics(sorted) });
  });

  // Founder-only confirmation of payment received (no UTR required)
  app.post('/api/orders/:id/verify-upi', requireFounderAuth, (req, res) => {
    try {
      const orderId = req.params.id;
      const confirmationRef = `FOUNDER-CONFIRMED-${Date.now().toString().slice(-6)}`;

      const orders = readOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      orders[idx] = {
        ...orders[idx],
        paymentMethod: orders[idx].paymentMethod || 'UPI_QR',
        paymentStatus: 'PAID',
        paymentInitiated: true,
        orderStatus:
          orders[idx].orderStatus === 'PENDING_CONFIRMATION' || orders[idx].orderStatus === 'PAYMENT_FAILED'
            ? 'CONFIRMED'
            : orders[idx].orderStatus,
        gatewayTransactionId: confirmationRef,
        paymentVerifiedAt: new Date().toISOString(),
        paymentFailureReason: undefined,
      };

      writeOrders(orders);
      void dispatchOwnerOrderNotification(orders[idx]);
      void dispatchCustomerThankYouNotification(orders[idx]);
      const sorted = [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json({
        order: orders[idx],
        orders: sorted,
        analytics: computeOrderAnalytics(sorted),
        ownerWhatsappUrl: getOwnerWhatsAppUrl(orders[idx]),
      });
    } catch (err) {
      console.error('Verify UPI payment error:', err);
      res.status(500).json({ error: 'Unable to confirm order.' });
    }
  });

  // Android GPay / Bank Notification Webhook -> highlights matching pending order in Founder Panel ONLY (never confirms PAID without founder tap)
  app.post('/api/upi/auto-confirm-webhook', (req, res) => {
    try {
      const expectedSecret = (process.env.UPI_WEBHOOK_SECRET || getFounderAccessCode()).trim();
      const providedSecret = String(
        req.headers['x-webhook-secret'] || req.body?.secret || req.query?.secret || ''
      ).trim();

      if (!providedSecret || providedSecret !== expectedSecret) {
        res.status(401).json({ error: 'Unauthorized webhook secret.' });
        return;
      }

      const text = String(req.body?.text || req.body?.message || req.body?.notification || '');
      let amount = Number(req.body?.amount || 0);
      if ((!Number.isFinite(amount) || amount <= 0) && text) {
        const amtMatch = text.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
        if (amtMatch) {
          amount = Math.round(Number(amtMatch[1].replace(/,/g, '')));
        }
      }

      let orderId = String(req.body?.orderId || '').trim();
      if (!orderId && text) {
        const ordMatch = text.match(/\b(HR-2026-\d{4})\b/i);
        if (ordMatch) orderId = ordMatch[1].toUpperCase();
      }

      const orders = readOrders().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      let targetIdx = -1;
      if (orderId) {
        targetIdx = orders.findIndex(o => o.id === orderId && o.paymentStatus !== 'PAID');
      }
      if (targetIdx === -1 && amount > 0) {
        targetIdx = orders.findIndex(
          o =>
            o.paymentStatus === 'PENDING' &&
            o.paymentInitiated === true &&
            Math.round(Number(o.total)) === Math.round(amount)
        );
      }
      if (targetIdx === -1 && amount > 0) {
        targetIdx = orders.findIndex(
          o =>
            o.paymentStatus === 'PENDING' &&
            Math.round(Number(o.total)) === Math.round(amount)
        );
      }

      if (targetIdx === -1) {
        res.status(404).json({
          matched: false,
          error: 'No matching pending order found for that order ID or amount.',
        });
        return;
      }

      orders[targetIdx] = {
        ...orders[targetIdx],
        paymentInitiated: true,
      };

      writeOrders(orders);

      res.json({
        matched: true,
        confirmed: false,
        awaitingFounderConfirmation: true,
        orderId: orders[targetIdx].id,
        total: orders[targetIdx].total,
        order: orders[targetIdx],
      });
    } catch (err) {
      console.error('UPI webhook error:', err);
      res.status(500).json({ error: 'Failed to process UPI notification webhook.' });
    }
  });

  // Founder-only mark payment as FAILED
  app.post('/api/orders/:id/mark-failed', requireFounderAuth, (req, res) => {
    try {
      const orderId = req.params.id;
      const reason = String(req.body?.reason || '').trim() || 'No payment received for this order.';

      const orders = readOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      if (orders[idx].paymentStatus === 'PAID') {
        res.status(400).json({ error: 'Cannot mark an already verified PAID order as failed.' });
        return;
      }

      orders[idx] = {
        ...orders[idx],
        paymentStatus: 'FAILED',
        orderStatus: 'PAYMENT_FAILED',
        paymentFailureReason: reason,
      };

      writeOrders(orders);
      const sorted = [...orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json({ order: orders[idx], orders: sorted, analytics: computeOrderAnalytics(sorted) });
    } catch (err) {
      console.error('Mark payment failed error:', err);
      res.status(500).json({ error: 'Unable to mark order as failed.' });
    }
  });

  // Founder-only remove all unpaid/visitor entries while preserving every PAID order
  app.post('/api/orders/clear-unpaid', requireFounderAuth, (_req, res) => {
    try {
      const orders = readOrders();
      const paidOnly = orders
        .filter(o => o.paymentStatus === 'PAID')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const removedCount = orders.length - paidOnly.length;
      writeOrders(paidOnly);
      res.json({
        success: true,
        removedCount,
        orders: paidOnly,
        analytics: computeOrderAnalytics(paidOnly),
      });
    } catch (err) {
      console.error('Clear unpaid orders error:', err);
      res.status(500).json({ error: 'Unable to clear unpaid entries.' });
    }
  });

  // Founder-only delete a single unpaid/abandoned visitor row
  app.delete('/api/orders/:id', requireFounderAuth, (req, res) => {
    try {
      const orderId = req.params.id;
      const orders = readOrders();
      const target = orders.find(o => o.id === orderId);
      if (!target) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      if (target.paymentStatus === 'PAID') {
        res.status(400).json({ error: 'Safety block: Cannot delete a verified PAID customer order.' });
        return;
      }
      const remaining = orders
        .filter(o => o.id !== orderId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      writeOrders(remaining);
      res.json({
        success: true,
        orders: remaining,
        analytics: computeOrderAnalytics(remaining),
      });
    } catch (err) {
      console.error('Delete unpaid order error:', err);
      res.status(500).json({ error: 'Unable to delete unpaid entry.' });
    }
  });
}

export function createApiApp(): express.Express {
  const app = express();
  attachApiRoutes(app);
  return app;
}
