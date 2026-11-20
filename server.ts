import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { Order, OrderAnalytics, ProductSalesMetric } from './src/types/index.ts';

const PORT = Number(process.env.PORT || 3000);
const AUTHORIZED_FOUNDER_EMAIL = 'guddan1102@gmail.com';
const DEFAULT_FOUNDER_CODE = process.env.FOUNDER_ACCESS_CODE || '4448989';
const CONNECTED_UPI_ID = 'guddan1102@okhdfcbank';
const CONNECTED_UPI_NAME = 'HAIROLOGY';
const OWNER_WHATSAPP_DIGITS = (process.env.OWNER_WHATSAPP_NUMBER || '918104559706').replace(/\D/g, '');

const DATA_DIR = path.resolve(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CONFIG_FILE = path.join(DATA_DIR, 'founder_config.json');

interface FounderConfig {
  accessCode: string;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readOrders(): Order[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading orders file:', err);
    return [];
  }
}

function writeOrders(orders: Order[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders file:', err);
  }
}

function getFounderAccessCode(): string {
  try {
    ensureDataDir();
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const cfg = JSON.parse(raw) as FounderConfig;
      if (cfg && typeof cfg.accessCode === 'string' && cfg.accessCode.trim().length >= 4) {
        return cfg.accessCode.trim();
      }
    }
  } catch (err) {
    console.error('Error reading founder config:', err);
  }
  return DEFAULT_FOUNDER_CODE;
}

function setFounderAccessCode(newCode: string): void {
  ensureDataDir();
  const cfg: FounderConfig = { accessCode: newCode.trim() };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
}

function buildOwnerOrderAlertMessage(order: Order): string {
  const itemsList = order.items
    .map(it => `• ${it.quantity}x ${it.productName} (${it.variantLabel}) — ₹${it.price * it.quantity}`)
    .join('\n');

  const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `🛍️ NEW HAIROLOGY ORDER (#${order.id})\n📅 Date: ${formattedDate}\n\n👤 WHO ORDERED:\n• Name: ${order.deliveryAddress.recipientName}\n• Phone: ${order.customerPhone}\n\n📍 FULL DELIVERY ADDRESS:\n${order.deliveryAddress.streetAddress}\n${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}\n\n📦 WHAT WAS ORDERED:\n${itemsList}\n\n💰 BILLING & PAYMENT:\n• Subtotal: ₹${order.subtotal}${order.discount > 0 ? `\n• Discount${order.couponApplied ? ` (${order.couponApplied})` : ''}: -₹${order.discount}` : ''}\n• Shipping: ${order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}\n• Grand Total: ₹${order.total}\n• Payment Status: ${order.paymentStatus}${order.gatewayTransactionId ? ` (UTR: ${order.gatewayTransactionId})` : ''}\n• UPI ID: ${CONNECTED_UPI_ID}\n• Order Status: ${order.orderStatus.replace(/_/g, ' ')}\n• AWB Tracking: ${order.trackingNumber || 'Pending'}`;
}

function getOwnerWhatsAppUrl(order: Order): string {
  const msg = buildOwnerOrderAlertMessage(order);
  return `https://wa.me/${OWNER_WHATSAPP_DIGITS}?text=${encodeURIComponent(msg)}`;
}

function buildCustomerThankYouMessage(order: Order): string {
  const itemsList = order.items
    .map(it => `• ${it.quantity}x ${it.productName} (${it.variantLabel}) - ₹${it.price * it.quantity}`)
    .join('\n');

  return `✨ THANK YOU FOR YOUR HAIROLOGY ORDER! ✨\n\nDear ${order.deliveryAddress.recipientName},\nThank you for shopping with HAIROLOGY Haute-Beauté Haircare! Your UPI payment of ₹${order.total} has been confirmed.\n\n📦 ORDER SUMMARY:\n• Order ID: #${order.id}\n• UPI Transaction Ref: ${order.gatewayTransactionId || 'Verified'}\n• Amount Paid: ₹${order.total} (PAID)\n• Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}\n\n🛍️ ITEMS ORDERED:\n${itemsList}\n\n📍 DELIVERY ADDRESS:\n${order.deliveryAddress.recipientName}\n${order.deliveryAddress.streetAddress}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode} (${order.deliveryAddress.state})\nMobile: ${order.customerPhone}\n\n🚚 DISPATCH & TRACKING:\n• Courier Partner: Delhivery Express\n• AWB Tracking: ${order.trackingNumber}\n• Delivery Window: 2-4 business days across India\n\nHairology team personally packing your order.\n\nThank you for choosing Hairology! 🌿`;
}

