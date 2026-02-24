
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { fetchProducts, getProductLabel } from './lib/productService';
import { submitOrder } from './lib/orderService';
import { uploadFile } from './lib/storageService';
import { supabase } from './lib/supabaseClient';
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
import { AdminLogin } from './pages/admin/AdminLogin';
import AboutUs from './pages/AboutUs';
import CustomQuote from './pages/CustomQuote';
import { formatCurrency } from './lib/pricing';
import { calculateLeadDays, getEstimatedShipDate } from './lib/utils';

function App() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Fetch Products from Supabase on Mount
    useEffect(() => {
        async function loadProducts() {
            try {
                const data = await fetchProducts();
                setProducts(data);
            } catch (error) {
                console.error("Failed to load products:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProducts();
    }, []);

    // Save cart to local storage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);
    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        shippingMethod: 'store', // Default
        storeName: '',
        city: '',
        district: '',
        pickupLocation: '',
        pickupDate: '',
        pickupTime: '',
        friendName: '',
        needProof: 'yes' // Default proof preference
    });
    const [shippingCost, setShippingCost] = useState(60); // Default store shipping
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [successData, setSuccessData] = useState(null);
    const navigate = useNavigate();

    // Calculate totals
    const itemsTotal = cart.reduce((sum, i) => sum + i.price, 0);
    const FREE_SHIPPING_THRESHOLD = 599;
    const isFreeShipping = itemsTotal >= FREE_SHIPPING_THRESHOLD;
    const finalShippingCost = isFreeShipping ? 0 : shippingCost;
    const totalAmount = itemsTotal + finalShippingCost;
    const totalQuantity = cart.reduce((sum, item) => sum + Number(item.quantity), 0);

    const handleAddToCart = (item) => {
        let newCart = [...cart];

        // Check if we are updating an specific existing item (by ID)
        const existingIdIndex = cart.findIndex(i => i._id === item._id);

        if (existingIdIndex >= 0) {
            // Update existing item
            newCart[existingIdIndex] = item;
        } else {
            // Adding new item - check for identical content to merge
            const identicalIndex = cart.findIndex(i => {
                if (i.productId !== item.productId) return false;

                // Fields to ignore during comparison
                const keysToIgnore = ['_id', 'quantity', 'price', 'productName'];
                // productName should be same, but safe to ignore if productId is same.

                // Compare all other keys
                const allKeys = new Set([...Object.keys(i), ...Object.keys(item)]);
                for (const key of allKeys) {
                    if (keysToIgnore.includes(key)) continue;
                    if (i[key] !== item[key]) return false;
                }
                return true;
            });

            if (identicalIndex >= 0) {
                // Merge with existing item
                const existingItem = newCart[identicalIndex];
                const newQuantity = Number(existingItem.quantity) + Number(item.quantity);

                // Recalculate price for the new total quantity
                const product = products.find(p => p.id === item.productId);
                // IF product is missing (e.g. inactive now), we might have an issue.
                // Assuming product exists for now.
                const newPrice = product ? product.calculatePrice(item, newQuantity) : existingItem.price;

                newCart[identicalIndex] = {
                    ...existingItem,
                    quantity: newQuantity,
                    price: newPrice
                };
            } else {
                // Add as completely new item
                newCart.push(item);
            }
        }

        setCart(newCart);
        alert('已加入購物車！');
    };

    const handleEditItem = (item) => {
        navigate(`/product/${item.productId}`, { state: { editingItem: item } });
    };

    const handleDeleteItem = (id) => {
        if (confirm('確定要刪除此項目嗎？')) {
            setCart(cart.filter(i => i._id !== id));
        }
    };

    const handleCustomerChange = (field, value) => {
        setCustomer(prev => ({ ...prev, [field]: value }));
    };

    const handleShippingCostChange = (cost) => {
        setShippingCost(cost);
    };

    const handleSubmit = async (couponData = {}) => {
        const { couponCode, discountAmount = 0 } = couponData;
        const discountStart = discountAmount; // Capture for logging

        // Recalculate Final Total (Safety Check)
        const finalTotal = Math.max(0, itemsTotal - discountAmount + finalShippingCost);

        let confirmMsg = `確定要送出訂單嗎？\n\n商品總計: ${formatCurrency(itemsTotal)}`;

        if (discountAmount > 0) {
            confirmMsg += `\n優惠折抵: -${formatCurrency(discountAmount)}`;
        }

        if (finalShippingCost > 0) {
            confirmMsg += `\n運費: ${formatCurrency(finalShippingCost)}`;
        } else if (isFreeShipping && shippingCost > 0) {
            confirmMsg += `\n運費: 免運 (滿$${FREE_SHIPPING_THRESHOLD}活動)`;
        } else if (couponCode && finalShippingCost === 0 && !isFreeShipping) {
            confirmMsg += `\n運費: 免運 (優惠碼)`;
        }

        confirmMsg += `\n----------------\n總金額: ${formatCurrency(finalTotal)}`;

        if (!confirm(confirmMsg)) return;

        setIsSubmitting(true);

        try {
            // 1. Process File Uploads for all items in cart
            const processedItems = await Promise.all(cart.map(async (item) => {
                const newItem = { ...item };

                // Upload any File objects in the item properties
                for (const key of Object.keys(newItem)) {
                    if (newItem[key] instanceof File) {
                        try {
                            const publicUrl = await uploadFile(newItem[key]);
                            newItem[key] = publicUrl; // Replace File with URL
                            newItem[`${key}_filename`] = newItem[key].name; // Store original filename if needed
                        } catch (err) {
                            console.error(`Failed to upload file for item ${item.productName}:`, err);
                            throw new Error('圖片上傳失敗，請稍後再試');
                        }
                    }
                }

                // Add readable labels (Shape, Font) - REMOVED: Now storing Raw Codes
                // The conversion happens at display time using getLabel dictionary.
                return {
                    ...newItem
                };
            }));

            const orderId = `ORD-${Date.now().toString().slice(-6)}`;
            const needProof = customer.needProof || 'yes';

            const totalQuantity = cart.reduce((sum, item) => sum + parseInt(item.quantity || 0, 10), 0);
            const leadDays = calculateLeadDays(totalQuantity);

            let estimatedDate = '';
            if (customer.shippingMethod === 'pickup') {
                estimatedDate = customer.pickupDate;
            } else {
                estimatedDate = getEstimatedShipDate(leadDays);
            }

            const orderData = {
                orderId,
                timestamp: new Date().toISOString(),
                estimatedDate,
                customer: {
                    ...customer,
                    needProof,
                    shippingCost: finalShippingCost,
                    address: customer.shippingMethod === 'post'
                        ? `${customer.city}${customer.district}${customer.address}`
                        : customer.address
                },
                items: processedItems,
                totalAmount: finalTotal, // Use calculated final total
                couponCode, // Add Coupon
                discountAmount, // Add Discount
                totalQuantity,
                status: 'pending'
            };

            // 1.5 Create Human Readable Version for Email/Line (Translating Codes to Chinese)
            // Clone the items to avoid mutating the original strict structure
            const readableItems = processedItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                const readableItem = { ...item };

                // Translate Options
                Object.keys(item).forEach(key => {
                    const label = getProductLabel(products, item.productId, key, item[key]);
                    if (label !== item[key]) {
                        readableItem[key] = label; // Replace code with Label (e.g. 'double' -> '雙面')
                    }
                });

                // Use Chinese Product Name if available
                if (product) readableItem.productName = product.name;

                return readableItem;
            });

            // 2. Submit to Supabase (Keep strict codes for DB consistency)
            await submitOrder(orderData);

            // 3. Send to Google Sheets (Use READABLE version for Email/Line)
            const GAS_URL = 'https://script.google.com/macros/s/AKfycbyO90PCWLiKQHvCn_tuBTHL4X-SdGYutHnepLKPLzKudSXP6A0E8Jix8MKKL_syyuGw/exec';

            // Send Order Notification
            fetch(GAS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...orderData,
                    items: readableItems // Send CHINESE version to GAS
                })
            }).catch(e => console.error("GAS Email Trigger Error:", e));

            // 4. LOW STOCK ALERT (New Feature)
            // Check materials that are below safety stock using SECURE RPC
            try {
                // Use RPC to bypass RLS and get only low stock items
                const { data: criticalMaterials, error: rpcError } = await supabase.rpc('check_low_stock');

                if (rpcError) throw rpcError;

                if (criticalMaterials && criticalMaterials.length > 0) {
                    // Group by severity
                    const outOfStock = criticalMaterials.filter(m => m.current_stock <= 0);
                    const lowStock = criticalMaterials.filter(m => m.current_stock > 0); // Already filtered by < safety_stock in SQL

                    let alertMessage = `⚠️ 庫存警報通知 (Inventory Alert)\n`;
                    let hasAlerts = false;

                    if (outOfStock.length > 0) {
                        alertMessage += `\n⛔ 庫存用罄 (Out of Stock):\n${outOfStock.map(m => `- ${m.name}: 剩餘 ${m.current_stock} (安全量: ${m.safety_stock})`).join('\n')}\n`;
                        hasAlerts = true;
                    }

                    if (lowStock.length > 0) {
                        alertMessage += `\n⚠️ 庫存告急 (Low Stock):\n${lowStock.map(m => `- ${m.name}: 剩餘 ${m.current_stock} (安全量: ${m.safety_stock})`).join('\n')}`;
                        hasAlerts = true;
                    }

                    if (hasAlerts) {
                        // Send SEPARATE Alert to GAS
                        fetch(GAS_URL, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'system_alert', // Special Type
                                message: alertMessage
                            })
                        }).catch(e => console.error("GAS Alert Error:", e));
                    }
                }
            } catch (err) {
                console.error("Failed to check low stock:", err);
            }

            // Success State
            setSuccessData({ orderId, needProof, estimatedDate, totalAmount });
            setCart([]);
            setCustomer(prev => ({
                ...prev,
                name: '',
                phone: '',
                email: '',
                address: '',
                pickupLocation: '',
                pickupTime: '',
                pickupDate: ''
            }));

            navigate('/thank-you');

        } catch (error) {
            console.error("Error submitting order:", error);
            alert(error.message || '送出失敗，請稍後再試或直接聯繫我們。');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-wood-50 text-wood-600">Loading products...</div>;
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
                            onAddToCart={handleAddToCart}
                        />
                    } />
                    <Route path="/cart" element={
                        <Cart
                            cart={cart}
                            products={products}
                            customer={customer}
                            shippingCost={finalShippingCost} // Use final calculated cost
                            onUpdateItem={handleAddToCart}
                            onDelete={handleDeleteItem}
                            onCustomerChange={handleCustomerChange}
                            onShippingCostChange={handleShippingCostChange}
                            onSubmit={handleSubmit}
                            isSubmitting={isSubmitting}
                            isFreeShipping={isFreeShipping}
                            FREE_SHIPPING_THRESHOLD={FREE_SHIPPING_THRESHOLD}
                            itemsTotal={itemsTotal}
                        />
                    } />
                    <Route
                        path="/thank-you"
                        element={
                            successData ? (
                                <ThankYouPage
                                    orderId={successData.orderId}
                                    needProof={successData.needProof}
                                    onHome={() => {
                                        setSuccessData(null);
                                        navigate('/');
                                    }}
                                    estimatedDate={successData.estimatedDate}
                                    totalAmount={successData.totalAmount}
                                />
                            ) : (
                                <ProductGallery products={products} /> // Fallback
                            )
                        }
                    />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<div className="text-xl font-bold text-gray-500 mt-10 ml-4">請選擇左側功能選單</div>} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="coupons" element={<AdminCoupons />} />
                        <Route path="inventory" element={<AdminInventory />} />
                    </Route>
                    <Route path="/admin/login" element={<AdminLogin />} />
                </Routes>
            </div>
        </div>
    );
}

export default App;
