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
        address: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // We currently only have one product, but structure handles more
    const activeProduct = PRODUCTS[0];

    const handleAddToCart = (item) => {
        if (editingItem) {
            setCart(cart.map(i => i._id === item._id ? item : i));
            setEditingItem(null);
        } else {
            setCart([...cart, item]);
        }
        // Scroll to cart
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

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

    const isValid = cart.length > 0 && customer.name && customer.phone && customer.address;

    const handleSubmit = async () => {
        if (!isValid) return;
        if (!confirm(`確定要送出訂單嗎？\n總計: ${formatCurrency(cart.reduce((sum, i) => sum + i.price, 0))}`)) return;

        setIsSubmitting(true);

        // Helper to find label
        const getLabel = (fieldName, value) => {
            const field = activeProduct.fields.find(f => f.name === fieldName);
            const option = field?.options?.find(o => o.value === value);
            return option ? option.label : value;
        };

        const formattedItems = cart.map(item => ({
            ...item,
            shape: getLabel('shape', item.shape),
            font: getLabel('font', item.font)
        }));

        const orderData = {
            timestamp: new Date().toISOString(),
            customer,
            items: formattedItems,
            totalAmount: cart.reduce((sum, i) => sum + i.price, 0),
        };

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
                        <img src="/LOGO_01.svg" alt="比創空間 Logo" className="w-10 h-10 object-contain" />
                        <h1 className="text-xl font-bold font-serif text-wood-900 tracking-tight">比創空間</h1>
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
                            <OrderList items={cart} onEdit={handleEdit} onDelete={handleDelete} />
                        </div>

                        <CustomerInfo data={customer} onChange={handleCustomerChange} />

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