async function dispatchOwnerOrderNotification(order: Order): Promise<void> {
  const message = buildOwnerOrderAlertMessage(order);
  const webhookUrl = (process.env.WHATSAPP_WEBHOOK_URL || '').trim();
  const callMeBotKey = (process.env.CALLMEBOT_API_KEY || '').trim();

  if (webhookUrl.startsWith('http')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerPhone: `+${OWNER_WHATSAPP_DIGITS}`,
          message,
          order,
        }),
      });
    } catch (err) {
      console.warn('Owner WhatsApp webhook notification notice:', err);
    }
  }

  if (callMeBotKey) {
    try {
      await fetch(
        `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(OWNER_WHATSAPP_DIGITS)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(callMeBotKey)}`
      );
    } catch (err) {
      console.warn('CallMeBot WhatsApp notification notice:', err);
    }
  }
}

async function dispatchCustomerThankYouNotification(order: Order): Promise<void> {
  const webhookUrl = (process.env.CUSTOMER_WHATSAPP_WEBHOOK_URL || '').trim();
  if (!webhookUrl.startsWith('http')) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'CUSTOMER_THANK_YOU',
        customerPhone: order.customerPhone,
        recipientName: order.deliveryAddress.recipientName,
        orderId: order.id,
        total: order.total,
        trackingNumber: order.trackingNumber,
        message: buildCustomerThankYouMessage(order),
        order,
      }),
    });
  } catch (err) {
    console.warn('Customer WhatsApp webhook notice:', err);
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

  const catalogDefaults = [
    { id: 'the-trio', name: 'The Hairology Trio' },
    { id: 'the-duo', name: 'The Hairology Duo (Clarify & Reconstruct)' },
    { id: 'hot-water-rosemary-duo', name: 'Hot Water Shampoo + Rosemary Conditioner' },
    { id: 'protein-rosemary-duo', name: 'Protein + Rosemary conditioner' },
    { id: 'hot-water-shampoo', name: 'Hot Water Shampoo (Heat Shield + Clarify)' },
    { id: 'protein-shampoo', name: 'Protein Shampoo (Strength in Every Strand)' },
    { id: 'rosemary-conditioner', name: 'ROSEMARY CONDITIONER' },
  ];
  for (const prod of catalogDefaults) {
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

    const seenProductsInOrder = new Set<string>();
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
        if (!seenProductsInOrder.has(item.productId)) {
          metric.paidOrdersCount += 1;
          seenProductsInOrder.add(item.productId);
        }
      } else if (isFailed) {
        metric.failedUnits += item.quantity;
      } else if (isPending) {
        metric.pendingUnits += item.quantity;
      }
    }
  }

  const productWiseSales = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);

  return {
    totalSales,
    totalOrders: orders.length,
    successfulPaymentsCount,
    successfulPaymentsAmount,
    failedPaymentsCount,
    failedPaymentsAmount,
    pendingOrdersCount,
    pendingOrdersAmount,
    productWiseSales,
    deliveryStatusBreakdown,
  };
}

function requireFounderAuth(req: Request, res: Response, next: NextFunction): void {
  const emailHeader = String(req.headers['x-founder-email'] || '').trim().toLowerCase();
  const codeHeader = String(req.headers['x-founder-code'] || '').trim();

  if (emailHeader !== AUTHORIZED_FOUNDER_EMAIL || codeHeader !== getFounderAccessCode()) {
    res.status(401).json({ error: 'Unauthorized: Founder credentials required.' });
    return;
  }
  next();
}

