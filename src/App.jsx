import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { fetchProducts } from './lib/productService';
import { useCart } from './hooks/useCart';
import { useOrderSubmit } from './hooks/useOrderSubmit';
import Navbar from './components/Navbar';
import ProductGallery from './components/ProductGallery';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import ThankYouPage from './components/ThankYouPage';
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

const FREE_SHIPPING_THRESHOLD = 599;

function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        shippingMethod: 'store',
        storeName: '',
        city: '',
        district: '',
        pickupLocation: '',
        pickupDate: '',
        pickupTime: '',
        friendName: '',
        needProof: 'yes',
    });
    const [shippingCost, setShippingCost] = useState(60);

    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { cart, setCart, handleAddToCart, handleDeleteItem } = useCart();
    const { submitOrder, isSubmitting, successData, clearSuccessData } = useOrderSubmit();

    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await fetchProducts();
                setProducts(data);
            } catch (error) {
                console.error('Failed to load products:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProducts();
    }, []);

    // 通知預渲染工具：首屏資料已就緒。
    // 等 1 秒讓 path-specific component（ProductDetail / CourseDetail）也完成自身 fetch。
    useEffect(() => {
        if (isLoading) return;
        const t = setTimeout(() => {
            document.dispatchEvent(new Event('render-complete'));
        }, 1000);
        return () => clearTimeout(t);
    }, [isLoading, location.pathname]);

    const itemsTotal = cart.reduce((sum, i) => sum + i.price, 0);
    const isFreeShipping = itemsTotal >= FREE_SHIPPING_THRESHOLD;
    const finalShippingCost = isFreeShipping ? 0 : shippingCost;

    const handleCustomerChange = (field, value) => {
        setCustomer(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (couponData) => {
        submitOrder({
            cart,
            customer,
            itemsTotal,
            finalShippingCost,
            isFreeShipping,
            shippingCost,
            FREE_SHIPPING_THRESHOLD,
            products,
            couponData,
            onSuccess: () => {
                setCart([]);
                setCustomer(prev => ({
                    ...prev,
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    pickupLocation: '',
                    pickupTime: '',
                    pickupDate: '',
                }));
            },
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bcs-gray text-bcs-muted">
                載入中...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col">
            <Navbar cartCount={cart.length} />

            <div className="flex-1">
            <Routes>
                {/* 品牌首頁 */}
                <Route path="/" element={<Home />} />

                {/* 販創所（/store/*） */}
                <Route path="/store" element={<Store />} />
                <Route path="/store/products" element={<ProductGallery products={products} />} />
                <Route path="/store/product/:id" element={
                    <ProductDetail
                        products={products}
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
                        FREE_SHIPPING_THRESHOLD={FREE_SHIPPING_THRESHOLD}
                        itemsTotal={itemsTotal}
                    />
                } />
                <Route path="/store/thank-you" element={
                    successData ? (
                        <ThankYouPage
                            orderId={successData.orderId}
                            needProof={successData.needProof}
                            estimatedDate={successData.estimatedDate}
                            totalAmount={successData.totalAmount}
                            onHome={() => {
                                clearSuccessData();
                                navigate('/');
                            }}
                        />
                    ) : (
                        <Navigate to="/store/products" replace />
                    )
                } />

                {/* 舊路由向後相容重定向 */}
                <Route path="/product/:id" element={<Navigate to="/store/products" replace />} />
                <Route path="/cart" element={<Navigate to="/store/cart" replace />} />
                <Route path="/thank-you" element={<Navigate to="/store/products" replace />} />

                {/* 關於我們 */}
                <Route path="/about" element={<AboutUs />} />

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
