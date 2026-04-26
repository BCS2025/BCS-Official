/**
 * 對稿（製作前確認）相關 helper。
 * 規則：以後台 `needsProof` 旗標判斷，不再依 fields 結構自動推論。
 */
export const productNeedsProof = (product) => product?.needsProof === true;

/**
 * 回傳購物車中所有需對稿的 cart items（保留原 cart item 結構，含 productId / quantity / proofFile / proofFileLater 等）
 */
export const getProofItems = (cart, products) =>
    (cart || []).filter(item => productNeedsProof((products || []).find(p => p.id === item.productId)));
