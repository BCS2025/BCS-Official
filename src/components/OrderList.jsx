import { Trash2, Edit2 } from 'lucide-react';
import { Button } from './ui/Button';
import { formatCurrency } from '../lib/pricing';
import { getProductLabel } from '../data/products';

export default function OrderList({ items, onEdit, onDelete }) {
    if (items.length === 0) {
        return (
            <div className="text-center py-10 bg-wood-50 rounded-lg border border-dashed border-wood-200 text-wood-500">
                尚未加入任何商品
            </div>
        );
    }

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-wood-200 bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-wood-100 text-wood-700 font-medium">
                            <tr>
                                <th className="px-4 py-3">商品內容</th>
                                <th className="px-4 py-3 text-center">規格</th>
                                <th className="px-4 py-3 text-center">數量</th>
                                <th className="px-4 py-3 text-right">金額</th>
                                <th className="px-4 py-3 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-wood-100">
                            {items.map((item) => (
                                <tr key={item._id} className="hover:bg-wood-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-wood-900">{item.productName}</div>
                                        <div className="text-xs text-wood-500">
                                            正面: {item.textFront}
                                            {item.textBack && ` / 背面: ${item.textBack}`}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-wood-600">
                                        {/* Display specific fields if they exist */}
                                        {item.siding && (
                                            <div>{item.siding === 'double' ? '雙面雕刻' : '單面雕刻'}</div>
                                        )}
                                        <div className="text-xs space-y-1">
                                            {item.shape && (
                                                <div>{getProductLabel(item.productId, 'shape', item.shape)}</div>
                                            )}
                                            {item.font && (
                                                <div>{getProductLabel(item.productId, 'font', item.font)}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right font-medium text-wood-800">{formatCurrency(item.price)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => onEdit(item)} className="h-8 w-8 p-0" title="編輯">
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => onDelete(item._id)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" title="刪除">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-wood-50 font-bold text-wood-900 border-t border-wood-200">
                            <tr>
                                <td colSpan={3} className="px-4 py-3 text-right">總計</td>
                                <td className="px-4 py-3 text-right text-lg">{formatCurrency(totalPrice)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