async function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', upiId: CONNECTED_UPI_ID });
  });

  // ================= FOUNDER AUTHENTICATION ROUTES =================
  app.post('/api/founder/verify-email', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (email === AUTHORIZED_FOUNDER_EMAIL) {
      res.json({ valid: true });
      return;
    }
    res.status(403).json({ valid: false, error: 'This Gmail address is not authorized for this panel.' });
  });

  app.post('/api/founder/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    if (email !== AUTHORIZED_FOUNDER_EMAIL) {
      res.status(403).json({ authenticated: false, error: 'Unauthorized Gmail address.' });
      return;
    }
    if (code !== getFounderAccessCode()) {
      res.status(401).json({ authenticated: false, error: 'Incorrect security access code.' });
      return;
    }
    res.json({ authenticated: true, email: AUTHORIZED_FOUNDER_EMAIL });
  });

  app.post('/api/founder/change-code', requireFounderAuth, (req, res) => {
    const nextCode = String(req.body?.newCode || '').trim();
    if (nextCode.length < 4) {
      res.status(400).json({ error: 'Access code must be at least 4 characters.' });
      return;
    }
    setFounderAccessCode(nextCode);
    res.json({ success: true, message: 'Access code updated.' });
  });

  // ================= CREATE PENDING UPI ORDER (AUTO-AMOUNT QR) =================
  app.post('/api/orders/upi-create', (req, res) => {
    try {
      const body = req.body || {};
      const deliveryAddress = body.deliveryAddress;
      const items = Array.isArray(body.items) ? body.items : [];
      const subtotal = Number(body.subtotal || 0);
      const discount = 0;
      const shipping = Number(body.shipping || 0);
      const total = Number(body.total || 0);
      const couponApplied = undefined;
      const existingOrderId = body.existingOrderId ? String(body.existingOrderId).trim() : undefined;

      if (
        !deliveryAddress ||
        !deliveryAddress.recipientName ||
        !deliveryAddress.phoneNumber ||
        !deliveryAddress.streetAddress ||
        !deliveryAddress.city ||
        !deliveryAddress.state ||
        !deliveryAddress.pincode ||
        items.length === 0 ||
        total <= 0
      ) {
        res.status(400).json({ error: 'Complete delivery address, cart items, and valid total amount are required.' });
        return;
      }

      const orders = readOrders();

      if (existingOrderId) {
        const existingIdx = orders.findIndex(o => o.id === existingOrderId && o.paymentStatus === 'PENDING');
        if (existingIdx > -1) {
          orders[existingIdx] = {
            ...orders[existingIdx],
            customerPhone: String(deliveryAddress.phoneNumber),
            deliveryAddress: {
              recipientName: String(deliveryAddress.recipientName),
              phoneNumber: String(deliveryAddress.phoneNumber),
              streetAddress: String(deliveryAddress.streetAddress),
              city: String(deliveryAddress.city),
              state: String(deliveryAddress.state),
              pincode: String(deliveryAddress.pincode),
            },
            items,
            subtotal,
            discount,
            shipping,
            total,
            couponApplied,
          };
          writeOrders(orders);
          const ord = orders[existingIdx];
          const upiDeepLink = `upi://pay?pa=${encodeURIComponent(CONNECTED_UPI_ID)}&pn=${encodeURIComponent(CONNECTED_UPI_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Hairology #${ord.id}`)}`;
          res.json({ order: ord, upiId: CONNECTED_UPI_ID, upiDeepLink });
          return;
        }
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const orderId = `HR-2026-${randomNum}`;
      const newOrder: Order = {
        id: orderId,
        createdAt: new Date().toISOString(),
        customerPhone: String(deliveryAddress.phoneNumber),
        deliveryAddress: {
          recipientName: String(deliveryAddress.recipientName),
          phoneNumber: String(deliveryAddress.phoneNumber),
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
        paymentMethod: 'UPI_QR',
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_CONFIRMATION',
        payerUpi: CONNECTED_UPI_ID,
        trackingNumber: `DELHIVERY-AWB-${Math.floor(100000000 + Math.random() * 900000000)}`,
      };

      writeOrders([newOrder, ...orders]);
      void dispatchOwnerOrderNotification(newOrder);
      const upiDeepLink = `upi://pay?pa=${encodeURIComponent(CONNECTED_UPI_ID)}&pn=${encodeURIComponent(CONNECTED_UPI_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Hairology #${orderId}`)}`;

      res.json({
        order: newOrder,
        upiId: CONNECTED_UPI_ID,
        upiDeepLink,
      });
    } catch (err) {
      console.error('Create UPI order error:', err);
      res.status(500).json({ error: 'Unable to prepare UPI payment order.' });
    }
  });

  // ================= CUSTOMER POLLING: ORDER PAYMENT STATUS =================
  // Only returns full confirmed receipt once paymentStatus === 'PAID'
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
        paymentStatus: ord.paymentStatus,
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

  // ================= PROTECTED FOUNDER ORDERS & ANALYTICS ROUTES =================
  app.get('/api/orders', requireFounderAuth, (_req, res) => {
    const orders = readOrders().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const analytics = computeOrderAnalytics(orders);
    res.json({ orders, analytics });
  });

  app.post('/api/orders/reset', requireFounderAuth, (_req, res) => {
    writeOrders([]);
    const analytics = computeOrderAnalytics([]);
    res.json({ success: true, orders: [], analytics });
  });

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
        error: 'Safety block: Cannot mark an unpaid order as Dispatched/Delivered until UPI payment is verified as PAID.',
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

  // Founder-only verification of UPI payment received on guddan1102@okhdfcbank (1-tap or with UTR Ref)
  app.post('/api/orders/:id/verify-upi', requireFounderAuth, (req, res) => {
    try {
      const orderId = req.params.id;
      const rawUtr = String(req.body?.utrRef || '').trim();

      if (rawUtr && !/^[A-Za-z0-9_-]{4,64}$/.test(rawUtr)) {
        res.status(400).json({
          error: 'Invalid UTR format. Use letters/numbers only or leave blank for 1-tap confirmation.',
        });
        return;
      }

      const utrRef = rawUtr || `UPI-RCVD-${Date.now().toString().slice(-6)}`;

      const orders = readOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      orders[idx] = {
        ...orders[idx],
        paymentMethod: 'UPI_QR',
        paymentStatus: 'PAID',
        orderStatus:
          orders[idx].orderStatus === 'PENDING_CONFIRMATION' || orders[idx].orderStatus === 'PAYMENT_FAILED'
            ? 'CONFIRMED'
            : orders[idx].orderStatus,
        gatewayTransactionId: utrRef,
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
      res.status(500).json({ error: 'Unable to verify UPI payment.' });
    }
  });

  // Automated Android Google Pay / Bank SMS Notification Webhook -> auto-matches & checks out customer order
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

      let utrRef = String(req.body?.utr || req.body?.utrRef || '').trim();
      if (!utrRef && text) {
        const utrMatch = text.match(/\b(\d{12})\b/);
        if (utrMatch) utrRef = utrMatch[1];
      }
      if (!utrRef) {
        utrRef = `GPAY-AUTO-${Date.now().toString().slice(-6)}`;
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
            Math.round(Number(o.total)) === Math.round(amount)
        );
      }

      if (targetIdx === -1) {
        res.status(404).json({
          matched: false,
          error: 'No matching pending UPI order found for that order ID or amount.',
        });
        return;
      }

      orders[targetIdx] = {
        ...orders[targetIdx],
        paymentMethod: 'UPI_QR',
        paymentStatus: 'PAID',
        orderStatus:
          orders[targetIdx].orderStatus === 'PENDING_CONFIRMATION' || orders[targetIdx].orderStatus === 'PAYMENT_FAILED'
            ? 'CONFIRMED'
            : orders[targetIdx].orderStatus,
        gatewayTransactionId: utrRef,
        paymentVerifiedAt: new Date().toISOString(),
        paymentFailureReason: undefined,
      };

      writeOrders(orders);
      void dispatchOwnerOrderNotification(orders[targetIdx]);
      void dispatchCustomerThankYouNotification(orders[targetIdx]);

      res.json({
        matched: true,
        orderId: orders[targetIdx].id,
        total: orders[targetIdx].total,
        utrRef,
        order: orders[targetIdx],
      });
    } catch (err) {
      console.error('Auto-confirm UPI webhook error:', err);
      res.status(500).json({ error: 'Failed to process UPI notification webhook.' });
    }
  });

  // Founder-only mark payment as FAILED
  app.post('/api/orders/:id/mark-failed', requireFounderAuth, (req, res) => {
    try {
      const orderId = req.params.id;
      const reason = String(req.body?.reason || '').trim() || 'No UPI payment received for this order.';

      const orders = readOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }

      if (orders[idx].paymentStatus === 'PAID') {
        res.status(400).json({ error: 'Cannot mark an already PAID order as failed.' });
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

  // ================= VITE DEV MIDDLEWARE OR PRODUCTION STATIC =================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HAIROLOGY server running on http://0.0.0.0:${PORT}`);
  });
}

createApp();
