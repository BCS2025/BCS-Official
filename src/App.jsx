
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { fetchProducts, getProductLabel } from './lib/productService';
import { submitOrder } from './lib/orderService';
import { uploadFile } from './lib/storageService';
import Navbar from './components/Navbar';
import ProductGallery from './components/ProductGallery';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import ThankYouPage from './components/ThankYouPage';
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

    const handleSubmit = async () => {
        let confirmMsg = `確定要送出訂單嗎？\n\n商品總計: ${formatCurrency(itemsTotal)}`;
        if (finalShippingCost > 0) {
            confirmMsg += `\n運費: ${formatCurrency(finalShippingCost)}`;
        } else if (isFreeShipping && shippingCost > 0) {
            confirmMsg += `\n運費: 免運 (滿$${FREE_SHIPPING_THRESHOLD}活動)`;
        }
        confirmMsg += `\n----------------\n總金額: ${formatCurrency(totalAmount)}`;

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

                // Add readable labels (Shape, Font)
                return {
                    ...newItem,
                    shape: getProductLabel(products, item.productId, 'shape', item.shape),
                    font: getProductLabel(products, item.productId, 'font', item.font)
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
                totalAmount: totalAmount,
                totalQuantity,
                status: 'pending'
            };

            // 2. Submit to Supabase
            await submitOrder(orderData);

            // 3. (Optional) Send to Google Sheets for Email Notifications (Fire and Forget)
            const GAS_URL = 'https://script.google.com/macros/s/AKfycbyO90PCWLiKQHvCn_tuBTHL4X-SdGYutHnepLKPLzKudSXP6A0E8Jix8MKKL_syyuGw/exec';
            fetch(GAS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            }).catch(e => console.error("GAS Email Trigger Error:", e));

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
                    <Route path="/product/:id" element={
                        <ProductDetail
                            products={products}
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
                </Routes>
            </div>
        </div>
    );
}

export default App;
