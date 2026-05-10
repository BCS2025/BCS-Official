import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { fetchProducts } from './lib/productService';
import {
    fetchActiveShippingMethods,
    getAllowedShippingMethodIds,
    isMethodFreeShipping,
} from './lib/shippingService';
import { useCart } from './hooks/useCart';
import { useOrderSubmit } from './hooks/useOrderSubmit';
import { useGA4PageView } from './hooks/useAnalytics';
import Navbar from './components/Navbar';
import ProductGallery from './components/ProductGallery';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import ThankYouPage from './components/ThankYouPage';
import PaymentConfirmPage from './pages/PaymentConfirmPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import TrackOrderPage from './pages/TrackOrderPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminQuoteMaterials } from './pages/admin/AdminQuoteMaterials';
import { AdminLogin } from './pages/admin/AdminLogin';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Store from './pages/Store';
import Forge from './pages/Forge';
import Terms from './pages/Terms';
import Returns from './pages/Returns';
import Footer from './components/Footer';
import MakerWorld from './pages/MakerWorld';
import CourseDetail from './pages/CourseDetail';
import InquiryWidget from './components/InquiryWidget';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminLocations } from './pages/admin/AdminLocations';
import { AdminRegistrations } from './pages/admin/AdminRegistrations';
import { AdminForgePortfolio } from './pages/admin/AdminForgePortfolio';
import { AdminNotificationFailures } from './pages/admin/AdminNotificationFailures';
import { AdminPublish } from './pages/admin/AdminPublish';
import { AdminShippingSettings } from './pages/admin/AdminShippingSettings';

