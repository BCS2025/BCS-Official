import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
import AboutUs from './pages/AboutUs';
import CustomQuote from './pages/CustomQuote';

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
            <div className="min-h-screen flex items-center justify-center bg-wood-50 text-wood-600">
                Loading products...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-wood-50 pb-20 font-sans">
            <Navbar cartCount={cart.length} />

            <div className="pt-4">
                <Routes>
                    <Route path="/" element={<ProductGallery products={products} />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/quote" element={<CustomQuote />} />
                    <Route path="/product/:id" element={
                        <ProductDetail
                            products={products}
                            cart={cart}
                            onAddToCart={(item) => handleAddToCart(item, products)}
                        />
                    } />
                    <Route path="/cart" element={
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
                    <Route path="/thank-you" element={
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
                            <ProductGallery products={products} />
                        )
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={
                            <div className="text-xl font-bold text-gray-500 mt-10 ml-4">請選擇左側功能選單</div>
                        } />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="coupons" element={<AdminCoupons />} />
                        <Route path="inventory" element={<AdminInventory />} />
                        <Route path="quote-materials" element={<AdminQuoteMaterials />} />
                    </Route>
                    <Route path="/admin/login" element={<AdminLogin />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;
