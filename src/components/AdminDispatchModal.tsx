import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Bell,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  Lock,
  Key,
  LogOut,
  Eye,
  EyeOff,
  ShieldAlert,
  Sparkles,
  Mail,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  XCircle,
  RefreshCw,
  BarChart3,
  Phone,
  User,
  Trash2,
  Plus
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ADMIN_PHONE, PRODUCTS, USER_UPI_ID } from '../data/products';
import { Order } from '../types';

const AUTHORIZED_FOUNDER_EMAILS = [
  'guddan1102@gmail.com',
  'digitalssanchiagarwal@gmail.com',
];
const DEFAULT_STATIC_FOUNDER_CODE = '4448989';
const FOUNDER_CODE_STORAGE_KEY = 'hairology_founder_access_code_v1';
const AUTH_SESSION_KEY = 'hairology_admin_auth_v2';
const AUTH_CREDS_KEY = 'hairology_founder_creds_v1';
const WHATSAPP_SENT_STORAGE_KEY = 'hairology_whatsapp_prompt_done_v1';

function readWhatsappPromptDoneIds(): string[] {
  try {
    const raw = localStorage.getItem(WHATSAPP_SENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function getStoredFounderCode(): string {
  try {
    const saved = localStorage.getItem(FOUNDER_CODE_STORAGE_KEY);
    if (saved && saved.trim().length >= 4) return saved.trim();
  } catch {
    // ignore
  }
  return DEFAULT_STATIC_FOUNDER_CODE;
}

async function tryParseJson(res: Response): Promise<Record<string, unknown> | null> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null;
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

type OrderFilterType =
  | 'ALL'
  | 'PAID'
  | 'PENDING'
  | 'FAILED'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

export const AdminDispatchModal: React.FC = () => {
  const {
    isAdminOpen,
    closeAdmin,
    orders,
    analytics,
    fetchFounderOrders,
    updateOrderStatus,
    founderVerifyUpiPayment,
    founderMarkPaymentFailed,
    founderCreateManualOrder,
    founderDeleteUnpaidOrder,
    founderClearUnpaidOrders
  } = useCart();

  // Two-Step Authentication Gate State (Gmail -> Access Code)
  // Always requires 2-step verification whenever the Founder Panel is opened
  const [savedCreds, setSavedCreds] = useState<{ email: string; code: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<'email' | 'code'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [showChangeCode, setShowChangeCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [codeChangeMsg, setCodeChangeMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'webhooks' | 'schema'>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderFilterType>('PAID');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [apiLoadError, setApiLoadError] = useState<string | null>(null);
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [isMarkingFailed, setIsMarkingFailed] = useState(false);
  const [isDeletingUnpaid, setIsDeletingUnpaid] = useState(false);
  const [isClearingUnpaid, setIsClearingUnpaid] = useState(false);
  const [justVerifiedOrderId, setJustVerifiedOrderId] = useState<string | null>(null);
  const [whatsappPromptDoneIds, setWhatsappPromptDoneIds] = useState<string[]>(() =>
    readWhatsappPromptDoneIds()
  );
  const [showAddOrderForm, setShowAddOrderForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualPincode, setManualPincode] = useState('');
  const [manualProductId, setManualProductId] = useState(PRODUCTS[0]?.id || 'the-trio');
  const [manualAmount, setManualAmount] = useState(String(PRODUCTS[0]?.variants[0]?.price || 1299));
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualFormError, setManualFormError] = useState<string | null>(null);

  const markWhatsappPromptDone = (orderId: string) => {
    setWhatsappPromptDoneIds(prev => {
      if (prev.includes(orderId)) return prev;
      const next = [...prev, orderId];
      try {
        localStorage.setItem(WHATSAPP_SENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setJustVerifiedOrderId(prev => (prev === orderId ? null : prev));
  };

  const handleSelectOrder = (orderId: string) => {
    if (justVerifiedOrderId && justVerifiedOrderId !== orderId) {
      markWhatsappPromptDone(justVerifiedOrderId);
    }
    setSelectedOrderId(orderId);
  };

  // Fetch live server orders whenever authenticated panel opens, on tab focus, and auto-refresh every 2 seconds
  useEffect(() => {
    if (!isAdminOpen || !isAuthenticated || !savedCreds) return;

    setIsLoadingOrders(true);
    fetchFounderOrders(savedCreds.email, savedCreds.code)
      .then(res => {
        setApiLoadError(res.ok ? null : res.error || 'Could not load orders.');
      })
      .finally(() => {
        setIsLoadingOrders(false);
      });

    const syncNow = () => {
      void fetchFounderOrders(savedCreds.email, savedCreds.code).then(res => {
        if (res.ok) setApiLoadError(null);
      });
    };

    const interval = setInterval(syncNow, 2000);
    const handleVisibility = () => {
      if (!document.hidden) syncNow();
    };
    window.addEventListener('focus', syncNow);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncNow);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAdminOpen, isAuthenticated, savedCreds, fetchFounderOrders]);

  // Reset to 2-step verification gate whenever Founder Panel is opened via URL or search
  useEffect(() => {
    const resetGate = () => {
      try {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        sessionStorage.removeItem(AUTH_CREDS_KEY);
      } catch {
        // ignore
      }
      setSavedCreds(null);
      setIsAuthenticated(false);
      setAuthStep('email');
      setEmailInput('');
      setCodeInput('');
      setEmailError(null);
      setCodeError(null);
    };
    resetGate();
    window.addEventListener('open-admin-portal', resetGate);
    return () => window.removeEventListener('open-admin-portal', resetGate);
  }, []);

  const showToast = (msg: string, ms = 3500) => {
    setWhatsappToast(msg);
    setTimeout(() => setWhatsappToast(null), ms);
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = emailInput.trim().toLowerCase();
    if (!normalized) {
      setEmailError('Please enter your Gmail address.');
      return;
    }
    setIsAuthenticating(true);
    try {
      let handledByServer = false;
      try {
        const res = await fetch('/api/founder/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized })
        });
        const data = await tryParseJson(res);
        if (data !== null) {
          handledByServer = true;
          if (res.ok && data.valid) {
            setEmailError(null);
            setCodeError(null);
            setAuthStep('code');
          } else {
            setEmailError(
              typeof data.error === 'string'
                ? data.error
                : 'Access denied. This Gmail address is not authorized for this panel.'
            );
          }
        }
      } catch {
        // Static / Vercel hosting fallback
      }

      if (!handledByServer) {
        if (AUTHORIZED_FOUNDER_EMAILS.includes(normalized)) {
          setEmailError(null);
          setCodeError(null);
          setAuthStep('code');
        } else {
          setEmailError('This Gmail address is not authorized for this panel.');
        }
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanCode = codeInput.trim();
    if (!cleanCode) {
      setCodeError('Please enter your security code.');
      return;
    }
    setIsAuthenticating(true);
    try {
      let handledByServer = false;
      let authenticated = false;

      try {
        const res = await fetch('/api/founder/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, code: cleanCode })
        });
        const data = await tryParseJson(res);
        if (data !== null) {
          handledByServer = true;
          if (res.ok && data.authenticated) {
            authenticated = true;
          } else {
            setCodeError(
              typeof data.error === 'string'
                ? data.error
                : 'Incorrect security code. Please check and try again.'
            );
          }
        }
      } catch {
        // Static / Vercel hosting fallback
      }

      if (!handledByServer) {
        if (AUTHORIZED_FOUNDER_EMAILS.includes(cleanEmail) && cleanCode === getStoredFounderCode()) {
          authenticated = true;
        } else {
          setCodeError('Incorrect security code. Please check and try again.');
        }
      }

      if (authenticated) {
        const creds = { email: cleanEmail, code: cleanCode };
        sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
        sessionStorage.setItem(AUTH_CREDS_KEY, JSON.stringify(creds));
        setSavedCreds(creds);
        setIsAuthenticated(true);
        setCodeError(null);
        setCodeInput('');
        await fetchFounderOrders(creds.email, creds.code);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLockSession = () => {
    if (justVerifiedOrderId) {
      markWhatsappPromptDone(justVerifiedOrderId);
    }
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(AUTH_CREDS_KEY);
    } catch {
      // ignore
    }
    setSavedCreds(null);
    setIsAuthenticated(false);
    setAuthStep('email');
    setEmailInput('');
    setCodeInput('');
    setEmailError(null);
    setCodeError(null);
  };

  const handleLockAndClose = () => {
    handleLockSession();
    closeAdmin();
  };

  const handleSaveNewCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!savedCreds) return;
    const trimmed = newCode.trim();
    if (trimmed.length < 4) {
      setCodeChangeMsg('Access code must be at least 4 characters');
      return;
    }
    try {
      let handledByServer = false;
      let updated = false;
      try {
        const res = await fetch('/api/founder/change-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-email': savedCreds.email,
            'x-founder-code': savedCreds.code
          },
          body: JSON.stringify({ newCode: trimmed })
        });
        const data = await tryParseJson(res);
        if (data !== null) {
          handledByServer = true;
          if (res.ok) {
            updated = true;
          } else {
            setCodeChangeMsg(typeof data.error === 'string' ? data.error : 'Could not update code');
          }
        }
      } catch {
        // Static / Vercel hosting fallback
      }

      if (!handledByServer) {
        localStorage.setItem(FOUNDER_CODE_STORAGE_KEY, trimmed);
        updated = true;
      }

      if (updated) {
        const nextCreds = { ...savedCreds, code: trimmed };
        sessionStorage.setItem(AUTH_CREDS_KEY, JSON.stringify(nextCreds));
        setSavedCreds(nextCreds);
        setCodeChangeMsg('Access code updated successfully!');
        setTimeout(() => {
          setCodeChangeMsg(null);
          setShowChangeCode(false);
          setNewCode('');
        }, 1500);
      }
    } catch {
      setCodeChangeMsg('Unable to update access code');
    }
  };

  const handleRefreshLiveOrders = async () => {
    if (!savedCreds) return;
    setIsLoadingOrders(true);
    const res = await fetchFounderOrders(savedCreds.email, savedCreds.code);
    setIsLoadingOrders(false);
    if (res.ok) {
      setApiLoadError(null);
      showToast('Live orders & sales analytics refreshed!');
    } else {
      setApiLoadError(res.error || 'Could not refresh orders.');
      showToast(res.error || 'Could not refresh orders.');
    }
  };

  const visibleOrders = orders;

  const awaitingPaymentCount = visibleOrders.filter(
    ord => ord.paymentStatus !== 'PAID' && ord.paymentStatus !== 'FAILED' && ord.orderStatus !== 'PAYMENT_FAILED'
  ).length;

  const filteredOrders = visibleOrders.filter(ord => {
    const matchesFilter = (() => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'PAID') return ord.paymentStatus === 'PAID';
      if (statusFilter === 'FAILED') return ord.paymentStatus === 'FAILED' || ord.orderStatus === 'PAYMENT_FAILED';
      if (statusFilter === 'PENDING') {
        return ord.paymentStatus !== 'PAID' && ord.paymentStatus !== 'FAILED' && ord.orderStatus !== 'PAYMENT_FAILED';
      }
      return ord.orderStatus === statusFilter;
    })();

    if (!matchesFilter) return false;
    if (!orderSearchQuery.trim()) return true;

    const q = orderSearchQuery.toLowerCase();
    return (
      ord.id.toLowerCase().includes(q) ||
      ord.deliveryAddress.recipientName.toLowerCase().includes(q) ||
      ord.customerPhone.toLowerCase().includes(q) ||
      ord.deliveryAddress.city.toLowerCase().includes(q) ||
      ord.deliveryAddress.pincode.includes(q) ||
      (ord.gatewayTransactionId || '').toLowerCase().includes(q) ||
      ord.items.some(it => it.productName.toLowerCase().includes(q))
    );
  });

  const selectedOrder =
    filteredOrders.find(o => o.id === selectedOrderId) ||
    filteredOrders[0] ||
    null;

  const handleStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    if (!savedCreds) return;
    const res = await updateOrderStatus(orderId, newStatus, savedCreds);
    if (res.ok) {
      showToast(`Delivery status updated to ${newStatus.replace(/_/g, ' ')}.`);
    } else {
      showToast(res.error || 'Unable to update delivery status.');
    }
  };

  const handleVerifyUpiPayment = async (orderId: string) => {
    if (!savedCreds) return;
    setIsVerifyingUtr(true);
    const res = await founderVerifyUpiPayment(orderId, '', savedCreds);
    setIsVerifyingUtr(false);
    if (res.ok) {
      if (!whatsappPromptDoneIds.includes(orderId)) {
        setJustVerifiedOrderId(orderId);
      }
      setStatusFilter('PAID');
      setSelectedOrderId(orderId);
    }
    showToast(res.message || 'Order confirmed.');
  };

  const handleMarkPaymentFailed = async (orderId: string) => {
    if (!savedCreds) return;
    setIsMarkingFailed(true);
    const res = await founderMarkPaymentFailed(orderId, 'No UPI payment received for this order.', savedCreds);
    setIsMarkingFailed(false);
    showToast(res.message || 'Updated payment status.');
  };

  const handleDeleteUnpaidOrder = async (orderId: string) => {
    if (!savedCreds) return;
    setIsDeletingUnpaid(true);
    const res = await founderDeleteUnpaidOrder(orderId, savedCreds);
    setIsDeletingUnpaid(false);
    if (res.ok && selectedOrderId === orderId) {
      setSelectedOrderId(null);
    }
    showToast(res.message || 'Removed non-paying visitor entry.');
  };

  const handleClearAllUnpaidOrders = async () => {
    if (!savedCreds) return;
    setIsClearingUnpaid(true);
    const res = await founderClearUnpaidOrders(savedCreds);
    setIsClearingUnpaid(false);
    if (res.ok) {
      setSelectedOrderId(null);
      setStatusFilter('PAID');
    }
    showToast(res.message || 'Cleared unpaid visitor entries.');
  };

  const handleTestWebhook = () => {
    showToast(`Test notification ready for ${ADMIN_PHONE} via Hairology Notification Bridge.`);
  };

  const getCleanPhone = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, '');
    return digits.startsWith('91') ? digits : `91${digits.slice(-10)}`;
  };

  const getCustomerThankYouMessage = (order: Order) => {
    return `✨ THANK YOU FOR YOUR HAIROLOGY ORDER! ✨\n\nDear ${order.deliveryAddress.recipientName},\nThank you for choosing HAIROLOGY Haute-Beauté Haircare! Your UPI payment of ₹${order.total} has been confirmed.\n\n📦 ORDER SUMMARY:\n• Order ID: #${order.id}\n• Amount Paid: ₹${order.total} (PAID)\n• Delivery Status: ${order.orderStatus.replace(/_/g, ' ')}\n• Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n\n🛍️ ITEMS ORDERED:\n${order.items.map(it => `• ${it.quantity}x ${it.productName} (${it.variantLabel}) - ₹${it.price * it.quantity}`).join('\n')}\n\n📍 DELIVERY ADDRESS:\n${order.deliveryAddress.recipientName}\n${order.deliveryAddress.streetAddress}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode} (${order.deliveryAddress.state})\nPhone: ${order.customerPhone}\n\n🚚 DISPATCH & TRACKING:\n• Courier Partner: Delhivery Express\n• AWB Tracking: ${order.trackingNumber || 'Assigned on Dispatch'}\n\nHairology team personally packing your order.\n\nThank you for supporting Hairology! 🌿`;
  };

  const getOwnerOrderDetailsMessage = (order: Order) => {
    const formattedDate = new Date(order.createdAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const itemsList = order.items
      .map(it => `• ${it.quantity}x ${it.productName} (${it.variantLabel}) — ₹${it.price * it.quantity}`)
      .join('\n');

    return `🛍️ HAIROLOGY ORDER DETAILS (#${order.id})\n📅 Date: ${formattedDate}\n\n👤 WHO ORDERED:\n• Name: ${order.deliveryAddress.recipientName}\n• Phone: ${order.customerPhone}\n\n📍 FULL DELIVERY ADDRESS:\n${order.deliveryAddress.streetAddress}\n${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}\n\n📦 WHAT WAS ORDERED:\n${itemsList}\n\n💰 BILLING & PAYMENT:\n• Subtotal: ₹${order.subtotal}${order.discount > 0 ? `\n• Discount${order.couponApplied ? ` (${order.couponApplied})` : ''}: -₹${order.discount}` : ''}\n• Shipping: ${order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}\n• Grand Total: ₹${order.total}\n• Payment Status: ${order.paymentStatus}\n• Delivery Status: ${order.orderStatus.replace(/_/g, ' ')}\n• AWB Tracking: ${order.trackingNumber || 'Pending'}`;
  };

  const getAllOrdersSummaryMessage = (list: Order[]) => {
    const slice = list.slice(0, 15);
    const lines = slice.map((ord, idx) => {
      const dt = new Date(ord.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const itemsText = ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
      return `${idx + 1}. #${ord.id} (${dt}) — ₹${ord.total} [${ord.paymentStatus}]\n   Name: ${ord.deliveryAddress.recipientName} | ${ord.customerPhone}\n   Address: ${ord.deliveryAddress.streetAddress}, ${ord.deliveryAddress.city} - ${ord.deliveryAddress.pincode}\n   Items: ${itemsText}`;
    });
    const extraNote = list.length > 15 ? `\n\n(+${list.length - 15} more orders in Founder Panel)` : '';
    const heading = statusFilter === 'PAID' ? 'PAID ORDERS SUMMARY' : 'ORDERS SUMMARY';
    return `📊 HAIROLOGY ${heading} (${list.length} Orders | Paid Sales: ₹${analytics.totalSales})\n\n${lines.join('\n\n')}${extraNote}`;
  };

  const getStatusBadgeClasses = (ord: Order) => {
    if (ord.paymentStatus === 'FAILED' || ord.orderStatus === 'PAYMENT_FAILED') {
      return 'bg-red-950/70 text-red-300 border border-red-500/40';
    }
    if (ord.orderStatus === 'PENDING_CONFIRMATION') {
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }
    if (ord.orderStatus === 'CONFIRMED') {
      return 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40';
    }
    if (ord.orderStatus === 'DISPATCHED' || ord.orderStatus === 'OUT_FOR_DELIVERY') {
      return 'bg-blue-900/60 text-blue-300 border border-blue-500/40';
    }
    return 'bg-emerald-900/80 text-emerald-200 border border-emerald-400/50';
  };

  if (!isAdminOpen) return null;

  // ================= 1. TWO-STEP SECURITY LOGIN SCREEN (GMAIL -> ACCESS CODE) =================
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-[#121110]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#1C1A18] text-[#FDFBF7] rounded-3xl border border-[#C5A880]/40 max-w-md w-full my-auto p-6 sm:p-8 shadow-2xl relative">

          <button
            onClick={handleLockAndClose}
            className="absolute top-5 right-5 text-[#8A7463] hover:text-white p-1 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#C5A880] flex items-center justify-center mx-auto shadow-inner">
              {authStep === 'email' ? <Mail className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121110] border border-[#C5A880]/30 text-[10px] tracking-widest uppercase font-bold text-[#C5A880] mb-2 font-mono">
                <ShieldAlert className="w-3 h-3 text-[#C5A880]" />
                RESTRICTED FOUNDER ACCESS • STEP {authStep === 'email' ? '1' : '2'} OF 2
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Hairology Owner Portal
              </h3>
              <p className="text-xs text-[#8A7463] mt-1.5 leading-relaxed max-w-xs mx-auto">
                {authStep === 'email'
                  ? 'Sign in with your authorized founder Gmail address to continue.'
                  : 'Gmail verified. Enter your private security access code to view orders & analytics.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-wider">
              <span className={`px-2.5 py-1 rounded-full border ${
                authStep === 'email'
                  ? 'bg-[#C5A880]/20 border-[#C5A880] text-[#C5A880] font-bold'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 font-bold'
              }`}>
                1. Gmail {authStep === 'code' && '✓'}
              </span>
              <span className="text-[#8A7463]">→</span>
              <span className={`px-2.5 py-1 rounded-full border ${
                authStep === 'code'
                  ? 'bg-[#C5A880]/20 border-[#C5A880] text-[#C5A880] font-bold'
                  : 'bg-[#121110] border-white/10 text-[#8A7463]'
              }`}>
                2. Access Code
              </span>
            </div>

            {authStep === 'email' ? (
              <form onSubmit={handleVerifyEmail} className="space-y-4 pt-1">
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8A7463] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => {
                      setEmailInput(e.target.value);
                      setEmailError(null);
                    }}
                    autoFocus
                    autoComplete="email"
                    placeholder="Enter authorized Gmail address"
                    className={`w-full text-sm py-3.5 pl-10 pr-4 bg-[#121110] border rounded-xl outline-none transition-all text-[#FDFBF7] placeholder-[#8A7463]/70 ${
                      emailError
                        ? 'border-red-500 ring-2 ring-red-500/30'
                        : 'border-[#C5A880]/40 focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/20'
                    }`}
                  />
                </div>

                {emailError && (
                  <div className="text-xs text-red-400 font-medium">
                    ✗ {emailError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 bg-gradient-to-r from-[#C5A880] to-[#A88B60] hover:from-[#d4b993] hover:to-[#bfa378] text-[#121110] font-bold text-xs tracking-widest uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-60"
                >
                  <span>{isAuthenticating ? 'VERIFYING...' : 'VERIFY GMAIL & CONTINUE'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4 pt-1">
                <div className="px-3.5 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-emerald-300 font-mono truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{emailInput.trim().toLowerCase()}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('email');
                      setCodeInput('');
                      setCodeError(null);
                    }}
                    className="text-[11px] text-[#C5A880] hover:underline font-semibold shrink-0 ml-2 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showCode ? 'text' : 'password'}
                    maxLength={20}
                    value={codeInput}
                    onChange={e => {
                      setCodeInput(e.target.value);
                      setCodeError(null);
                    }}
                    autoFocus
                    placeholder="Enter security access code"
                    className={`w-full text-center text-lg tracking-[0.25em] font-mono py-3.5 px-10 bg-[#121110] border rounded-xl outline-none transition-all text-[#FDFBF7] placeholder:text-xs placeholder:tracking-normal placeholder:font-sans placeholder-[#8A7463]/70 ${
                      codeError
                        ? 'border-red-500 ring-2 ring-red-500/30'
                        : 'border-[#C5A880]/40 focus:border-[#C5A880] focus:ring-2 focus:ring-[#C5A880]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7463] hover:text-[#C5A880] p-1 cursor-pointer"
                    aria-label={showCode ? 'Hide code' : 'Show code'}
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {codeError && (
                  <div className="text-xs text-red-400 font-medium">
                    ✗ {codeError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 bg-gradient-to-r from-[#C5A880] to-[#A88B60] hover:from-[#d4b993] hover:to-[#bfa378] text-[#121110] font-bold text-xs tracking-widest uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-sans disabled:opacity-60"
                >
                  <Key className="w-4 h-4" />
                  <span>{isAuthenticating ? 'UNLOCKING...' : 'UNLOCK SALES ANALYTICS & ORDERS'}</span>
                </button>
              </form>
            )}

            <div className="pt-2 text-[11px] text-[#8A7463] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Two-step encrypted gate. Founder access only.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. FULL AUTHENTICATED FOUNDER ANALYTICS & CONTROL HUB =================
  const analyticsById = new Map(analytics.productWiseSales.map(p => [p.productId, p]));
  const catalogProductMetrics = PRODUCTS.map((catalogProd, index) => {
    const metric = analyticsById.get(catalogProd.id);
    const primaryVariant = catalogProd.variants[0];
    const discountPct =
      catalogProd.id === 'hot-water-rosemary-duo' || catalogProd.id === 'protein-rosemary-duo'
        ? 13
        : Math.round(((primaryVariant.mrp - primaryVariant.price) / primaryVariant.mrp) * 100);
    return {
      rank: index + 1,
      productId: catalogProd.id,
      productName: catalogProd.name,
      image: catalogProd.image,
      size: primaryVariant.size,
      price: primaryVariant.price,
      mrp: primaryVariant.mrp,
      discountPct,
      unitsSold: metric?.unitsSold || 0,
      revenue: metric?.revenue || 0,
      paidOrdersCount: metric?.paidOrdersCount || 0,
      pendingUnits: metric?.pendingUnits || 0,
      failedUnits: metric?.failedUnits || 0,
    };
  });
  for (const extra of analytics.productWiseSales) {
    if (!PRODUCTS.some(p => p.id === extra.productId)) {
      catalogProductMetrics.push({
        rank: catalogProductMetrics.length + 1,
        productId: extra.productId,
        productName: extra.productName,
        image: PRODUCTS[0]?.image || '',
        size: '250 ml',
        price: 0,
        mrp: 0,
        discountPct: 0,
        unitsSold: extra.unitsSold,
        revenue: extra.revenue,
        paidOrdersCount: extra.paidOrdersCount,
        pendingUnits: extra.pendingUnits,
        failedUnits: extra.failedUnits,
      });
    }
  }
  const maxProductRevenue = Math.max(1, ...catalogProductMetrics.map(p => p.revenue));

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-[#1C1A18] text-[#FDFBF7] rounded-3xl border border-[#C5A880]/40 max-w-6xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">

        {/* ================= MODAL HEADER ================= */}
        <div className="p-4 sm:p-5 bg-[#121110] border-b border-[#C5A880]/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A880]/20 text-[#C5A880] flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                  Hairology Founder Sales & Dispatch Hub
                </h3>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  VERIFIED: {savedCreds?.email || AUTHORIZED_FOUNDER_EMAILS[0]}
                </span>
              </div>
              <div className="text-xs text-[#C5A880] font-mono mt-0.5">
                Owner: {ADMIN_PHONE} • Connected UPI: {USER_UPI_ID} • Live Sales & Delivery Control
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setManualFormError(null);
                setShowAddOrderForm(prev => !prev);
              }}
              className="px-2.5 py-1.5 bg-[#C5A880] hover:bg-[#d4b993] text-[#121110] text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Add or Restore Confirmed Order"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Order</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshLiveOrders}
              disabled={isLoadingOrders}
              className="px-2.5 py-1.5 bg-[#23201D] hover:bg-[#322E2A] text-emerald-300 text-[11px] font-semibold rounded-lg border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Refresh Live Orders"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingOrders ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChangeCode(!showChangeCode)}
              className="px-2.5 py-1.5 bg-[#23201D] hover:bg-[#322E2A] text-[#C5A880] text-[11px] font-semibold rounded-lg border border-[#C5A880]/30 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
              title="Change Security Access Code"
            >
              <Key className="w-3 h-3" />
              <span>Change Code</span>
            </button>

            <button
              type="button"
              onClick={handleLockSession}
              className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-[11px] font-semibold rounded-lg border border-red-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Lock Admin Session Immediately"
            >
              <LogOut className="w-3 h-3" />
              <span>Lock</span>
            </button>

            <button
              type="button"
              onClick={handleLockAndClose}
              className="p-1.5 text-[#E8DFD1]/70 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Change Access Code Bar */}
        {showChangeCode && (
          <div className="p-3 bg-[#2A2622] border-b border-[#C5A880]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#C5A880] font-medium flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>Update Security Access Code:</span>
            </span>
            <form onSubmit={handleSaveNewCode} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                maxLength={20}
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder="New access code (min 4 chars)"
                className="px-3 py-1.5 bg-[#121110] border border-[#C5A880]/40 rounded-lg text-xs font-mono text-white outline-none w-44"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#C5A880] text-[#121110] font-bold rounded-lg text-xs hover:bg-[#d4b993] cursor-pointer"
              >
                Save Code
              </button>
            </form>
            {codeChangeMsg && (
              <span className="text-emerald-400 font-bold text-xs">{codeChangeMsg}</span>
            )}
          </div>
        )}

        {/* ================= NAVIGATION TABS ================= */}
        <div className="px-4 sm:px-6 py-2 bg-[#23201D] border-b border-white/5 flex gap-4 text-xs font-semibold tracking-wider uppercase overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#C5A880] text-[#C5A880]'
                : 'border-transparent text-[#8A7463] hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Paid Orders ({analytics.successfulPaymentsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'products'
                ? 'border-[#C5A880] text-[#C5A880]'
                : 'border-transparent text-[#8A7463] hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Product-Wise Sales ({PRODUCTS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhooks')}
            className={`py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'webhooks'
                ? 'border-[#C5A880] text-[#C5A880]'
                : 'border-transparent text-[#8A7463] hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Owner Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`py-2 border-b-2 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'schema'
                ? 'border-[#C5A880] text-[#C5A880]'
                : 'border-transparent text-[#8A7463] hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>DB Schema</span>
          </button>
        </div>

        {/* Add / Restore Confirmed Order Form */}
        {showAddOrderForm && (
          <form
            onSubmit={async e => {
              e.preventDefault();
              if (!savedCreds) return;
              setManualFormError(null);
              const prod = PRODUCTS.find(p => p.id === manualProductId) || PRODUCTS[0];
              const variant = prod.variants[0];
              const amountNum = Math.round(Number(manualAmount) || variant.price);
              setIsSavingManual(true);
              const res = await founderCreateManualOrder(
                {
                  recipientName: manualName,
                  phoneNumber: manualPhone,
                  streetAddress: manualAddress,
                  city: manualCity,
                  state: manualState,
                  pincode: manualPincode,
                  items: [
                    {
                      productId: prod.id,
                      variantId: variant.id,
                      productName: prod.name,
                      variantLabel: variant.label,
                      price: amountNum,
                      mrp: variant.mrp,
                      quantity: 1,
                      image: prod.image,
                    },
                  ],
                  total: amountNum,
                  paymentStatus: 'PAID',
                },
                savedCreds
              );
              setIsSavingManual(false);
              if (res.ok && res.order) {
                setShowAddOrderForm(false);
                setManualName('');
                setManualPhone('');
                setManualAddress('');
                setManualCity('');
                setManualState('');
                setManualPincode('');
                setStatusFilter('PAID');
                setSelectedOrderId(res.order.id);
                showToast(`Order #${res.order.id} saved & synced across all panels!`);
              } else {
                setManualFormError(res.message || 'Please check customer name, 10-digit phone, and amount.');
              }
            }}
            className="p-4 bg-[#23201D] border-b border-[#C5A880]/30 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#C5A880] uppercase tracking-wider text-[11px]">
                Add / Restore Confirmed Order (Syncs to All Panels)
              </span>
              <button
                type="button"
                onClick={() => setShowAddOrderForm(false)}
                className="text-[#8A7463] hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
            {manualFormError && (
              <div className="text-red-300 bg-red-950/60 border border-red-500/40 rounded-lg px-3 py-1.5">
                {manualFormError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                required
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="Customer Full Name *"
                className="px-3 py-2 bg-[#121110] border border-white/15 rounded-lg text-white outline-none focus:border-[#C5A880]"
              />
              <input
                type="tel"
                required
                value={manualPhone}
                onChange={e => setManualPhone(e.target.value)}
                placeholder="10-Digit Mobile Number *"
                className="px-3 py-2 bg-[#121110] border border-white/15 rounded-lg text-white font-mono outline-none focus:border-[#C5A880]"
              />
              <div className="flex gap-2">
                <select
                  value={manualProductId}
                  onChange={e => {
                    const nextId = e.target.value;
                    setManualProductId(nextId);
                    const found = PRODUCTS.find(p => p.id === nextId);
                    if (found?.variants[0]) setManualAmount(String(found.variants[0].price));
                  }}
                  className="flex-1 px-2.5 py-2 bg-[#121110] border border-white/15 rounded-lg text-white outline-none focus:border-[#C5A880]"
                >
                  {PRODUCTS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  required
                  min={1}
                  value={manualAmount}
                  onChange={e => setManualAmount(e.target.value)}
                  placeholder="₹"
                  className="w-24 px-2.5 py-2 bg-[#121110] border border-white/15 rounded-lg text-white font-mono outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                value={manualAddress}
                onChange={e => setManualAddress(e.target.value)}
                placeholder="Street Address (optional)"
                className="sm:col-span-2 px-3 py-2 bg-[#121110] border border-white/15 rounded-lg text-white outline-none focus:border-[#C5A880]"
              />
              <input
                type="text"
                value={manualCity}
                onChange={e => setManualCity(e.target.value)}
                placeholder="City"
                className="px-3 py-2 bg-[#121110] border border-white/15 rounded-lg text-white outline-none focus:border-[#C5A880]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={manualPincode}
                  onChange={e => setManualPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Pincode"
                  className="flex-1 px-3 py-2 bg-[#121110] border border-white/15 rounded-lg text-white font-mono outline-none focus:border-[#C5A880]"
                />
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {isSavingManual ? 'Saving...' : 'Save Order'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Toast alert */}
        {whatsappToast && (
          <div className="bg-emerald-900 text-emerald-100 text-xs py-2 px-4 text-center border-b border-emerald-700 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{whatsappToast}</span>
          </div>
        )}

        {apiLoadError && (
          <div className="bg-amber-950/90 text-amber-200 text-xs py-2 px-4 text-center border-b border-amber-500/40 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{apiLoadError}</span>
          </div>
        )}

        {/* ================= TAB 1: EXECUTIVE ANALYTICS + CUSTOMER ORDERS & DELIVERY ================= */}
        {activeTab === 'orders' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

            {/* 5 PAID-ONLY EXECUTIVE KPI SUMMARY CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Total Sales */}
              <div className="bg-gradient-to-br from-[#2A241A] to-[#1A1714] p-3.5 rounded-2xl border border-[#C5A880]/40 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between">
                  <span>Total Sales</span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#C5A880]" />
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
                  ₹{analytics.totalSales.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[#8A7463] mt-0.5">Verified paid revenue</div>
              </div>

              {/* 2. Paid Orders */}
              <div
                onClick={() => setStatusFilter('PAID')}
                className="bg-[#23201D] hover:bg-[#292521] p-3.5 rounded-2xl border border-emerald-500/30 cursor-pointer transition-colors"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
                  <span>Paid Orders</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-emerald-300 mt-1 tabular-nums">
                  {analytics.successfulPaymentsCount}
                </div>
                <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                  ₹{analytics.successfulPaymentsAmount.toLocaleString('en-IN')} verified
                </div>
              </div>

              {/* 3. Confirmed / Packing */}
              <div
                onClick={() => setStatusFilter('CONFIRMED')}
                className="bg-[#23201D] hover:bg-[#292521] p-3.5 rounded-2xl border border-[#C5A880]/30 cursor-pointer transition-colors"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#C5A880] flex items-center justify-between">
                  <span>Confirmed</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
                  {analytics.deliveryStatusBreakdown.CONFIRMED}
                </div>
                <div className="text-[10px] text-[#8A7463] mt-0.5">Ready to pack &amp; ship</div>
              </div>

              {/* 4. In Transit */}
              <div
                onClick={() => setStatusFilter('DISPATCHED')}
                className="bg-[#23201D] hover:bg-[#292521] p-3.5 rounded-2xl border border-blue-500/30 cursor-pointer transition-colors"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center justify-between">
                  <span>In Transit</span>
                  <Truck className="w-3.5 h-3.5 text-blue-300" />
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-blue-200 mt-1 tabular-nums">
                  {analytics.deliveryStatusBreakdown.DISPATCHED + analytics.deliveryStatusBreakdown.OUT_FOR_DELIVERY}
                </div>
                <div className="text-[10px] text-[#8A7463] mt-0.5">Dispatched + OFD</div>
              </div>

              {/* 5. Delivered */}
              <div
                onClick={() => setStatusFilter('DELIVERED')}
                className="bg-[#23201D] hover:bg-[#292521] p-3.5 rounded-2xl border border-white/10 cursor-pointer transition-colors"
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#E8DFD1] flex items-center justify-between">
                  <span>Delivered</span>
                  <Package className="w-3.5 h-3.5 text-[#C5A880]" />
                </div>
                <div className="font-serif text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
                  {analytics.deliveryStatusBreakdown.DELIVERED}
                </div>
                <div className="text-[10px] text-[#8A7463] mt-0.5">Completed orders</div>
              </div>
            </div>

            {/* DELIVERY STATUS BREAKDOWN & FILTER BAR */}
            <div className="p-3 bg-[#23201D] rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: 'PAID', label: `Paid Customers Only (${analytics.successfulPaymentsCount})` },
                    { key: 'CONFIRMED', label: `Confirmed (${analytics.deliveryStatusBreakdown.CONFIRMED})` },
                    { key: 'DISPATCHED', label: `Dispatched (${analytics.deliveryStatusBreakdown.DISPATCHED})` },
                    { key: 'OUT_FOR_DELIVERY', label: `Out for Delivery (${analytics.deliveryStatusBreakdown.OUT_FOR_DELIVERY})` },
                    { key: 'DELIVERED', label: `Delivered (${analytics.deliveryStatusBreakdown.DELIVERED})` }
                  ] as Array<{ key: OrderFilterType; label: string }>
                ).map(pill => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setStatusFilter(pill.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      statusFilter === pill.key
                        ? 'bg-[#C5A880] text-[#121110] border-[#C5A880]'
                        : 'bg-[#121110] text-[#E8DFD1]/70 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(awaitingPaymentCount > 0 || statusFilter === 'PENDING') && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      statusFilter === 'PENDING'
                        ? 'bg-amber-400 text-[#121110] border-amber-400'
                        : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-400'
                    }`}
                  >
                    Awaiting Confirmation ({awaitingPaymentCount})
                  </button>
                )}

                {statusFilter === 'PENDING' && awaitingPaymentCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllUnpaidOrders}
                    disabled={isClearingUnpaid}
                    className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/70 text-red-200 border border-red-500/40 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isClearingUnpaid ? 'Cleaning...' : 'Remove Non-Paying Visitors'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* ORDERS SPLIT VIEW: LIST + DETAIL INSPECTOR */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

              {/* Orders list on left */}
              <div className="md:col-span-5 space-y-2.5">
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  placeholder="Search paid customer name, phone no, product..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#121110] border border-white/15 rounded-xl text-white placeholder-[#8A7463] outline-none focus:border-[#C5A880]"
                />

                {filteredOrders.length === 0 ? (
                  <div className="p-6 text-center bg-[#23201D] rounded-2xl border border-white/10 text-xs text-[#8A7463] space-y-3">
                    <div className="font-semibold text-white">
                      {statusFilter === 'PAID'
                        ? 'No Confirmed Paid Customers Yet'
                        : 'No orders match this view'}
                    </div>
                    <div className="leading-relaxed">
                      {statusFilter === 'PAID'
                        ? 'Only customers whose payment is confirmed appear here — website visitors who did not complete payment are hidden.'
                        : orders.length === 0
                          ? 'Confirmed UPI payments will appear here with customer names, phone numbers, and delivery addresses.'
                          : 'Try clearing your search or switching the filter tab above.'}
                    </div>
                    {statusFilter === 'PAID' && awaitingPaymentCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('PENDING')}
                        className="mt-1 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Review Awaiting Confirmation ({awaitingPaymentCount}) →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                    {filteredOrders.map(ord => (
                      <div
                        key={ord.id}
                        onClick={() => handleSelectOrder(ord.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedOrder?.id === ord.id
                            ? 'border-[#C5A880] bg-[#2A2622] shadow'
                            : 'border-white/10 bg-[#1F1C1A] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-[#C5A880]">#{ord.id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadgeClasses(ord)}`}>
                            {ord.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-bold text-white truncate">
                            {ord.deliveryAddress.recipientName}
                          </div>
                          <div className="font-serif text-sm font-bold text-white tabular-nums shrink-0">
                            ₹{ord.total}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[11px] mt-1">
                          <span className="font-mono text-emerald-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{ord.customerPhone}</span>
                          </span>
                          <span className={`text-[10px] font-mono font-bold ${
                            ord.paymentStatus === 'PAID'
                              ? 'text-emerald-400'
                              : ord.paymentStatus === 'FAILED'
                                ? 'text-red-400'
                                : 'text-amber-400'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#8A7463] mt-1 truncate">
                          {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected order detail panel */}
              <div className="md:col-span-7 bg-[#23201D] rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
                {selectedOrder ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between pb-3 border-b border-white/10 gap-3">
                      <div>
                        <div className="font-mono text-xs text-[#C5A880]">Order #{selectedOrder.id}</div>
                        <h4 className="font-serif text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                          <User className="w-4 h-4 text-[#C5A880]" />
                          <span>{selectedOrder.deliveryAddress.recipientName}</span>
                        </h4>
                        <div className="font-mono text-xs text-emerald-400 mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{selectedOrder.customerPhone}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-2xl font-bold text-[#C5A880] tabular-nums">
                          ₹{selectedOrder.total}
                        </div>
                        <div className={`text-[10px] font-bold font-mono ${
                          selectedOrder.paymentStatus === 'PAID'
                            ? 'text-emerald-400'
                            : selectedOrder.paymentStatus === 'FAILED'
                              ? 'text-red-400'
                              : 'text-amber-400'
                        }`}>
                          {selectedOrder.paymentStatus} • {selectedOrder.paymentMethod}
                        </div>
                      </div>
                    </div>

                    {/* UPI PAYMENT VERIFICATION STATUS CARD */}
                    {selectedOrder.paymentStatus === 'PAID' ? (
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-emerald-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>UPI Payment Verified &amp; Confirmed</span>
                          </span>
                          <span className="text-[10px] font-mono bg-emerald-900/70 px-2 py-0.5 rounded">PAID</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-200/80 flex flex-wrap gap-x-4 gap-y-1">
                          <span>Status: <strong>Confirmed by Founder</strong></span>
                          <span>UPI ID: {USER_UPI_ID}</span>
                        </div>
                      </div>
                    ) : selectedOrder.paymentStatus === 'FAILED' || selectedOrder.orderStatus === 'PAYMENT_FAILED' ? (
                      <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-red-300 font-bold gap-2">
                          <span className="flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-red-400" />
                            <span>Payment Failed / Not Received</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteUnpaidOrder(selectedOrder.id)}
                            disabled={isDeletingUnpaid}
                            className="px-2.5 py-1 bg-[#121110] hover:bg-red-900 text-red-200 border border-red-500/40 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-60 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isDeletingUnpaid ? 'Removing...' : 'Remove Visitor'}</span>
                          </button>
                        </div>
                        <div className="text-[11px] text-red-200/90">
                          Reason: <strong>{selectedOrder.paymentFailureReason || 'No UPI payment received'}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3 text-xs">
                        <div className="flex items-center justify-between text-amber-300 font-bold gap-2 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <span>Awaiting Your Confirmation (₹{selectedOrder.total})</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMarkPaymentFailed(selectedOrder.id)}
                              disabled={isMarkingFailed}
                              className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-60"
                            >
                              {isMarkingFailed ? 'Updating...' : 'Mark Failed'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnpaidOrder(selectedOrder.id)}
                              disabled={isDeletingUnpaid}
                              className="px-2.5 py-1 bg-[#121110] hover:bg-red-950 text-[#E8DFD1] border border-white/15 rounded-lg text-[10px] font-bold cursor-pointer disabled:opacity-60 flex items-center gap-1"
                              title="Remove non-paying visitor"
                            >
                              <Trash2 className="w-3 h-3 text-red-300" />
                              <span>{isDeletingUnpaid ? '...' : 'Dismiss'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-amber-200/85 leading-relaxed">
                          Received <strong>₹{selectedOrder.total}</strong> on <strong>{USER_UPI_ID}</strong>? Only you can confirm this order — tap below once you receive the money.
                        </div>

                        <button
                          type="button"
                          onClick={() => handleVerifyUpiPayment(selectedOrder.id)}
                          disabled={isVerifyingUtr}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-60 shadow-md flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isVerifyingUtr
                              ? 'Confirming Order...'
                              : `I Received ₹${selectedOrder.total} — Confirm Order`}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Customer & Shipping details */}
                    <div className="text-xs space-y-1.5 bg-[#1A1816] p-3.5 rounded-xl border border-white/5">
                      <div><strong>Customer Name:</strong> {selectedOrder.deliveryAddress.recipientName}</div>
                      <div><strong>Phone Number:</strong> <span className="font-mono text-emerald-400">{selectedOrder.customerPhone}</span></div>
                      <div><strong>Delivery Address:</strong> {selectedOrder.deliveryAddress.streetAddress}, {selectedOrder.deliveryAddress.city} - {selectedOrder.deliveryAddress.pincode} ({selectedOrder.deliveryAddress.state})</div>
                      <div><strong>Billing Breakdown:</strong> Subtotal ₹{selectedOrder.subtotal} • Shipping {selectedOrder.shipping === 0 ? 'FREE' : `₹${selectedOrder.shipping}`} • Total <strong className="text-[#C5A880]">₹{selectedOrder.total}</strong></div>
                      <div><strong>Payment Method:</strong> <span className="font-mono text-[#C5A880]">{selectedOrder.paymentMethod}</span>{selectedOrder.paymentDetailNote ? <span className="text-[#E8DFD1]/85"> ({selectedOrder.paymentDetailNote})</span> : null}</div>
                      <div><strong>AWB Tracking:</strong> <span className="font-mono text-[#C5A880]">{selectedOrder.trackingNumber}</span></div>
                      <div><strong>Order Timestamp:</strong> {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</div>
                    </div>

                    {/* One-time WhatsApp prompt shown ONLY right while confirming an order */}
                    {justVerifiedOrderId === selectedOrder.id &&
                      selectedOrder.paymentStatus === 'PAID' &&
                      !whatsappPromptDoneIds.includes(selectedOrder.id) && (
                        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 shadow-lg space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>Order Confirmed &amp; Saved! Send WhatsApp details (one-time):</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => markWhatsappPromptDone(selectedOrder.id)}
                              className="text-[10px] font-bold text-[#8A7463] hover:text-white px-2 py-0.5 rounded border border-white/10 cursor-pointer shrink-0"
                            >
                              Done
                            </button>
                          </div>

                          <a
                            href={`https://wa.me/${getCleanPhone(selectedOrder.customerPhone)}?text=${encodeURIComponent(
                              getCustomerThankYouMessage(selectedOrder)
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => markWhatsappPromptDone(selectedOrder.id)}
                            className="w-full py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>Send Thank You Message to Customer ({selectedOrder.customerPhone})</span>
                          </a>
                        </div>
                      )}

                    {/* Items list */}
                    <div>
                      <div className="text-xs font-bold text-[#8A7463] uppercase tracking-wider mb-2">
                        Products in Order
                      </div>
                      <div className="space-y-2">
                        {selectedOrder.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-[#1A1816] p-2.5 rounded-lg border border-white/5 text-xs">
                            <div>
                              <span className="font-bold text-white">{it.quantity}x {it.productName}</span>
                              <span className="text-[#8A7463] ml-2">({it.variantLabel})</span>
                            </div>
                            <span className="font-mono font-bold text-[#C5A880]">₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Status Update Flow */}
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#8A7463] uppercase tracking-wider">
                          Delivery Status Control
                        </span>
                        {selectedOrder.paymentStatus !== 'PAID' && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Dispatch locked until PAID</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(['CONFIRMED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const).map(st => {
                          const disabled = selectedOrder.paymentStatus !== 'PAID';
                          return (
                            <button
                              key={st}
                              type="button"
                              disabled={disabled}
                              onClick={() => handleStatusChange(selectedOrder.id, st)}
                              className={`py-1.5 px-3 text-[10px] font-bold rounded-lg border transition-all ${
                                selectedOrder.orderStatus === st
                                  ? 'bg-[#C5A880] text-[#121110] border-[#C5A880]'
                                  : disabled
                                    ? 'bg-[#1A1816]/40 text-[#8A7463]/40 border-white/5 cursor-not-allowed'
                                    : 'bg-[#1A1816] text-[#E8DFD1]/80 border-white/10 hover:border-[#C5A880]/60 cursor-pointer'
                              }`}
                            >
                              {st.replace(/_/g, ' ')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-14 text-xs text-[#8A7463] space-y-2">
                    <div className="font-semibold text-[#E8DFD1]">
                      {statusFilter === 'PAID'
                        ? 'Showing Paid Customers Only'
                        : 'No order selected'}
                    </div>
                    <div className="max-w-sm mx-auto leading-relaxed">
                      {statusFilter === 'PAID'
                        ? 'Select a verified paid customer on the left to view full delivery details and send Thank You WhatsApp updates. Non-paying visitors are hidden.'
                        : 'Select an order to inspect customer phone, UPI verification, and delivery status.'}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* PER-ORDER SALES & REVENUE TOTALS LEDGER */}
            <div className="bg-[#23201D] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#C5A880]" />
                    <span>Per-Order Sales &amp; Totals Breakdown</span>
                  </h4>
                  <p className="text-[11px] text-[#8A7463] mt-0.5">
                    {statusFilter === 'PAID'
                      ? 'Showing verified PAID customers only. Tap any row to inspect.'
                      : 'Filtered orders breakdown and cumulative sales summary. Tap any row to inspect.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  {filteredOrders.length > 0 && (
                    <a
                      href={`https://wa.me/${getCleanPhone(ADMIN_PHONE)}?text=${encodeURIComponent(
                        getAllOrdersSummaryMessage(filteredOrders)
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {statusFilter === 'PAID' ? 'Forward Paid Customers to WhatsApp' : 'Forward Listed Orders to WhatsApp'}
                      </span>
                    </a>
                  )}
                  <div className="text-xs font-mono text-[#C5A880] bg-[#121110] px-3 py-1.5 rounded-xl border border-[#C5A880]/30">
                    {statusFilter === 'PAID'
                      ? `${filteredOrders.length} Paid Customer${filteredOrders.length === 1 ? '' : 's'}`
                      : `Showing ${filteredOrders.length} Orders`}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs text-[#E8DFD1]">
                  <thead className="bg-[#121110] text-[#C5A880] uppercase tracking-wider text-[10px] font-mono border-b border-white/10">
                    <tr>
                      <th className="py-3 px-3">Order #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer &amp; Phone</th>
                      <th className="py-3 px-3">Items</th>
                      <th className="py-3 px-3 text-right">Subtotal</th>
                      <th className="py-3 px-3 text-right">Shipping</th>
                      <th className="py-3 px-3 text-right">Order Total</th>
                      <th className="py-3 px-3">Payment Status</th>
                      <th className="py-3 px-3">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-xs text-[#8A7463]">
                          {statusFilter === 'PAID'
                            ? 'No verified PAID customers in this view — non-paying visitors are hidden.'
                            : 'No orders match the current filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(ord => (
                        <tr
                          key={`ledger-${ord.id}`}
                          onClick={() => handleSelectOrder(ord.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedOrder?.id === ord.id ? 'bg-[#C5A880]/10' : 'hover:bg-white/5'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-[#C5A880] whitespace-nowrap">
                            #{ord.id}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-[#E8DFD1]/80 whitespace-nowrap">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">{ord.deliveryAddress.recipientName}</div>
                            <div className="font-mono text-[10px] text-emerald-400">{ord.customerPhone}</div>
                          </td>
                          <td className="py-2.5 px-3 max-w-[220px] truncate text-[#E8DFD1]/90">
                            {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                            ₹{ord.subtotal.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap text-[#8A7463]">
                            {ord.shipping === 0 ? 'FREE' : `₹${ord.shipping.toLocaleString('en-IN')}`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-serif font-bold text-white tabular-nums whitespace-nowrap">
                            ₹{ord.total.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                ord.paymentStatus === 'PAID'
                                  ? 'bg-emerald-900/60 text-emerald-300'
                                  : ord.paymentStatus === 'FAILED'
                                    ? 'bg-red-900/60 text-red-300'
                                    : 'bg-amber-900/60 text-amber-300'
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadgeClasses(ord)}`}>
                              {ord.orderStatus.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Cumulative Totals Summary Bar (Paid-Only Metrics) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
                <div className="bg-[#121110] p-3 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase tracking-wider text-[#8A7463]">Paid Customers</div>
                  <div className="font-serif text-lg font-bold text-white mt-0.5 tabular-nums">
                    {analytics.successfulPaymentsCount}
                  </div>
                </div>
                <div className="bg-[#121110] p-3 rounded-xl border border-emerald-500/30">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400">Verified Paid Sales</div>
                  <div className="font-serif text-lg font-bold text-emerald-300 mt-0.5 tabular-nums">
                    ₹{analytics.totalSales.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-[#121110] p-3 rounded-xl border border-[#C5A880]/30">
                  <div className="text-[10px] uppercase tracking-wider text-[#C5A880]">Confirmed / Packing</div>
                  <div className="font-serif text-lg font-bold text-white mt-0.5 tabular-nums">
                    {analytics.deliveryStatusBreakdown.CONFIRMED}
                  </div>
                </div>
                <div className="bg-[#121110] p-3 rounded-xl border border-blue-500/30">
                  <div className="text-[10px] uppercase tracking-wider text-blue-300">In Transit</div>
                  <div className="font-serif text-lg font-bold text-blue-200 mt-0.5 tabular-nums">
                    {analytics.deliveryStatusBreakdown.DISPATCHED + analytics.deliveryStatusBreakdown.OUT_FOR_DELIVERY}
                  </div>
                </div>
                <div className="bg-[#121110] p-3 rounded-xl border border-white/15 col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#E8DFD1]">Delivered</div>
                  <div className="font-serif text-lg font-bold text-[#C5A880] mt-0.5 tabular-nums">
                    {analytics.deliveryStatusBreakdown.DELIVERED}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PRODUCT-WISE SALES ANALYTICS ================= */}
        {activeTab === 'products' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <h4 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#C5A880]" />
                  <span>Product-Wise Sales & Revenue Breakdown</span>
                </h4>
                <p className="text-xs text-[#8A7463] mt-0.5">
                  Units sold and revenue calculated exclusively from verified PAID orders.
                </p>
              </div>
              <div className="text-xs font-mono text-[#C5A880] bg-[#121110] px-3 py-1.5 rounded-xl border border-[#C5A880]/30">
                Total Verified Revenue: <strong className="text-emerald-400">₹{analytics.totalSales.toLocaleString('en-IN')}</strong>
              </div>
            </div>

            {/* Product Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogProductMetrics.map(prod => {
                const sharePct = analytics.totalSales > 0 ? Math.round((prod.revenue / analytics.totalSales) * 100) : 0;
                const barWidth = Math.round((prod.revenue / maxProductRevenue) * 100);
                return (
                  <div key={prod.productId} className="bg-[#23201D] p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {prod.image && (
                          <img
                            src={prod.image}
                            alt={prod.productName}
                            className="w-12 h-14 rounded-xl object-cover border border-[#C5A880]/30 shrink-0 bg-[#121110]"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold bg-[#121110] text-[#C5A880] px-1.5 py-0.5 rounded border border-[#C5A880]/30">
                              #{prod.rank}
                            </span>
                            <span className="text-[10px] font-mono text-[#8A7463]">{prod.size}</span>
                          </div>
                          <h5 className="font-serif text-base font-bold text-white mt-1 leading-snug">
                            {prod.productName}
                          </h5>
                          {prod.price > 0 && (
                            <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                              <span className="font-bold text-[#C5A880]">₹{prod.price.toLocaleString('en-IN')}</span>
                              <span className="line-through text-[#8A7463] text-[11px]">₹{prod.mrp.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                {prod.discountPct}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-[#121110] text-[#C5A880] px-2 py-1 rounded-lg border border-[#C5A880]/30 shrink-0">
                        {sharePct}% share
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-[#121110] p-2.5 rounded-xl border border-white/5">
                        <div className="text-[10px] text-[#8A7463] uppercase">Verified Revenue</div>
                        <div className="font-serif text-lg font-bold text-emerald-400 mt-0.5">
                          ₹{prod.revenue.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="bg-[#121110] p-2.5 rounded-xl border border-white/5">
                        <div className="text-[10px] text-[#8A7463] uppercase">Units Sold</div>
                        <div className="font-serif text-lg font-bold text-white mt-0.5">
                          {prod.unitsSold} pcs
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-[#121110] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#C5A880] to-emerald-400 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8A7463] font-mono pt-1">
                      <span>Paid Orders: <strong className="text-white">{prod.paidOrdersCount}</strong></span>
                      <span>Pending: <strong className="text-amber-300">{prod.pendingUnits}</strong></span>
                      <span>Failed: <strong className="text-red-300">{prod.failedUnits}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Product-Wise Table */}
            <div className="bg-[#23201D] p-5 rounded-2xl border border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Product Performance &amp; Live Catalog Pricing Ledger ({catalogProductMetrics.length} Products)
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs text-[#E8DFD1]">
                  <thead className="bg-[#121110] text-[#C5A880] uppercase tracking-wider text-[10px] font-mono border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Live Price (MRP)</th>
                      <th className="py-3 px-4">Units Sold (Paid)</th>
                      <th className="py-3 px-4">Paid Orders</th>
                      <th className="py-3 px-4">Pending</th>
                      <th className="py-3 px-4">Failed</th>
                      <th className="py-3 px-4 text-right">Net Revenue (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {catalogProductMetrics.map(prod => (
                      <tr key={prod.productId} className="hover:bg-white/5">
                        <td className="py-3 px-4 font-mono text-[#C5A880] font-bold">{prod.rank}</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            {prod.image && (
                              <img
                                src={prod.image}
                                alt={prod.productName}
                                className="w-8 h-9 rounded-md object-cover border border-white/10 shrink-0"
                              />
                            )}
                            <span>{prod.productName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#8A7463] whitespace-nowrap">{prod.size}</td>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          {prod.price > 0 ? (
                            <span>
                              <strong className="text-[#C5A880]">₹{prod.price}</strong>{' '}
                              <span className="line-through text-[#8A7463] text-[10px]">₹{prod.mrp}</span>{' '}
                              <span className="text-emerald-300 text-[10px]">({prod.discountPct}%)</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">{prod.unitsSold}</td>
                        <td className="py-3 px-4 font-mono text-emerald-300">{prod.paidOrdersCount}</td>
                        <td className="py-3 px-4 font-mono text-amber-300">{prod.pendingUnits}</td>
                        <td className="py-3 px-4 font-mono text-red-300">{prod.failedUnits}</td>
                        <td className="py-3 px-4 font-serif font-bold text-emerald-400 text-right">
                          ₹{prod.revenue.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: OWNER ALERTS & UPI BRIDGE ================= */}
        {activeTab === 'webhooks' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <div className="bg-[#23201D] p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#C5A880]" />
                  <h4 className="font-serif text-lg font-bold text-white">
                    UPI Verification &amp; Founder Alert Bridge
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  className="px-3 py-1.5 bg-[#C5A880] text-[#121110] text-xs font-bold rounded-lg hover:bg-[#B39265] cursor-pointer"
                >
                  Send Test Ping
                </button>
              </div>

              <p className="text-xs text-[#E8DFD1]/80 leading-relaxed mb-4">
                Payments arrive directly on your connected UPI ID <code className="font-mono text-[#C5A880]">{USER_UPI_ID}</code>. Order alerts are formatted for your WhatsApp number <strong>{ADMIN_PHONE}</strong>. To enable silent background WhatsApp alerts on every new &amp; verified order, set <code className="font-mono text-[#C5A880]">CALLMEBOT_API_KEY</code> or <code className="font-mono text-[#C5A880]">WHATSAPP_WEBHOOK_URL</code> in your server environment.
              </p>

              <div className="bg-[#121110] p-4 rounded-xl border border-[#C5A880]/30 font-mono text-xs text-[#C5A880] space-y-1 select-all">
                <div className="text-[#8A7463]">Live Order Notification Preview ({ADMIN_PHONE}):</div>
                <div className="text-emerald-400">🛍️ HAIROLOGY ORDER DETAILS: #{selectedOrder?.id || 'HR-2026-0001'}</div>
                <div>Payment Method: {selectedOrder?.paymentMethod || 'UPI_QR'}</div>
                <div>Total: ₹{selectedOrder?.total || 1299} ({selectedOrder?.paymentStatus || 'PAID'})</div>
                <div>Customer: {selectedOrder?.deliveryAddress.recipientName || 'Customer Name'} ({selectedOrder?.customerPhone || '+91 XXXXXXXXXX'})</div>
              </div>

              {selectedOrder && (
                <a
                  href={`https://wa.me/${getCleanPhone(ADMIN_PHONE)}?text=${encodeURIComponent(
                    getOwnerOrderDetailsMessage(selectedOrder)
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 w-full py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Order #{selectedOrder.id} Details to My Number ({ADMIN_PHONE})</span>
                </a>
              )}
            </div>

            <div className="bg-[#23201D] p-5 rounded-2xl border border-[#C5A880]/30 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <h4 className="font-serif text-base font-bold text-white">
                  Founder-Only Order Confirmation (Optional GPay Alert Bridge)
                </h4>
              </div>
              <p className="text-xs text-[#E8DFD1]/80 leading-relaxed">
                Orders are confirmed <strong>only when you tap &ldquo;I Received ₹... — Confirm Order&rdquo;</strong> inside this Founder Panel. If you link an Android notification forwarder (like MacroDroid) to the endpoint below, it will highlight incoming GPay payments under <strong>Awaiting Confirmation</strong> for your final approval:
              </p>
              <div className="bg-[#121110] p-3.5 rounded-xl border border-white/10 font-mono text-[11px] text-[#E8DFD1] space-y-1.5 overflow-x-auto">
                <div>
                  <span className="text-[#8A7463]">POST Webhook URL: </span>
                  <span className="text-emerald-400 select-all">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/upi/auto-confirm-webhook
                  </span>
                </div>
                <div>
                  <span className="text-[#8A7463]">Header: </span>
                  <span className="text-[#C5A880]">x-webhook-secret: {savedCreds?.code || 'YOUR_FOUNDER_CODE'}</span>
                </div>
                <div>
                  <span className="text-[#8A7463]">JSON Body: </span>
                  <span className="text-white">{`{"text": "{notification_text}"}`}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#23201D] p-4 rounded-xl border border-white/10">
                <div className="font-bold text-[#C5A880] mb-1">Founder Phone Contact</div>
                <div className="font-mono text-white text-sm">{ADMIN_PHONE}</div>
                <div className="text-[11px] text-[#8A7463] mt-1">Order verification &amp; owner alerts</div>
              </div>

              <div className="bg-[#23201D] p-4 rounded-xl border border-white/10">
                <div className="font-bold text-[#C5A880] mb-1">Connected UPI ID</div>
                <div className="font-mono text-white text-sm">{USER_UPI_ID}</div>
                <div className="text-[11px] text-[#8A7463] mt-1">Auto-fills cart amount on customer scan</div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: DATABASE SCHEMA ================= */}
        {activeTab === 'schema' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="text-xs text-[#E8DFD1]/80">
              System Database Architecture (Orders + UPI Verification Ledger):
            </div>

            <div className="bg-[#121110] p-4 rounded-xl border border-white/10 font-mono text-xs text-[#E8DFD1] overflow-x-auto leading-relaxed">
              <pre>{`CREATE TABLE orders (
    id VARCHAR(30) PRIMARY KEY,
    customer_phone VARCHAR(15) NOT NULL,
    delivery_address JSONB NOT NULL,
    subtotal_paise INT NOT NULL,
    discount_paise INT DEFAULT 0,
    shipping_paise INT DEFAULT 0,
    total_amount_paise INT NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(25) DEFAULT 'PENDING', -- 'PAID' | 'FAILED' | 'PENDING'
    order_status VARCHAR(30) DEFAULT 'PENDING_CONFIRMATION',
    upi_transaction_ref VARCHAR(64),
    payer_upi VARCHAR(64),
    payment_failure_reason TEXT,
    payment_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}</pre>
            </div>
          </div>
        )}

        {/* ================= MODAL FOOTER ================= */}
        <div className="p-4 bg-[#121110] border-t border-white/10 flex items-center justify-between text-xs text-[#8A7463]">
          <div>Authorized Founder: {savedCreds?.email || AUTHORIZED_FOUNDER_EMAILS[0]} • Connected to {ADMIN_PHONE}</div>
          <button
            type="button"
            onClick={handleLockAndClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold cursor-pointer"
          >
            Close Console
          </button>
        </div>

      </div>
    </div>
  );
};
