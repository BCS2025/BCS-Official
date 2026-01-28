
import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { PRODUCTS, getProductLabel } from './data/products'; // Correct import path
import Navbar from './components/Navbar';
import ProductGallery from './components/ProductGallery';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import ThankYouPage from './components/ThankYouPage';
import { formatCurrency } from './lib/pricing';
import { calculateLeadDays, getEstimatedShipDate } from './lib/utils';

function App() {
    const [cart, setCart] = useState([]);
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

    // We use a simple view state for Thank You page to avoid complex routing if not needed,
    // but a route is better. Let's use a route /thankyou or just conditional rendering if we want to keep it simple.
    // However, user asked for routes. Let's stick to standard routes for pages, 
    // but for "Thank You" it's often a result state. I'll make it a route /order-confirmation/:id
    // to strictly follow "Multi-Page" feel, or just use state rendering if it's easier.
    // Given the previous code used state 'successData', let's stick to that for simplicity on transition,
    // OR create a dedicated route. Let's use route for better history management.
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
        // item should contain productId, _id, etc.
        const existingIndex = cart.findIndex(i => i._id === item._id);

        let newCart;
        if (existingIndex >= 0) {
            // Edit existing
            newCart = [...cart];
            newCart[existingIndex] = item;
        } else {
            // Add new
            newCart = [...cart, item];
        }

        setCart(newCart);

        // Stay on page and notify user
        alert('已加入購物車！');
    };

    const handleEditItem = (item) => {
        // Navigate to product detail with state or query param to pre-fill?
        // Since we lifted state, we can pass the item to ProductDetail via location state or ID.
        // But ProductDetail expects to fetch product by ID.
        // We need a way to tell ProductDetail "Edit this specific item from cart".
        // URL could be /product/:id?edit=cartItemId
        // For simplicity now: We will just navigate to product page, 
        // pass the item data via state location, and ProductForm will initialize with it.
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

        // Format items with readable labels
        const formattedItems = cart.map(item => ({
            ...item,
            shape: getProductLabel('shape', item.shape, item.productId),
            font: getProductLabel('font', item.font, item.productId)
        }));

        const orderId = `ORD-${Date.now().toString().slice(-6)}`;
        const needProof = customer.needProof || 'yes';

        const totalQuantity = cart.reduce((sum, item) => sum + parseInt(item.quantity || 0, 10), 0);
        const leadDays = calculateLeadDays(totalQuantity);

        let estimatedDate = '';
        if (customer.shippingMethod === 'pickup') {
            estimatedDate = customer.pickupDate;
        } else {
            // For shipping, calculate estimated completion date
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
            items: formattedItems,
            totalAmount: totalAmount,
            totalQuantity: totalQuantity, // Pass to backend for email logic if needed
        };

        const GAS_URL = 'https://script.google.com/macros/s/AKfycbyO90PCWLiKQHvCn_tuBTHL4X-SdGYutHnepLKPLzKudSXP6A0E8Jix8MKKL_syyuGw/exec';

        try {
            await fetch(GAS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            // Success
            setSuccessData({ orderId, needProof, estimatedDate });
            setCart([]);
            setCustomer(prev => ({
                ...prev,
                name: '',
                phone: '',
                email: '',
                address: '',
                pickupLocation: '',
                pickupTime: '',
                pickupDate: '' // Ensure reset
            }));

            // Navigate to Thank You (we'll just render it conditionally or use a route)
            // For now, let's keep it simple and just use the state to switch view in main return, 
            // OR render a Route. I'll prefer rendering it here as an overlay or route replacement.
            // Let's use navigate.
            navigate('/thank-you');

        } catch (error) {
            console.error("Error submitting order:", error);
            alert('送出失敗，請稍後再試或直接聯繫我們。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-wood-50 pb-20 font-sans">
            <Navbar cartCount={cart.length} />

            <div className="pt-4">
                <Routes>
                    <Route path="/" element={<ProductGallery />} />
                    <Route path="/product/:id" element={
                        <ProductDetail
                            onAddToCart={handleAddToCart}
                        />
                    } />
                    <Route path="/cart" element={
                        <Cart
                            cart={cart}
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
                                />
                            ) : (
                                <ProductGallery /> // Fallback if no success data
                            )
                        }
                    />
                </Routes>
            </div>
        </div>
    );
}

export default App;
