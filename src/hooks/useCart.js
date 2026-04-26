import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useCart() {
    const navigate = useNavigate();

    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const handleAddToCart = (item, products) => {
        let newCart = [...cart];

        // Updating an existing item by ID
        const existingIdIndex = cart.findIndex(i => i._id === item._id);
        if (existingIdIndex >= 0) {
            newCart[existingIdIndex] = item;
            setCart(newCart);
            alert('已加入購物車！');
            return;
        }

        // 對稿商品永不合併：每筆對應獨立檔案/客製內容，避免後台處理混淆
        const productMeta = products?.find(p => p.id === item.productId);
        if (productMeta?.needsProof) {
            newCart.push(item);
            setCart(newCart);
            alert('已加入購物車！');
            return;
        }

        // Adding new item — check for identical config to merge
        const identicalIndex = cart.findIndex(i => {
            if (i.productId !== item.productId) return false;
            const keysToIgnore = ['_id', 'quantity', 'price', 'productName'];
            const allKeys = new Set([...Object.keys(i), ...Object.keys(item)]);
            for (const key of allKeys) {
                if (keysToIgnore.includes(key)) continue;
                if (i[key] !== item[key]) return false;
            }
            return true;
        });

        if (identicalIndex >= 0) {
            const existingItem = newCart[identicalIndex];
            const newQuantity = Number(existingItem.quantity) + Number(item.quantity);
            const product = products?.find(p => p.id === item.productId);
            const newPrice = product
                ? product.calculatePrice(item, newQuantity)
                : existingItem.price;
            newCart[identicalIndex] = { ...existingItem, quantity: newQuantity, price: newPrice };
        } else {
            newCart.push(item);
        }

        setCart(newCart);
        alert('已加入購物車！');
    };

    const handleEditItem = (item) => {
        navigate(`/product/${item.productId}`, { state: { editingItem: item } });
    };

    const handleDeleteItem = (id) => {
        if (confirm('確定要刪除此項目嗎？')) {
            setCart(prev => prev.filter(i => i._id !== id));
        }
    };

    return { cart, setCart, handleAddToCart, handleEditItem, handleDeleteItem };
}
