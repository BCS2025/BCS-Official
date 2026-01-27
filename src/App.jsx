import { useState } from 'react';
import { PRODUCTS } from './config/products';
import ProductForm from './components/ProductForm';
import OrderList from './components/OrderList';
import CustomerInfo from './components/CustomerInfo';
import { Button } from './components/ui/Button';
import { ShoppingCart, Send } from 'lucide-react';
import { formatCurrency } from './lib/pricing';

function App() {
    const [cart, setCart] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
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
        pickupTime: '',
        friendName: ''
    });
    const [shippingCost, setShippingCost] = useState(60); // Default store shipping
    const [isSubmitting, setIsSubmitting] = useState(false);

    // We currently only have one product, but structure handles more
    const activeProduct = PRODUCTS[0];

    // Calculate totals
    const itemsTotal = cart.reduce((sum, i) => sum + i.price, 0);
    const totalAmount = itemsTotal + shippingCost;

    const handleAddToCart = (item) => {
        // ... (keep existing)
        if (editingItem) {
            setCart(cart.map(i => i._id === item._id ? item : i));
            setEditingItem(null);
        } else {
            setCart([...cart, item]);
        }
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    // ... (keep handleEdit, handleDelete)

    const handleEdit = (item) => {
        setEditingItem(item);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id) => {
        if (confirm('確定要刪除此項目嗎？')) {
            setCart(cart.filter(i => i._id !== id));
            if (editingItem?._id === id) setEditingItem(null);
        }
    };

    const handleCustomerChange = (friend, value) => {
        setCustomer(prev => ({ ...prev, [friend]: value }));
    };

    const handleShippingCostChange = (cost) => {
        setShippingCost(cost);
    };

    // Validation Logic
    const isCustomerValid = () => {
        const basic = customer.name && customer.phone;
        if (!basic) return false;

        switch (customer.shippingMethod) {
            case 'store':
                return !!customer.storeName;
            case 'post':
                return customer.city && customer.district && customer.address;
            case 'pickup':
                return customer.pickupLocation && customer.pickupTime;
            case 'friend':
                return !!customer.friendName;
            default:
                return false;
        }
    };

    const isValid = cart.length > 0 && isCustomerValid();

    // Helper to find label (for UI and Submit)
    const getProductLabel = (fieldName, value) => {
        const field = activeProduct.fields.find(f => f.name === fieldName);
        const option = field?.options?.find(o => o.value === value);
        return option ? option.label : value;
    };

    const handleSubmit = async () => {
        if (!isValid) return;

        let confirmMsg = `確定要送出訂單嗎？\n\n商品總計: ${formatCurrency(itemsTotal)}`;
        if (shippingCost > 0) confirmMsg += `\n運費: ${formatCurrency(shippingCost)}`;
        confirmMsg += `\n----------------\n總金額: ${formatCurrency(totalAmount)}`;

        if (!confirm(confirmMsg)) return;

        setIsSubmitting(true);

        const formattedItems = cart.map(item => ({
            ...item,
            shape: getProductLabel('shape', item.shape),
            font: getProductLabel('font', item.font)
        }));

        const orderData = {
            timestamp: new Date().toISOString(),
            customer: {
                ...customer,
                shippingCost, // Add shipping cost to data
                address: customer.shippingMethod === 'post'
                    ? `${customer.city}${customer.district}${customer.address}`
                    : customer.address // Normalize address for Google Sheet
            },
            items: formattedItems,
            totalAmount: totalAmount, // Use final total
        };
        // ... (keep fetch logic)


        console.log("Submitting Order:", orderData);

        // REPLACE with your actual Web App URL
        const GAS_URL = 'https://script.google.com/macros/s/AKfycbyO90PCWLiKQHvCn_tuBTHL4X-SdGYutHnepLKPLzKudSXP6A0E8Jix8MKKL_syyuGw/exec';

        try {
            // For demo purposes, we'll just alert if the URL is not replaced
            if (GAS_URL.includes('REPLACE')) {
                alert("請先設定 Google Apps Script URL (見程式碼)");
                setIsSubmitting(false);
                return;
            }

            const response = await fetch(GAS_URL, {
                method: 'POST',
                mode: 'no-cors', // Important for GAS
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            // Since mode is no-cors, we can't read the response properly to check success/fail status code
            // We assume it worked if no network error.
            alert('訂單已送出！我們會盡快與您聯繫。');
            setCart([]);
            setCustomer({ name: '', phone: '', email: '', address: '' });

        } catch (error) {
            console.error("Error submitting order:", error);
            alert('送出失敗，請稍後再試或直接聯繫我們。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-wood-50 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img
                            src={`${import.meta.env.BASE_URL}WebsiteLogoIcon.png`}
                            alt="比創空間 Logo"
                            className="h-14 w-auto object-contain"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-wood-600">
                        <ShoppingCart size={20} />
                        <span className="font-medium">{cart.length} 件商品</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
                {/* Hero / Intro */}
                <section className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-serif font-bold text-wood-900">客製化木質鑰匙圈</h2>
                    <p className="text-wood-600">為您的生活增添一份溫暖的手作質感</p>
                </section>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Product Form */}
                    <div className="md:col-span-1 md:sticky md:top-24">
                        <ProductForm
                            product={activeProduct}
                            onAddToCart={handleAddToCart}
                            initialData={editingItem}
                            onCancelEdit={() => setEditingItem(null)}
                        />
                    </div>

                    {/* Right Column: Order List & Customer Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-wood-100">
                            <h3 className="text-lg font-serif font-bold text-wood-900 mb-4 flex items-center gap-2">
                                <ShoppingCart size={20} className="text-wood-500" />
                                購物清單
                            </h3>
                            <OrderList
                                items={cart}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                getLabel={getProductLabel}
                            />
                        </div>

                        <CustomerInfo
                            data={customer}
                            onChange={handleCustomerChange}
                            onShippingCostChange={handleShippingCostChange}
                        />

                        <Button
                            size="lg"
                            className="w-full text-lg py-6 shadow-md"
                            onClick={handleSubmit}
                            disabled={!isValid || isSubmitting}
                        >
                            {isSubmitting ? '處理中...' : (
                                <span className="flex items-center gap-2">
                                    <Send size={20} /> 確認送出訂單
                                </span>
                            )}
                        </Button>

                        {!isValid && cart.length > 0 && (
                            <p className="text-center text-sm text-red-500">
                                請填寫完整的訂購資訊以送出訂單
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
