import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, ShoppingBag, Clock, CheckCircle2, Truck, XCircle,
  Search, Phone, MapPin, Eye, Printer, RefreshCw,
  PackageCheck, Layers, ExternalLink, Sparkles, Plus, Trash2, Edit3, UploadCloud,
  AlertTriangle, Settings, Save, Palette, Boxes,
  Lock, Unlock, LogOut, ShieldCheck, Smartphone, Laptop, Tablet, Globe, Copy,
  Volume2, VolumeX, Megaphone, MessageCircle, Loader2, Mail, Bell,
  FileText, Download, Calendar, Receipt
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface OrderItem {
  productTitle: string;
  variantName: string;
  colorCode: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  email?: string;
  phoneNumber: string;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryFee: number;
  city?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  referrer?: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  orderStatus: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'partial_delivered' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  source?: string;
  createdAt: string;
  statusHistory?: Array<{ status: string; note: string; timestamp: string }>;
  courier?: {
    name?: string;
    provider?: string;
    consignmentId?: number | string;
    trackingCode?: string;
    status?: string;
    sentAt?: string;
    responseRaw?: any;
  };
}

interface SalesReportItem {
  productId?: string;
  productTitle: string;
  variantName: string;
  colorCode?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
}

interface SalesReportRecord {
  _id: string;
  orderId?: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  deliveryFee: number;
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  deliveredAt: string;
  items: SalesReportItem[];
  month: number;
  year: number;
  monthYear: string;
}

interface SalesReportSummary {
  totalDeliveredOrders: number;
  totalItemsSold: number;
  totalRevenue: number;
  totalDeliveryFees: number;
  netProductSales: number;
  periodLabel: string;
  period: 'all' | 'monthly' | 'yearly';
  year: number;
  month: number;
}

interface TopSellingProduct {
  productTitle: string;
  variantName: string;
  colorCode?: string;
  size?: string;
  image?: string;
  totalQuantity: number;
  totalSales: number;
}

interface ProductVariant {
  name: string;
  colorCode: string;
  image?: string;
  images?: string[];
  stock: number;
  extraPrice?: number;
}

interface CategoryConfig {
  id: string;
  name: string;
  isActive?: boolean;
}

interface DeliveryLocationConfig {
  id: string;
  name: string;
  fee: number;
  time?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

interface Product {
  _id: string;
  title: string;
  englishTitle?: string;
  slug?: string;
  category: string;
  regularPrice: number;
  salePrice: number;
  discountPercent?: number;
  description: string;
  shortDescription?: string;
  features?: string[];
  specifications?: Array<{ key: string; value: string }>;
  reviews?: Array<any>;
  inStock: boolean;
  stockQuantity: number;
  images: string[];
  variants: ProductVariant[];
  sizes: string[];
  rating?: number;
  reviewCount?: number;
  badges?: string[];
  createdAt?: string;
}

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders?: number;
  shippedOrders?: number;
  deliveredOrders: number;
  cancelledOrders?: number;
  averageOrderValue: number;
  conversionRate: string;
}

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const cleaned = envUrl.replace(/\/+$/, '');
    if (cleaned.includes('backend-ratul-26b4')) {
      return 'https://backend-nine-kohl-67.vercel.app/api';
    }
    return cleaned;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://backend-nine-kohl-67.vercel.app/api';
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

