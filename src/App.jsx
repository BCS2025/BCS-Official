import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import CustomQuote from './pages/CustomQuote';
import MakerWorld from './pages/MakerWorld';
import CourseDetail from './pages/CourseDetail';
import { AdminCourses } from './pages/admin/AdminCourses';
import { AdminRegistrations } from './pages/admin/AdminRegistrations';

const FREE_SHIPPING_THRESHOLD = 599;

function App() {
    const navigate = useNavigate();
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
        <div className="min-h-screen bg-white font-sans">
            <Navbar cartCount={cart.length} />

            <Routes>
                {/* 品牌首頁 */}
                <Route path="/" element={<Home />} />

                {/* 販創所（/store/*） */}
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

                {/* 鍛造工坊（Phase 4 前暫用 CustomQuote） */}
                <Route path="/forge" element={<CustomQuote />} />
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
                    <Route path="registrations" element={<AdminRegistrations />} />
                </Route>
                <Route path="/admin/login" element={<AdminLogin />} />
            </Routes>
        </div>
    );
}


export default App;
