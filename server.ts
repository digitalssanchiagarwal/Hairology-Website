import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import type { Order, OrderAnalytics, ProductSalesMetric } from './src/types/index.ts';

function resolvePort(): number {
  const portFlagIdx = process.argv.findIndex(arg => arg === '--port' || arg.startsWith('--port='));
  if (portFlagIdx !== -1) {
    const arg = process.argv[portFlagIdx];
    const raw = arg.includes('=') ? arg.split('=')[1] : process.argv[portFlagIdx + 1];
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const envPort = Number(process.env.PORT || 0);
  if (envPort > 0 && String(envPort) !== process.env.NGINX_PORT) {
    return envPort;
  }
  return Number(process.env.DEFAULT_APP_PORT || 3000);
}

const PORT = resolvePort();
const AUTHORIZED_FOUNDER_EMAILS = [
  'guddan1102@gmail.com',
  'digitalssanchiagarwal@gmail.com',
];
const DEFAULT_FOUNDER_CODE = process.env.FOUNDER_ACCESS_CODE || '4448989';
const CONNECTED_UPI_ID = 'guddan1102@okhdfcbank';
const CONNECTED_UPI_NAME = 'HAIROLOGY';
const OWNER_WHATSAPP_DIGITS = (process.env.OWNER_WHATSAPP_NUMBER || '918104559706').replace(/\D/g, '');

const DATA_DIR = path.resolve(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const ORDERS_BACKUP_FILE = path.join(DATA_DIR, 'orders.backup.json');
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

  return `🛍️ NEW HAIROLOGY ORDER (#${order.id})\n📅 Date: ${formattedDate}\n\n👤 WHO ORDERED:\n• Name: ${order.deliveryAddress.recipientName}\n• Phone: ${order.customerPhone}\n\n📍 FULL DELIVERY ADDRESS:\n${order.deliveryAddress.streetAddress}\n${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}\n\n📦 WHAT WAS ORDERED:\n${itemsList}\n\n💰 BILLING & PAYMENT:\n• Subtotal: ₹${order.subtotal}${order.discount > 0 ? `\n• Discount${order.couponApplied ? ` (${order.couponApplied})` : ''}: -₹${order.discount}` : ''}\n• Shipping: ${order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}\n• Grand Total: ₹${order.total}\n• Payment Status: ${order.paymentStatus}\n• UPI ID: ${CONNECTED_UPI_ID}\n• Order Status: ${order.orderStatus.replace(/_/g, ' ')}\n• AWB Tracking: ${order.trackingNumber || 'Pending'}`;
}

function getOwnerWhatsAppUrl(order: Order): string {
  const msg = buildOwnerOrderAlertMessage(order);
  return `https://wa.me/${OWNER_WHATSAPP_DIGITS}?text=${encodeURIComponent(msg)}`;
}

function buildCustomerThankYouMessage(order: Order): string {
  const itemsList = order.items
    .map(it => `• ${it.quantity}x ${it.productName} (${it.variantLabel}) - ₹${it.price * it.quantity}`)
    .join('\n');

  return `✨ THANK YOU FOR YOUR HAIROLOGY ORDER! ✨\n\nDear ${order.deliveryAddress.recipientName},\nThank you for shopping with HAIROLOGY Haute-Beauté Haircare! Your UPI payment of ₹${order.total} has been confirmed.\n\n📦 ORDER SUMMARY:\n• Order ID: #${order.id}\n• Amount Paid: ₹${order.total} (PAID)\n• Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}\n\n🛍️ ITEMS ORDERED:\n${itemsList}\n\n📍 DELIVERY ADDRESS:\n${order.deliveryAddress.recipientName}\n${order.deliveryAddress.streetAddress}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode} (${order.deliveryAddress.state})\nMobile: ${order.customerPhone}\n\n🚚 DISPATCH & TRACKING:\n• Courier Partner: Delhivery Express\n• AWB Tracking: ${order.trackingNumber}\n• Delivery Window: 2-4 business days across India\n\nHairology team personally packing your order.\n\nThank you for choosing Hairology! 🌿`;
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

  if (!AUTHORIZED_FOUNDER_EMAILS.includes(emailHeader) || codeHeader !== getFounderAccessCode()) {
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
    if (AUTHORIZED_FOUNDER_EMAILS.includes(email)) {
      res.json({ valid: true, email });
      return;
    }
    res.status(403).json({ valid: false, error: 'This Gmail address is not authorized for this panel.' });
  });

  app.post('/api/founder/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    if (!AUTHORIZED_FOUNDER_EMAILS.includes(email)) {
      res.status(403).json({ authenticated: false, error: 'Unauthorized Gmail address.' });
      return;
    }
    if (code !== getFounderAccessCode()) {
      res.status(401).json({ authenticated: false, error: 'Incorrect security access code.' });
      return;
    }
    res.json({ authenticated: true, email });
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
          const upiAmountParam = total > 2000 ? '' : `&am=${total.toFixed(2)}`;
          const upiDeepLink = `upi://pay?pa=${encodeURIComponent(CONNECTED_UPI_ID)}&pn=${encodeURIComponent(CONNECTED_UPI_NAME)}${upiAmountParam}&cu=INR&tn=${encodeURIComponent(`Hairology #${ord.id}`)}`;
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

  // Customer notifies that they tapped a UPI app or scanned QR & completed payment (strictly remains PENDING until founder confirms)
  app.post('/api/orders/:id/payment-initiated', (req, res) => {
    try {
      const orderId = req.params.id;
      const orders = readOrders();
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      orders[idx] = {
        ...orders[idx],
        paymentInitiated: true,
      };
      writeOrders(orders);
      res.json({ ok: true, paymentInitiated: true });
    } catch (err) {
      console.error('Payment initiated mark error:', err);
      res.status(500).json({ error: 'Unable to record payment attempt.' });
    }
  });

  // ================= PROTECTED FOUNDER ORDERS & ANALYTICS ROUTES =================
  app.get('/api/orders', requireFounderAuth, (_req, res) => {
    const orders = readOrders()
      .filter(o => o.paymentStatus === 'PAID' || o.paymentInitiated !== false)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const analytics = computeOrderAnalytics(orders);
    res.json({ orders, analytics });
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
          ord.paymentStatus === existing.paymentStatus &&
          (deliveryRank[ord.orderStatus] || 0) > (deliveryRank[existing.orderStatus] || 0)
        ) {
          map.set(ord.id, ord);
        }
      }
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      writeOrders(merged);
      res.json({ orders: merged, analytics: computeOrderAnalytics(merged) });
    } catch (err) {
      console.error('Sync cloud orders error:', err);
      res.status(500).json({ error: 'Unable to sync cloud orders.' });
    }
  });

  app.post('/api/orders/manual-create', requireFounderAuth, (req, res) => {
    try {
      const body = req.body || {};
      const orderInput = body.order && typeof body.order === 'object' ? body.order : body;
      const recipientName = String(
        orderInput?.deliveryAddress?.recipientName || orderInput?.recipientName || ''
      ).trim();
      const rawPhone = String(
        orderInput?.customerPhone || orderInput?.deliveryAddress?.phoneNumber || orderInput?.phoneNumber || ''
      ).trim();
      const total = Number(orderInput?.total || 0);
      const subtotal = Number(orderInput?.subtotal || total || 0);
      const shipping = Number(orderInput?.shipping || 0);
      const items = Array.isArray(orderInput?.items) ? orderInput.items : [];

      if (!recipientName || !rawPhone || !Number.isFinite(total) || total <= 0 || items.length === 0) {
        res.status(400).json({ error: 'Customer name, phone, items, and valid order amount (> ₹0) are required.' });
        return;
      }

      const isPaid = orderInput?.paymentStatus === 'PAID';
      const orderId =
        typeof orderInput?.id === 'string' && /^[a-zA-Z0-9_-]{6,32}$/.test(orderInput.id.trim())
          ? orderInput.id.trim()
          : `HR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const utrRef = String(orderInput?.gatewayTransactionId || orderInput?.utrRef || '').trim();
      const cleanPincode = String(orderInput?.deliveryAddress?.pincode || '400001')
        .replace(/\D/g, '')
        .slice(0, 6)
        .padEnd(6, '0');

      const newOrder: Order = {
        id: orderId,
        createdAt: typeof orderInput?.createdAt === 'string' ? orderInput.createdAt : new Date().toISOString(),
        customerPhone: rawPhone,
        deliveryAddress: {
          recipientName,
          phoneNumber: rawPhone,
          streetAddress: String(orderInput?.deliveryAddress?.streetAddress || 'Direct UPI Order').trim(),
          city: String(orderInput?.deliveryAddress?.city || 'India').trim(),
          state: String(orderInput?.deliveryAddress?.state || 'India').trim(),
          pincode: cleanPincode,
        },
        items,
        subtotal,
        discount: 0,
        shipping,
        codFee: 0,
        total,
        paymentMethod: 'UPI_QR',
        paymentStatus: isPaid ? 'PAID' : 'PENDING',
        orderStatus: isPaid ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
        payerUpi: CONNECTED_UPI_ID,
        trackingNumber:
          typeof orderInput?.trackingNumber === 'string' && orderInput.trackingNumber
            ? orderInput.trackingNumber
            : `DELHIVERY-AWB-${Math.floor(100000000 + Math.random() * 900000000)}`,
        ...(isPaid
          ? {
              gatewayTransactionId: utrRef || `UPI-RCVD-${Date.now().toString().slice(-6)}`,
              paymentVerifiedAt:
                typeof orderInput?.paymentVerifiedAt === 'string'
                  ? orderInput.paymentVerifiedAt
                  : new Date().toISOString(),
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

  // Founder-only confirmation of UPI payment received on guddan1102@okhdfcbank (no UTR required)
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
        paymentMethod: 'UPI_QR',
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

  // Android GPay / Bank Notification Webhook -> surfaces matching pending order in Founder Panel ONLY (never confirms PAID without founder tap)
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

      // Strictly keep paymentStatus PENDING & orderStatus PENDING_CONFIRMATION so ONLY the founder can confirm the order.
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

  // ================= VITE DEV MIDDLEWARE OR PRODUCTION STATIC =================
  if (process.env.NODE_ENV !== 'production') {
    const vitePromise = import('vite').then(({ createServer }) =>
      createServer({
        server: {
          middlewareMode: true,
          ...(process.env.DISABLE_HMR === 'true' ? { hmr: false } : {}),
        },
        appType: 'spa',
      })
    );
    vitePromise.catch(err => {
      console.error('Failed to initialize Vite dev middleware:', err);
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
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
