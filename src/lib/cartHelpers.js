/**
 * 判斷商品是否需要「製作前對稿」確認。
 * 規則：商品 fields 中存在 text 或 file 型別 → 用戶輸入會影響排版/設計，需先確認。
 * 純 select / 無 fields 的商品（現貨、變體選擇）不適用。
 */
export const productNeedsProof = (product) =>
    Array.isArray(product?.fields) &&
    product.fields.some(f => f.type === 'text' || f.type === 'file');

export const cartNeedsProof = (cart, products) =>
    cart.some(item => productNeedsProof(products.find(p => p.id === item.productId)));
