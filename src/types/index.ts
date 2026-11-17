export interface Product {
  id: string;
  name: string;
  tagline: string;
  subtitle: string;
  category: string;
  description: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  accentColor: string;
  variants: {
    id: string;
    label: string;
    size: string;
    mrp: number;
    price: number;
  }[];
  activeComplex: string;
  benefits: {
    title: string;
    description: string;
  }[];
  howToUse: {
    step: number;
    title: string;
    instructions: string;
  }[];
  ingredients: {
    name: string;
    role: string;
    source: string;
  }[];
  faqs: {
    q: string;
    a: string;
  }[];
  additionalInfo: {
    shelfLife: string;
    manufacturer: string;
    origin: string;
    supportContact: string;
    supportEmail: string;
    licenseNo: string;
  };
  image: string;
  galleryImages: {
    id: string;
    title: string;
    type: 'bottle' | 'benefits' | 'ingredients' | 'stats' | 'reviews' | 'promise';
    badge?: string;
  }[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantLabel: string;
  price: number;
  mrp: number;
  quantity: number;
  image: string;
  isFreebie?: boolean;
}

export interface AppliedCoupon {
  code: string;
  discountPercentage: number;
  discountAmount?: number;
  freeGiftName?: string;
}

export interface DeliveryAddress {
  recipientName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  codFee: number;
  total: number;
  couponApplied?: string;
  paymentMethod: 'UPI_QR' | 'UPI';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  orderStatus:
    | 'PENDING_CONFIRMATION'
    | 'CONFIRMED'
    | 'DISPATCHED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'PAYMENT_FAILED';
  gatewayTransactionId?: string;
  paymentFailureReason?: string;
  paymentVerifiedAt?: string;
  trackingNumber?: string;
  payerName?: string;
  payerUpi?: string;
}

export interface ProductSalesMetric {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  paidOrdersCount: number;
  pendingUnits: number;
  failedUnits: number;
}

export interface OrderAnalytics {
  totalSales: number;
  totalOrders: number;
  successfulPaymentsCount: number;
  successfulPaymentsAmount: number;
  failedPaymentsCount: number;
  failedPaymentsAmount: number;
  pendingOrdersCount: number;
  pendingOrdersAmount: number;
  productWiseSales: ProductSalesMetric[];
  deliveryStatusBreakdown: Record<Order['orderStatus'], number>;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
  productName: string;
  location?: string;
  tag?: string;
}