export default function App() {
  // 1. SECURITY & AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('eb_admin_token') || localStorage.getItem('eb_admin_auth') === 'true');
  });
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 2. CORE NAVIGATION & DATA STATES
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'sales_reports' | 'offers' | 'categories_delivery' | 'settings'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // 2.1 ANNOUNCEMENT & OFFER BANNER CONFIG
  const [announcement, setAnnouncement] = useState({
    enabled: true,
    badgeText: 'LIMITED OFFER',
    messageText: 'সীমিত সময়ের জন্য FLAT 50% DISCOUNT!',
    phoneText: 'Call Us 01648-439277',
    phoneNumber: '01648439277',
    whatsappNumber: '8801648439277',
    themeColor: '#12372A',
    textColor: '#FFFFFF',
    badgeBgColor: '#FBFADA',
    badgeTextColor: '#12372A',
    showPhone: true,
    showWhatsapp: true,
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    deliveredOrders: 0,
    averageOrderValue: 0,
    conversionRate: '0%',
  });
  const [salesGraphData, setSalesGraphData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);

  // 3. REALTIME & NOTIFICATION STATES
  const [lastSyncTime, setLastSyncTime] = useState<string>('কখনোই নয়');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<string[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);

  // 4. ORDER FILTERS & CANCELLED REMOVAL
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [hideCancelled, setHideCancelled] = useState<boolean>(true); // Cancelled orders removed from view by default
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  const handlePrintInvoice = useReactToPrint({
    contentRef: invoicePrintRef,
    documentTitle: invoiceOrder ? `Invoice-${invoiceOrder.orderNumber}` : 'Invoice',
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 12mm 15mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  // 4.1 SALES REPORT STATES & PRINT
  const [salesReportPeriod, setSalesReportPeriod] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [salesReportYear, setSalesReportYear] = useState<number>(() => new Date().getFullYear());
  const [salesReportMonth, setSalesReportMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [salesReports, setSalesReports] = useState<SalesReportRecord[]>([]);
  const [salesReportSummary, setSalesReportSummary] = useState<SalesReportSummary | null>(null);
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [availableReportYears, setAvailableReportYears] = useState<number[]>([new Date().getFullYear()]);
  const [reportMonthsData, setReportMonthsData] = useState<{ month: number; nameBn: string; orderCount: number; revenue: number }[]>([]);
  const [salesReportLoading, setSalesReportLoading] = useState<boolean>(false);
  const [salesReportSearch, setSalesReportSearch] = useState<string>('');

  const salesReportPrintRef = useRef<HTMLDivElement>(null);

  const handlePrintSalesReport = useReactToPrint({
    contentRef: salesReportPrintRef,
    documentTitle: `Sales-Report-${salesReportSummary?.periodLabel || 'Report'}`.replace(/[\s\(\)]+/g, '-'),
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  });

  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isPurgingCancelled, setIsPurgingCancelled] = useState(false);

  // 5. PRODUCT CRUD & IMGBB STATES
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productSearch, setProductSearch] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [imgbbApiKey, setImgbbApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('imgbb_api_key');
      if (saved && saved !== '2a5cb82f7e7a83f1246dc49f5756615b') {
        return saved;
      }
    }
    return '754d8fcb05936232d06f927a4a3a665d';
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [variantUploadIdx, setVariantUploadIdx] = useState<number | null>(null);
  const [openGalleryPickerIdx, setOpenGalleryPickerIdx] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form input states for Add/Edit Product
  const [formTitle, setFormTitle] = useState('');
  const [formEnglishTitle, setFormEnglishTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Clothing');
  const [formRegularPrice, setFormRegularPrice] = useState(2850);
  const [formSalePrice, setFormSalePrice] = useState(1850);
  const [formStock, setFormStock] = useState(45);
  const [formInStock, setFormInStock] = useState(true);
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formSpecs, setFormSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: 'Size', value: '18 Inches' },
    { key: 'Weight', value: 'Approximately 2 kg' },
    { key: 'Capacity', value: 'Up to 7 kg of belongings' },
    { key: 'Warranty', value: '2 Years' },
    { key: 'Color Options', value: '6 Attractive Colors' },
    { key: 'Lock System', value: 'Built-in Number Lock' },
    { key: 'Wheels', value: '360° Spinner Wheels' },
    { key: 'Quality', value: 'Premium Quality' },
  ]);
  const [formImage, setFormImage] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formSizes, setFormSizes] = useState('Free Size, M, L, XL, XXL');
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([
    { name: 'রয়েল ব্লু', colorCode: '#1E3A8A', stock: 15 },
    { name: 'মেরুন রেড', colorCode: '#831843', stock: 12 },
    { name: 'এমারেল্ড গ্রিন', colorCode: '#065F46', stock: 10 },
  ]);

  // Categories & Delivery Locations state
  const [categories, setCategories] = useState<CategoryConfig[]>([
    { id: 'clothing', name: 'Clothing', isActive: true },
    { id: 'bags', name: 'Bags', isActive: true },
    { id: 'luggage', name: 'Luggage', isActive: true },
    { id: 'kids-baby', name: 'Kids & Baby', isActive: true },
    { id: 'beauty-products', name: 'Beauty Products', isActive: true },
    { id: 'general', name: 'General', isActive: true },
  ]);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocationConfig[]>([
    { id: 'inside_dhaka', name: 'ঢাকার ভিতরে', fee: 70, time: '২৪-৪৮ ঘণ্টা', isDefault: true, isActive: true },
    { id: 'outside_dhaka', name: 'ঢাকার বাইরে', fee: 130, time: '২-৩ দিন', isDefault: false, isActive: true },
    { id: 'sub_dhaka', name: 'সাভার / গাজীপুর / নারায়ণগঞ্জ', fee: 100, time: '২৪-৭২ ঘণ্টা', isDefault: false, isActive: true },
    { id: 'free_delivery', name: 'ফ্রি ডেলিভারি (স্পেশাল অফার)', fee: 0, time: '২-৪ দিন', isDefault: false, isActive: false },
  ]);
  const [savingCategories, setSavingCategories] = useState(false);
  const [savingLocations, setSavingLocations] = useState(false);

  // Category Add/Edit Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newCatActive, setNewCatActive] = useState(true);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatActive, setEditCatActive] = useState(true);

  // Delivery Location Add/Edit Form State
  const [newLocName, setNewLocName] = useState('');
  const [newLocId, setNewLocId] = useState('');
  const [newLocFee, setNewLocFee] = useState<number>(70);
  const [newLocTime, setNewLocTime] = useState('২৪-৪৮ ঘণ্টা');
  const [newLocDefault, setNewLocDefault] = useState(false);
  const [newLocActive, setNewLocActive] = useState(true);
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editLocFee, setEditLocFee] = useState<number>(70);
  const [editLocTime, setEditLocTime] = useState('');
  const [editLocDefault, setEditLocDefault] = useState(false);
  const [editLocActive, setEditLocActive] = useState(true);

  // Steadfast Courier States
  const [courierBalance, setCourierBalance] = useState<number | null>(null);
  const [sendingCourierId, setSendingCourierId] = useState<string | null>(null);
  const [trackingCourierId, setTrackingCourierId] = useState<string | null>(null);
  const [fetchingBalance, setFetchingBalance] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Generate crisp in-memory WAV chime for HTML5 Audio fallback
  const generateChimeDataUri = (): string => {
    try {
      const sampleRate = 22050;
      const duration = 0.8;
      const numSamples = Math.floor(sampleRate * duration);
      const dataSize = numSamples * 2;
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const f1 = 587.33; // D5
        const f2 = 880.00; // A5
        const env1 = Math.exp(-t * 6);
        const env2 = t > 0.15 ? Math.exp(-(t - 0.15) * 5) : 0;
        const s1 = Math.sin(2 * Math.PI * f1 * t) * env1;
        const s2 = t > 0.15 ? Math.sin(2 * Math.PI * f2 * (t - 0.15)) * env2 : 0;
        const sample = Math.max(-1, Math.min(1, (s1 + s2) * 0.75));
        view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
      }
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return `data:audio/wav;base64,${window.btoa(binary)}`;
    } catch {
      return '';
    }
  };

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    return audioCtxRef.current;
  };

  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      if (!chimeAudioRef.current && typeof Audio !== 'undefined') {
        const uri = generateChimeDataUri();
        if (uri) {
          chimeAudioRef.current = new Audio(uri);
          chimeAudioRef.current.load();
        }
      }
    } catch {
      // ignore
    }
  };

  const requestDesktopNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {
          // ignore
        }
      }
    }
  };

  const sendDesktopNotification = (order: Order) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`🔔 নতুন অর্ডার এসেছে! #${order.orderNumber}`, {
          body: `গ্রাহক: ${order.customerName} | মোট: ৳${order.totalAmount}\nফোন: ${order.phoneNumber} | ঠিকানা: ${order.deliveryAddress}`,
          icon: '/favicon.svg',
          tag: `order-${order.orderNumber}`,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch {
        // ignore
      }
    }
  };

  const flashTabTitle = (alertText: string) => {
    if (typeof document !== 'undefined') {
      document.title = alertText;
    }
  };

  // Play clear, loud notification chime using dual Web Audio + HTML5 Audio layers
  const playNotificationSound = (isTest = false) => {
    if (!soundEnabled && !isTest) return;

    // 1. Web Audio API chime with warm resonant tone
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        // High tone
        osc1.frequency.setValueAtTime(659.25, now); // E5
        gain1.gain.setValueAtTime(0.55, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        // Lower resonant chime
        osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
        gain2.gain.setValueAtTime(0.65, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.38);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.65);
      }
    } catch (err) {
      console.warn('Web Audio playback error:', err);
    }

    // 2. HTML5 Audio backup
    try {
      if (!chimeAudioRef.current && typeof Audio !== 'undefined') {
        const uri = generateChimeDataUri();
        if (uri) {
          chimeAudioRef.current = new Audio(uri);
        }
      }
      if (chimeAudioRef.current) {
        chimeAudioRef.current.currentTime = 0;
        chimeAudioRef.current.volume = 0.85;
        chimeAudioRef.current.play().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  const handleIncomingNewOrders = (newOrders: Order[]) => {
    if (!newOrders || newOrders.length === 0) return;

    playNotificationSound();

    newOrders.forEach((newest) => {
      showToast(`🔔 নতুন অর্ডার এসেছে! #${newest.orderNumber} - ${newest.customerName} (৳${newest.totalAmount})`);
      sendDesktopNotification(newest);
    });

    setNewOrderAlert(newOrders[0]);
    flashTabTitle(`🔔 (${newOrders.length}) নতুন অর্ডার এসেছে!`);
    setNewlyArrivedIds((prev) => [
      ...newOrders.map((o) => String(o._id || o.orderNumber)),
      ...prev,
    ]);
  };

  // 6. REAL-TIME DATA FETCHING (POLLING EVERY 4 SECONDS)
  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    const apiUrl = API_BASE_URL;

    try {
      // 1. Fetch live metrics & sales graph
      const resStats = await fetch(`${apiUrl}/analytics/dashboard`, { cache: 'no-store' });
      if (resStats.ok) {
        const json = await resStats.json();
        if (json.success && json.data) {
          setMetrics(json.data.metrics);
          setSalesGraphData(json.data.salesData || []);
          setStatusDistribution(json.data.statusDistribution || []);
          setApiOnline(true);
        }
      }

      // 2. Fetch live orders
      const resOrders = await fetch(`${apiUrl}/orders`, { cache: 'no-store' });
      if (resOrders.ok) {
        const json = await resOrders.json();
        if (json.success && json.data) {
          const freshOrders = json.data as Order[];

          if (isInitialLoadRef.current) {
            // First load: register existing order IDs without sounding chime
            knownOrderIdsRef.current = new Set(
              freshOrders.map((o) => String(o._id || o.orderNumber))
            );
            isInitialLoadRef.current = false;
          } else {
            // Subsequent polls: detect fresh incoming orders
            const incomingNewOrders = freshOrders.filter(
              (o) => !knownOrderIdsRef.current.has(String(o._id || o.orderNumber))
            );

            if (incomingNewOrders.length > 0) {
              incomingNewOrders.forEach((o) =>
                knownOrderIdsRef.current.add(String(o._id || o.orderNumber))
              );
              handleIncomingNewOrders(incomingNewOrders);
            }
          }
          setOrders(freshOrders);
        }
      }

      // 3. Fetch products from MongoDB Atlas
      const resProducts = await fetch(`${apiUrl}/products?limit=100`, { cache: 'no-store' });
      if (resProducts.ok) {
        const json = await resProducts.json();
        if (json.success && json.data) {
          setProducts(json.data);
        }
      }

      // 4. Fetch announcement, categories, and delivery locations configuration
      const resConfig = await fetch(`${apiUrl}/config`, { cache: 'no-store' });
      if (resConfig.ok) {
        const json = await resConfig.json();
        if (json.success && json.data) {
          if (json.data.announcement) {
            setAnnouncement(json.data.announcement);
          }
          if (Array.isArray(json.data.categories) && json.data.categories.length > 0) {
            setCategories(json.data.categories);
          }
          if (Array.isArray(json.data.deliveryLocations) && json.data.deliveryLocations.length > 0) {
            setDeliveryLocations(json.data.deliveryLocations);
          }
        }
      }

      // 5. Fetch Steadfast Courier balance
      try {
        const resBalance = await fetch(`${apiUrl}/courier/balance`, { cache: 'no-store' });
        if (resBalance.ok) {
          const json = await resBalance.json();
          if (json.success && json.balance !== undefined) {
            setCourierBalance(json.balance);
          }
        }
      } catch {
        // Silently skip if courier balance fails
      }

      setLastSyncTime(new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      setApiOnline(false);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // One-time interaction unlock for Web Audio and Notifications
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
      requestDesktopNotification();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Restore tab title when user focuses the tab
  useEffect(() => {
    const handleFocus = () => {
      if (typeof document !== 'undefined') {
        document.title = 'Elegant Beauty - অ্যাডমিন ড্যাশবোর্ড';
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Verify backend session token on app load
  useEffect(() => {
    const token = localStorage.getItem('eb_admin_token');
    if (!token) return;

    fetch(`${API_BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.valid) {
          localStorage.removeItem('eb_admin_token');
          localStorage.removeItem('eb_admin_auth');
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        // Keep session alive on temporary network error
      });
  }, []);

  // Instant Real-time SSE Stream Listener
  useEffect(() => {
    if (!isAuthenticated) return;
    const apiUrl = API_BASE_URL;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${apiUrl}/orders/stream`);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'NEW_ORDER' && parsed.data) {
            const newOrder = parsed.data as Order;
            const orderKey = String(newOrder._id || newOrder.orderNumber);

            if (!knownOrderIdsRef.current.has(orderKey)) {
              knownOrderIdsRef.current.add(orderKey);
              handleIncomingNewOrders([newOrder]);

              setOrders((prev) => [
                newOrder,
                ...prev.filter((o) => String(o._id || o.orderNumber) !== orderKey),
              ]);

              setMetrics((prev) => ({
                ...prev,
                totalOrders: prev.totalOrders + 1,
                pendingOrders: prev.pendingOrders + 1,
                totalRevenue: prev.totalRevenue + (newOrder.totalAmount || 0),
              }));
            }
          }
        } catch {
          // ignore parsing errors
        }
      };
      eventSource.onerror = () => {
        // EventSource will auto-reconnect
      };
    } catch {
      // Fallback to auto-polling
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [isAuthenticated]);

  // High responsiveness polling every 4 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();

    const interval = setInterval(() => {
      fetchData(true); // Silent background sync
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle Admin Login with Backend API
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        localStorage.setItem('eb_admin_token', data.token);
        localStorage.setItem('eb_admin_auth', 'true');
        setIsAuthenticated(true);
        unlockAudio();
        requestDesktopNotification();
        showToast('লগইন সফল হয়েছে! সিকিউর পোর্টালে স্বাগতম।');
      } else if (res.status === 404) {
        // Backend deployment is pending promotion on Vercel
        if (
          authUsername.trim().toLowerCase() === 'admin' &&
          authPassword.trim() === 'admin@beauty2026'
        ) {
          localStorage.setItem('eb_admin_auth', 'true');
          setIsAuthenticated(true);
          unlockAudio();
          requestDesktopNotification();
          showToast('লগইন সফল হয়েছে! সিকিউর পোর্টালে স্বাগতম।');
        } else {
          setAuthError('ভুল ইউজারনেম বা পাসওয়ার্ড প্রদান করেছেন।');
        }
      } else {
        setAuthError(data.message || 'ভুল ইউজারনেম বা পাসওয়ার্ড প্রদান করেছেন।');
      }
    } catch {
      // Offline fallback: fallback if backend is momentarily unreachable
      if (
        authUsername.trim().toLowerCase() === 'admin' &&
        authPassword.trim() === 'admin@beauty2026'
      ) {
        localStorage.setItem('eb_admin_auth', 'true');
        setIsAuthenticated(true);
        unlockAudio();
        requestDesktopNotification();
        showToast('লগইন সফল হয়েছে (জরুরি অফলাইন মোড)।');
      } else {
        setAuthError('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('eb_admin_token');
    localStorage.removeItem('eb_admin_auth');
    setIsAuthenticated(false);
    showToast('সফলভাবে লগআউট হয়েছেন।');
  };

  // 6.1 SALES REPORT DATA OPERATIONS
  const fetchSalesReports = async (
    period = salesReportPeriod,
    year = salesReportYear,
    month = salesReportMonth
  ) => {
    setSalesReportLoading(true);
    try {
      const token = localStorage.getItem('eb_admin_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const url = `${API_BASE_URL}/sales-reports?period=${period}&year=${year}&month=${month}`;
      let fetchedReports: SalesReportRecord[] = [];
      let fetchedSummary: SalesReportSummary | null = null;
      let fetchedTopProducts: TopSellingProduct[] = [];

      try {
        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            fetchedReports = json.data.reports || [];
            fetchedSummary = json.data.summary || null;
            fetchedTopProducts = json.data.topProducts || [];
            if (json.data.availableYears?.length > 0) {
              setAvailableReportYears(json.data.availableYears);
            }
            if (json.data.monthsData) {
              setReportMonthsData(json.data.monthsData);
            }
          }
        }
      } catch (networkErr) {
        console.warn('Backend sales reports fetch warning:', networkErr);
      }

      // Instant Client-side Fallback & Hydration:
      // If reports are 0 or backend route is pending, extract directly from live delivered orders!
      if (fetchedReports.length === 0 && orders.length > 0) {
        const deliveredOrders = orders.filter((o) =>
          ['delivered', 'partial_delivered'].includes(String(o.orderStatus || '').toLowerCase())
        );

        if (deliveredOrders.length > 0) {
          let filteredOrders = deliveredOrders;
          if (period === 'monthly') {
            const matchedMonth = deliveredOrders.filter((o) => {
              const d = new Date(o.createdAt);
              return d.getFullYear() === year && d.getMonth() + 1 === month;
            });
            filteredOrders = matchedMonth.length > 0 ? matchedMonth : deliveredOrders;
          } else if (period === 'yearly') {
            const matchedYear = deliveredOrders.filter((o) => {
              const d = new Date(o.createdAt);
              return d.getFullYear() === year;
            });
            filteredOrders = matchedYear.length > 0 ? matchedYear : deliveredOrders;
          }

          let totalItemsSold = 0;
          let totalRevenue = 0;
          let totalDeliveryFees = 0;
          let netProductSales = 0;
          const prodMap: Record<string, TopSellingProduct> = {};

          const fallbackReports: SalesReportRecord[] = filteredOrders.map((ord) => {
            const dDate = new Date(ord.createdAt);
            const ordSubtotal = Number(ord.subtotal) || 0;
            const ordDelivery = Number(ord.deliveryFee) || 0;
            const ordTotal = Number(ord.totalAmount) || ordSubtotal + ordDelivery;

            totalRevenue += ordTotal;
            totalDeliveryFees += ordDelivery;
            netProductSales += ordSubtotal;

            const repItems: SalesReportItem[] = (ord.items || []).map((it) => {
              const q = Number(it.quantity) || 1;
              const u = Number(it.unitPrice) || 0;
              const t = Number(it.totalPrice) || u * q;
              totalItemsSold += q;

              const pKey = `${it.productTitle}___${it.variantName || 'Default'}`;
              if (!prodMap[pKey]) {
                prodMap[pKey] = {
                  productTitle: it.productTitle,
                  variantName: it.variantName || 'Default',
                  colorCode: it.colorCode || '',
                  size: it.size || '',
                  image: it.image || '/banner.jpeg',
                  totalQuantity: 0,
                  totalSales: 0,
                };
              }
              prodMap[pKey].totalQuantity += q;
              prodMap[pKey].totalSales += t;

              return {
                productTitle: it.productTitle,
                variantName: it.variantName || 'Default',
                colorCode: it.colorCode || '',
                size: it.size || '',
                quantity: q,
                unitPrice: u,
                totalPrice: t,
                image: it.image || '/banner.jpeg',
              };
            });

            return {
              _id: ord._id,
              orderId: ord._id,
              orderNumber: ord.orderNumber,
              customerName: ord.customerName,
              customerPhone: ord.phoneNumber,
              deliveryAddress: ord.deliveryAddress,
              deliveryArea: ord.deliveryArea,
              deliveryFee: ordDelivery,
              subtotal: ordSubtotal,
              totalAmount: ordTotal,
              paymentMethod: ord.paymentMethod || 'Cash on Delivery (COD)',
              deliveredAt: ord.createdAt,
              items: repItems,
              month: dDate.getMonth() + 1,
              year: dDate.getFullYear(),
              monthYear: `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`,
            };
          });

          fetchedReports = fallbackReports;
          fetchedSummary = {
            totalDeliveredOrders: fallbackReports.length,
            totalItemsSold,
            totalRevenue,
            totalDeliveryFees,
            netProductSales,
            periodLabel:
              period === 'all'
                ? 'সকল সময় (All Time)'
                : period === 'monthly'
                ? `${month}/${year}`
                : `${year} সাল`,
            period,
            year,
            month,
          };
          fetchedTopProducts = Object.values(prodMap).sort(
            (a, b) => b.totalQuantity - a.totalQuantity
          );
        }
      }

      setSalesReports(fetchedReports);
      setSalesReportSummary(fetchedSummary);
      setTopSellingProducts(fetchedTopProducts);
    } catch (err) {
      console.warn('Error fetching sales reports:', err);
    } finally {
      setSalesReportLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSalesReports(salesReportPeriod, salesReportYear, salesReportMonth);
    }
  }, [isAuthenticated, activeTab, orders.length, salesReportPeriod, salesReportYear, salesReportMonth]);

  const handleDeleteSalesReport = async (id: string) => {
    try {
      const token = localStorage.getItem('eb_admin_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE_URL}/sales-reports/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('সেলস রিপোর্ট রেকর্ড মুছে ফেলা হয়েছে।');
        setSalesReports((prev) => prev.filter((r) => r._id !== id));
        fetchSalesReports();
      } else {
        alert(data.message || 'ডিলিট ব্যর্থ হয়েছে');
      }
    } catch {
      alert('সার্ভারের সাথে সংযোগে সমস্যা হয়েছে');
    }
  };

  const handleClearPeriodReports = async () => {
    const label = salesReportSummary?.periodLabel || 'নির্বাচিত সময়';
    if (!window.confirm(`সতর্কতা: আপনি কি নিশ্চিত যে ${label}-এর সকল সেলস রিপোর্ট রেকর্ড মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('eb_admin_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${API_BASE_URL}/sales-reports/clear`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          period: salesReportPeriod,
          year: salesReportYear,
          month: salesReportMonth,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'রিপোর্ট মুছে ফেলা হয়েছে।');
        fetchSalesReports();
      } else {
        alert(data.message || 'মুছে ফেলা ব্যর্থ হয়েছে');
      }
    } catch {
      alert('সার্ভারের সাথে সংযোগে সমস্যা হয়েছে');
    }
  };

  const handleSyncSalesReports = async () => {
    try {
      const token = localStorage.getItem('eb_admin_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      showToast('ডেলিভারড অর্ডার সিঙ্ক করা হচ্ছে...');
      const res = await fetch(`${API_BASE_URL}/sales-reports/sync`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('সেলস রিপোর্ট সফলভাবে সিঙ্ক সম্পন্ন হয়েছে।');
        fetchSalesReports();
      }
    } catch {
      showToast('সিঙ্ক ব্যর্থ হয়েছে');
    }
  };

  // Handle Order Status Switch
  const handleStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    setOrders((prev) =>
      prev.map((ord) => (ord._id === orderId ? { ...ord, orderStatus: newStatus } : ord))
    );

    try {
      const apiUrl = API_BASE_URL;
      const res = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`অর্ডার স্ট্যাটাস আপডেট: '${newStatus}'`);
        fetchData(true);
        fetchSalesReports();
      }
    } catch {
      showToast('স্ট্যাটাস লোকালি আপডেট করা হয়েছে।');
    }
  };

  // Handle Single Order Delete
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    const apiUrl = API_BASE_URL;

    try {
      const res = await fetch(`${apiUrl}/orders/${orderToDelete._id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status === 404 || data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== orderToDelete._id));
        showToast(`🗑️ অর্ডার #${orderToDelete.orderNumber} ড্যাশবোর্ড থেকে মুছে ফেলা হয়েছে!`);
        setOrderToDelete(null);
        if (selectedOrder?._id === orderToDelete._id) setSelectedOrder(null);
        fetchData(true);
      } else {
        showToast(data.message || 'ডিলিট করতে ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setOrders((prev) => prev.filter((o) => o._id !== orderToDelete._id));
      setOrderToDelete(null);
      showToast('ডিলিট সম্পন্ন (লোকাল আপডেট): ' + err.message);
    }
  };

  // Handle Purge All Cancelled Orders
  const handlePurgeCancelled = async () => {
    const apiUrl = API_BASE_URL;
    try {
      const res = await fetch(`${apiUrl}/orders/actions/purge-cancelled`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.orderStatus !== 'Cancelled'));
        showToast(`🗑️ ${data.deletedCount || 'সকল'} বাতিল অর্ডার ড্যাশবোর্ড থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে!`);
        setIsPurgingCancelled(false);
        fetchData(true);
      }
    } catch (err: any) {
      showToast('বাতিল অর্ডার মুছতে সমস্যা হয়েছে: ' + err.message);
    }
  };

  // Copy courier delivery information for Steadfast/Pathao/RedX
  const copyCourierText = (order: Order) => {
    const itemsText = order.items.map((it) => `${it.productTitle} (${it.variantName} x${it.quantity})`).join(', ');
    const emailStr = order.email || order.customerEmail;
    const cleanNote = (order.notes || '').replace(/^Nostrum\s+veniam\s+cons\s*\|\s*/i, '').trim();
    const text = `নাম: ${order.customerName}${emailStr ? `\nইমেইল: ${emailStr}` : ''}
ফোন: ${order.phoneNumber}
ঠিকানা: ${order.deliveryAddress}
পণ্য: ${itemsText}
টোটাল COD কালেকশন: ৳${order.totalAmount}
নোট: ${cleanNote || 'দ্রুত ডেলিভারি'}`;

    navigator.clipboard.writeText(text);
    showToast('📋 কুরিয়ার বুকিং টেক্সট ক্লিপবোর্ডে কপি করা হয়েছে!');
  };

  // Dispatch single order to Steadfast Courier
  const handleSendToSteadfast = async (orderId: string, force = false) => {
    setSendingCourierId(orderId);
    const apiUrl = API_BASE_URL;

    try {
      const res = await fetch(`${apiUrl}/orders/send-steadfast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, force }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const trackingCode = data.trackingCode || data.consignment?.tracking_code || 'N/A';
        showToast(`🚚 Steadfast বুকিং সফল! ট্র্যাকিং কোড: ${trackingCode}`);
        if (data.data) {
          setOrders((prev) => prev.map((ord) => (ord._id === orderId ? data.data : ord)));
          if (selectedOrder && selectedOrder._id === orderId) {
            setSelectedOrder(data.data);
          }
        }
        await fetchData(true);
      } else {
        showToast(`❌ ${data.message || 'Steadfast বুকিং ব্যর্থ হয়েছে'}`);
      }
    } catch (err: any) {
      showToast(`❌ কুরিয়ার সংযোগে ত্রুটি: ${err.message}`);
    } finally {
      setSendingCourierId(null);
    }
  };

  // Live track order from Steadfast Courier API
  const handleTrackSteadfast = async (orderId: string) => {
    setTrackingCourierId(orderId);
    const apiUrl = API_BASE_URL;

    try {
      const res = await fetch(`${apiUrl}/courier/tracking/${orderId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`📦 লাইভ কুরিয়ার স্ট্যাটাস: ${data.data?.courierStatus || 'In Review'}`);
        fetchData(true);
      } else {
        showToast(`⚠️ ${data.message || 'ট্র্যাকিং তথ্য পাওয়া যায়নি'}`);
      }
    } catch (err: any) {
      showToast(`❌ ট্র্যাকিং এরর: ${err.message}`);
    } finally {
      setTrackingCourierId(null);
    }
  };

  // Refresh Steadfast balance manually
  const handleRefreshCourierBalance = async () => {
    setFetchingBalance(true);
    const apiUrl = API_BASE_URL;
    try {
      const res = await fetch(`${apiUrl}/courier/balance`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.success && data.balance !== undefined) {
        setCourierBalance(data.balance);
        showToast(`💰 Steadfast বর্তমান ব্যালেন্স: ৳${data.balance}`);
      } else {
        showToast(`❌ ব্যালেন্স চেক ব্যর্থ: ${data.message || 'Error'}`);
      }
    } catch (err: any) {
      showToast(`❌ ব্যালেন্স ফেচ এরর: ${err.message}`);
    } finally {
      setFetchingBalance(false);
    }
  };

  // Save Announcement & Limited Offer Banner to MongoDB Atlas
  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    const apiUrl = API_BASE_URL;
    try {
      const res = await fetch(`${apiUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ অফার ব্যানার সফলভাবে আপডেট হয়েছে এবং লাইভ স্টোরে প্রকাশিত হয়েছে!');
        fetchData(true);
      } else {
        showToast(data.message || 'সেটিংস আপডেট ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      showToast('সেভ এরর: ' + err.message);
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Helper to generate a slug from a name
  const makeSlug = (text: string, prefix: string) => {
    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || `${prefix}-${Date.now().toString().slice(-4)}`;
  };

  // Save Categories to backend
  const handleSaveCategories = async (updatedCategories: CategoryConfig[]) => {
    setSavingCategories(true);
    const apiUrl = API_BASE_URL;
    try {
      const res = await fetch(`${apiUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updatedCategories }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(updatedCategories);
        showToast('✅ ক্যাটাগরি তালিকা সফলভাবে সেভ হয়েছে এবং লাইভ স্টোরে যুক্ত হয়েছে!');
        fetchData(true);
      } else {
        showToast(data.message || 'ক্যাটাগরি আপডেট ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      showToast('সেভ এরর: ' + err.message);
    } finally {
      setSavingCategories(false);
    }
  };

  // Add Category
  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) {
      showToast('⚠️ অনুগ্রহ করে ক্যাটাগরির নাম লিখুন');
      return;
    }
    const id = newCatId.trim() || makeSlug(name, 'cat');
    if (categories.some((c) => c.id === id || c.name.toLowerCase() === name.toLowerCase())) {
      showToast('⚠️ এই নামের বা আইডির ক্যাটাগরি ইতিমধ্যে বিদ্যমান!');
      return;
    }
    const updated = [...categories, { id, name, isActive: newCatActive }];
    handleSaveCategories(updated);
    setNewCatName('');
    setNewCatId('');
    setNewCatActive(true);
  };

  // Edit Category
  const handleUpdateCategory = (id: string) => {
    const name = editCatName.trim();
    if (!name) {
      showToast('⚠️ অনুগ্রহ করে ক্যাটাগরির নাম লিখুন');
      return;
    }
    const updated = categories.map((c) =>
      c.id === id ? { ...c, name, isActive: editCatActive } : c
    );
    handleSaveCategories(updated);
    setEditingCatId(null);
  };

  // Delete Category
  const handleDeleteCategory = (catToDelete: CategoryConfig) => {
    const count = products.filter((p) => p.category === catToDelete.name).length;
    const msg = count > 0
      ? `"${catToDelete.name}" ক্যাটাগরির অধীনে ${count}টি প্রোডাক্ট রয়েছে। আপনি কি নিশ্চিত এটি মুছতে চান?`
      : `আপনি কি নিশ্চিত "${catToDelete.name}" ক্যাটাগরি মুছে ফেলতে চান?`;
    if (!window.confirm(msg)) return;
    const updated = categories.filter((c) => c.id !== catToDelete.id);
    handleSaveCategories(updated);
  };

  // Toggle Category Active
  const handleToggleCategoryActive = (id: string) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, isActive: c.isActive === false ? true : false } : c
    );
    handleSaveCategories(updated);
  };

  // Save Delivery Locations to backend
  const handleSaveDeliveryLocations = async (updatedLocations: DeliveryLocationConfig[]) => {
    setSavingLocations(true);
    const apiUrl = API_BASE_URL;
    try {
      const res = await fetch(`${apiUrl}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryLocations: updatedLocations }),
      });
      const data = await res.json();
      if (data.success) {
        setDeliveryLocations(updatedLocations);
        showToast('✅ ডেলিভারি লোকেশন ও চার্জ সফলভাবে সেভ হয়েছে এবং চেকআউট ফর্মে যুক্ত হয়েছে!');
        fetchData(true);
      } else {
        showToast(data.message || 'ডেলিভারি লোকেশন আপডেট ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      showToast('সেভ এরর: ' + err.message);
    } finally {
      setSavingLocations(false);
    }
  };

  // Add Delivery Location
  const handleAddDeliveryLocation = () => {
    const name = newLocName.trim();
    if (!name) {
      showToast('⚠️ অনুগ্রহ করে লোকেশনের নাম লিখুন');
      return;
    }
    const id = newLocId.trim() || makeSlug(name, 'loc');
    if (deliveryLocations.some((l) => l.id === id)) {
      showToast('⚠️ এই আইডির লোকেশন ইতিমধ্যে বিদ্যমান!');
      return;
    }
    let updated = [...deliveryLocations];
    if (newLocDefault) {
      updated = updated.map((l) => ({ ...l, isDefault: false }));
    }
    updated.push({
      id,
      name,
      fee: Number(newLocFee) || 0,
      time: newLocTime.trim() || '২-৩ দিন',
      isDefault: newLocDefault,
      isActive: newLocActive,
    });
    handleSaveDeliveryLocations(updated);
    setNewLocName('');
    setNewLocId('');
    setNewLocFee(70);
    setNewLocTime('২৪-৪৮ ঘণ্টা');
    setNewLocDefault(false);
    setNewLocActive(true);
  };

  // Update Delivery Location
  const handleUpdateDeliveryLocation = (id: string) => {
    const name = editLocName.trim();
    if (!name) {
      showToast('⚠️ অনুগ্রহ করে লোকেশনের নাম লিখুন');
      return;
    }
    let updated = deliveryLocations.map((l) => {
      if (l.id === id) {
        return {
          ...l,
          name,
          fee: Number(editLocFee) || 0,
          time: editLocTime.trim() || '২-৩ দিন',
          isDefault: editLocDefault,
          isActive: editLocActive,
        };
      }
      return editLocDefault ? { ...l, isDefault: false } : l;
    });
    handleSaveDeliveryLocations(updated);
    setEditingLocId(null);
  };

  // Delete Delivery Location
  const handleDeleteDeliveryLocation = (locToDelete: DeliveryLocationConfig) => {
    if (deliveryLocations.length <= 1) {
      showToast('⚠️ অন্তত একটি ডেলিভারি লোকেশন থাকা আবশ্যক');
      return;
    }
    if (!window.confirm(`আপনি কি নিশ্চিত "${locToDelete.name}" লোকেশন মুছে ফেলতে চান?`)) return;
    let updated = deliveryLocations.filter((l) => l.id !== locToDelete.id);
    if (locToDelete.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    handleSaveDeliveryLocations(updated);
  };

  // Toggle Delivery Location Active
  const handleToggleDeliveryLocationActive = (id: string) => {
    const updated = deliveryLocations.map((l) =>
      l.id === id ? { ...l, isActive: l.isActive === false ? true : false } : l
    );
    handleSaveDeliveryLocations(updated);
  };

  // Set Location as Default
  const handleSetDefaultLocation = (id: string) => {
    const updated = deliveryLocations.map((l) => ({
      ...l,
      isDefault: l.id === id,
    }));
    handleSaveDeliveryLocations(updated);
  };

  // Handle Quick In-Stock Toggle
  const toggleProductStock = async (prod: Product) => {
    const updatedInStock = !prod.inStock;
    setProducts((prev) =>
      prev.map((p) => (p._id === prod._id ? { ...p, inStock: updatedInStock } : p))
    );

    try {
      const apiUrl = API_BASE_URL;
      await fetch(`${apiUrl}/products/${prod._id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: updatedInStock }),
      });
      showToast(`${prod.title}: ${updatedInStock ? 'ইন স্টক' : 'আউট অফ স্টক'} করা হয়েছে`);
    } catch {
      console.log('Stock updated locally');
    }
  };

  // Handle Quick Stock Quantity Changer
  const updateProductQuantity = async (prod: Product, delta: number) => {
    const newQty = Math.max(0, prod.stockQuantity + delta);
    setProducts((prev) =>
      prev.map((p) => (p._id === prod._id ? { ...p, stockQuantity: newQty, inStock: newQty > 0 } : p))
    );

    try {
      const apiUrl = API_BASE_URL;
      await fetch(`${apiUrl}/products/${prod._id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newQty, inStock: newQty > 0 }),
      });
    } catch {
      console.log('Stock qty updated locally');
    }
  };

  // Reusable Image Upload Helper (ImageBB direct -> Backend proxy -> Local fallback)
  const uploadImageFile = async (file: File): Promise<string> => {
    const activeKey = imgbbApiKey.trim();
    let uploadedUrl = '';

    // 1. Direct browser upload to ImageBB
    if (activeKey) {
      try {
        const directForm = new FormData();
        directForm.append('image', file);
        if (file.name) directForm.append('name', file.name);

        const directRes = await fetch(`https://api.imgbb.com/1/upload?key=${activeKey}`, {
          method: 'POST',
          body: directForm,
        });
        const directData = await directRes.json();
        if (directData.success && directData.data?.url) {
          uploadedUrl = directData.data.url;
        }
      } catch (directErr) {
        console.warn('Direct ImgBB upload failed:', directErr);
      }
    }

    // Convert to base64 for backend endpoints if needed
    const base64: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // 2. Backend proxy upload to ImageBB
    if (!uploadedUrl) {
      try {
        const apiUrl = API_BASE_URL;
        const proxyRes = await fetch(`${apiUrl}/upload/imgbb`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            name: file.name,
            apiKey: activeKey || undefined,
          }),
        });
        const proxyData = await proxyRes.json();
        if (proxyData.success && proxyData.data?.url) {
          uploadedUrl = proxyData.data.url;
        }
      } catch (proxyErr) {
        console.warn('Backend proxy upload failed:', proxyErr);
      }
    }

    // 3. Fallback to server local storage so upload NEVER fails
    if (!uploadedUrl) {
      try {
        const apiUrl = API_BASE_URL;
        const localRes = await fetch(`${apiUrl}/upload/local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            name: file.name,
          }),
        });
        const localData = await localRes.json();
        if (localData.success && localData.data?.url) {
          uploadedUrl = localData.data.url;
        }
      } catch (localErr) {
        console.warn('Local storage upload failed:', localErr);
      }
    }

    return uploadedUrl || base64;
  };

  // Handle Multi-Image Upload for Product Pictures
  const handleMultiImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadImageFile(file);
        if (url) {
          newUrls.push(url);
        }
      }

      if (newUrls.length > 0) {
        setFormImages((prev) => {
          const combined = [...prev, ...newUrls];
          setFormImage(combined[0] || '');
          return combined;
        });
        showToast(`✅ ${newUrls.length}টি প্রোডাক্ট ছবি সফলভাবে যুক্ত হয়েছে!`);
      }
    } catch (err: any) {
      showToast('ছবি আপলোডে সমস্যা: ' + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Image Upload for a Specific Color Variant
  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || variantUploadIdx === null) return;
    setUploadingImage(true);

    try {
      const url = await uploadImageFile(file);
      if (url) {
        setFormVariants((prev) =>
          prev.map((v, i) =>
            i === variantUploadIdx
              ? { ...v, image: url, images: [url, ...(v.images || []).filter((x) => x !== url)] }
              : v
          )
        );
        // Also add to product formImages if not already present
        setFormImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
        showToast('✅ কালারের ছবি সফলভাবে যুক্ত হয়েছে!');
      }
    } catch (err: any) {
      showToast('কালারের ছবি আপলোডে সমস্যা: ' + err.message);
    } finally {
      setUploadingImage(false);
      setVariantUploadIdx(null);
      if (variantFileInputRef.current) {
        variantFileInputRef.current.value = '';
      }
    }
  };

  // Add Manual URLs
  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    const urls = manualUrlInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http') || u.startsWith('/'));

    if (urls.length === 0) {
      showToast('সঠিক ইমেজ URL লিখুন (http:// বা https:// দিয়ে শুরু)');
      return;
    }

    setFormImages((prev) => {
      const updated = [...prev, ...urls];
      setFormImage(updated[0] || '');
      return updated;
    });
    setManualUrlInput('');
    showToast(`✅ ${urls.length}টি ইমেজ লিংক যুক্ত করা হয়েছে!`);
  };

  // Set Cover Image
  const handleSetCoverImage = (index: number) => {
    setFormImages((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const target = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      const updated = [target, ...remaining];
      setFormImage(updated[0]);
      return updated;
    });
    showToast('★ মূল কভার ছবি পরিবর্তন করা হয়েছে');
  };

  // Remove an image from product gallery
  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setFormImage(updated[0] || '');
      return updated;
    });
  };

  // Assign Gallery Image to Color Variant
  const handleAssignGalleryImageToVariant = (variantIdx: number, imgUrl: string) => {
    setFormVariants((prev) =>
      prev.map((v, i) =>
        i === variantIdx
          ? { ...v, image: imgUrl, images: [imgUrl, ...(v.images || []).filter((x) => x !== imgUrl)] }
          : v
      )
    );
    setOpenGalleryPickerIdx(null);
    showToast('✅ কালারের জন্য ছবি সিলেক্ট করা হয়েছে!');
  };

  // Automatic Color Naming Dictionary & Resolver
  const COLOR_DICTIONARY = [
    { name: 'কালো (Black)', hex: '#000000' },
    { name: 'ম্যাট ব্ল্যাক (Matte Black)', hex: '#18181B' },
    { name: 'চারকোল (Charcoal)', hex: '#374151' },
    { name: 'ধূসর (Grey)', hex: '#6B7280' },
    { name: 'সিলভার (Silver)', hex: '#94A3B8' },
    { name: 'হালকা ধূসর (Light Grey)', hex: '#E5E7EB' },
    { name: 'সাদা (White)', hex: '#FFFFFF' },
    { name: 'আইভরি / অফ-হোয়াইট (Off White)', hex: '#FEF3C7' },
    { name: 'লাল (Red)', hex: '#FF0000' },
    { name: 'রক্তিম লাল (Crimson Red)', hex: '#DC2626' },
    { name: 'মেরুন (Maroon)', hex: '#831843' },
    { name: 'বার্গান্ডি (Burgundy)', hex: '#881337' },
    { name: 'নীল (Blue)', hex: '#0000FF' },
    { name: 'রয়েল ব্লু (Royal Blue)', hex: '#1E3A8A' },
    { name: 'নেভি ব্লু (Navy Blue)', hex: '#1E40AF' },
    { name: 'আকাশি নীল (Sky Blue)', hex: '#0284C7' },
    { name: 'হালকা আকাশি (Baby Blue)', hex: '#60A5FA' },
    { name: 'টিয়াল / ফিরোজা (Teal)', hex: '#0D9488' },
    { name: 'সায়ান (Cyan)', hex: '#06B6D4' },
    { name: 'সবুজ (Green)', hex: '#16A34A' },
    { name: 'এমারেল্ড গ্রিন (Emerald Green)', hex: '#065F46' },
    { name: 'বটল গ্রিন (Bottle Green)', hex: '#14532D' },
    { name: 'লাইম গ্রিন (Lime Green)', hex: '#84CC16' },
    { name: 'অলিভ গ্রিন (Olive Green)', hex: '#65A30D' },
    { name: 'হলুদ (Yellow)', hex: '#FFFF00' },
    { name: 'সোনালী হলুদ (Golden Yellow)', hex: '#FACC15' },
    { name: 'সরিষা (Mustard)', hex: '#D97706' },
    { name: 'কমলা (Orange)', hex: '#EA580C' },
    { name: 'হালকা কমলা (Light Orange)', hex: '#FB923C' },
    { name: 'পীচ (Peach)', hex: '#FDBA74' },
    { name: 'গোলাপি (Pink)', hex: '#FFC0CB' },
    { name: 'রানি গোলাপি (Magenta)', hex: '#EC4899' },
    { name: 'বেবি পিঙ্ক (Baby Pink)', hex: '#F472B6' },
    { name: 'রোজ পিঙ্ক (Rose Pink)', hex: '#FB7185' },
    { name: 'বেগুনি (Purple)', hex: '#800080' },
    { name: 'গাঢ় বেগুনি (Deep Purple)', hex: '#581C87' },
    { name: 'ল্যাভেন্ডার (Lavender)', hex: '#A855F7' },
    { name: 'ভায়োলেট (Violet)', hex: '#7C3AED' },
    { name: 'বাদামী (Brown)', hex: '#8B4513' },
    { name: 'কফি ব্রাউন (Coffee Brown)', hex: '#78350F' },
    { name: 'চকলেট (Chocolate)', hex: '#451A03' },
    { name: 'গোল্ডেন (Gold)', hex: '#D4AF37' },
    { name: 'ব্রোঞ্জ (Bronze)', hex: '#CD7F32' },
    { name: 'নুড / স্কিন (Nude)', hex: '#F5D0C5' },
  ];

  const hexToRgb = (hex: string) => {
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return { r: 0, g: 0, b: 0 };
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  };

  const getSmartColorName = (hex: string): string => {
    if (!hex || typeof hex !== 'string') return 'ডিফল্ট কালার';
    const { r, g, b } = hexToRgb(hex);
    let bestDist = Infinity;
    let bestName = 'ডিফল্ট কালার';

    for (const c of COLOR_DICTIONARY) {
      const crgb = hexToRgb(c.hex);
      const rmean = (r + crgb.r) / 2;
      const dr = r - crgb.r;
      const dg = g - crgb.g;
      const db = b - crgb.b;
      const dist = Math.sqrt((((512 + rmean) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rmean) * db * db) >> 8));
      if (dist < bestDist) {
        bestDist = dist;
        bestName = c.name;
      }
    }
    return bestName;
  };

  // Add next smart color variant with automatic name
  const handleAddNewColorVariant = () => {
    const POPULAR_SUGGESTIONS = [
      { name: 'রয়েল ব্লু (Royal Blue)', colorCode: '#1E3A8A' },
      { name: 'রক্তিম লাল (Crimson Red)', colorCode: '#DC2626' },
      { name: 'এমারেল্ড গ্রিন (Emerald Green)', colorCode: '#065F46' },
      { name: 'ম্যাট ব্ল্যাক (Matte Black)', colorCode: '#18181B' },
      { name: 'মেরুন (Maroon)', colorCode: '#831843' },
      { name: 'রানি গোলাপি (Magenta)', colorCode: '#EC4899' },
      { name: 'সাদা (White)', colorCode: '#FFFFFF' },
      { name: 'আকাশি নীল (Sky Blue)', colorCode: '#0284C7' },
      { name: 'সোনালী হলুদ (Golden Yellow)', colorCode: '#FACC15' },
      { name: 'কফি ব্রাউন (Coffee Brown)', colorCode: '#78350F' },
      { name: 'গাঢ় বেগুনি (Deep Purple)', colorCode: '#581C87' },
      { name: 'কমলা (Orange)', colorCode: '#EA580C' },
      { name: 'টিয়াল / ফিরোজা (Teal)', colorCode: '#0D9488' },
      { name: 'সিলভার (Silver)', colorCode: '#94A3B8' },
    ];

    const currentCodes = formVariants.map((v) => v.colorCode.toLowerCase());
    const nextColor =
      POPULAR_SUGGESTIONS.find((s) => !currentCodes.includes(s.colorCode.toLowerCase())) ||
      {
        colorCode: '#3B82F6',
        name: getSmartColorName('#3B82F6'),
      };

    setFormVariants((prev) => [
      ...prev,
      {
        name: nextColor.name,
        colorCode: nextColor.colorCode,
        stock: Number(formStock) || 10,
        image: '',
        images: [],
      },
    ]);
    showToast(`✅ "${nextColor.name}" কালার স্বয়ংক্রিয়ভাবে যোগ করা হয়েছে!`);
  };

  // Helper to load Luggage Demo (Exact demo from user)
  const handleLoadLuggageDemo = () => {
    setFormTitle('18-Inch Cabin Luggage / Hand Luggage');
    setFormEnglishTitle('18-Inch Cabin Luggage / Hand Luggage');
    setFormCategory('Luggage');
    setFormRegularPrice(4500);
    setFormSalePrice(2950);
    setFormStock(35);
    setFormInStock(true);
    setFormDescription(
      'ভ্রমণের জন্য ছোট, হালকা ও ব্যবহার উপযোগী লাগেজ খুঁজছেন? আমাদের 18-Inch Cabin Luggage হতে পারে আপনার জন্য উপযুক্ত পছন্দ। বিমানে ভ্রমণের সময় কেবিন লাগেজ হিসেবে ব্যবহার অথবা একক ব্যক্তির স্বল্প সময়ের ভ্রমণে প্রয়োজনীয় পোশাক ও জিনিসপত্র বহনের জন্য এটি একটি সুবিধাজনক অপশন।'
    );
    setFormSpecs([
      { key: 'Size', value: '18 Inches' },
      { key: 'Weight', value: 'Approximately 2 kg' },
      { key: 'Capacity', value: 'Up to 7 kg of belongings' },
      { key: 'Warranty', value: '2 Years' },
      { key: 'Color Options', value: '6 Attractive Colors' },
      { key: 'Lock System', value: 'Built-in Number Lock' },
      { key: 'Wheels', value: '360° Spinner Wheels' },
      { key: 'Quality', value: 'Premium Quality' },
    ]);
    setFormFeatures(
      `Compact design for convenient travel.\nLightweight body for easy handling.\n360° spinner wheels for smooth movement.\nBuilt-in number lock for added convenience.\nSuitable for solo travelers and short trips.\nAvailable in 6 attractive colors to match your style.`
    );
    setFormSizes('18 Inches (কেবিন স্ট্যান্ডার্ড)');
    setFormVariants([
      { name: 'নেভি ব্লু (Navy Blue)', colorCode: '#1E3A8A', stock: 10 },
      { name: 'রোজ পিঙ্ক (Rose Pink)', colorCode: '#FB7185', stock: 8 },
      { name: 'ক্লাসিক ব্ল্যাক (Classic Black)', colorCode: '#09090B', stock: 10 },
      { name: 'সিলভার গ্রে (Silver Grey)', colorCode: '#94A3B8', stock: 7 },
    ]);
    showToast('✨ ১৮-ইঞ্চি লাগেজ ডেমো ফিচার ও স্পেসিফিকেশন সফলভাবে লোড হয়েছে!');
  };

  // Helper to parse pasted raw text into specs and features
  const handleParseCustomText = (text: string) => {
    if (!text.trim()) return;
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const newSpecs: Array<{ key: string; value: string }> = [];
    const newFeats: string[] = [];

    lines.forEach((line) => {
      if (line.includes(':') && !line.startsWith('http') && !line.startsWith('https')) {
        const parts = line.split(':');
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim();
        if (k && v) {
          newSpecs.push({ key: k, value: v });
          return;
        }
      }
      newFeats.push(line.replace(/^[-•*]\s*/, ''));
    });

    if (newSpecs.length > 0) {
      setFormSpecs((prev) => [...prev, ...newSpecs]);
    }
    if (newFeats.length > 0) {
      setFormFeatures((prev) => (prev ? prev + '\n' + newFeats.join('\n') : newFeats.join('\n')));
    }
    showToast(`✅ ${newSpecs.length}টি স্পেসিফিকেশন ও ${newFeats.length}টি ফিচার টেক্সট থেকে পার্স করা হয়েছে!`);
  };

  // Open Modal for New Product
  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormEnglishTitle('');
    setFormCategory('Clothing');
    setFormRegularPrice(2500);
    setFormSalePrice(1650);
    setFormStock(30);
    setFormInStock(true);
    setFormDescription('');
    setFormFeatures('');
    setFormSpecs([
      { key: '', value: '' },
      { key: '', value: '' },
      { key: '', value: '' },
      { key: '', value: '' },
    ]);
    setFormImages([]);
    setFormImage('');
    setShowManualUrl(false);
    setManualUrlInput('');
    setVariantUploadIdx(null);
    setOpenGalleryPickerIdx(null);
    setFormSizes('Free Size, M, L, XL, XXL');
    setFormVariants([
      { name: 'রয়েল ব্লু', colorCode: '#1E3A8A', stock: 10, image: '' },
      { name: 'মেরুন রেড', colorCode: '#831843', stock: 10, image: '' },
      { name: 'এমারেল্ড গ্রিন', colorCode: '#065F46', stock: 10, image: '' },
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (variantFileInputRef.current) variantFileInputRef.current.value = '';
    setIsProductModalOpen(true);
  };

  // Open Modal to Edit Product
  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormTitle(prod.title);
    setFormEnglishTitle(prod.englishTitle || '');
    setFormCategory(prod.category);
    setFormRegularPrice(prod.regularPrice);
    setFormSalePrice(prod.salePrice);
    setFormStock(prod.stockQuantity);
    setFormInStock(prod.inStock);
    setFormDescription(prod.description);
    setFormFeatures(prod.features ? prod.features.join('\n') : '');
    setFormSpecs(
      prod.specifications && prod.specifications.length > 0
        ? prod.specifications
        : [
            { key: 'ক্যাটাগরি', value: prod.category },
            { key: 'কোয়ালিটি', value: 'প্রিমিয়াম' },
          ]
    );
    const prodImages = prod.images && prod.images.length > 0 ? prod.images : [];
    setFormImages(prodImages);
    const currentImg = prodImages[0] || '';
    setFormImage(currentImg);
    setShowManualUrl(false);
    setManualUrlInput('');
    setVariantUploadIdx(null);
    setOpenGalleryPickerIdx(null);
    setFormSizes(prod.sizes ? prod.sizes.join(', ') : 'Free Size, M, L');
    setFormVariants(
      prod.variants && prod.variants.length > 0
        ? prod.variants.map((v) => ({
            name: v.name || '',
            colorCode: v.colorCode || '#1E3A8A',
            stock: v.stock !== undefined ? v.stock : prod.stockQuantity,
            extraPrice: v.extraPrice || 0,
            image: v.image || (v.images && v.images[0]) || '',
            images: v.images && v.images.length > 0 ? v.images : (v.image ? [v.image] : []),
          }))
        : [{ name: 'ডিফল্ট', colorCode: '#1E3A8A', stock: prod.stockQuantity, image: '' }]
    );
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (variantFileInputRef.current) variantFileInputRef.current.value = '';
    setIsProductModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('অনুগ্রহ করে প্রোডাক্টের নাম লিখুন');
      return;
    }

    // Parse features from newlines or commas
    const parsedFeatures = formFeatures
      .split('\n')
      .flatMap((line) => line.split(','))
      .map((f) => f.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    // Clean specifications
    const parsedSpecs = formSpecs
      .map((s) => ({ key: s.key.trim(), value: s.value.trim() }))
      .filter((s) => s.key && s.value);

    const allImages = formImages.filter((img) => img && typeof img === 'string' && img.trim().length > 0);
    const finalImages = allImages.length > 0 ? allImages : (formImage ? [formImage] : ['/banner.jpeg']);

    const payload = {
      title: formTitle.trim(),
      englishTitle: formEnglishTitle.trim(),
      category: formCategory,
      regularPrice: Number(formRegularPrice),
      salePrice: Number(formSalePrice),
      stockQuantity: Number(formStock),
      inStock: formInStock,
      description: formDescription.trim(),
      features: parsedFeatures,
      specifications: parsedSpecs,
      images: finalImages,
      variants: formVariants.map((v) => ({
        name: v.name.trim() || 'ডিফল্ট',
        colorCode: v.colorCode || '#1E3A8A',
        stock: Number(v.stock) || 0,
        extraPrice: Number(v.extraPrice) || 0,
        image: v.image || (v.images && v.images[0]) || '',
        images: v.images && v.images.length > 0 ? v.images : (v.image ? [v.image] : []),
      })),
      sizes: formSizes.split(',').map((s) => s.trim()).filter(Boolean),
      rating: editingProduct ? (editingProduct.rating ?? 0) : 0,
      reviewCount: editingProduct ? (editingProduct.reviewCount ?? 0) : 0,
      reviews: editingProduct ? (editingProduct.reviews ?? []) : [],
    };

    const apiUrl = API_BASE_URL;

    try {
      if (editingProduct) {
        const res = await fetch(`${apiUrl}/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          setProducts((prev) =>
            prev.map((p) => (p._id === editingProduct._id ? data.data || { ...p, ...payload } : p))
          );
          showToast('✅ প্রোডাক্ট সফলভাবে আপডেট করা হয়েছে!');
          setIsProductModalOpen(false);
          fetchData(true);
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast('❌ আপডেট ব্যর্থ: ' + (errData.message || res.statusText));
        }
      } else {
        const res = await fetch(`${apiUrl}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setProducts((prev) => [data.data, ...prev]);
          }
          showToast('✅ নতুন প্রোডাক্ট সফলভাবে যোগ করা হয়েছে!');
          setIsProductModalOpen(false);
          fetchData(true);
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast('❌ প্রোডাক্ট তৈরিতে সমস্যা: ' + (errData.message || res.statusText));
        }
      }
    } catch (err: any) {
      showToast('সেভ করার সময় ত্রুটি: ' + err.message);
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    const apiUrl = API_BASE_URL;
    try {
      const res = await fetch(`${apiUrl}/products/${productToDelete._id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 404) {
        throw new Error(data.message || 'পণ্য ডিলিট করা যায়নি');
      }
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete._id));
      showToast(`🗑️ "${productToDelete.title}" সফলভাবে ডিলিট করা হয়েছে!`);
      setProductToDelete(null);
      fetchData(true);
    } catch (err: any) {
      setProducts((prev) => prev.filter((p) => p._id !== productToDelete._id));
      setProductToDelete(null);
      showToast('ডিলিট সম্পন্ন (লোকাল আপডেট): ' + err.message);
    }
  };

  // Filtered Products for the table
  const filteredProducts = products.filter((p) => {
    const matchesCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;
    const matchesSearch =
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.englishTitle && p.englishTitle.toLowerCase().includes(productSearch.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Filtered Orders (Cancel order removal & search)
  const filteredOrders = orders.filter((order) => {
    // If hideCancelled is enabled, remove cancelled orders unless user explicitly selected 'Cancelled' tab
    if (hideCancelled && order.orderStatus === 'Cancelled' && filterStatus !== 'Cancelled') {
      return false;
    }
    const matchesStatus = filterStatus === 'all' || (order.orderStatus || '').toLowerCase() === filterStatus.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (order.orderNumber || '').toLowerCase().includes(q) ||
      (order.customerName || '').toLowerCase().includes(q) ||
      (order.email || '').toLowerCase().includes(q) ||
      (order.customerEmail || '').toLowerCase().includes(q) ||
      (order.phoneNumber || '').includes(searchQuery) ||
      (order.ipAddress || '').includes(searchQuery) ||
      (order.city || '').toLowerCase().includes(q) ||
      (order.deliveryAddress || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Order['orderStatus'] | string) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'pending':
        return <span className="badge badge-warning text-xs font-semibold gap-1"><Clock size={12} /> Pending</span>;
      case 'confirmed':
        return <span className="badge badge-info text-xs font-semibold gap-1"><CheckCircle2 size={12} /> Confirmed</span>;
      case 'processing':
        return <span className="badge badge-primary text-xs font-semibold gap-1"><Layers size={12} /> Processing</span>;
      case 'shipped':
        return <span className="badge badge-secondary text-xs font-semibold gap-1"><Truck size={12} /> Shipped</span>;
      case 'delivered':
        return <span className="badge badge-success text-xs font-semibold gap-1"><PackageCheck size={12} /> Delivered</span>;
      case 'partial_delivered':
        return <span className="badge badge-accent text-xs font-semibold gap-1"><PackageCheck size={12} /> Partial Delivered</span>;
      case 'cancelled':
        return <span className="badge badge-error text-xs font-semibold gap-1"><XCircle size={12} /> Cancelled</span>;
      default:
        return <span className="badge text-xs font-semibold">{status}</span>;
    }
  };

  const getCourierStatusBadge = (status?: string) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'delivered':
        return <span className="badge badge-success text-[10px] font-bold gap-1"><CheckCircle2 size={10} /> delivered</span>;
      case 'cancelled':
      case 'cancelled_by_recipient':
        return <span className="badge badge-error text-[10px] font-bold gap-1"><XCircle size={10} /> cancelled</span>;
      case 'partial_delivered':
        return <span className="badge badge-accent text-[10px] font-bold gap-1"><Layers size={10} /> partial_delivered</span>;
      case 'shipped':
      case 'in_review':
        return <span className="badge badge-info text-[10px] font-bold gap-1"><Truck size={10} /> shipped</span>;
      case 'pending':
      default:
        return <span className="badge badge-warning text-[10px] font-bold gap-1"><Clock size={10} /> {s}</span>;
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'Mobile':
        return (
          <span title="মোবাইল ডিভাইস">
            <Smartphone size={13} className="text-emerald-600" />
          </span>
        );
      case 'Tablet':
        return (
          <span title="ট্যাবলেট ডিভাইস">
            <Tablet size={13} className="text-purple-600" />
          </span>
        );
      default:
        return (
          <span title="ডেস্কটপ / ল্যাপটপ">
            <Laptop size={13} className="text-blue-600" />
          </span>
        );
    }
  };

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATION / LOGIN SCREEN (WHEN NOT AUTHENTICATED)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c221a] via-[#12372A] to-[#1c4d3b] flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-amber-200/40 text-slate-800">
          <div className="text-center mb-6">
            <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-amber-400 shadow-md">
              <img src="/logo-light.jpeg" alt="Elegant Beauty Logo" className="w-full h-full object-cover" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>সিকিউর অ্যাডমিন পোর্টাল</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Elegant Beauty</h2>
            <p className="text-xs text-slate-500 mt-0.5">অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে লগইন করুন</p>
          </div>

          {authError && (
            <div className="alert alert-error text-xs text-white p-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                ইউজারনেম (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="admin"
                  className="input input-bordered w-full pl-10 rounded-xl bg-slate-50 text-slate-900 font-medium text-sm"
                />
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                সিকিউরিটি পাসওয়ার্ড (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input input-bordered w-full pl-10 rounded-xl bg-slate-50 text-slate-900 font-medium text-sm"
                />
                <Unlock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn w-full bg-[#12372A] hover:bg-[#1a4d3b] text-white font-bold rounded-xl mt-2 border-0 shadow-lg text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {authLoading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Lock size={16} /> অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করুন
                </>
              )}
            </button>
          </form>

          {/* Secure Portal Indicator */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>২৫৬-বিট এনক্রিপশন ও রেট-লিমিট দ্বারা সুরক্ষিত</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast toast-top toast-end z-50">
          <div className="alert alert-neutral text-white shadow-xl text-xs sm:text-sm font-semibold rounded-2xl flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="navbar bg-white border-b border-slate-200 px-4 md:px-8 shadow-xs sticky top-0 z-40">
        <div className="flex-1 gap-3 items-center">
          <img src="/logo-light.jpeg" alt="Logo" className="w-10 h-10 rounded-full border border-amber-300 object-cover shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-800 tracking-tight">Elegant Beauty</span>
              <span className="badge badge-sm badge-neutral font-mono text-[10px]">SECURE ADMIN</span>
            </div>
            <p className="text-xs text-slate-500">Facebook Campaign, COD Orders & Realtime Sync</p>
          </div>
        </div>

        <div className="flex-none gap-2 sm:gap-3 items-center">
          {/* Realtime Live Pulse Indicator */}
          <div className={`flex items-center gap-2 text-xs border px-3 py-1.5 rounded-full shadow-2xs ${
            apiOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="font-bold hidden sm:inline">{apiOnline ? 'লাইভ সিঙ্ক সক্রিয়' : 'অফলাইন মোড'}</span>
            <span className="text-[11px] font-mono hidden md:inline">({lastSyncTime})</span>
          </div>

          {/* Sound Alert Toggle & Instant Test Button */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => {
                unlockAudio();
                requestDesktopNotification();
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (nextState) {
                  playNotificationSound(true);
                  showToast('🔔 সাউন্ড অ্যালার্ট চালু করা হয়েছে (টেস্ট সাউন্ড প্লে হয়েছে)');
                } else {
                  showToast('সাউন্ড অ্যালার্ট বন্ধ করা হয়েছে');
                }
              }}
              className={`btn btn-xs rounded-lg gap-1 border-0 transition-all ${
                soundEnabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                  : 'bg-transparent text-slate-500 hover:text-slate-800'
              }`}
              title={soundEnabled ? 'সাউন্ড অ্যালার্ট চালু আছে (নতুন অর্ডারে শব্দ হবে)' : 'সাউন্ড বন্ধ'}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span className="text-[11px] font-bold">{soundEnabled ? 'সাউন্ড চালু' : 'সাউন্ড বন্ধ'}</span>
            </button>

            {soundEnabled && (
              <button
                onClick={() => {
                  unlockAudio();
                  requestDesktopNotification();
                  playNotificationSound(true);
                  showToast('🔊 টেস্ট সাউন্ড সফলভাবে প্লে হয়েছে!');
                }}
                className="btn btn-xs btn-ghost text-emerald-800 hover:bg-emerald-200/60 rounded-lg text-[11px] font-bold px-2 gap-1"
                title="সাউন্ড চিম টেস্ট করতে চাপুন"
              >
                <Bell size={12} className="text-amber-600 animate-bounce" />
                <span>টেস্ট</span>
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="btn btn-sm btn-ghost btn-circle text-slate-600 hover:text-emerald-700"
            title="ম্যানুয়াল রিফ্রেশ"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Store Landing Page Link */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-outline btn-neutral gap-1.5 hidden sm:flex"
          >
            <ExternalLink size={14} />
            <span>ল্যান্ডিং পেজ</span>
          </a>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-error btn-outline rounded-xl gap-1"
            title="অ্যাডমিন প্যানেল থেকে লগআউট করুন"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 flex gap-2 md:gap-4 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp size={16} />
          ড্যাশবোর্ড ও সেলস গ্রাফ
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag size={16} />
          সকল অর্ডার ({orders.length})
          {orders.filter((o) => o.orderStatus === 'Pending').length > 0 && (
            <span className="badge badge-sm badge-error text-white font-bold animate-pulse">
              {orders.filter((o) => o.orderStatus === 'Pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Boxes size={16} />
          প্রোডাক্ট ও স্টক কন্ট্রোল ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('sales_reports')}
          className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'sales_reports'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText size={16} />
          সেলস রিপোর্ট ({Math.max(orders.filter((o) => ['delivered', 'partial_delivered'].includes(String(o.orderStatus || '').toLowerCase())).length, salesReports.length)})
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'offers'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone size={16} />
          অফার ও ব্যানার কন্ট্রোল
          {announcement.enabled ? (
            <span className="badge badge-xs badge-success text-white font-bold">LIVE</span>
          ) : (
            <span className="badge badge-xs badge-ghost text-slate-500 font-bold">OFF</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('categories_delivery')}
          className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'categories_delivery'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers size={16} />
          ক্যাটাগরি ও ডেলিভারি ({categories.length} / {deliveryLocations.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings size={16} />
          ImageBB ও এপিআই সেটিংস
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Real-time New Order Notification Banner */}
        {newOrderAlert && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-emerald-500/40 animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-warning text-slate-900 text-[11px] font-black uppercase tracking-wider">
                    নতুন অর্ডার এসেছে!
                  </span>
                  <h4 className="font-extrabold text-base md:text-lg">#{newOrderAlert.orderNumber}</h4>
                </div>
                <p className="text-xs md:text-sm text-emerald-100 mt-0.5">
                  গ্রাহক: <strong className="text-white">{newOrderAlert.customerName}</strong> | ফোন:{' '}
                  <strong className="text-white font-mono">{newOrderAlert.phoneNumber}</strong> | মোট:{' '}
                  <strong className="text-amber-300">৳{newOrderAlert.totalAmount}</strong> ({newOrderAlert.deliveryAddress})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedOrder(newOrderAlert);
                  setActiveTab('orders');
                  setNewOrderAlert(null);
                }}
                className="btn btn-sm bg-white text-emerald-900 hover:bg-emerald-50 border-0 font-bold rounded-xl shadow gap-1"
              >
                <Eye size={15} />
                অর্ডার দেখুন
              </button>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="btn btn-sm btn-circle btn-ghost text-white/80 hover:text-white hover:bg-white/20"
                title="নোটিফিকেশন বন্ধ করুন"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {/* TAB 1: DASHBOARD (REAL-LIFE METRICS, CANCELLED EXCLUDED) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">রিয়েল সেলস রেভিনিউ</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">৳{metrics.totalRevenue.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-1">বাতিল অর্ডার ব্যতীত সঠিক আয়</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                    ৳
                  </div>
                </div>
              </div>

              <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">মোট একটিভ অর্ডার</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                      {orders.filter((o) => o.orderStatus !== 'Cancelled').length} টি
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                      <ShoppingBag size={14} />
                      <span>{orders.filter((o) => o.orderStatus === 'Delivered').length} টি ডেলিভার্ড সম্পন্ন</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag size={22} />
                  </div>
                </div>
              </div>

              <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">পেন্ডিং ডেলিভারি (COD)</p>
                    <h3 className="text-2xl font-black text-amber-600 mt-1">
                      {orders.filter((o) => o.orderStatus === 'Pending').length} টি
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mt-1">
                      <Clock size={14} />
                      <span>কল দিয়ে কনফার্ম করুন</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={22} />
                  </div>
                </div>
              </div>

              <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">মোট প্রোডাক্ট স্টক</p>
                    <h3 className="text-2xl font-black text-purple-700 mt-1">
                      {products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0)} পিস
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-purple-600 font-medium mt-1">
                      <Boxes size={14} />
                      <span>{products.length} টি ক্যাটাগরি প্রোডাক্ট</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Boxes size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* Graphs (Real-life Data Only) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">দৈনিক বিক্রি ও আয়ের রিয়েল গ্রাফ</h4>
                    <p className="text-xs text-slate-500">গত ৭ দিনের প্রকৃত ফেসবুক ক্যাম্পেইন সেলস (বাতিল অর্ডার বাদে)</p>
                  </div>
                  <span className="badge badge-outline text-xs">লাইভ ট্রেন্ড</span>
                </div>

                <div className="h-72 w-full">
                  {salesGraphData.length === 0 || salesGraphData.every((d) => d.revenue === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                      <TrendingUp size={36} className="text-slate-300 mb-2" />
                      <p>এখনো কোনো সফল বিক্রির তথ্য নেই</p>
                      <p className="text-xs text-slate-400 mt-1">অর্ডার ডেলিভার্ড বা নিশ্চিত হলে এখানে গ্রাফ দেখা যাবে।</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesGraphData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(val) => `৳${val}`} />
                        <Tooltip
                          formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'মোট বিক্রি']}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Status Ratio */}
              <div className="card bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1">অর্ডার স্ট্যাটাস রেশিও</h4>
                  <p className="text-xs text-slate-500 mb-4">ডেলিভারির সার্বিক অবস্থা</p>
                  <div className="h-56 w-full flex items-center justify-center">
                    {orders.length === 0 ? (
                      <div className="text-center text-slate-400 text-xs">কোনো অর্ডার ডাটা নেই</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusDistribution} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="count">
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                  {statusDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-600">
                        {item.name}: <strong className="text-slate-900">{item.count}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT (REAL-LIFE DATA, USER INFO, CANCELLED REMOVAL) */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter, Search & Cancelled Orders Removal Controls */}
            <div className="card bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="অর্ডার নং, নাম, ফোন বা আইপি খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered input-sm w-full pl-9 bg-slate-50 text-slate-800 text-xs rounded-xl"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-1 w-full md:w-auto items-center">
                {['all', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`btn btn-xs rounded-lg ${filterStatus === status ? 'btn-neutral' : 'btn-ghost text-slate-600'}`}
                  >
                    {status === 'all' ? 'সব অর্ডার' : status}
                    <span className="badge badge-xs ml-1">
                      {status === 'all' ? orders.length : orders.filter((o) => o.orderStatus === status).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Cancelled Orders Quick Controls */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={hideCancelled}
                    onChange={(e) => setHideCancelled(e.target.checked)}
                    className="checkbox checkbox-xs checkbox-error"
                  />
                  <span>বাতিল অর্ডার লুকান</span>
                </label>

                {orders.some((o) => o.orderStatus === 'Cancelled') && (
                  <button
                    onClick={() => setIsPurgingCancelled(true)}
                    className="btn btn-xs btn-error btn-outline rounded-xl gap-1 text-[11px]"
                    title="বাতিলকৃত সকল অর্ডার স্থায়ীভাবে মুছে ফেলুন"
                  >
                    <Trash2 size={12} />
                    <span>বাতিল অর্ডার মুছুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="card bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
                    <tr>
                      <th>অর্ডার তারিখ ও নং</th>
                      <th>কাস্টমার বিবরণ ও ডিভাইস</th>
                      <th>ডেলিভারি ঠিকানা ও আইপি</th>
                      <th>পণ্য ও ভেরিয়েন্ট</th>
                      <th>মোট টাকা (COD)</th>
                      <th>কুরিয়ার (Steadfast)</th>
                      <th>স্ট্যাটাস</th>
                      <th>স্ট্যাটাস পরিবর্তন</th>
                      <th className="text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-16 text-slate-400">
                          <ShoppingBag size={42} className="mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-600">কোনো অর্ডার পাওয়া যায়নি।</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {hideCancelled
                              ? 'বাতিল অর্ডার লুকানো আছে অথবা এখনো কোনো অর্ডার আসেনি।'
                              : 'কাস্টমার অর্ডার করার সাথে সাথে এখানে রিয়েল-টাইমে প্রদর্শিত হবে।'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const isNewArrival = newlyArrivedIds.includes(String(order._id || order.orderNumber));
                        return (
                          <tr
                            key={order._id}
                            className={`hover transition-colors ${
                              isNewArrival ? 'bg-emerald-50/70 border-l-4 border-emerald-500 font-medium' : ''
                            }`}
                          >
                            {/* Order Number & Timestamp */}
                            <td>
                              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                                <span>{order.orderNumber}</span>
                                {isNewArrival && (
                                  <span className="badge badge-error text-white text-[10px] font-black animate-pulse px-1.5 py-0.5">
                                    নতুন!
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString('bn-BD', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>

                          {/* Customer Name, Phone (Call & WhatsApp) and Device Info */}
                          <td>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {order.customerName}
                              <span title={`ডিভাইস: ${order.deviceType || 'Desktop'}`}>
                                {getDeviceIcon(order.deviceType)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <a
                                href={`tel:${order.phoneNumber}`}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 font-mono"
                                title="সরাসরি কল দিন"
                              >
                                <Phone size={11} /> {order.phoneNumber}
                              </a>
                              <a
                                href={`https://wa.me/88${order.phoneNumber.replace(/^0/, '')}?text=আসসালামু%20আলাইকুম%20${encodeURIComponent(order.customerName)},%20Elegant%20Beauty%20থেকে%20আপনার%20অর্ডার%20#${order.orderNumber}%20সম্পর্কে%20কল%20করছি`}
                                target="_blank"
                                rel="noreferrer"
                                className="badge badge-xs bg-[#25D366] text-white font-bold hover:scale-105 transition-transform"
                                title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
                              >
                                WA
                              </a>
                            </div>
                          </td>

                          {/* Delivery Address, District Badge & IP */}
                          <td className="max-w-[220px]">
                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                              <MapPin size={12} className="text-amber-600 shrink-0" />
                              <span className="badge badge-xs badge-neutral">
                                {order.city || (order.deliveryArea === 'inside_dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে')}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                (৳{order.deliveryFee})
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 truncate mt-0.5" title={order.deliveryAddress}>
                              {order.deliveryAddress}
                            </p>
                            {order.ipAddress && (
                              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                <Globe size={10} /> IP: {order.ipAddress}
                              </p>
                            )}
                          </td>

                          {/* Items and variants */}
                          <td>
                            <div className="space-y-1.5 py-1">
                              {order.items.length > 1 && (
                                <span className="badge badge-xs bg-emerald-100 text-emerald-900 font-bold border-0">
                                  {order.items.length} টি পণ্য (মোট {order.items.reduce((s, x) => s + (x.quantity || 1), 0)} পিস)
                                </span>
                              )}
                              {order.items.slice(0, 3).map((it, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <img
                                    src={it.image || '/banner.jpeg'}
                                    alt={it.productTitle}
                                    className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate max-w-[160px]" title={it.productTitle}>
                                      {it.productTitle}
                                    </p>
                                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: it.colorCode || '#1e3a8a' }}
                                      ></span>
                                      <span className="truncate max-w-[130px]" title={it.variantName}>
                                        {it.variantName} × {it.quantity}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  + আরও {order.items.length - 3} টি পণ্য রয়েছে
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Total COD Amount */}
                          <td>
                            <div className="font-bold text-emerald-700">৳{order.totalAmount}</div>
                            <div className="text-[11px] text-slate-400">ক্যাশ অন ডেলিভারি</div>
                          </td>

                          {/* Courier Dispatch & Tracking (Steadfast) */}
                          <td>
                            {order.courier?.consignmentId || order.courier?.trackingCode ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {getCourierStatusBadge(order.courier.status)}
                                  <button
                                    type="button"
                                    disabled
                                    className="btn btn-xs btn-ghost btn-disabled opacity-60 text-[10px] h-6 min-h-0 px-1.5 font-bold text-slate-500 cursor-not-allowed border border-slate-200 rounded-md"
                                    title="Dispatched to Steadfast"
                                  >
                                    <CheckCircle2 size={11} className="text-emerald-600" />
                                    Dispatched
                                  </button>
                                </div>

                                <div className="font-mono text-[11px] font-bold text-slate-800 flex items-center gap-1">
                                  <span className="truncate max-w-[110px]" title={String(order.courier.trackingCode || order.courier.consignmentId)}>
                                    {order.courier.trackingCode || order.courier.consignmentId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(String(order.courier?.trackingCode || order.courier?.consignmentId || ''));
                                      showToast('ট্র্যাকিং কোড কপি হয়েছে!');
                                    }}
                                    className="text-slate-400 hover:text-purple-700"
                                    title="ট্র্যাকিং কোড কপি করুন"
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>

                                {order.courier.trackingCode && (
                                  <div>
                                    <a
                                      href={`https://steadfast.com.bd/t/${order.courier.trackingCode}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:text-purple-900 underline"
                                      title="Steadfast এ লাইভ ট্র্যাক করুন"
                                    >
                                      <span>https://steadfast.com.bd/t/{order.courier.trackingCode}</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  </div>
                                )}

                                <div>
                                  <button
                                    type="button"
                                    onClick={() => handleTrackSteadfast(order._id)}
                                    disabled={trackingCourierId === order._id}
                                    className="text-[10px] text-purple-600 hover:text-purple-800 underline font-semibold flex items-center gap-0.5"
                                  >
                                    {trackingCourierId === order._id ? (
                                      <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                      <RefreshCw size={9} />
                                    )}
                                    লাইভ ট্র্যাকিং
                                  </button>
                                </div>
                              </div>
                            ) : order.orderStatus?.toLowerCase() === 'cancelled' ? (
                              <span className="text-[11px] text-slate-400 italic">বাতিলকৃত</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSendToSteadfast(order._id)}
                                disabled={sendingCourierId === order._id}
                                className="btn btn-xs bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-xs font-bold gap-1 text-[11px] transition-all"
                                title="Steadfast কুরিয়ারে বুকিং করুন"
                              >
                                {sendingCourierId === order._id ? (
                                  <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>পাঠানো হচ্ছে...</span>
                                  </>
                                ) : (
                                  <>
                                    <Truck size={12} />
                                    <span>Send to Steadfast</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td>{getStatusBadge(order.orderStatus)}</td>

                          {/* Status Changer Dropdown */}
                          <td>
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleStatusChange(order._id, e.target.value as any)}
                              className="select select-bordered select-xs w-28 bg-slate-50 font-medium rounded-lg"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          {/* Action Buttons: View, Invoice, Copy Courier, Delete */}
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="btn btn-xs btn-ghost btn-circle text-slate-600 hover:text-slate-900"
                                title="গ্রাহকের পূর্ণ তথ্য ও অর্ডার ডিটেইলস"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => copyCourierText(order)}
                                className="btn btn-xs btn-ghost btn-circle text-blue-600 hover:text-blue-800"
                                title="কুরিয়ার টেক্সট কপি করুন"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                onClick={() => setInvoiceOrder(order)}
                                className="btn btn-xs btn-ghost btn-circle text-emerald-600 hover:text-emerald-800"
                                title="ইনভয়েস প্রিন্ট"
                              >
                                <Printer size={14} />
                              </button>
                              <button
                                onClick={() => setOrderToDelete(order)}
                                className="btn btn-xs btn-ghost btn-circle text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="অর্ডার ড্যাশবোর্ড থেকে মুছুন"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS & LIVE STOCK CONTROL */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                  <Boxes className="text-emerald-700" size={22} />
                  প্রোডাক্ট ম্যানেজমেন্ট ও স্টক কন্ট্রোল
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  MongoDB Atlas ক্লাস্টারে সরাসরি প্রোডাক্ট আপলোড, ইমেজবিবি ইমেজ ও লাইভ স্টক নিয়ন্ত্রণ
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={openNewProductModal}
                  className="btn btn-sm bg-[#12372A] hover:bg-[#1a4a39] text-white font-bold rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus size={16} /> নতুন প্রোডাক্ট যোগ করুন
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="card bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="প্রোডাক্ট খুঁজুন..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="input input-bordered input-sm w-full pl-9 bg-slate-50 text-slate-800 text-xs rounded-xl"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                {['All', ...Array.from(new Set([...categories.map((c) => c.name), ...products.map((p) => p.category)].filter(Boolean)))].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`btn btn-xs rounded-lg ${productCategoryFilter === cat ? 'btn-neutral' : 'btn-ghost text-slate-600'}`}
                  >
                    {cat === 'All' ? 'সব ক্যাটাগরি' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            <div className="card bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
                    <tr>
                      <th>ছবি ও নাম</th>
                      <th>ক্যাটাগরি</th>
                      <th>রেগুলার প্রাইস</th>
                      <th>অফার প্রাইস</th>
                      <th>স্টক অবস্থা</th>
                      <th>স্টক সংখ্যা</th>
                      <th>কালার ভেরিয়েন্ট</th>
                      <th className="text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          কোনো প্রোডাক্ট পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => (
                        <tr key={prod._id} className="hover">
                          <td>
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.images?.[0] || '/product-clothing.jpg'}
                                alt={prod.title}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                              />
                              <div>
                                <p className="font-bold text-slate-900 line-clamp-1 max-w-[200px]" title={prod.title}>
                                  {prod.title}
                                </p>
                                {prod.englishTitle && (
                                  <p className="text-xs text-slate-400 line-clamp-1">{prod.englishTitle}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-sm badge-outline font-medium">{prod.category}</span>
                          </td>
                          <td className="text-slate-400 line-through">৳{prod.regularPrice}</td>
                          <td className="font-bold text-emerald-700 text-base">৳{prod.salePrice}</td>
                          <td>
                            <button
                              onClick={() => toggleProductStock(prod)}
                              className={`badge cursor-pointer transition-all ${
                                prod.inStock ? 'badge-success text-white' : 'badge-error text-white'
                              }`}
                              title="ক্লিক করে স্টক অবস্থা পরিবর্তন করুন"
                            >
                              {prod.inStock ? 'ইন স্টক' : 'আউট অফ স্টক'}
                            </button>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateProductQuantity(prod, -1)}
                                className="btn btn-xs btn-square btn-ghost text-slate-600 hover:bg-slate-200"
                              >
                                -
                              </button>
                              <span className="font-bold font-mono text-slate-800 w-8 text-center">
                                {prod.stockQuantity}
                              </span>
                              <button
                                onClick={() => updateProductQuantity(prod, 1)}
                                className="btn btn-xs btn-square btn-ghost text-slate-600 hover:bg-slate-200"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {(prod.variants || []).slice(0, 4).map((v, i) => (
                                <span
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-white shadow-2xs"
                                  style={{ backgroundColor: v.colorCode }}
                                  title={`${v.name} (স্টক: ${v.stock})`}
                                ></span>
                              ))}
                              {prod.variants && prod.variants.length > 4 && (
                                <span className="text-[10px] text-slate-400">+{prod.variants.length - 4}</span>
                              )}
                            </div>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  const origin = window.location.origin.includes('5173') || window.location.origin.includes('3001')
                                    ? 'http://localhost:3000'
                                    : window.location.origin;
                                  const prodKey = prod.slug || prod._id || prod.title;
                                  const shareUrl = `${origin}/?product=${encodeURIComponent(prodKey)}`;
                                  navigator.clipboard.writeText(shareUrl);
                                  setToastMessage(`"${prod.title.slice(0, 20)}..." এর মার্কেটিং লিংক কপি হয়েছে!`);
                                  setTimeout(() => setToastMessage(''), 3500);
                                }}
                                className="btn btn-xs btn-ghost btn-circle text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                title="ফেসবুক মার্কেটিং এর জন্য প্রোডাক্ট লিংক কপি করুন"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={() => openEditProductModal(prod)}
                                className="btn btn-xs btn-ghost btn-circle text-slate-600 hover:text-emerald-700"
                                title="এডিট করুন"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => setProductToDelete(prod)}
                                className="btn btn-xs btn-ghost btn-circle text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="ডিলিট করুন"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SALES & DELIVERY REPORT */}
        {activeTab === 'sales_reports' && (
          <div className="space-y-6">
            {/* Header & Filter Controller */}
            <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
                  <FileText className="text-emerald-700" size={22} />
                  বিক্রয় ও ডেলিভারি রিপোর্ট (Sales Reports)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ডেলিভারি সম্পন্ন হওয়া অর্ডারের অফিসিয়াল হিসাব, মাসিক ও বার্ষিক আয় বিশ্লেষণ এবং PDF ডাউনলোড
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                {/* Period Selector (All vs Monthly vs Yearly) */}
                <div className="join bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setSalesReportPeriod('all')}
                    className={`join-item btn btn-xs rounded-lg font-bold border-0 ${
                      salesReportPeriod === 'all'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    সকল রিপোর্ট
                  </button>
                  <button
                    onClick={() => setSalesReportPeriod('monthly')}
                    className={`join-item btn btn-xs rounded-lg font-bold border-0 ${
                      salesReportPeriod === 'monthly'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    মাসিক
                  </button>
                  <button
                    onClick={() => setSalesReportPeriod('yearly')}
                    className={`join-item btn btn-xs rounded-lg font-bold border-0 ${
                      salesReportPeriod === 'yearly'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    বার্ষিক
                  </button>
                </div>

                {/* Year Select */}
                {salesReportPeriod !== 'all' && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500 hidden sm:inline">বছর:</label>
                    <select
                      value={salesReportYear}
                      onChange={(e) => setSalesReportYear(Number(e.target.value))}
                      className="select select-bordered select-xs rounded-lg bg-white font-medium text-xs text-slate-800"
                    >
                      {availableReportYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Month Select (Only when Monthly is active) */}
                {salesReportPeriod === 'monthly' && (
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-bold text-slate-500 hidden sm:inline">মাস:</label>
                    <select
                      value={salesReportMonth}
                      onChange={(e) => setSalesReportMonth(Number(e.target.value))}
                      className="select select-bordered select-xs rounded-lg bg-white font-medium text-xs text-slate-800"
                    >
                      {[
                        { num: 1, name: 'জানুয়ারি' },
                        { num: 2, name: 'ফেব্রুয়ারি' },
                        { num: 3, name: 'মার্চ' },
                        { num: 4, name: 'এপ্রিল' },
                        { num: 5, name: 'মে' },
                        { num: 6, name: 'জুন' },
                        { num: 7, name: 'জুলাই' },
                        { num: 8, name: 'আগস্ট' },
                        { num: 9, name: 'সেপ্টেম্বর' },
                        { num: 10, name: 'অক্টোবর' },
                        { num: 11, name: 'নভেম্বর' },
                        { num: 12, name: 'ডিসেম্বর' },
                      ].map((m) => (
                        <option key={m.num} value={m.num}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* PDF Download Button */}
                <button
                  onClick={() => handlePrintSalesReport()}
                  disabled={salesReports.length === 0}
                  className="btn btn-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg border-0 gap-1.5 shadow-2xs"
                  title="বর্তমান সেলস রিপোর্টের PDF ডাউনলোড অথবা প্রিন্ট করুন"
                >
                  <Download size={13} />
                  <span>PDF ডাউনলোড</span>
                </button>

                {/* Sync Button */}
                <button
                  onClick={handleSyncSalesReports}
                  disabled={salesReportLoading}
                  className="btn btn-xs btn-outline border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg gap-1"
                  title="ডেলিভারড হওয়া অর্ডারসমূহ স্বয়ংক্রিয়ভাবে রিপোর্টে সিঙ্ক করুন"
                >
                  <RefreshCw size={13} className={salesReportLoading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">সিঙ্ক</span>
                </button>

                {/* Clear Period Button */}
                {salesReports.length > 0 && (
                  <button
                    onClick={handleClearPeriodReports}
                    className="btn btn-xs btn-ghost text-rose-600 hover:bg-rose-50 rounded-lg gap-1"
                    title="এই পিরিয়ডের সকল সেলস রিপোর্ট রেকর্ড মুছে ফেলুন"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline">রিপোর্ট মুছুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Current Period Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-emerald-950">
              <div className="flex items-center gap-2.5">
                <Calendar size={18} className="text-emerald-700 shrink-0" />
                <span className="text-sm font-bold">
                  নির্বাচিত রিপোর্ট সময়কাল:
                  <span className="ml-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-xs font-black tracking-wide">
                    {salesReportSummary?.periodLabel || (salesReportPeriod === 'monthly' ? `${salesReportMonth}/${salesReportYear}` : `${salesReportYear} সাল`)}
                  </span>
                </span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">
                সর্বমোট ডেলিভারড অর্ডার: <b>{salesReports.length}</b> টি | প্রস্তুতকারক: Elegant Beauty ERP
              </p>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="card bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">ডেলিভারড অর্ডার</span>
                  <PackageCheck size={18} className="text-emerald-600" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 font-mono">
                  {salesReportSummary?.totalDeliveredOrders ?? salesReports.length}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">সফলভাবে ডেলিভারড</p>
              </div>

              <div className="card bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">বিক্রীত পণ্য</span>
                  <ShoppingBag size={18} className="text-blue-600" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 font-mono">
                  {salesReportSummary?.totalItemsSold ?? 0}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">মোট আইটেম সংখ্যা</p>
              </div>

              <div className="card bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">নেট প্রোডাক্ট সেলস</span>
                  <Receipt size={18} className="text-indigo-600" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 font-mono">
                  ৳ {(salesReportSummary?.netProductSales ?? 0).toLocaleString()}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">ডেলিভারি চার্জ ব্যতীত</p>
              </div>

              <div className="card bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">সংগৃহীত ডেলিভারি ফি</span>
                  <Truck size={18} className="text-amber-600" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 font-mono">
                  ৳ {(salesReportSummary?.totalDeliveryFees ?? 0).toLocaleString()}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">কুরিয়ার ও পরিবহন ফি</p>
              </div>

              <div className="card bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-md col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between text-emerald-200 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">সর্বমোট সেলস আদায়</span>
                  <TrendingUp size={18} className="text-emerald-300" />
                </div>
                <h4 className="text-2xl font-black font-mono">
                  ৳ {(salesReportSummary?.totalRevenue ?? 0).toLocaleString()}
                </h4>
                <p className="text-[11px] text-emerald-200 mt-1">মোট সংগৃহীত রাজস্ব</p>
              </div>
            </div>

            {/* Yearly View: Month-by-Month Matrix */}
            {salesReportPeriod === 'yearly' && reportMonthsData.length > 0 && (
              <div className="card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-700" />
                    {salesReportYear} সালের ১২ মাসের বিক্রয় তুলনামূলক সারসংক্ষেপ
                  </h4>
                  <span className="text-xs text-slate-400">যে কোনো মাসে ক্লিক করে বিস্তারিত মাসিক রিপোর্টে যান</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {reportMonthsData.map((m) => (
                    <button
                      key={m.month}
                      type="button"
                      onClick={() => {
                        setSalesReportPeriod('monthly');
                        setSalesReportMonth(m.month);
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-all group"
                    >
                      <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-800">{m.nameBn}</p>
                      <p className="text-sm font-black font-mono text-slate-900 mt-1">৳ {Number(m.revenue || 0).toLocaleString()}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{m.orderCount} টি ডেলিভারি</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top Selling Products in Selected Period */}
            {topSellingProducts.length > 0 && (
              <div className="card bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  এই সময়ে সর্বাধিক বিক্রীত প্রোডাক্ট (Top Selling Products)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {topSellingProducts.slice(0, 5).map((tp, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200">
                        <img src={tp.image || '/banner.jpeg'} alt={tp.productTitle} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate" title={tp.productTitle}>{tp.productTitle}</p>
                        <p className="text-[11px] text-slate-500 truncate">{tp.variantName}</p>
                        <div className="flex items-center justify-between text-xs font-bold mt-1">
                          <span className="text-emerald-700 font-mono">{tp.totalQuantity} টি</span>
                          <span className="text-slate-900 font-mono">৳ {tp.totalSales.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivered Sales Records Table */}
            <div className="card bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">ডেলিভারড অর্ডারের বিস্তারিত বিবরণী</h4>
                  <span className="badge badge-sm badge-neutral font-mono">{salesReports.length}</span>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={salesReportSearch}
                    onChange={(e) => setSalesReportSearch(e.target.value)}
                    placeholder="অর্ডার নং, নাম বা ফোন খুঁজুন..."
                    className="input input-xs input-bordered w-full pl-8 rounded-lg bg-white text-xs text-slate-800"
                  />
                  <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                  {salesReportSearch && (
                    <button
                      onClick={() => setSalesReportSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {salesReportLoading ? (
                <div className="p-12 text-center">
                  <span className="loading loading-spinner loading-md text-emerald-700"></span>
                  <p className="text-xs text-slate-500 mt-2 font-medium">সেলস রিপোর্ট লোড করা হচ্ছে...</p>
                </div>
              ) : salesReports.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <ShoppingBag size={42} className="mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    {salesReportSummary?.periodLabel || 'এই সময়ে'} কোনো ডেলিভারড সেলস রেকর্ড পাওয়া যায়নি।
                  </p>
                  <p className="text-xs text-slate-400">
                    যখন কোনো অর্ডার 'Delivered' স্ট্যাটাসে পৌঁছাবে, তা স্বয়ংক্রিয়ভাবে এখানে সেলস রিপোর্ট হিসেবে যুক্ত হবে।
                  </p>
                  <button
                    onClick={handleSyncSalesReports}
                    className="btn btn-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg border-0 gap-1.5 shadow-2xs mt-2"
                  >
                    <RefreshCw size={13} />
                    <span>বর্তমান ডেলিভারড অর্ডারসমূহ সিঙ্ক করুন</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-xs w-full text-slate-700">
                    <thead className="bg-slate-100/80 text-slate-700 text-xs uppercase tracking-wider font-bold">
                      <tr>
                        <th className="py-3 pl-4">অর্ডার নং ও তারিখ</th>
                        <th>গ্রাহকের তথ্য</th>
                        <th>বিক্রীত পণ্যের বিবরণ</th>
                        <th className="text-right">সাবটোটাল</th>
                        <th className="text-right">ডেলিভারি ফি</th>
                        <th className="text-right">সর্বমোট আদায়</th>
                        <th className="text-center pr-4">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {salesReports
                        .filter((r) => {
                          if (!salesReportSearch) return true;
                          const q = salesReportSearch.toLowerCase().trim();
                          return (
                            r.orderNumber?.toLowerCase().includes(q) ||
                            r.customerName?.toLowerCase().includes(q) ||
                            r.customerPhone?.toLowerCase().includes(q) ||
                            r.deliveryAddress?.toLowerCase().includes(q) ||
                            r.items?.some((it) => it.productTitle?.toLowerCase().includes(q))
                          );
                        })
                        .map((report) => (
                          <tr key={report._id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Order Number & Delivery Date */}
                            <td className="py-3 pl-4">
                              <span className="font-mono font-bold text-slate-900 block">#{report.orderNumber}</span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock size={11} />
                                {report.deliveredAt ? new Date(report.deliveredAt).toLocaleDateString('bn-BD') : 'N/A'}
                              </span>
                            </td>

                            {/* Customer Info */}
                            <td>
                              <span className="font-bold text-slate-900 block">{report.customerName}</span>
                              <span className="font-mono text-slate-500 text-[11px] block">{report.customerPhone || 'N/A'}</span>
                              <span className="text-[11px] text-slate-400 truncate max-w-xs block" title={report.deliveryAddress}>
                                {report.deliveryAddress || 'N/A'}
                              </span>
                            </td>

                            {/* Items Sold */}
                            <td className="max-w-md">
                              <div className="space-y-1.5 py-1">
                                {report.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-md bg-white border border-slate-200 overflow-hidden shrink-0">
                                      <img src={it.image || '/banner.jpeg'} alt={it.productTitle} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-slate-800 text-xs truncate" title={it.productTitle}>
                                        {it.productTitle}
                                      </p>
                                      <p className="text-[10px] text-slate-500">
                                        ভ্যারিয়েন্ট: {it.variantName} {it.size ? `| সাইজ: ${it.size}` : ''} | Qty: <b className="text-emerald-700 font-mono">{it.quantity}</b> × ৳{it.unitPrice}
                                      </p>
                                    </div>
                                    <span className="font-mono font-bold text-xs text-slate-800 shrink-0">
                                      ৳{it.totalPrice}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Subtotal */}
                            <td className="text-right font-mono font-semibold text-slate-700">
                              ৳ {Number(report.subtotal || 0).toLocaleString()}
                            </td>

                            {/* Delivery Fee */}
                            <td className="text-right font-mono text-slate-500 text-[11px]">
                              ৳ {Number(report.deliveryFee || 0).toLocaleString()}
                            </td>

                            {/* Total Amount */}
                            <td className="text-right font-mono font-black text-emerald-800 text-sm">
                              ৳ {Number(report.totalAmount || 0).toLocaleString()}
                            </td>

                            {/* Action: Delete */}
                            <td className="text-center pr-4">
                              <button
                                type="button"
                                onClick={() => handleDeleteSalesReport(report._id)}
                                className="btn btn-xs btn-ghost text-rose-500 hover:bg-rose-50 rounded-lg"
                                title="এই সেলস রেকর্ডটি মুছে ফেলুন"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-100/90 font-bold text-slate-900 text-xs border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="py-3 pl-4">
                          সর্বমোট সারসংক্ষেপ ({salesReports.length} টি ডেলিভারড অর্ডার)
                        </td>
                        <td className="text-right font-mono">
                          ৳ {(salesReportSummary?.netProductSales ?? 0).toLocaleString()}
                        </td>
                        <td className="text-right font-mono">
                          ৳ {(salesReportSummary?.totalDeliveryFees ?? 0).toLocaleString()}
                        </td>
                        <td className="text-right font-mono text-emerald-800 text-sm font-black">
                          ৳ {(salesReportSummary?.totalRevenue ?? 0).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: OFFER BANNER CONTROLLER */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
                  <Megaphone className="text-emerald-700" size={22} />
                  অফার ও নোটিস ব্যানার কন্ট্রোল (Announcement Bar)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ল্যান্ডিং পেজের শীর্ষে প্রদর্শিত অফার টেক্সট, ডিসকাউন্ট ব্যাজ, ব্যাকগ্রাউন্ড কালার ও হেল্পলাইন সরাসরি এখান থেকে পরিবর্তন করুন।
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAnnouncement}
                  disabled={savingAnnouncement}
                  className="btn btn-sm bg-[#12372A] hover:bg-[#1a4a39] text-white font-bold rounded-xl gap-1.5 shadow-sm"
                >
                  <Save size={15} />
                  {savingAnnouncement ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                </button>
              </div>
            </div>

            {/* Live Interactive Storefront Preview */}
            <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Eye size={15} className="text-emerald-700" />
                  স্টোরফ্রন্ট লাইভ প্রিভিউ (গ্রাহক ওয়েবসাইটে যেভাবে দেখবে)
                </h4>
                <span className={`badge badge-sm font-bold ${announcement.enabled ? 'badge-success text-white' : 'badge-error text-white'}`}>
                  {announcement.enabled ? 'ব্যানার সক্রিয় (ACTIVE)' : 'ব্যানার বন্ধ (DISABLED)'}
                </span>
              </div>

              {/* The Live Rendered Bar */}
              <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-sm relative">
                <div
                  style={{
                    backgroundColor: announcement.themeColor || '#12372A',
                    color: announcement.textColor || '#FFFFFF',
                  }}
                  className="py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm transition-all"
                >
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    {announcement.badgeText && (
                      <span
                        style={{
                          backgroundColor: announcement.badgeBgColor || '#FBFADA',
                          color: announcement.badgeTextColor || '#12372A',
                        }}
                        className="badge font-extrabold text-[10px] px-2.5 py-0.5 border-0 animate-pulse shadow-xs"
                      >
                        {announcement.badgeText}
                      </span>
                    )}
                    <span className="font-semibold">{announcement.messageText}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    {announcement.showPhone && (
                      <span className="flex items-center gap-1.5 text-amber-300 font-mono font-bold">
                        <Phone size={13} className="text-amber-400" />
                        <span>{announcement.phoneText || `Call Us ${announcement.phoneNumber}`}</span>
                      </span>
                    )}
                    {announcement.showWhatsapp && (
                      <span className="flex items-center gap-1 text-[#25D366] font-semibold">
                        <MessageCircle size={13} />
                        <span>WhatsApp Chat</span>
                      </span>
                    )}
                  </div>
                </div>

                {!announcement.enabled && (
                  <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-2xs flex items-center justify-center text-white text-xs font-bold gap-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <span>ব্যানারটি বর্তমানে বন্ধ আছে — কাস্টমারদের স্ক্রিনে এটি দেখানো হবে না</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controller Settings Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Offer Texts & Badge */}
              <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                  ১. অফার ও টেক্সট কনফিগারেশন
                </h4>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-800 text-xs block">অফার ব্যানার প্রদর্শন করুন</label>
                    <p className="text-[11px] text-slate-500">চালু রাখলে ল্যান্ডিং পেজের একদম উপরে ব্যানারটি শো করবে</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={announcement.enabled}
                    onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                    className="toggle toggle-success toggle-sm"
                  />
                </div>

                {/* Badge Text Input & Presets */}
                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-1">
                    অফার ব্যাজ টেক্সট (Offer Badge)
                  </label>
                  <input
                    type="text"
                    value={announcement.badgeText}
                    onChange={(e) => setAnnouncement({ ...announcement, badgeText: e.target.value })}
                    placeholder="LIMITED OFFER"
                    className="input input-sm input-bordered w-full rounded-xl bg-slate-50 text-xs font-bold"
                  />

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['LIMITED OFFER', '৫০% ছাড়', 'হট ডিল 🔥', 'ঈদ ধামাকা অফার', 'ফ্ল্যাশ সেল ⚡', 'বিশেষ ছাড়'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAnnouncement({ ...announcement, badgeText: preset })}
                        className="btn btn-xs btn-outline rounded-lg text-[10px] text-slate-600 hover:bg-slate-100"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Announcement Message Text & Presets */}
                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-1">
                    প্রধান অফার মেসেজ / শিরোনাম
                  </label>
                  <textarea
                    rows={2}
                    value={announcement.messageText}
                    onChange={(e) => setAnnouncement({ ...announcement, messageText: e.target.value })}
                    placeholder="সীমিত সময়ের জন্য FLAT 50% DISCOUNT!"
                    className="textarea textarea-bordered w-full rounded-xl bg-slate-50 text-xs font-medium"
                  ></textarea>

                  {/* Preset message chips */}
                  <div className="flex flex-col gap-1 mt-2">
                    {[
                      'সীমিত সময়ের জন্য FLAT 50% DISCOUNT!',
                      'আজই অর্ডার করলে পাচ্ছেন ৫০% মহা ছাড় + ক্যাশ অন ডেলিভারি!',
                      '২টি কিনলে সারা দেশে হোম ডেলিভারি সম্পূর্ণ ফ্রি!',
                      'স্টক সীমিত! আপনার পছন্দের কালার বুকিং করুন এখনই!',
                      '১০০% অরিজিনাল কোয়ালিটি পণ্য — সারা দেশে হোম ডেলিভারি!'
                    ].map((msg) => (
                      <button
                        key={msg}
                        type="button"
                        onClick={() => setAnnouncement({ ...announcement, messageText: msg })}
                        className="text-left text-[11px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-lg border border-emerald-200 transition-colors"
                      >
                        • {msg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Theme, Colors & Helpline */}
              <div className="card bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                  ২. কালার থিম ও হেল্পলাইন সাপোর্ট
                </h4>

                {/* Color Theme Presets */}
                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-1.5">
                    রিয়েল কালার থিম নির্বাচন করুন
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: '🌲 রয়্যাল এমারেল্ড', bg: '#12372A', badgeBg: '#FBFADA', text: '#FFFFFF', badgeText: '#12372A' },
                      { name: '🍷 ড্রাগন মেরুন', bg: '#831843', badgeBg: '#FCE7F3', text: '#FFFFFF', badgeText: '#831843' },
                      { name: '👑 লাক্সারি গোল্ড', bg: '#78350F', badgeBg: '#FEF3C7', text: '#FFFFFF', badgeText: '#78350F' },
                      { name: '🌌 মিডনাইট ব্ল্যাক', bg: '#0F172A', badgeBg: '#F1F5F9', text: '#FFFFFF', badgeText: '#0F172A' },
                      { name: '🔮 রয়েল পার্পল', bg: '#581C87', badgeBg: '#F3E8FF', text: '#FFFFFF', badgeText: '#581C87' },
                      { name: '🌊 ওশান নেভি', bg: '#1E3A8A', badgeBg: '#DBEAFE', text: '#FFFFFF', badgeText: '#1E3A8A' },
                    ].map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() =>
                          setAnnouncement({
                            ...announcement,
                            themeColor: theme.bg,
                            badgeBgColor: theme.badgeBg,
                            textColor: theme.text,
                            badgeTextColor: theme.badgeText,
                          })
                        }
                        className="p-2 rounded-xl text-left text-[11px] font-bold border transition-all hover:scale-[1.02]"
                        style={{
                          backgroundColor: theme.bg,
                          color: theme.text,
                          borderColor: announcement.themeColor === theme.bg ? '#F59E0B' : 'transparent',
                          borderWidth: announcement.themeColor === theme.bg ? '2px' : '1px',
                        }}
                      >
                        {theme.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ব্যানার ব্যাকগ্রাউন্ড</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={announcement.themeColor}
                        onChange={(e) => setAnnouncement({ ...announcement, themeColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={announcement.themeColor}
                        onChange={(e) => setAnnouncement({ ...announcement, themeColor: e.target.value })}
                        className="input input-xs input-bordered w-full font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">ব্যাজ ব্যাকগ্রাউন্ড</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={announcement.badgeBgColor}
                        onChange={(e) => setAnnouncement({ ...announcement, badgeBgColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={announcement.badgeBgColor}
                        onChange={(e) => setAnnouncement({ ...announcement, badgeBgColor: e.target.value })}
                        className="input input-xs input-bordered w-full font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Helpline Phone & WhatsApp */}
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-slate-700 text-xs">হেল্পলাইন ফোন</label>
                        <input
                          type="checkbox"
                          checked={announcement.showPhone}
                          onChange={(e) => setAnnouncement({ ...announcement, showPhone: e.target.checked })}
                          className="checkbox checkbox-xs checkbox-success"
                          title="ফোন নম্বর দেখান"
                        />
                      </div>
                      <input
                        type="text"
                        value={announcement.phoneNumber}
                        onChange={(e) => setAnnouncement({ ...announcement, phoneNumber: e.target.value })}
                        placeholder="01648439277"
                        className="input input-sm input-bordered w-full rounded-xl bg-slate-50 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold text-slate-700 text-xs">হোয়াটসঅ্যাপ নম্বর</label>
                        <input
                          type="checkbox"
                          checked={announcement.showWhatsapp}
                          onChange={(e) => setAnnouncement({ ...announcement, showWhatsapp: e.target.checked })}
                          className="checkbox checkbox-xs checkbox-success"
                          title="হোয়াটসঅ্যাপ বাটন দেখান"
                        />
                      </div>
                      <input
                        type="text"
                        value={announcement.whatsappNumber}
                        onChange={(e) => setAnnouncement({ ...announcement, whatsappNumber: e.target.value })}
                        placeholder="8801648439277"
                        className="input input-sm input-bordered w-full rounded-xl bg-slate-50 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Save CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAnnouncement}
                    disabled={savingAnnouncement}
                    className="btn btn-sm w-full bg-[#12372A] hover:bg-[#1a4a39] text-white font-bold rounded-xl gap-2 shadow-md"
                  >
                    <Save size={16} />
                    {savingAnnouncement ? 'সংরক্ষণ ও লাইভ আপডেট হচ্ছে...' : 'পরিবর্তন সংরক্ষণ ও লাইভ স্টোরে প্রকাশ করুন'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CATEGORIES & DELIVERY LOCATIONS MANAGEMENT */}
        {activeTab === 'categories_delivery' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header / Intro Banner */}
            <div className="card bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md border border-emerald-700/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <Layers size={16} /> স্টোর কনফিগারেশন হাব
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white">
                    ক্যাটাগরি ও ডেলিভারি লোকেশন কন্ট্রোল
                  </h2>
                  <p className="text-xs md:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                    আপনার অনলাইন স্টোরের সমস্ত পণ্য ক্যাটাগরি এবং চেকআউট ফর্মের ডেলিভারি লোকেশন, শিপিং চার্জ ও ডেলিভারির সময়সীমা এক জায়গা থেকেই সহজে যোগ, পরিবর্তন বা মুছে ফেলুন।
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center">
                    <div className="text-[10px] text-emerald-200 uppercase font-bold">মোট ক্যাটাগরি</div>
                    <div className="text-lg font-black text-white">{categories.length} টি</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-center">
                    <div className="text-[10px] text-emerald-200 uppercase font-bold">ডেলিভারি লোকেশন</div>
                    <div className="text-lg font-black text-amber-300">{deliveryLocations.length} টি</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Column Grid: Left Categories, Right Delivery Locations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ================= SECTION 1: PRODUCT CATEGORIES ================= */}
              <div className="space-y-6">
                <div className="card bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                        <Boxes size={18} />
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">পণ্য ক্যাটাগরি সমূহ</h3>
                        <p className="text-[11px] text-slate-500">স্টোরের ফিল্টার বার ও ড্রপডাউনে ব্যবহৃত হয়</p>
                      </div>
                    </div>
                    <span className="badge badge-sm badge-neutral font-mono">{categories.filter(c => c.isActive !== false).length} টি সক্রিয়</span>
                  </div>

                  {/* Add New Category Form */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Plus size={14} className="text-emerald-600" />
                      নতুন ক্যাটাগরি যোগ করুন
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">ক্যাটাগরির নাম *</label>
                        <input
                          type="text"
                          placeholder="যেমন: লেডিস ব্যাগ, থ্রি-পিস"
                          value={newCatName}
                          onChange={(e) => {
                            setNewCatName(e.target.value);
                            setNewCatId(makeSlug(e.target.value, 'cat'));
                          }}
                          className="input input-sm input-bordered w-full rounded-xl bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">স্লাগ / ইউনিক আইডি</label>
                        <input
                          type="text"
                          placeholder="auto-generated-slug"
                          value={newCatId}
                          onChange={(e) => setNewCatId(e.target.value)}
                          className="input input-sm input-bordered w-full rounded-xl bg-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="label cursor-pointer gap-2 py-0">
                        <input
                          type="checkbox"
                          checked={newCatActive}
                          onChange={(e) => setNewCatActive(e.target.checked)}
                          className="checkbox checkbox-xs checkbox-primary"
                        />
                        <span className="label-text text-xs font-medium text-slate-700">সক্রিয় (Active) রাখুন</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={savingCategories || !newCatName.trim()}
                        className="btn btn-xs bg-[#12372A] hover:bg-[#1a4a39] text-white rounded-lg gap-1 px-3 shadow-xs font-bold"
                      >
                        <Plus size={13} /> ক্যাটাগরি যোগ করুন
                      </button>
                    </div>
                  </div>

                  {/* Category List / Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="table table-sm w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th>ক্যাটাগরির নাম ও আইডি</th>
                          <th className="text-center">প্রোডাক্ট</th>
                          <th className="text-center">স্ট্যাটাস</th>
                          <th className="text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {categories.map((cat) => {
                          const isEditing = editingCatId === cat.id;
                          const prodCount = products.filter((p) => p.category === cat.name).length;
                          const isActive = cat.isActive !== false;

                          if (isEditing) {
                            return (
                              <tr key={cat.id} className="bg-amber-50/60">
                                <td colSpan={4} className="p-3">
                                  <div className="space-y-2">
                                    <div className="text-xs font-bold text-slate-800">ক্যাটাগরি সম্পাদনা: {cat.name}</div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <input
                                        type="text"
                                        value={editCatName}
                                        onChange={(e) => setEditCatName(e.target.value)}
                                        className="input input-xs input-bordered flex-1 rounded-lg bg-white text-xs"
                                        placeholder="ক্যাটাগরি নাম"
                                      />
                                      <label className="label cursor-pointer gap-1.5 py-0">
                                        <input
                                          type="checkbox"
                                          checked={editCatActive}
                                          onChange={(e) => setEditCatActive(e.target.checked)}
                                          className="checkbox checkbox-xs checkbox-primary"
                                        />
                                        <span className="label-text text-xs">সক্রিয়</span>
                                      </label>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingCatId(null)}
                                        className="btn btn-xs btn-ghost rounded-lg"
                                      >
                                        বাতিল
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCategory(cat.id)}
                                        disabled={savingCategories}
                                        className="btn btn-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold gap-1"
                                      >
                                        <Save size={12} /> সংরক্ষণ করুন
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="font-medium text-slate-800">
                                <div className="font-bold text-xs text-slate-900">{cat.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{cat.id}</div>
                              </td>
                              <td className="text-center">
                                <span className="badge badge-xs badge-ghost text-slate-700 font-bold px-2 py-1">
                                  {prodCount} টি
                                </span>
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCategoryActive(cat.id)}
                                  className={`badge badge-xs font-bold cursor-pointer transition-transform hover:scale-105 ${
                                    isActive
                                      ? 'badge-success text-white'
                                      : 'badge-ghost text-slate-400 line-through'
                                  }`}
                                  title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                                >
                                  {isActive ? 'Active' : 'Inactive'}
                                </button>
                              </td>
                              <td className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCatId(cat.id);
                                      setEditCatName(cat.name);
                                      setEditCatActive(cat.isActive !== false);
                                    }}
                                    className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 p-1 rounded-lg"
                                    title="সম্পাদনা করুন"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat)}
                                    className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 p-1 rounded-lg"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>পরিবর্তনগুলো তাৎক্ষণিকভাবে ক্লাউড ডাটাবেজে ও লাইভ স্টোরে সিঙ্ক হয়ে যায়।</span>
                    <button
                      type="button"
                      onClick={() => handleSaveCategories(categories)}
                      disabled={savingCategories}
                      className="btn btn-xs btn-outline btn-neutral rounded-lg gap-1"
                    >
                      <RefreshCw size={12} className={savingCategories ? 'animate-spin' : ''} />
                      {savingCategories ? 'সিঙ্ক হচ্ছে...' : 'পুনরায় সিঙ্ক করুন'}
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 2: DELIVERY LOCATIONS & CHARGES ================= */}
              <div className="space-y-6">
                <div className="card bg-white p-5 md:p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                        <Truck size={18} />
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">ডেলিভারি লোকেশন ও শিপিং চার্জ</h3>
                        <p className="text-[11px] text-slate-500">চেকআউট ফর্মে গ্রাহকদের পছন্দের জন্য অপশন</p>
                      </div>
                    </div>
                    <span className="badge badge-sm badge-neutral font-mono">{deliveryLocations.filter(l => l.isActive !== false).length} টি সক্রিয়</span>
                  </div>

                  {/* Add New Delivery Location Form */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Plus size={14} className="text-emerald-600" />
                      নতুন ডেলিভারি লোকেশন যোগ করুন
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">লোকেশন নাম *</label>
                        <input
                          type="text"
                          placeholder="যেমন: ঢাকার ভিতরে, সাভার/গাজীপুর"
                          value={newLocName}
                          onChange={(e) => {
                            setNewLocName(e.target.value);
                            setNewLocId(makeSlug(e.target.value, 'loc'));
                          }}
                          className="input input-sm input-bordered w-full rounded-xl bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">আইডি (ইউনিক কী)</label>
                        <input
                          type="text"
                          placeholder="inside_dhaka, sub_dhaka"
                          value={newLocId}
                          onChange={(e) => setNewLocId(e.target.value)}
                          className="input input-sm input-bordered w-full rounded-xl bg-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">ডেলিভারি চার্জ (৳) *</label>
                        <input
                          type="number"
                          placeholder="70"
                          value={newLocFee}
                          onChange={(e) => setNewLocFee(Number(e.target.value))}
                          className="input input-sm input-bordered w-full rounded-xl bg-white text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">আনুমানিক সময়সীমা</label>
                        <input
                          type="text"
                          placeholder="যেমন: ২৪-৪৮ ঘণ্টা, ২-৩ দিন"
                          value={newLocTime}
                          onChange={(e) => setNewLocTime(e.target.value)}
                          className="input input-sm input-bordered w-full rounded-xl bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-3">
                        <label className="label cursor-pointer gap-1.5 py-0">
                          <input
                            type="checkbox"
                            checked={newLocDefault}
                            onChange={(e) => setNewLocDefault(e.target.checked)}
                            className="checkbox checkbox-xs checkbox-warning"
                          />
                          <span className="label-text text-xs font-semibold text-slate-700">ডিফল্ট সিলেক্টেড</span>
                        </label>
                        <label className="label cursor-pointer gap-1.5 py-0">
                          <input
                            type="checkbox"
                            checked={newLocActive}
                            onChange={(e) => setNewLocActive(e.target.checked)}
                            className="checkbox checkbox-xs checkbox-primary"
                          />
                          <span className="label-text text-xs font-medium text-slate-700">সক্রিয়</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddDeliveryLocation}
                        disabled={savingLocations || !newLocName.trim()}
                        className="btn btn-xs bg-[#12372A] hover:bg-[#1a4a39] text-white rounded-lg gap-1 px-3 shadow-xs font-bold"
                      >
                        <Plus size={13} /> লোকেশন যোগ করুন
                      </button>
                    </div>
                  </div>

                  {/* Delivery Location List / Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="table table-sm w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th>লোকেশন ও আইডি</th>
                          <th className="text-center">চার্জ</th>
                          <th className="text-center">সময়</th>
                          <th className="text-center">ডিফল্ট</th>
                          <th className="text-center">স্ট্যাটাস</th>
                          <th className="text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {deliveryLocations.map((loc) => {
                          const isEditing = editingLocId === loc.id;
                          const isActive = loc.isActive !== false;

                          if (isEditing) {
                            return (
                              <tr key={loc.id} className="bg-amber-50/60">
                                <td colSpan={6} className="p-3">
                                  <div className="space-y-2">
                                    <div className="text-xs font-bold text-slate-800">লোকেশন সম্পাদনা: {loc.name}</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">নাম</label>
                                        <input
                                          type="text"
                                          value={editLocName}
                                          onChange={(e) => setEditLocName(e.target.value)}
                                          className="input input-xs input-bordered w-full rounded-lg bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">চার্জ (৳)</label>
                                        <input
                                          type="number"
                                          value={editLocFee}
                                          onChange={(e) => setEditLocFee(Number(e.target.value))}
                                          className="input input-xs input-bordered w-full rounded-lg bg-white font-bold"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block">সময়</label>
                                        <input
                                          type="text"
                                          value={editLocTime}
                                          onChange={(e) => setEditLocTime(e.target.value)}
                                          className="input input-xs input-bordered w-full rounded-lg bg-white"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                      <div className="flex items-center gap-3">
                                        <label className="label cursor-pointer gap-1 py-0">
                                          <input
                                            type="checkbox"
                                            checked={editLocDefault}
                                            onChange={(e) => setEditLocDefault(e.target.checked)}
                                            className="checkbox checkbox-xs checkbox-warning"
                                          />
                                          <span className="label-text text-xs">ডিফল্ট রাখুন</span>
                                        </label>
                                        <label className="label cursor-pointer gap-1 py-0">
                                          <input
                                            type="checkbox"
                                            checked={editLocActive}
                                            onChange={(e) => setEditLocActive(e.target.checked)}
                                            className="checkbox checkbox-xs checkbox-primary"
                                          />
                                          <span className="label-text text-xs">সক্রিয়</span>
                                        </label>
                                      </div>
                                      <div className="flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setEditingLocId(null)}
                                          className="btn btn-xs btn-ghost rounded-lg"
                                        >
                                          বাতিল
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateDeliveryLocation(loc.id)}
                                          disabled={savingLocations}
                                          className="btn btn-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold gap-1"
                                        >
                                          <Save size={12} /> সংরক্ষণ করুন
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={loc.id} className="hover:bg-slate-50/70 transition-colors">
                              <td>
                                <div className="font-bold text-xs text-slate-900">{loc.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{loc.id}</div>
                              </td>
                              <td className="text-center">
                                <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  {loc.fee === 0 ? 'ফ্রি (৳০)' : `৳${loc.fee}`}
                                </span>
                              </td>
                              <td className="text-center text-slate-600 text-[11px]">
                                {loc.time || '—'}
                              </td>
                              <td className="text-center">
                                {loc.isDefault ? (
                                  <span className="badge badge-xs badge-warning text-slate-900 font-extrabold uppercase text-[9px] px-2 py-0.5 shadow-xs">
                                    DEFAULT
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetDefaultLocation(loc.id)}
                                    className="text-[10px] text-slate-400 hover:text-emerald-700 underline cursor-pointer"
                                    title="ডিফল্ট হিসেবে সেট করুন"
                                  >
                                    ডিফল্ট করুন
                                  </button>
                                )}
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleDeliveryLocationActive(loc.id)}
                                  className={`badge badge-xs font-bold cursor-pointer transition-transform hover:scale-105 ${
                                    isActive
                                      ? 'badge-success text-white'
                                      : 'badge-ghost text-slate-400 line-through'
                                  }`}
                                  title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                                >
                                  {isActive ? 'Active' : 'Inactive'}
                                </button>
                              </td>
                              <td className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLocId(loc.id);
                                      setEditLocName(loc.name);
                                      setEditLocFee(loc.fee);
                                      setEditLocTime(loc.time || '');
                                      setEditLocDefault(Boolean(loc.isDefault));
                                      setEditLocActive(loc.isActive !== false);
                                    }}
                                    className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 p-1 rounded-lg"
                                    title="সম্পাদনা করুন"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDeliveryLocation(loc)}
                                    className="btn btn-ghost btn-xs text-rose-600 hover:bg-rose-50 p-1 rounded-lg"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>কাস্টমার চেকআউট ফর্মে এই অপশন ও চার্জ লাইভ দেখতে পাবে।</span>
                    <button
                      type="button"
                      onClick={() => handleSaveDeliveryLocations(deliveryLocations)}
                      disabled={savingLocations}
                      className="btn btn-xs btn-outline btn-neutral rounded-lg gap-1"
                    >
                      <RefreshCw size={12} className={savingLocations ? 'animate-spin' : ''} />
                      {savingLocations ? 'সিঙ্ক হচ্ছে...' : 'পুনরায় সিঙ্ক করুন'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div className="card bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Settings size={20} className="text-emerald-700" />
                ImageBB ও ডাটাবেজ কনফিগারেশন
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  ImageBB API Key (ইমেজ আপলোডের জন্য)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={imgbbApiKey}
                    onChange={(e) => setImgbbApiKey(e.target.value)}
                    placeholder="আপনার ImageBB API Key দিন"
                    className="input input-sm input-bordered flex-1 rounded-xl font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('imgbb_api_key', imgbbApiKey.trim());
                        showToast('✅ ImageBB API Key লোকাল স্টোরেজে সেভ হয়েছে!');
                      }}
                      className="btn btn-sm bg-[#12372A] hover:bg-[#1a4a39] text-white rounded-xl gap-1 shrink-0"
                    >
                      <Save size={14} /> সেভ করুন
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const keyToTest = imgbbApiKey.trim();
                        if (!keyToTest) {
                          showToast('⚠️ অনুগ্রহ করে প্রথমে একটি ImageBB API Key লিখুন');
                          return;
                        }
                        showToast('🔄 ImageBB কী যাচাই করা হচ্ছে...');
                        try {
                          const directForm = new FormData();
                          directForm.append('image', 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
                          const res = await fetch(`https://api.imgbb.com/1/upload?key=${keyToTest}`, {
                            method: 'POST',
                            body: directForm,
                          });
                          const data = await res.json();
                          if (data.success) {
                            showToast('✅ দারুণ! আপনার ImageBB API Key সম্পূর্ণ সক্রিয় ও কার্যকর!');
                          } else {
                            showToast('❌ কী অকার্যকর: ' + (data.error?.message || 'Invalid API v1 key'));
                          }
                        } catch (err: any) {
                          showToast('❌ যাচাই এরর: ' + err.message);
                        }
                      }}
                      className="btn btn-sm btn-outline rounded-xl text-emerald-700 gap-1 shrink-0"
                    >
                      কী টেস্ট করুন
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  বিনামূল্যে আপনার নিজস্ব API Key পেতে <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">api.imgbb.com</a> ভিজিট করে ১-ক্লিকে "Get API key" বাটনে ক্লিক করুন।
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-800 text-sm mb-2">MongoDB Atlas ক্লাস্টার স্ট্যাটাস</h4>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
                  <p><span className="text-slate-500">ক্লাস্টার:</span> cluster0.avzil94.mongodb.net</p>
                  <p><span className="text-slate-500">ইউজারনেম:</span> SHop1DB</p>
                  <p><span className="text-slate-500">কানেকশন অবস্থা:</span> <strong className="text-emerald-600">Active & Connected</strong></p>
                </div>
              </div>
            </div>

            {/* Steadfast Courier Configuration Card */}
            <div className="card bg-white p-6 rounded-2xl shadow-xs border border-purple-200 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center shadow-sm">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Steadfast Courier (Street Fast) ইন্টিগ্রেশন</h3>
                    <p className="text-xs text-purple-700">অটোমেটিক পার্সেল বুকিং, ট্র্যাকিং ও COD কালেকশন</p>
                  </div>
                </div>
                <span className="badge badge-sm bg-emerald-600 text-white font-bold text-[10px]">
                  সক্রিয় ও কানেক্টেড 🟢
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
                  <span className="text-slate-500 text-[11px] block">কুরিয়ার ব্যালেন্স:</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-black text-xl text-purple-950">৳{courierBalance ?? 0}</span>
                    <button
                      type="button"
                      onClick={handleRefreshCourierBalance}
                      disabled={fetchingBalance}
                      className="btn btn-xs bg-white text-purple-800 border-purple-200 hover:bg-purple-100 rounded-lg gap-1"
                    >
                      {fetchingBalance ? <span className="loading loading-spinner loading-xs"></span> : <RefreshCw size={11} />}
                      রিফ্রেশ
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                  <p><span className="text-slate-500">API Portal:</span> <a href="https://portal.packzy.com" target="_blank" rel="noreferrer" className="text-purple-700 underline font-semibold">portal.packzy.com</a></p>
                  <p><span className="text-slate-500">API Key:</span> 6ibojlrm...dfg2n3</p>
                  <p><span className="text-slate-500">Secret Key:</span> jnmvuiqf...zuc8</p>
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <a
                  href="https://portal.packzy.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline border-purple-300 text-purple-800 hover:bg-purple-50 rounded-xl gap-1 text-xs"
                >
                  <ExternalLink size={13} /> Steadfast মার্চেন্ট পোর্টালে লগইন
                </a>
                <button
                  type="button"
                  onClick={handleRefreshCourierBalance}
                  className="btn btn-sm bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl gap-1 text-xs"
                >
                  <RefreshCw size={13} /> কানেকশন টেস্ট
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT PRODUCT WITH IMGBB UPLOAD                    */}
      {/* ------------------------------------------------------------- */}
      {isProductModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl bg-white text-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <Boxes className="text-emerald-700" size={20} />
                {editingProduct ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট আপলোড করুন'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">প্রোডাক্টের নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="যেমন: প্রিমিয়াম জর্জেট পার্টি থ্রি-পিস"
                    className="input input-sm input-bordered w-full rounded-xl bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ইংলিশ টাইটেল (English Title)</label>
                  <input
                    type="text"
                    value={formEnglishTitle}
                    onChange={(e) => setFormEnglishTitle(e.target.value)}
                    placeholder="Exclusive Party Three-Piece"
                    className="input input-sm input-bordered w-full rounded-xl bg-slate-50 text-xs"
                  />
                </div>
              </div>

              {/* Category, Prices & Stock */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ক্যাটাগরি</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="select select-sm select-bordered w-full rounded-xl bg-slate-50 text-xs font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name} {c.isActive === false ? '(নিষ্ক্রিয়)' : ''}
                      </option>
                    ))}
                    {!categories.some((c) => c.name === formCategory) && (
                      <option value={formCategory}>{formCategory}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">রেগুলার মূল্য (৳)</label>
                  <input
                    type="number"
                    value={formRegularPrice}
                    onChange={(e) => setFormRegularPrice(Number(e.target.value))}
                    className="input input-sm input-bordered w-full rounded-xl bg-slate-50 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">অফার মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    value={formSalePrice}
                    onChange={(e) => setFormSalePrice(Number(e.target.value))}
                    className="input input-sm input-bordered w-full rounded-xl bg-slate-50 font-bold text-emerald-700 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">স্টক পরিমাণ (পিস)</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="input input-sm input-bordered w-full rounded-xl bg-slate-50 text-xs"
                  />
                </div>
              </div>

              {/* MULTIPLE PRODUCT PICTURES & GALLERY */}
              <div className="space-y-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <UploadCloud size={16} className="text-emerald-700" />
                    প্রোডাক্টের ছবিসমূহ / গ্যালারি (একাধিক ছবি যোগ করুন)
                    {formImages.length > 0 && (
                      <span className="badge badge-sm bg-emerald-100 text-emerald-800 border-emerald-200 font-bold">
                        {formImages.length}টি ছবি
                      </span>
                    )}
                  </label>
                  <span className="badge badge-success badge-xs text-white font-medium py-1 px-2 gap-1">
                    <CheckCircle2 size={10} /> ImageBB ক্লাউড অটো-আপলোড
                  </span>
                </div>

                {/* Hidden Multi-file input for product images */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleMultiImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />

                {/* Hidden Single-file input for color variant picture */}
                <input
                  type="file"
                  ref={variantFileInputRef}
                  accept="image/*"
                  onChange={handleVariantImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />

                {/* Upload Dropzone */}
                <div
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1.5 ${
                    uploadingImage
                      ? 'border-emerald-400 bg-emerald-50/50 cursor-wait'
                      : 'border-slate-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/20'
                  }`}
                >
                  {uploadingImage ? (
                    <div className="py-2 flex flex-col items-center gap-1">
                      <Loader2 size={24} className="animate-spin text-emerald-700" />
                      <div className="text-xs font-bold text-slate-800">ছবি আপলোড হচ্ছে...</div>
                      <p className="text-[10px] text-slate-500">ImageBB ক্লাউডে সুরক্ষিতভাবে সংরক্ষণ করা হচ্ছে</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                        <UploadCloud size={20} />
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        {formImages.length > 0 ? '+ আরও ছবি যোগ করতে ক্লিক করুন' : 'ছবি আপলোড করতে ক্লিক করুন (একসাথে একাধিক ফাইল নির্বাচন করা যাবে)'}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        কম্পিউটার বা মোবাইল থেকে ছবি সিলেক্ট করলেই স্বয়ংক্রিয়ভাবে আপলোড হবে (JPG, PNG, WEBP)
                      </p>
                    </>
                  )}
                </div>

                {/* Uploaded Images Gallery Grid */}
                {formImages.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>আপলোডকৃত ছবিসমূহ: (প্রথম ছবিটি কভার হিসেবে দেখাবে)</span>
                      <span className="text-[10px] text-slate-400">ড্রপডাউনে ক্লিক করে কভার সেট করতে পারেন</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {formImages.map((imgUrl, i) => (
                        <div
                          key={i}
                          className={`relative group rounded-xl overflow-hidden border bg-white shadow-2xs transition-all ${
                            i === 0
                              ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <div className="aspect-square relative w-full bg-slate-100">
                            <img
                              src={imgUrl}
                              alt={`Product ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = '/banner.jpeg';
                              }}
                            />

                            {/* Cover Badge */}
                            {i === 0 && (
                              <span className="absolute top-1.5 left-1.5 bg-emerald-700 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                                ★ কভার
                              </span>
                            )}

                            {/* Delete button top right */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(i);
                              }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                              title="ছবিটি মুছে ফেলুন"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Action Footer */}
                          <div className="p-1 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-mono">#{i + 1}</span>
                            {i !== 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(i)}
                                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                              >
                                কভার বানান
                              </button>
                            ) : (
                              <span className="text-emerald-700 font-bold">মূল ছবি</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapsible Manual URL paste option */}
                <div className="pt-1">
                  {!showManualUrl ? (
                    <button
                      type="button"
                      onClick={() => setShowManualUrl(true)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>🔗 সরাসরি কোনো ইমেজ লিংক (URL) পেস্ট করে যোগ করতে চান?</span>
                    </button>
                  ) : (
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">
                          সরাসরি ইমেজ লিংক (URL পেস্ট করুন, একাধিক লিংক কমা বা নতুন লাইনে দিতে পারেন):
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowManualUrl(false)}
                          className="text-[10px] text-slate-500 hover:text-slate-800"
                        >
                          লুকান ✕
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          value={manualUrlInput}
                          onChange={(e) => setManualUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddManualUrl();
                            }
                          }}
                          placeholder="https://i.ibb.co/example/photo.jpg"
                          className="input input-xs input-bordered flex-1 rounded-lg bg-white font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={handleAddManualUrl}
                          className="btn btn-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg px-3"
                        >
                          + যোগ করুন
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COLOR VARIANTS BUILDER WITH COLOR-SPECIFIC PICTURES */}
              <div className="space-y-2 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Palette size={16} className="text-emerald-700" />
                      কালার ভেরিয়েন্ট ও ছবি (Multiple Colors & Pictures)
                      <span className="badge badge-sm bg-slate-200 text-slate-800 font-bold">
                        {formVariants.length}টি কালার
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      প্রতিটি কালারের জন্য আলাদা ছবি নির্বাচন বা আপলোড করতে পারবেন
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewColorVariant}
                    className="btn btn-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg gap-1 font-bold shadow-2xs"
                    title="স্বয়ংক্রিয় নামসহ নতুন কালার যোগ করুন"
                  >
                    <Plus size={12} /> কালার যোগ করুন
                  </button>
                </div>

                {/* Quick Popular Color Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-500 font-medium">ক্লিক করে দ্রুত কালার যোগ করুন:</span>
                  {[
                    { name: 'রয়েল ব্লু', code: '#1E3A8A' },
                    { name: 'রক্তিম লাল', code: '#DC2626' },
                    { name: 'এমারেল্ড গ্রিন', code: '#065F46' },
                    { name: 'ম্যাট ব্ল্যাক', code: '#18181B' },
                    { name: 'মেরুন', code: '#831843' },
                    { name: 'রানি গোলাপি', code: '#EC4899' },
                    { name: 'সাদা', code: '#FFFFFF' },
                    { name: 'আকাশি নীল', code: '#0284C7' },
                    { name: 'সোনালী হলুদ', code: '#FACC15' },
                    { name: 'কফি ব্রাউন', code: '#78350F' },
                    { name: 'গাঢ় বেগুনি', code: '#581C87' },
                    { name: 'কমলা', code: '#EA580C' },
                  ].map((preset) => {
                    const isAdded = formVariants.some(
                      (v) => v.colorCode.toLowerCase() === preset.code.toLowerCase()
                    );
                    return (
                      <button
                        key={preset.code}
                        type="button"
                        disabled={isAdded}
                        onClick={() => {
                          const autoName = getSmartColorName(preset.code);
                          setFormVariants((prev) => [
                            ...prev,
                            {
                              name: autoName,
                              colorCode: preset.code,
                              stock: Number(formStock) || 10,
                              image: '',
                              images: [],
                            },
                          ]);
                          showToast(`✅ "${autoName}" কালার যোগ করা হয়েছে!`);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-all ${
                          isAdded
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                            : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-2xs cursor-pointer'
                        }`}
                        title={isAdded ? 'ইতিমধ্যে যোগ করা হয়েছে' : `+ ${preset.name} যোগ করুন`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                          style={{ backgroundColor: preset.code }}
                        ></span>
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto p-1 pr-1.5 custom-scrollbar">
                  {formVariants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2"
                    >
                      {/* Top Row: Color swatch, name, stock, delete */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Color Picker input */}
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="color"
                            value={v.colorCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              const autoName = getSmartColorName(val);
                              setFormVariants((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, colorCode: val, name: autoName } : item
                                )
                              );
                            }}
                            className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs hover:scale-105 transition-transform"
                            title="কালার নির্বাচন করুন (নাম স্বয়ংক্রিয়ভাবে বসে যাবে)"
                          />
                        </div>

                        {/* Variant Name */}
                        <div className="flex items-center gap-1 flex-1 min-w-[170px]">
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormVariants((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                              );
                            }}
                            placeholder="কালারের নাম (e.g. রয়েল ব্লু, লাল, কালো)"
                            className="input input-xs input-bordered flex-1 rounded-lg text-xs font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const autoName = getSmartColorName(v.colorCode);
                              setFormVariants((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, name: autoName } : item))
                              );
                            }}
                            className="text-[9px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-1 rounded font-bold shrink-0 transition-colors"
                            title="কালার অনুযায়ী স্বয়ংক্রিয় নাম সেট করুন"
                          >
                            অটো-নাম
                          </button>
                        </div>

                        {/* Variant Stock */}
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] text-slate-500 font-medium">স্টক:</span>
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setFormVariants((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, stock: val } : item))
                              );
                            }}
                            placeholder="স্টক"
                            className="input input-xs input-bordered w-16 rounded-lg text-xs font-mono text-center"
                          />
                        </div>

                        {/* Delete variant */}
                        <button
                          type="button"
                          onClick={() => setFormVariants((prev) => prev.filter((_, i) => i !== idx))}
                          className="btn btn-xs btn-ghost btn-circle text-rose-500 hover:bg-rose-50"
                          title="এই কালারটি মুছে ফেলুন"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Bottom Row: Color Picture Preview & Selector */}
                      <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-600">কালারের ছবি:</span>
                          {v.image ? (
                            <div className="flex items-center gap-2">
                              <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-emerald-500 shadow-2xs shrink-0 bg-slate-50">
                                <img
                                  src={v.image}
                                  alt={v.name}
                                  className="w-full h-full object-cover"
                                  onError={(e: any) => {
                                    e.target.onerror = null;
                                    e.target.src = '/banner.jpeg';
                                  }}
                                />
                              </div>
                              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                ✓ ছবি যুক্ত হয়েছে
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormVariants((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, image: '', images: [] } : item))
                                  )
                                }
                                className="text-[10px] text-rose-600 hover:text-rose-800 hover:underline font-bold"
                              >
                                ছবি রিমুভ ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">কোনো ছবি সেট করা নেই</span>
                          )}
                        </div>

                        {/* Action buttons to assign image */}
                        <div className="flex items-center gap-1.5">
                          {/* Upload image specifically for this color */}
                          <button
                            type="button"
                            onClick={() => {
                              setVariantUploadIdx(idx);
                              variantFileInputRef.current?.click();
                            }}
                            className="btn btn-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg gap-1 font-semibold text-[10px]"
                            title="ডিভাইস থেকে এই কালারের ছবি আপলোড করুন"
                          >
                            <UploadCloud size={11} className="text-emerald-700" />
                            {v.image ? 'ছবি পরিবর্তন' : 'ছবি আপলোড'}
                          </button>

                          {/* Pick from product gallery images if any exist */}
                          {formImages.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setOpenGalleryPickerIdx(openGalleryPickerIdx === idx ? null : idx)}
                              className={`btn btn-xs rounded-lg gap-1 font-semibold text-[10px] ${
                                openGalleryPickerIdx === idx
                                  ? 'bg-emerald-700 text-white border-0'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                              title="প্রোডাক্ট গ্যালারিতে থাকা ছবিগুলো থেকে বেছে নিন"
                            >
                              <Layers size={11} />
                              গ্যালারি থেকে বেছে নিন
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Gallery Picker for this variant */}
                      {openGalleryPickerIdx === idx && formImages.length > 0 && (
                        <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1.5 animate-fade-in">
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900">
                            <span>নিচের ছবিগুলোর মধ্যে যেটি "{v.name}" কালারের সেটিতে ক্লিক করুন:</span>
                            <button
                              type="button"
                              onClick={() => setOpenGalleryPickerIdx(null)}
                              className="text-slate-500 hover:text-slate-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {formImages.map((imgUrl, gIdx) => (
                              <button
                                key={gIdx}
                                type="button"
                                onClick={() => handleAssignGalleryImageToVariant(idx, imgUrl)}
                                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-transform hover:scale-105 ${
                                  v.image === imgUrl
                                    ? 'border-emerald-600 ring-2 ring-emerald-500'
                                    : 'border-slate-300 hover:border-emerald-500'
                                }`}
                                title={`ছবি #${gIdx + 1} সিলেক্ট করুন`}
                              >
                                <img src={imgUrl} alt="Gallery" className="w-full h-full object-cover" />
                                {v.image === imgUrl && (
                                  <span className="absolute inset-0 bg-emerald-700/40 flex items-center justify-center text-white font-bold text-xs">
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {formVariants.length === 0 && (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-400 text-xs italic">
                      কোনো কালার ভেরিয়েন্ট নেই। উপরের "+ কালার যোগ করুন" বাটনে ক্লিক করে যোগ করুন।
                    </div>
                  )}
                </div>
              </div>

              {/* Sizes and Available Options */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                      <Layers size={14} className="text-emerald-700" />
                      <span>উপলব্ধ সাইজ (কমা দিয়ে লিখুন) *</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      একাধিক সাইজ যোগ করতে কমা (,) দিয়ে লিখুন। যেমন: <span className="font-mono text-emerald-800 font-semibold">Free Size, M, L, XL</span> অথবা <span className="font-mono text-emerald-800 font-semibold">18 Inches, 20 Inches</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-sm bg-emerald-100 text-emerald-800 font-bold border-0">
                      {formSizes.split(',').map((s) => s.trim()).filter(Boolean).length}টি সাইজ অন্তর্ভুক্ত
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadLuggageDemo}
                      className="btn btn-xs bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold gap-1"
                      title="১৮-ইঞ্চি লাগেজ ডেমোর বিস্তারিত, স্পেসিফিকেশন ও ফিচার পূরণ করুন"
                    >
                      <Sparkles size={12} className="text-amber-700" />
                      লাগেজ ডেমো
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={formSizes}
                    onChange={(e) => setFormSizes(e.target.value)}
                    placeholder="উপলব্ধ সাইজ লিখুন (যেমন: Free Size, M, L, XL, XXL অথবা 18 Inches, 20 Inches)"
                    className="input input-sm input-bordered w-full rounded-xl bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
                  />
                </div>

                {/* Active Sizes as Chips */}
                {formSizes.split(',').map((s) => s.trim()).filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 mr-1">বর্তমান সাইজ:</span>
                    {formSizes.split(',').map((s) => s.trim()).filter(Boolean).map((sz, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 font-bold text-xs shadow-2xs group"
                      >
                        <span>{sz}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = formSizes.split(',').map((s) => s.trim()).filter(Boolean);
                            const updated = list.filter((_, i) => i !== idx);
                            setFormSizes(updated.join(', '));
                          }}
                          className="w-4 h-4 rounded-full bg-slate-100 group-hover:bg-red-100 group-hover:text-red-700 text-slate-500 inline-flex items-center justify-center text-[10px] font-black transition-colors"
                          title="এই সাইজটি মুছে ফেলুন"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormSizes('')}
                      className="text-[10px] text-red-600 hover:text-red-800 font-semibold underline ml-1 cursor-pointer"
                    >
                      সব মুছুন
                    </button>
                  </div>
                )}

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">ক্লিক করে সাইজ যোগ/বাদ দিন:</span>
                  {[
                    'Free Size',
                    'S',
                    'M',
                    'L',
                    'XL',
                    'XXL',
                    '3XL',
                    '18 Inches',
                    '20 Inches',
                    '24 Inches',
                    '28 Inches',
                    'Standard',
                  ].map((preset) => {
                    const currentList = formSizes.split(',').map((s) => s.trim()).filter(Boolean);
                    const isSelected = currentList.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormSizes(currentList.filter((s) => s !== preset).join(', '));
                          } else {
                            const trimmed = formSizes.trim().replace(/,\s*$/, '');
                            setFormSizes(trimmed ? `${trimmed}, ${preset}` : preset);
                          }
                        }}
                        className={`px-2 py-0.5 text-[11px] rounded-md border font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isSelected ? `✓ ${preset}` : `+ ${preset}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description / বিস্তারিত বিবরণ */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>বিস্তারিত বিবরণ (Product Description) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">পণ্যটির বিস্তারিত পরিচিতি ও সারসংক্ষেপ</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="যেমন: ভ্রমণের জন্য ছোট, হালকা ও ব্যবহার উপযোগী লাগেজ খুঁজছেন? আমাদের 18-Inch Cabin Luggage হতে পারে আপনার জন্য উপযুক্ত পছন্দ..."
                  className="textarea textarea-bordered w-full rounded-xl bg-slate-50 text-xs leading-relaxed"
                ></textarea>
              </div>

              {/* Key Features / স্পেসিফিকেশন (Key-Value Specifications) */}
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-700" />
                      Key Features / স্পেসিফিকেশন (কী-ভ্যালু পেয়ার)
                    </h4>
                    <p className="text-[10px] text-slate-500">যেমন: Size: 18 Inches, Weight: 2 kg, Warranty: 2 Years ইত্যাদি</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFormSpecs((prev) => [
                          ...prev,
                          { key: '', value: '' },
                        ])
                      }
                      className="btn btn-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg gap-1 font-bold"
                    >
                      <Plus size={12} /> স্পেক্স রো যোগ করুন
                    </button>
                  </div>
                </div>

                {/* Specs List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {formSpecs.map((sp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="কী (e.g. Size, Warranty, Wheels)"
                        value={sp.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSpecs((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, key: val } : item))
                          );
                        }}
                        className="input input-xs input-bordered w-1/3 rounded-lg bg-white text-xs font-medium"
                      />
                      <input
                        type="text"
                        placeholder="মান (e.g. 18 Inches, 2 Years, 360° Spinner)"
                        value={sp.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormSpecs((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, value: val } : item))
                          );
                        }}
                        className="input input-xs input-bordered flex-1 rounded-lg bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setFormSpecs((prev) => prev.filter((_, i) => i !== idx))}
                        className="btn btn-xs btn-ghost btn-circle text-rose-500 hover:bg-rose-50"
                        title="মুছে ফেলুন"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {formSpecs.length === 0 && (
                    <div className="text-[11px] text-slate-400 italic py-1 text-center">
                      কোনো স্পেসিফিকেশন রো যোগ করা হয়নি। উপরের বাটনে ক্লিক করে যোগ করুন।
                    </div>
                  )}
                </div>
              </div>

              {/* Why Choose This / প্রধান সুবিধাসমূহ (Features / Highlights) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 text-xs block">
                    Why Choose This / প্রধান সুবিধাসমূহ (প্রতি লাইনে একটি করে বুলেট লিখুন)
                  </label>
                  <span className="text-[10px] text-slate-400">Enter দিয়ে নতুন বুলেট পয়েন্ট তৈরি করুন</span>
                </div>
                <textarea
                  rows={4}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  placeholder={`Compact design for convenient travel.\nLightweight body for easy handling.\n360° spinner wheels for smooth movement.\nBuilt-in number lock for added convenience.\nSuitable for solo travelers and short trips.\nAvailable in 6 attractive colors to match your style.`}
                  className="textarea textarea-bordered w-full rounded-xl bg-slate-50 text-xs leading-relaxed font-sans"
                ></textarea>
              </div>

              {/* Quick Text Auto-Parser Assistant */}
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                  <span>📋 টেক্সট পেস্ট করে অটো-পার্সিং অ্যাসিস্ট্যান্ট:</span>
                  <span className="text-[10px] text-amber-700 font-normal">যেকোনো ডেমো টেক্সট নিচে পেস্ট করে ক্লিক করুন</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="rawDemoPasteInput"
                    placeholder="যেমন: Size: 18 Inches / 360° spinner wheels ইত্যাদি টেক্সট দিন"
                    className="input input-xs input-bordered flex-1 rounded-lg bg-white text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value;
                        handleParseCustomText(val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('rawDemoPasteInput') as HTMLInputElement;
                      if (el && el.value) {
                        handleParseCustomText(el.value);
                        el.value = '';
                      } else {
                        showToast('অনুগ্রহ করে ইনপুট বক্সে টেক্সট লিখুন বা পেস্ট করুন');
                      }
                    }}
                    className="btn btn-xs bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold"
                  >
                    পার্স করুন
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-action pt-2">
                <button
                  type="submit"
                  className="btn btn-sm bg-[#12372A] hover:bg-[#1a4a39] text-white font-bold rounded-xl gap-1.5"
                >
                  <Save size={16} /> {editingProduct ? 'আপডেট সংরক্ষণ করুন' : 'প্রোডাক্ট আপলোড করুন'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE PRODUCT CONFIRMATION                             */}
      {/* ------------------------------------------------------------- */}
      {productToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm bg-white text-slate-800 p-6 rounded-3xl shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle size={28} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">প্রোডাক্ট ডিলিট করবেন?</h3>
            <p className="text-xs text-slate-600 mt-1">
              "<strong>{productToDelete.title}</strong>" প্রোডাক্টটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হবে।
            </p>

            <div className="modal-action justify-center gap-2 mt-6">
              <button
                onClick={handleDeleteProduct}
                className="btn btn-sm btn-error text-white font-bold rounded-xl"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
              <button
                onClick={() => setProductToDelete(null)}
                className="btn btn-sm btn-ghost rounded-xl"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE SINGLE ORDER CONFIRMATION                        */}
      {/* ------------------------------------------------------------- */}
      {orderToDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm bg-white text-slate-800 p-6 rounded-3xl shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 size={26} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">অর্ডার ডিলিট করবেন?</h3>
            <p className="text-xs text-slate-600 mt-1">
              অর্ডার নম্বর <strong>{orderToDelete.orderNumber}</strong> ({orderToDelete.customerName}) ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হবে।
            </p>

            <div className="modal-action justify-center gap-2 mt-6">
              <button
                onClick={handleDeleteOrder}
                className="btn btn-sm btn-error text-white font-bold rounded-xl"
              >
                হ্যাঁ, স্থায়ীভাবে মুছুন
              </button>
              <button
                onClick={() => setOrderToDelete(null)}
                className="btn btn-sm btn-ghost rounded-xl"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PURGE ALL CANCELLED ORDERS CONFIRMATION                 */}
      {/* ------------------------------------------------------------- */}
      {isPurgingCancelled && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm bg-white text-slate-800 p-6 rounded-3xl shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle size={28} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">সকল বাতিল অর্ডার মুছবেন?</h3>
            <p className="text-xs text-slate-600 mt-1">
              ড্যাশবোর্ডের সকল <strong>বাতিলকৃত (Cancelled)</strong> অর্ডার স্থায়ীভাবে ডাটাবেজ থেকে ডিলিট করা হবে।
            </p>

            <div className="modal-action justify-center gap-2 mt-6">
              <button
                onClick={handlePurgeCancelled}
                className="btn btn-sm btn-error text-white font-bold rounded-xl"
              >
                হ্যাঁ, সব বাতিল অর্ডার মুছুন
              </button>
              <button
                onClick={() => setIsPurgingCancelled(false)}
                className="btn btn-sm btn-ghost rounded-xl"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DETAILED CUSTOMER INFO & ORDER DETAILS                  */}
      {/* ------------------------------------------------------------- */}
      {selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-xl bg-white text-slate-800 rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  অর্ডার বিস্তারিত: #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('bn-BD', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              {/* Customer Profile & Device/IP Information */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-base text-slate-900">{selectedOrder.customerName}</p>
                    <p className="text-blue-600 font-mono font-semibold mt-0.5">{selectedOrder.phoneNumber}</p>
                    {(selectedOrder.email || selectedOrder.customerEmail) && (
                      <p className="text-slate-600 text-xs font-mono mt-0.5 flex items-center gap-1">
                        <Mail size={12} className="text-slate-400" />
                        {selectedOrder.email || selectedOrder.customerEmail}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href={`tel:${selectedOrder.phoneNumber}`}
                      className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1"
                    >
                      <Phone size={12} /> কল দিন
                    </a>
                    <a
                      href={`https://wa.me/88${selectedOrder.phoneNumber.replace(/^0/, '')}?text=আসসালামু%20আলাইকুম%20${encodeURIComponent(selectedOrder.customerName)},%20Elegant%20Beauty%20থেকে%20আপনার%20অর্ডার%20#${selectedOrder.orderNumber}%20সম্পর্কে`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-xs bg-[#25D366] hover:bg-[#20b858] text-white rounded-lg gap-1"
                    >
                      হোয়াটসঅ্যাপ
                    </a>
                  </div>
                </div>

                <div className="text-xs text-slate-600 pt-1 border-t border-slate-200">
                  <p><strong className="text-slate-700">ঠিকানা:</strong> {selectedOrder.deliveryAddress}</p>
                  <p className="mt-1">
                    <strong className="text-slate-700">এরিয়া:</strong>{' '}
                    {selectedOrder.deliveryArea === 'inside_dhaka' ? 'ঢাকার ভিতরে (৳৭০)' : 'ঢাকার বাইরে (৳১৩০)'}
                    {selectedOrder.city && ` | জেলা/শহর: ${selectedOrder.city}`}
                  </p>
                  {selectedOrder.notes && (
                    <p className="text-amber-800 font-medium mt-1">
                      <strong>গ্রাহকের নোট:</strong> {selectedOrder.notes.replace(/^Nostrum\s+veniam\s+cons\s*\|\s*/i, '').trim()}
                    </p>
                  )}
                </div>

                {/* Collected User Telemetry & Device Info */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Globe size={13} className="text-blue-500" />
                    <span>আইপি: {selectedOrder.ipAddress || '127.0.0.1'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getDeviceIcon(selectedOrder.deviceType)}
                    <span>ডিভাইস: {selectedOrder.deviceType || 'Desktop'}</span>
                  </div>
                  <div className="col-span-2 text-slate-400 truncate" title={selectedOrder.referrer || 'Direct'}>
                    সোর্স: {selectedOrder.referrer || selectedOrder.source || 'Facebook Landing Page'}
                  </div>
                </div>
              </div>

              {/* Steadfast Courier Integration Card */}
              <div className="bg-purple-50/80 p-3.5 rounded-2xl border border-purple-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
                      <Truck size={16} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-purple-950">Steadfast Courier (Street Fast)</h5>
                      <p className="text-[10px] text-purple-700">অটোমেটিক পার্সেল বুকিং ও ট্র্যাকিং</p>
                    </div>
                  </div>
                  {selectedOrder.courier?.consignmentId ? (
                    <span className="badge badge-sm bg-purple-700 text-white font-bold text-[10px]">
                      বুকড ({selectedOrder.courier.status || 'in_review'})
                    </span>
                  ) : (
                    <span className="badge badge-sm badge-outline text-purple-700 border-purple-300 font-bold text-[10px]">
                      এখনো বুকিং হয়নি
                    </span>
                  )}
                </div>

                {selectedOrder.courier?.consignmentId ? (
                  <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">ট্র্যাকিং কোড:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-purple-900">
                        <span>{selectedOrder.courier.trackingCode || 'N/A'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrder.courier?.trackingCode || '');
                            showToast('ট্র্যাকিং কোড কপি হয়েছে!');
                          }}
                          className="btn btn-ghost btn-xs btn-circle text-purple-700"
                          title="কপি করুন"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">কনসাইনমেন্ট আইডি:</span>
                      <span className="font-mono font-semibold text-slate-800">#{selectedOrder.courier.consignmentId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">কুরিয়ার স্ট্যাটাস:</span>
                      <span className="badge badge-xs bg-purple-100 text-purple-800 font-bold uppercase">
                        {selectedOrder.courier.status || 'in_review'}
                      </span>
                    </div>
                    {selectedOrder.courier.trackingCode && (
                      <div className="flex justify-between items-center pt-1 border-t border-purple-100">
                        <span className="text-slate-500 font-medium">পাবলিক ট্র্যাকিং লিঙ্ক:</span>
                        <a
                          href={`https://steadfast.com.bd/t/${selectedOrder.courier.trackingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 underline text-[11px]"
                          title="Steadfast এ লাইভ ট্র্যাক করুন"
                        >
                          <span>https://steadfast.com.bd/t/{selectedOrder.courier.trackingCode}</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTrackSteadfast(selectedOrder._id)}
                        disabled={trackingCourierId === selectedOrder._id}
                        className="btn btn-xs flex-1 bg-purple-100 text-purple-900 hover:bg-purple-200 border-0 rounded-lg gap-1 font-bold"
                      >
                        {trackingCourierId === selectedOrder._id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        লাইভ ট্র্যাকিং চেক
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendToSteadfast(selectedOrder._id, true)}
                        disabled={sendingCourierId === selectedOrder._id}
                        className="btn btn-xs btn-outline border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg text-[11px]"
                      >
                        পুনরায় পাঠান
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendToSteadfast(selectedOrder._id)}
                      disabled={sendingCourierId === selectedOrder._id}
                      className="btn btn-xs flex-1 bg-purple-700 hover:bg-purple-800 text-white rounded-xl gap-1.5 font-bold shadow-sm"
                    >
                      {sendingCourierId === selectedOrder._id ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span>পাঠানো হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Truck size={13} />
                          <span>Send to Steadfast (৳{selectedOrder.totalAmount} COD)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyCourierText(selectedOrder)}
                      className="btn btn-xs btn-outline border-purple-300 text-purple-700 hover:bg-purple-100 rounded-xl"
                      title="ম্যানুয়াল টেক্সট কপি"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Ordered Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase">অর্ডার করা পণ্যসমূহ</h4>
                  <span className="badge badge-sm badge-neutral font-bold">{selectedOrder.items.length} টি আইটেম</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={it.image || '/banner.jpeg'}
                          alt={it.productTitle}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-xs text-slate-900">{it.productTitle}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: it.colorCode || '#1e3a8a' }}
                            ></span>
                            <span className="font-medium text-slate-700">{it.variantName}</span>
                            {it.size && <span>| সাইজ: {it.size}</span>}
                            <span>| পরিমাণ: {it.quantity}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 font-mono text-sm">৳{it.totalPrice}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-slate-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>সাবটোটাল</span>
                  <span>৳{selectedOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>ডেলিভারি চার্জ</span>
                  <span>৳{selectedOrder.deliveryFee}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-emerald-700 border-t border-slate-200 pt-1">
                  <span>মোট COD কালেকশন</span>
                  <span>৳{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="modal-action flex justify-between items-center">
              <button
                onClick={() => setOrderToDelete(selectedOrder)}
                className="btn btn-sm btn-error btn-outline rounded-xl gap-1"
              >
                <Trash2 size={14} /> অর্ডার ডিলিট করুন
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInvoiceOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="btn btn-sm btn-outline btn-neutral rounded-xl gap-1.5"
                >
                  <Printer size={14} /> ইনভয়েস প্রিন্ট
                </button>
                <button onClick={() => setSelectedOrder(null)} className="btn btn-sm btn-neutral rounded-xl">
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: PRINTABLE COD INVOICE                                   */}
      {/* ------------------------------------------------------------- */}
      {invoiceOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl bg-white text-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
            {/* INVOICE PRINT CONTAINER (react-to-print targets this element exclusively) */}
            <div ref={invoicePrintRef} className="bg-white text-slate-800 p-2 sm:p-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <img src="/logo-light.jpeg" alt="Logo" className="w-10 h-10 rounded-full" />
                    <h2 className="text-xl font-black text-slate-900">Elegant Beauty</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Quality Products ❤️ Trusted Service</p>
                  <p className="text-xs text-slate-500">হটলাইন: +8801648439277 | https://www.elegant-beauty.xyz</p>
                </div>

                <div className="text-right">
                  <span className="badge badge-neutral text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-1">
                    ক্যাশ অন ডেলিভারি (COD)
                  </span>
                  <h4 className="font-mono font-bold text-slate-900 mt-1">#{invoiceOrder.orderNumber}</h4>
                  <p className="text-xs text-slate-400">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-500 uppercase mb-1">কাস্টমার ডেলিভারি তথ্য</p>
                  <p className="font-bold text-slate-900 text-sm">{invoiceOrder.customerName}</p>
                  <p className="font-mono text-slate-700">{invoiceOrder.phoneNumber}</p>
                  {(invoiceOrder.email || invoiceOrder.customerEmail) && (
                    <p className="font-mono text-slate-500">{invoiceOrder.email || invoiceOrder.customerEmail}</p>
                  )}
                  <p className="text-slate-600 mt-1">{invoiceOrder.deliveryAddress}</p>
                  <p className="text-emerald-700 font-semibold mt-1">
                    {invoiceOrder.deliveryArea === 'inside_dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-500 uppercase mb-1">ডেলিভারি নির্দেশিকা</p>
                  <p className="text-slate-600">• কুরিয়ার প্রতিনিধি: গ্রাহকের থেকে ক্যাশ টাকা গ্রহণ করুন।</p>
                  <p className="text-slate-600">• পণ্য ডেলিভারি সম্পন্ন করার পূর্বে প্যাকেট অক্ষত রাখুন।</p>
                  {invoiceOrder.notes && (
                    <p className="text-amber-800 font-semibold mt-2">বিশেষ নোট: {invoiceOrder.notes.replace(/^Nostrum\s+veniam\s+cons\s*\|\s*/i, '').trim()}</p>
                  )}
                </div>
              </div>

              <table className="table table-compact w-full text-xs border border-slate-200 mb-4">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 text-left">পণ্য বিবরণ</th>
                    <th className="py-2.5 px-3 text-left">ভেরিয়েন্ট</th>
                    <th className="py-2.5 px-3 text-center">পরিমাণ</th>
                    <th className="py-2.5 px-3 text-right">একক মূল্য</th>
                    <th className="py-2.5 px-3 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceOrder.items.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2 px-3 font-medium text-slate-800">{it.productTitle}</td>
                      <td className="py-2 px-3 text-slate-600">{it.variantName} {it.size && `(${it.size})`}</td>
                      <td className="py-2 px-3 text-center font-mono">{it.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">৳{it.unitPrice}</td>
                      <td className="py-2 px-3 text-right font-bold font-mono">৳{it.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end text-xs space-y-1">
                <div className="w-56 space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>সাবটোটাল:</span>
                    <span className="font-mono">৳{invoiceOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="font-mono">৳{invoiceOrder.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-1">
                    <span>সর্বমোট প্রদেয় (COD):</span>
                    <span className="font-mono">৳{invoiceOrder.totalAmount}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 mt-6 pt-3 text-center text-xs text-slate-500">
                ধন্যবাদ Elegant Beauty-র সাথে থাকার জন্য ❤️ আপনার বিশ্বাসই আমাদের সবচেয়ে বড় অর্জন।
              </div>
            </div>

            <div className="modal-action flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">PDF হিসেবে সেভ বা প্রিন্ট করতে বাটন চাপুন</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintInvoice()}
                  className="btn btn-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-1.5 shadow-sm"
                >
                  <Printer size={15} /> প্রিন্ট ইনভয়েস (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(null)}
                  className="btn btn-sm btn-ghost rounded-xl"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PRINTABLE A4 SALES & REVENUE REPORT CONTAINER                  */}
      {/* (Targeted exclusively by handlePrintSalesReport via react-to-print) */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'none' }}>
        <div ref={salesReportPrintRef} className="p-8 bg-white text-slate-900 font-sans text-xs">
          {/* Official Document Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <img src="/logo-light.jpeg" alt="Logo" className="w-14 h-14 rounded-full border border-slate-300" />
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Elegant Beauty</h1>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">অফিসিয়াল বিক্রয় ও রাজস্ব বিবরণী (Sales & Revenue Report)</p>
                <p className="text-[11px] text-slate-500">হটলাইন: +8801648439277 | ওয়েবসাইট: https://www.elegant-beauty.xyz</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded-md uppercase tracking-wider mb-1">
                {salesReportSummary?.period === 'yearly' ? 'বার্ষিক রিপোর্ট' : 'মাসিক রিপোর্ট'}
              </span>
              <p className="text-sm font-black text-slate-800">
                সময়কাল: {salesReportSummary?.periodLabel || `${salesReportMonth}/${salesReportYear}`}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                রিপোর্ট প্রস্তুত তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* KPI Summary Block */}
          <div className="grid grid-cols-5 gap-3 mb-6 p-4 bg-slate-50 border border-slate-300 rounded-lg">
            <div className="text-center border-r border-slate-200 pr-2">
              <p className="text-[10px] uppercase font-bold text-slate-500">ডেলিভারড অর্ডার</p>
              <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                {salesReportSummary?.totalDeliveredOrders ?? salesReports.length} টি
              </p>
            </div>
            <div className="text-center border-r border-slate-200 pr-2">
              <p className="text-[10px] uppercase font-bold text-slate-500">মোট বিক্রীত পণ্য</p>
              <p className="text-lg font-black font-mono text-blue-700 mt-0.5">
                {salesReportSummary?.totalItemsSold ?? 0} টি
              </p>
            </div>
            <div className="text-center border-r border-slate-200 pr-2">
              <p className="text-[10px] uppercase font-bold text-slate-500">নেট প্রোডাক্ট বিক্রয়</p>
              <p className="text-lg font-black font-mono text-indigo-700 mt-0.5">
                ৳{(salesReportSummary?.netProductSales ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center border-r border-slate-200 pr-2">
              <p className="text-[10px] uppercase font-bold text-slate-500">ডেলিভারি ফি আদায়</p>
              <p className="text-lg font-black font-mono text-amber-700 mt-0.5">
                ৳{(salesReportSummary?.totalDeliveryFees ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-slate-500">সর্বমোট রাজস্ব আয়</p>
              <p className="text-lg font-black font-mono text-emerald-800 mt-0.5">
                ৳{(salesReportSummary?.totalRevenue ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top Selling Products Summary (If available) */}
          {topSellingProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
                সর্বাধিক বিক্রীত পণ্যসমূহ (Top Selling Products)
              </h3>
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-1.5 text-left">ক্র.নং</th>
                    <th className="border border-slate-300 p-1.5 text-left">পণ্যের নাম</th>
                    <th className="border border-slate-300 p-1.5 text-left">ভ্যারিয়েন্ট / সাইজ</th>
                    <th className="border border-slate-300 p-1.5 text-right">বিক্রীত সংখ্যা</th>
                    <th className="border border-slate-300 p-1.5 text-right">মোট বিক্রয়মূল্য</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellingProducts.slice(0, 8).map((tp, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-1.5 font-bold">{tp.productTitle}</td>
                      <td className="border border-slate-300 p-1.5">{tp.variantName} {tp.size ? `(${tp.size})` : ''}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-emerald-700">{tp.totalQuantity} টি</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">৳{tp.totalSales.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed Itemized Table */}
          <div className="mb-6">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
              ডেলিভারি সম্পন্ন হওয়া অর্ডারের বিবরণী ({salesReports.length} টি রেকর্ড)
            </h3>
            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                  <th className="border border-slate-300 p-1.5">ক্র.</th>
                  <th className="border border-slate-300 p-1.5 text-left">অর্ডার নং ও তারিখ</th>
                  <th className="border border-slate-300 p-1.5 text-left">গ্রাহকের নাম ও ফোন</th>
                  <th className="border border-slate-300 p-1.5 text-left">পণ্য ও পরিমাণ</th>
                  <th className="border border-slate-300 p-1.5 text-right">পণ্যের মূল্য</th>
                  <th className="border border-slate-300 p-1.5 text-right">ডেলিভারি ফি</th>
                  <th className="border border-slate-300 p-1.5 text-right">মোট আদায়</th>
                </tr>
              </thead>
              <tbody>
                {salesReports.map((rep, idx) => (
                  <tr key={rep._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-300 p-1.5">
                      <span className="font-mono font-bold block">#{rep.orderNumber}</span>
                      <span className="text-[9px] text-slate-500 block">
                        {rep.deliveredAt ? new Date(rep.deliveredAt).toLocaleDateString('bn-BD') : ''}
                      </span>
                    </td>
                    <td className="border border-slate-300 p-1.5">
                      <span className="font-bold block">{rep.customerName}</span>
                      <span className="font-mono text-slate-600 block">{rep.customerPhone}</span>
                    </td>
                    <td className="border border-slate-300 p-1.5">
                      {rep.items.map((it, i) => (
                        <div key={i} className="text-[10px]">
                          • {it.productTitle} ({it.variantName}) × <b className="font-mono">{it.quantity}</b> = ৳{it.totalPrice}
                        </div>
                      ))}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                      ৳{Number(rep.subtotal || 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono text-slate-600">
                      ৳{Number(rep.deliveryFee || 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-slate-900">
                      ৳{Number(rep.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 text-slate-900 font-bold border-t-2 border-slate-400">
                  <td colSpan={4} className="border border-slate-300 p-2 text-right">
                    সর্বমোট যোগফল ({salesReports.length} টি ডেলিভারড অর্ডার):
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-mono">
                    ৳{(salesReportSummary?.netProductSales ?? 0).toLocaleString()}
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-mono">
                    ৳{(salesReportSummary?.totalDeliveryFees ?? 0).toLocaleString()}
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-mono text-xs font-black">
                    ৳{(salesReportSummary?.totalRevenue ?? 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures & Certification Block */}
          <div className="pt-12 flex justify-between items-end text-xs text-slate-600">
            <div className="text-center w-48 border-t border-slate-400 pt-1">
              <p className="font-bold text-slate-800">প্রস্তুতকারীর স্বাক্ষর</p>
              <p className="text-[10px] text-slate-500">হিসাব ও অর্থ বিভাগ</p>
            </div>

            <div className="text-center text-[10px] text-slate-400">
              <p>Elegant Beauty Automated System Generated Report</p>
              <p>কম্পিউটার জেনারেটেড রিপোর্ট, কোনো ম্যানুয়াল সিল প্রয়োজন নেই</p>
            </div>

            <div className="text-center w-48 border-t border-slate-400 pt-1">
              <p className="font-bold text-slate-800">অনুমোদনকারীর স্বাক্ষর</p>
              <p className="text-[10px] text-slate-500">ব্যবস্থাপনা পরিচালক / স্বত্বাধিকারী</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
