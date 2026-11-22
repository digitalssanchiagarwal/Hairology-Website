import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  ShieldCheck,
  Check,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Share2,
  AlertCircle,
  MapPin,
  Lock,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
  Copy
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import {
  USER_LOGO_IMAGE,
  USER_UPI_QR_IMAGE,
  USER_UPI_ID,
  USER_UPI_NAME,
  ADMIN_PHONE
} from '../data/products';
import { lookupPincode } from '../data/pincodes';
import { Order } from '../types';

export const FastCheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    closeCheckout,
    items,
    subtotal,
    shippingFee,
    orders,
    upsertOrder
  } = useCart();

  // Stepper State: Step 1 (Delivery Address) -> Step 2 (UPI Payment Scanner)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);

  // Step 1: Customer & Delivery details
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);

  // Step 2: UPI Payment Scanner & Live Order State
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [dynamicUpiQrUrl, setDynamicUpiQrUrl] = useState<string>('');
  const [useDynamicUpiQr, setUseDynamicUpiQr] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const grandTotal = Math.max(0, subtotal + shippingFee);
  const isAboveQrAutoLimit = grandTotal > 2000;
  const orderNote = pendingOrder ? `Hairology #${pendingOrder.id}` : `Hairology Order Rs.${grandTotal}`;
  const amountQueryParam = isAboveQrAutoLimit ? '' : `&am=${grandTotal.toFixed(2)}`;
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(USER_UPI_ID)}&pn=${encodeURIComponent(USER_UPI_NAME)}${amountQueryParam}&cu=INR&tn=${encodeURIComponent(orderNote)}`;
  const gpayDeepLink = `gpay://upi/pay?pa=${encodeURIComponent(USER_UPI_ID)}&pn=${encodeURIComponent(USER_UPI_NAME)}${amountQueryParam}&cu=INR&tn=${encodeURIComponent(orderNote)}`;
  const phonepeDeepLink = `phonepe://pay?pa=${encodeURIComponent(USER_UPI_ID)}&pn=${encodeURIComponent(USER_UPI_NAME)}${amountQueryParam}&cu=INR&tn=${encodeURIComponent(orderNote)}`;

  useEffect(() => {
    if (grandTotal > 0) {
      QRCode.toDataURL(upiDeepLink, {
        width: 360,
        margin: 2,
        color: { dark: '#121110', light: '#FFFFFF' },
        errorCorrectionLevel: 'M'
      })
        .then(url => setDynamicUpiQrUrl(url))
        .catch(err => console.error('Failed to generate UPI QR', err));
    }
  }, [grandTotal, upiDeepLink]);

  // Listen to local context updates and poll Express server status every 2 seconds.
  // Thank You confirmation ONLY unlocks once paymentStatus === 'PAID'.
  useEffect(() => {
    if (!isCheckoutOpen || checkoutStep !== 2 || !pendingOrder?.id || completedOrder) return;

    const matchInContext = orders.find(o => o.id === pendingOrder.id);
    if (matchInContext?.paymentStatus === 'PAID') {
      setCompletedOrder(matchInContext);
      setPendingOrder(null);
      return;
    }
    if (matchInContext?.paymentStatus === 'FAILED') {
      setPaymentError(
        matchInContext.paymentFailureReason || 'Payment was not received or was declined. Please retry UPI payment.'
      );
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(pendingOrder.id)}/status`);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) return;
        const data = await res.json();
        if (data?.paid && data?.order) {
          upsertOrder(data.order);
          setCompletedOrder(data.order);
          setPendingOrder(null);
        } else if (data?.paymentStatus === 'FAILED') {
          setPaymentError(
            data.paymentFailureReason || 'Payment was not received or was declined. Please retry UPI payment.'
          );
        }
      } catch {
        // ignore transient network poll error
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isCheckoutOpen, checkoutStep, pendingOrder, completedOrder, orders, upsertOrder]);

  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      const info = lookupPincode(clean);
      if (info.city) setCity(info.city);
      if (info.state) setState(info.state);
    }
  };

  const getCustomerPhoneDigits = (rawPhone: string) => {
    const digits = rawPhone.replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  // STEP 1 VALIDATION & LOGGING PENDING UPI ORDER BEFORE SHOWING SCANNER
  const handleProceedToPayment = async () => {
    setAddressError(null);
    setPaymentError(null);

    const cleanName = recipientName.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanAddress = streetAddress.trim();
    const cleanPincode = pincode.trim();
    const cleanCity = city.trim();
    const cleanState = state.trim();

    if (!cleanName || cleanName.length < 2) {
      setAddressError('Please enter the recipient full name.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      setAddressError('Please enter a valid 10-digit mobile number for WhatsApp updates.');
      return;
    }

    if (!cleanAddress || cleanAddress.length < 5) {
      setAddressError('Please enter your complete street address (Flat/House No., Building, Area).');
      return;
    }

    if (!cleanPincode || cleanPincode.length !== 6) {
      setAddressError('Please enter a valid 6-digit Indian postal pincode.');
      return;
    }

    if (!cleanCity || cleanCity.length < 2) {
      setAddressError('Please enter your city (at least 2 characters).');
      return;
    }

    if (!cleanState || cleanState.length < 2) {
      setAddressError('Please enter your state (at least 2 characters).');
      return;
    }

    if (items.length === 0 || grandTotal <= 0) {
      setAddressError('Your cart is empty. Please add products before continuing.');
      return;
    }

    setIsCreatingOrder(true);
    const cleanCustomerDigits = getCustomerPhoneDigits(phone);
    const customerFormattedPhone = `+91 ${cleanCustomerDigits}`;
    const addressPayload = {
      recipientName: cleanName,
      phoneNumber: customerFormattedPhone,
      streetAddress: cleanAddress,
      city: cleanCity,
      state: cleanState,
      pincode: cleanPincode
    };

    const buildClientFallbackOrder = (): Order => ({
      id: `HR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      customerPhone: customerFormattedPhone,
      deliveryAddress: addressPayload,
      items: [...items],
      subtotal,
      discount: 0,
      shipping: shippingFee,
      codFee: 0,
      total: grandTotal,
      paymentMethod: 'UPI_QR',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_CONFIRMATION',
      payerUpi: USER_UPI_ID,
      trackingNumber: `DELHIVERY-AWB-${Math.floor(100000000 + Math.random() * 900000000)}`,
    });

    try {
      let createdOrder: Order | null = null;
      let serverExplicitError: string | null = null;

      try {
        const res = await fetch('/api/orders/upi-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryAddress: addressPayload,
            items,
            subtotal,
            discount: 0,
            shipping: shippingFee,
            total: grandTotal,
            existingOrderId: pendingOrder?.id
          })
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data?.order) {
            createdOrder = data.order as Order;
          } else if (res.status >= 400 && res.status < 500 && res.status !== 404 && data?.error) {
            serverExplicitError = data.error;
          }
        }
      } catch {
        // Static Vercel / serverless fallback below
      }

      if (serverExplicitError) {
        setAddressError(serverExplicitError);
        setIsCreatingOrder(false);
        return;
      }

      if (!createdOrder) {
        createdOrder = buildClientFallbackOrder();
      }

      setPendingOrder(createdOrder);
      setCheckoutStep(2);
    } catch {
      setAddressError('Could not open UPI payment scanner. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const markPaymentInitiated = async () => {
    if (!pendingOrder) return;
    const updatedOrder: Order = {
      ...pendingOrder,
      paymentInitiated: true,
    };
    setPendingOrder(updatedOrder);
    upsertOrder(updatedOrder);

    try {
      await fetch(`/api/orders/${encodeURIComponent(pendingOrder.id)}/payment-initiated`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch {
      // ignore transient network error
    }
  };

  const buildCustomerThankYouReceipt = (order: Order) => {
    const itemsList = order.items
      .map(it => `• ${it.quantity}x ${it.productName} (${it.variantLabel}) - ₹${it.price * it.quantity}`)
      .join('\n');

    return `✨ THANK YOU FOR YOUR HAIROLOGY ORDER! ✨\n\nDear ${order.deliveryAddress.recipientName},\nThank you for shopping with HAIROLOGY Haute-Beauté Haircare! Your UPI payment of ₹${order.total} has been confirmed.\n\n📦 ORDER SUMMARY:\n• Order ID: #${order.id}\n• Amount Paid: ₹${order.total} (PAID)\n• Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}\n\n🛍️ ITEMS ORDERED:\n${itemsList}\n\n📍 DELIVERY ADDRESS:\n${order.deliveryAddress.recipientName}\n${order.deliveryAddress.streetAddress}, ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode} (${order.deliveryAddress.state})\nMobile: ${order.customerPhone}\n\n🚚 DISPATCH & TRACKING:\n• Courier Partner: Delhivery Express\n• AWB Tracking: ${order.trackingNumber}\n• Delivery Window: 2-4 business days across India\n\nHairology team personally packing your order.\n\nThank you for choosing Hairology! 🌿`;
  };

  const handleModalClose = () => {
    setCheckoutStep(1);
    setCompletedOrder(null);
    setAddressError(null);
    setPaymentError(null);
    setIsCreatingOrder(false);
    closeCheckout();
  };

  if (!isCheckoutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#121110]/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFBF7] rounded-3xl border border-[#C5A880]/30 max-w-xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* ================= HEADER ================= */}
        <div className="p-4 sm:p-5 bg-[#121110] text-[#FDFBF7] border-b border-[#C5A880]/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img
                src={USER_LOGO_IMAGE}
                alt="HAIROLOGY Logo"
                className="h-7 sm:h-8 w-auto object-contain bg-[#121110] p-1 rounded-lg border border-[#C5A880]/40 shadow-sm"
              />
              <span className="text-[10px] tracking-widest uppercase bg-[#C5A880] text-[#121110] px-2 py-0.5 rounded font-bold font-sans">
                DIRECT UPI CHECKOUT
              </span>
            </div>
            <div className="text-[11px] text-[#C5A880] flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Official Hairology Storefront • Instant UPI Scanner</span>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-1.5 text-[#E8DFD1]/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= STEPPER PROGRESS BAR ================= */}
        {!completedOrder && (
          <div className="bg-[#F4EFEB] px-4 sm:px-6 py-3 border-b border-[#E8DFD1] flex items-center justify-between text-xs font-semibold">
            <div
              onClick={() => {
                if (checkoutStep === 2 && !isCreatingOrder) setCheckoutStep(1);
              }}
              className={`flex items-center gap-2 cursor-pointer transition-all ${
                checkoutStep === 1
                  ? 'text-[#121110] font-bold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                checkoutStep === 1
                  ? 'bg-[#121110] text-[#C5A880]'
                  : 'bg-emerald-600 text-white'
              }`}>
                {checkoutStep === 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
              </span>
              <span>1. Delivery Address</span>
            </div>

            <div className={`h-[1px] flex-1 mx-3 sm:mx-4 ${
              checkoutStep === 2 ? 'bg-emerald-600' : 'bg-[#D1C7B7]'
            }`} />

            <div className={`flex items-center gap-2 ${
              checkoutStep === 2
                ? 'text-[#121110] font-bold'
                : 'text-[#8A7463]/70 select-none'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                checkoutStep === 2
                  ? 'bg-[#121110] text-[#C5A880]'
                  : 'bg-[#E5DFD5] text-[#8A7463] border border-[#D1C7B7]'
              }`}>
                {checkoutStep === 1 ? <Lock className="w-3 h-3 text-[#8A7463]" /> : '2'}
              </span>
              <span>2. UPI Payment</span>
            </div>
          </div>
        )}

        {/* ================= BODY ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {completedOrder ? (
            /* ================= ORDER SUCCESS STATE (ONLY AFTER PAYMENT IS VERIFIED PAID) ================= */
            <div className="py-4 text-center space-y-4 animate-in fade-in zoom-in duration-300">

              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  PAYMENT CONFIRMED BY HAIROLOGY
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#121110] mt-1">
                  Thank You, Your Order is Confirmed!
                </h3>
                <p className="text-xs text-[#6B7280] mt-1 font-mono">
                  Order ID: <strong className="text-[#121110]">#{completedOrder.id}</strong> • AWB Tracking: <strong className="text-[#C5A880]">{completedOrder.trackingNumber}</strong>
                </p>
                <p className="text-xs font-semibold text-emerald-800 mt-1.5">
                  Hairology team personally packing your order.
                </p>
              </div>

              {/* WHATSAPP RECEIPT DIRECTLY TO CUSTOMER'S NUMBER */}
              <div className="p-4 bg-[#F0FDF4] rounded-2xl border-2 border-[#86EFAC] text-center space-y-3 shadow-md">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Thank You Message & Details Ready for {completedOrder.customerPhone}</span>
                </div>

                <p className="text-xs text-[#166534] leading-relaxed max-w-md mx-auto">
                  Tap below to receive your official Hairology Thank You message, item summary, and Delhivery tracking on WhatsApp.
                </p>

                <a
                  href={`https://wa.me/91${getCustomerPhoneDigits(completedOrder.customerPhone)}?text=${encodeURIComponent(
                    buildCustomerThankYouReceipt(completedOrder)
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Send Thank You Message on WhatsApp ({completedOrder.customerPhone})</span>
                </a>
              </div>

              {/* Order summary receipt */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8DFD1] text-left text-xs space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center pb-2.5 border-b border-[#E8DFD1]">
                  <span className="font-bold text-[#121110]">Confirmed Paid Amount:</span>
                  <span className="font-serif text-lg font-bold text-emerald-700 tabular-nums">
                    ₹{completedOrder.total} (PAID)
                  </span>
                </div>

                <div>
                  <span className="font-bold text-[#121110] block mb-1">Delivering to:</span>
                  <div className="text-[#3D3A37] leading-relaxed">
                    <strong>{completedOrder.deliveryAddress.recipientName}</strong>
                    <br />
                    {completedOrder.deliveryAddress.streetAddress}, {completedOrder.deliveryAddress.city} - {completedOrder.deliveryAddress.pincode}
                  </div>
                  <div className="text-[#8A7463] mt-1">Mobile: {completedOrder.customerPhone}</div>
                </div>

                <div className="pt-2.5 border-t border-[#E8DFD1]">
                  <span className="font-bold text-[#121110] block mb-1.5">Items Ordered:</span>
                  <div className="space-y-1.5">
                    {completedOrder.items.map(it => (
                      <div key={`${it.productId}-${it.variantId}`} className="flex justify-between text-[#3D3A37]">
                        <span>{it.quantity}x {it.productName} ({it.variantLabel})</span>
                        <span className="font-mono font-medium">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleModalClose}
                className="w-full py-3.5 bg-[#121110] hover:bg-[#2A2724] text-[#C5A880] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : checkoutStep === 1 ? (
            /* ================= STEP 1: DELIVERY ADDRESS (MANDATORY GATEWAY) ================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#E8DFD1]">
                <div>
                  <h4 className="text-sm font-serif font-bold text-[#121110]">
                    Where should we deliver your order?
                  </h4>
                  <p className="text-[11px] text-[#8A7463]">
                    Complete your delivery address first. UPI scanner unlocks after address validation.
                  </p>
                </div>
                <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Free Shipping
                </span>
              </div>

              {addressError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{addressError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-[#121110] block mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => {
                      setRecipientName(e.target.value);
                      if (addressError) setAddressError(null);
                    }}
                    placeholder="Enter your full name"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E8DFD1] rounded-xl outline-none focus:border-[#121110] focus:ring-1 focus:ring-[#121110]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#121110] block mb-1">
                    Mobile Number (WhatsApp Updates) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#8A7463]">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone.replace(/^\+91\s*/, '')}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(digits);
                        if (addressError) setAddressError(null);
                      }}
                      placeholder="10-digit mobile number"
                      className="w-full text-xs pl-11 pr-3.5 py-2.5 bg-white border border-[#E8DFD1] rounded-xl outline-none focus:border-[#121110] focus:ring-1 focus:ring-[#121110] font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#121110] block mb-1">
                  Flat / House No. / Street Address / Landmark *
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={e => {
                    setStreetAddress(e.target.value);
                    if (addressError) setAddressError(null);
                  }}
                  placeholder="e.g. Flat 402, Green Valley Apartments, 12th Main Road"
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E8DFD1] rounded-xl outline-none focus:border-[#121110] focus:ring-1 focus:ring-[#121110]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#121110] block mb-1">
                    Pincode (6 Digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={e => handlePincodeChange(e.target.value)}
                    placeholder="e.g. 400050"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E8DFD1] rounded-xl outline-none focus:border-[#121110] focus:ring-1 focus:ring-[#121110] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#121110] block mb-1">
                    City / Area *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => {
                      setCity(e.target.value);
                      if (addressError) setAddressError(null);
                    }}
                    placeholder="City or Town"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E8DFD1] rounded-xl outline-none focus:border-[#121110] focus:ring-1 focus:ring-[#121110]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#121110] block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => {
                      setState(e.target.value);
                      if (addressError) setAddressError(null);
                    }}
                    placeholder="State"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-[#E8DFD1] rounded-xl outline-none focus:border-[#121110] focus:ring-1 focus:ring-[#121110]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD1] flex items-center justify-between text-xs text-[#8A7463]">
                <span>Items in bag: <strong>{items.reduce((s, i) => s + i.quantity, 0)}</strong></span>
                <span className="font-serif text-sm font-bold text-[#121110]">Total Payable: ₹{grandTotal}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isCreatingOrder}
                  className="w-full py-4 bg-[#121110] hover:bg-[#2A2724] text-[#C5A880] hover:text-white font-bold text-xs tracking-widest uppercase rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer border border-[#C5A880]/30 disabled:opacity-60"
                >
                  <span>{isCreatingOrder ? 'OPENING UPI SCANNER...' : 'PROCEED TO UPI PAYMENT (STEP 2)'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-[#8A7463] text-center mt-2 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-[#8A7463]" />
                  <span>Address must be entered before UPI scanner can be accessed</span>
                </p>
              </div>
            </div>
          ) : (
            /* ================= STEP 2: DIRECT UPI ID AUTO-AMOUNT SCANNER ================= */
            <div className="space-y-4">

              {/* Delivery Address Summary Bar */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#E8DFD1] flex items-start justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-[#121110] flex items-center gap-2">
                      <span>{recipientName}</span>
                      <span className="text-[#8A7463] font-mono font-normal">(+91 {getCustomerPhoneDigits(phone)})</span>
                    </div>
                    <div className="text-[#4B5563] text-[11px] mt-0.5 leading-snug">
                      {streetAddress}, {city} - {pincode} ({state})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutStep(1)}
                  className="px-2.5 py-1 bg-[#F4EFEB] hover:bg-[#E8DFD1] text-[#121110] text-[11px] font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* CONNECTED AUTO-AMOUNT UPI SCANNER */}
              <div className="bg-white rounded-2xl border-2 border-[#121110] shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8DFD1] pb-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#121110]">
                      Scan &amp; Pay Exact Cart Total (₹{grandTotal})
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full">
                    {isAboveQrAutoLimit ? 'SUPPORTS UP TO ₹1,00,000' : `₹${grandTotal} AUTO-FILLS`}
                  </span>
                </div>

                {isAboveQrAutoLimit && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Orders Above ₹2,000 — Enter ₹{grandTotal} Manually in UPI App</span>
                    </div>
                    <p className="leading-relaxed text-amber-800">
                      Indian UPI guidelines cap auto-filled QR codes at ₹2,000. Scan this QR or tap an app below, then type <strong>₹{grandTotal}</strong> inside Google Pay / PhonePe / Paytm (supports up to ₹1,00,000).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(USER_UPI_ID).catch(() => {});
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-amber-100 text-[#121110] border border-amber-300 rounded-lg font-mono font-bold text-[11px] cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedUpi ? `Copied ${USER_UPI_ID}!` : `Copy UPI ID: ${USER_UPI_ID}`}</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="relative p-2 bg-white rounded-xl border-2 border-[#121110] shadow-sm">
                      <img
                        src={useDynamicUpiQr && dynamicUpiQrUrl ? dynamicUpiQrUrl : USER_UPI_QR_IMAGE}
                        alt={`Scan to pay ₹${grandTotal} to ${USER_UPI_ID}`}
                        className="w-40 h-40 object-contain rounded-lg"
                      />
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#121110] text-[#C5A880] text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-[#C5A880]/40 whitespace-nowrap shadow">
                        {isAboveQrAutoLimit ? `ENTER ₹${grandTotal} IN APP` : `₹${grandTotal} AUTO-LOCKED`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseDynamicUpiQr(!useDynamicUpiQr)}
                      className="text-[10px] font-mono font-bold text-[#121110] mt-4 bg-[#F4EFEB] hover:bg-[#E8DFD1] px-2.5 py-1 rounded-full border border-[#E8DFD1] cursor-pointer transition-colors"
                    >
                      {useDynamicUpiQr
                        ? 'View Original GPay QR Card'
                        : isAboveQrAutoLimit
                          ? 'Switch to Open-Amount QR'
                          : `Switch to Auto-Fill ₹${grandTotal} QR`}
                    </button>
                  </div>

                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <div className="font-serif text-lg font-bold text-[#121110]">
                      HAIROLOGY • Official UPI
                    </div>

                    <p className="text-[11px] text-[#4B5563] leading-relaxed">
                      {isAboveQrAutoLimit ? (
                        <>
                          Scan this QR with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong> and enter your total of <strong>₹{grandTotal}</strong>. Works smoothly for orders above ₹2,000.
                        </>
                      ) : (
                        <>
                          Scan this QR with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong>. Your cart total of <strong>₹{grandTotal}</strong> appears automatically on your phone ready to pay.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Direct 1-tap UPI app buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <a
                    href={upiDeepLink}
                    onClick={() => void markPaymentInitiated()}
                    className="py-2.5 px-3 bg-[#121110] hover:bg-[#2A2724] text-[#C5A880] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Any UPI App (₹{grandTotal})</span>
                  </a>
                  <a
                    href={gpayDeepLink}
                    onClick={() => void markPaymentInitiated()}
                    className="py-2.5 px-3 bg-[#F4EFEB] hover:bg-[#E8DFD1] text-[#121110] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-[#E8DFD1]"
                  >
                    <span>Google Pay (₹{grandTotal})</span>
                  </a>
                  <a
                    href={phonepeDeepLink}
                    onClick={() => void markPaymentInitiated()}
                    className="py-2.5 px-3 bg-[#F4EFEB] hover:bg-[#E8DFD1] text-[#121110] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-[#E8DFD1]"
                  >
                    <span>PhonePe (₹{grandTotal})</span>
                  </a>
                </div>

              </div>

              {/* Awaiting Founder Confirmation Notice (No self-claim or auto-confirm) */}
              {paymentError ? (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2.5 font-medium">
                  <XCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              ) : (
                <div className="p-4 bg-[#121110] text-[#FDFBF7] rounded-2xl border border-[#C5A880]/40 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5 animate-pulse" />
                  <div className="text-xs space-y-2 flex-1">
                    <div className="font-bold text-[#C5A880]">
                      Scan &amp; Pay ₹{grandTotal} for Order #{pendingOrder?.id}
                    </div>
                    <p className="text-[11px] text-[#E8DFD1]/85 leading-relaxed">
                      Scan the QR code or use a UPI app above to complete payment. Your order will be confirmed only after Hairology verifies that your payment has been received.
                    </p>
                    {pendingOrder && (
                      <a
                        href={`https://wa.me/${ADMIN_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hi Hairology! I have paid ₹${grandTotal} for Order #${pendingOrder.id} (${recipientName}, +91 ${getCustomerPhoneDigits(phone)}). Please confirm my order.`
                        )}`}
                        onClick={() => void markPaymentInitiated()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-[11px] rounded-lg transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Order #{pendingOrder.id} on WhatsApp for Fast Confirmation</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* ================= FOOTER ================= */}
        {!completedOrder && checkoutStep === 2 && (
          <div className="p-4 sm:p-5 bg-white border-t border-[#E8DFD1] flex items-center justify-between text-xs text-[#8A7463]">
            <span>
              Order <strong>#{pendingOrder?.id}</strong> • {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
            <span className="text-[#121110] font-bold text-sm tabular-nums">Payable: ₹{grandTotal}</span>
          </div>
        )}

      </div>
    </div>
  );
};