function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');
    useGA4PageView();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        shippingMethod: 'store',
        // 綠界 C2C 賣貨便（線上選店後自動帶入）
        cvsStoreId: '',
        cvsStoreName: '',
        cvsStoreAddress: '',
        cvsStoreBrand: '',
        // 黑貓 / 郵政
        zipCode: '',
        city: '',
        district: '',
        // 自取
        pickupLocation: '',
        pickupDate: '',
        pickupTime: '',
        // 不在此預設 needProof：由 CustomerInfo 依購物車內容動態決定
    });
    const [shippingCost, setShippingCost] = useState(60);
    const [shippingMethods, setShippingMethods] = useState([]);

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { cart, setCart, handleAddToCart, handleDeleteItem } = useCart();
    const { submitOrder, isSubmitting, successData, clearSuccessData } = useOrderSubmit();

    useEffect(() => {
        let cancelled = false;
        async function loadProducts() {
            try {
                const data = await fetchProducts();
                if (!cancelled) setProducts(data);
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        async function loadShipping() {
            try {
                const methods = await fetchActiveShippingMethods();
                if (!cancelled) {
                    setShippingMethods(methods);
                    // 預設第一筆若為 store 60，沿用；否則同步初始 shippingCost
                    const initial = methods.find(m => m.id === 'store') || methods[0];
                    if (initial) setShippingCost(initial.price);
                }
            } catch (error) {
                console.error('Failed to load shipping methods:', error);
            }
        }
        loadProducts();
        loadShipping();
        return () => { cancelled = true; };
    }, []);

    // 通知預渲染工具：首屏資料已就緒。
    // 非 /store/* 的路由不需要 products，直接視為就緒。
    // 等 1 秒讓 path-specific component（ProductDetail / CourseDetail）也完成自身 fetch。
    useEffect(() => {
        const needsProducts = location.pathname.startsWith('/store');
        if (needsProducts && isLoading) return;
        const t = setTimeout(() => {
            document.dispatchEvent(new Event('render-complete'));
        }, 1000);
        return () => clearTimeout(t);
    }, [isLoading, location.pathname]);

    const itemsTotal = cart.reduce((sum, i) => sum + i.price, 0);

    // 依購物車內所有商品的 allowedShippingMethods 取交集；cart 為空回傳 null（不限制）
    const allowedShippingIds = useMemo(
        () => getAllowedShippingMethodIds(cart, products),
        [cart, products]
    );

    // 當前選擇的物流物件 + 該物流的免運門檻
    const currentMethod = shippingMethods.find(m => m.id === customer.shippingMethod) || null;
    const freeShippingThreshold = currentMethod?.free_shipping_threshold ?? null;
    const isFreeShipping = isMethodFreeShipping(currentMethod, itemsTotal);
    const finalShippingCost = isFreeShipping ? 0 : shippingCost;

    // 若購物車交集導致目前選的物流被禁用，自動切到第一個允許的選項
    useEffect(() => {
        if (!shippingMethods.length) return;
        if (!allowedShippingIds || allowedShippingIds.length === 0) return;
        if (allowedShippingIds.includes(customer.shippingMethod)) return;
        const fallback = shippingMethods.find(m => allowedShippingIds.includes(m.id));
        if (fallback) {
            setCustomer(prev => ({ ...prev, shippingMethod: fallback.id }));
            setShippingCost(fallback.price);
        }
    }, [allowedShippingIds, shippingMethods, customer.shippingMethod]);

    const handleCustomerChange = (field, value) => {
        setCustomer(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = ({ paymentMethod, ...couponData }) => {
        submitOrder({
            cart,
            customer,
            itemsTotal,
            finalShippingCost,
            isFreeShipping,
            shippingCost,
            freeShippingThreshold,
            products,
            couponData,
            paymentMethod,
            onSuccess: () => {
                setCart([]);
                setCustomer(prev => ({
                    ...prev,
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    cvsStoreId: '',
                    cvsStoreName: '',
                    cvsStoreAddress: '',
                    cvsStoreBrand: '',
                    zipCode: '',
                    pickupLocation: '',
                    pickupTime: '',
                    pickupDate: '',
                }));
                try { sessionStorage.removeItem('bcs_cvs_store'); } catch { /* noop */ }
            },
        });
    };

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            <Navbar cartCount={cart.length} />

            <div className="flex-1">
            <Routes>
                {/* 品牌首頁 */}
                <Route path="/" element={<Home />} />

                {/* 販創所（/store/*） */}
                <Route path="/store" element={<Store />} />
                <Route path="/store/products" element={<ProductGallery products={products} isLoading={isLoading} />} />
                <Route path="/store/product/:id" element={
                    <ProductDetail
                        products={products}
                        isLoading={isLoading}
                        cart={cart}
                        onAddToCart={(item) => handleAddToCart(item, products)}
                    />
                } />
                <Route path="/store/cart" element={
                    <Cart
                        cart={cart}
                        products={products}
                        customer={customer}
                        shippingCost={finalShippingCost}
                        onUpdateItem={(item) => handleAddToCart(item, products)}
                        onDelete={handleDeleteItem}
                        onCustomerChange={handleCustomerChange}
                        onShippingCostChange={setShippingCost}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        isFreeShipping={isFreeShipping}
                        freeShippingThreshold={freeShippingThreshold}
                        itemsTotal={itemsTotal}
                        shippingMethods={shippingMethods}
                        allowedShippingIds={allowedShippingIds}
                    />
                } />
                <Route path="/store/thank-you" element={
                    successData ? (
                        <ThankYouPage
                            orderId={successData.orderId}
                            needProof={successData.needProof}
                            estimatedDate={successData.estimatedDate}
                            totalAmount={successData.totalAmount}
                            paymentMethod={successData.paymentMethod}
                            hasLateUpload={successData.hasLateUpload}
                            onHome={() => {
                                clearSuccessData();
                                navigate('/');
                            }}
                        />
                    ) : (
                        <Navigate to="/store/products" replace />
                    )
                } />

                {/* LINE Pay 付款結果頁 */}
                <Route path="/store/payment/confirm" element={<PaymentConfirmPage />} />
                <Route path="/store/payment/cancel" element={<PaymentCancelPage />} />

                {/* 物流追蹤（從通知信件連結進入） */}
                <Route path="/store/track" element={<TrackOrderPage />} />

                {/* 舊路由向後相容重定向 */}
                <Route path="/product/:id" element={<Navigate to="/store/products" replace />} />
                <Route path="/cart" element={<Navigate to="/store/cart" replace />} />
                <Route path="/thank-you" element={<Navigate to="/store/products" replace />} />

                {/* 關於我們 */}
                <Route path="/about" element={<AboutUs />} />

                {/* 法律頁面 */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/returns" element={<Returns />} />

                {/* 鍛造工坊 */}
                <Route path="/forge" element={<Forge />} />
                <Route path="/quote" element={<Navigate to="/forge" replace />} />

                {/* 創客世界 */}
                <Route path="/makerworld" element={<MakerWorld />} />
                <Route path="/makerworld/:courseId" element={<CourseDetail />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={
                        <div className="text-xl font-bold text-gray-400 mt-10 ml-4">請選擇左側功能選單</div>
                    } />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="quote-materials" element={<AdminQuoteMaterials />} />
                    <Route path="courses" element={<AdminCourses />} />
                    <Route path="locations" element={<AdminLocations />} />
                    <Route path="registrations" element={<AdminRegistrations />} />
                    <Route path="forge-portfolio" element={<AdminForgePortfolio />} />
                    <Route path="notification-failures" element={<AdminNotificationFailures />} />
                    <Route path="shipping" element={<AdminShippingSettings />} />
                    <Route path="publish" element={<AdminPublish />} />
                </Route>
                <Route path="/admin/login" element={<AdminLogin />} />
            </Routes>
            </div>
            {!isAdminPage && <Footer />}

            {/* 回到頂部按鈕（避開右下浮動客服按鈕） */}
            {!isAdminPage && showScrollTop && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-24 right-6 z-40 w-11 h-11 bg-bcs-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-neutral-700 transition-all duration-200 hover:scale-110"
                    aria-label="回到頂部"
                >
                    <ChevronUp size={20} />
                </button>
            )}

            {/* 客服詢問 Widget（admin 後台不顯示） */}
            {!isAdminPage && <InquiryWidget products={products} />}
        </div>
    );
}


export default App;
