import { useState, useEffect } from 'react';
import { Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

/**
 * Visual Editor for Config Schema + Pricing Logic (Modifiers)
 * 
 * Props:
 * - initialSchema: Array of field objects (e.g. [{ name: 'size', label: 'Size', options: [...] }])
 * - initialPricing: Object (e.g. { type: 'variant', modifiers: { size: { 'L': 100 } } })
 * - onChange: (newSchema, newPricing) => void
 */
export function ConfigSchemaBuilder({ initialSchema, initialPricing, onChange }) {
    // 1. Local State for UI editing
    const [fields, setFields] = useState(initialSchema || []);
    const [modifiers, setModifiers] = useState(initialPricing?.modifiers || {});

    // 2. Sync to Parent on Change
    useEffect(() => {
        const newPricing = {
            type: 'variant', // Force 'variant' type when using this builder
            modifiers: modifiers
        };
        onChange(fields, newPricing);
    }, [fields, modifiers]);
    // Note: ensure onChange is stable or doesn't cause immediate re-render of THIS component with different initial props
    // In AdminProducts, we will use this component's output to update formData, but we won't feed formData back into initialSchema 
    // unless we close/re-open the modal.

    // --- Field Actions ---
    const addField = () => {
        const newField = {
            name: `field_${Date.now()}`,
            label: '新選項',
            type: 'select',
            options: [] // Empty options to start
        };
        setFields([...fields, newField]);
    };

    const removeField = (index) => {
        const fieldName = fields[index].name;
        // Remove field
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);

        // Remove associated modifiers
        const newModifiers = { ...modifiers };
        delete newModifiers[fieldName];
        setModifiers(newModifiers);
    };

    const updateField = (index, key, value) => {
        const newFields = [...fields];
        const oldName = newFields[index].name;

        newFields[index] = { ...newFields[index], [key]: value };
        setFields(newFields);

        // If 'name' (ID) changed, we need to migrate the modifier keys
        if (key === 'name' && oldName !== value) {
            const newModifiers = { ...modifiers };
            if (newModifiers[oldName]) {
                newModifiers[value] = newModifiers[oldName];
                delete newModifiers[oldName];
                setModifiers(newModifiers);
            }
        }
    };

    // --- Option Actions ---
    const addOption = (fieldIndex) => {
        const newFields = [...fields];
        // Ensure options array exists
        if (!newFields[fieldIndex].options) newFields[fieldIndex].options = [];

        newFields[fieldIndex].options.push({
            label: '新項目',
            value: `opt_${Date.now()}` // Temporary unique ID
        });
        setFields(newFields);
    };

    const removeOption = (fieldIndex, optIndex) => {
        const newFields = [...fields];
        const fieldName = newFields[fieldIndex].name;
        const optValue = newFields[fieldIndex].options[optIndex].value;

        // Remove Option
        newFields[fieldIndex].options = newFields[fieldIndex].options.filter((_, i) => i !== optIndex);
        setFields(newFields);

        // Remove Modifier Price for this option
        if (modifiers[fieldName] && modifiers[fieldName][optValue]) {
            const newModifiers = { ...modifiers };
            const fieldMods = { ...newModifiers[fieldName] };
            delete fieldMods[optValue];

            // If field has no more modifiers, keep empty object or delete? generic logic handles empty obj fine.
            newModifiers[fieldName] = fieldMods;
            setModifiers(newModifiers);
        }
    };

    const updateOption = (fieldIndex, optIndex, key, newVal) => {
        const newFields = [...fields];
        const field = newFields[fieldIndex];
        const oldVal = field.options[optIndex].value;

        // Update Option
        field.options[optIndex] = { ...field.options[optIndex], [key]: newVal };
        setFields(newFields);

        // If 'value' (ID) changed, migrate modifier key
        if (key === 'value' && oldVal !== newVal) {
            const fieldName = field.name;
            if (modifiers[fieldName] && modifiers[fieldName][oldVal] !== undefined) {
                const newModifiers = { ...modifiers };
                const fieldMods = { ...newModifiers[fieldName] };

                fieldMods[newVal] = fieldMods[oldVal];
                delete fieldMods[oldVal];

                newModifiers[fieldName] = fieldMods;
                setModifiers(newModifiers);
            }
        }
    };

    // --- Price Modifier Actions ---
    const updateOptionPrice = (fieldName, optValue, price) => {
        const numPrice = parseInt(price);
        const newModifiers = { ...modifiers };

        if (!newModifiers[fieldName]) {
            newModifiers[fieldName] = {};
        }

        if (!isNaN(numPrice) && numPrice !== 0) {
            newModifiers[fieldName][optValue] = numPrice;
        } else {
            // Remove if 0 or empty
            delete newModifiers[fieldName][optValue];
            // Cleanup empty field modifier object? Not strictly necessary but clean
            if (Object.keys(newModifiers[fieldName]).length === 0) {
                delete newModifiers[fieldName];
            }
        }

        setModifiers(newModifiers);
    };

    const getPrice = (fieldName, optValue) => {
        return modifiers[fieldName]?.[optValue] || '';
    };

    const moveField = (index, direction) => {
        const newFields = [...fields];
        if (direction === 'up' && index > 0) {
            [newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]];
        } else if (direction === 'down' && index < newFields.length - 1) {
            [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
        }
        setFields(newFields);
    };

    // ... (rest of functions)

    return (
        <div className="space-y-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            {fields.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    尚未設定任何客製化選項
                </div>
            )}

            {fields.map((field, fIdx) => (
                <div key={fIdx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm relative group transition-all duration-200 hover:shadow-md">
                    <div className="absolute top-3 right-3 flex gap-2">
                        {/* Reordering Controls */}
                        <div className="flex bg-slate-100 rounded-lg p-1 mr-2">
                            <button
                                type="button"
                                disabled={fIdx === 0}
                                onClick={() => moveField(fIdx, 'up')}
                                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent text-slate-500"
                                title="上移"
                            >
                                <ChevronUp size={16} />
                            </button>
                            <button
                                type="button"
                                disabled={fIdx === fields.length - 1}
                                onClick={() => moveField(fIdx, 'down')}
                                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent text-slate-500"
                                title="下移"
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeField(fIdx)}
                            className="text-slate-300 hover:text-red-500 transition-colors bg-slate-50 rounded-full p-2 hover:bg-red-50"
                            title="移除此選項類別"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                    {/* Field Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-32"> {/* Increased padding for buttons */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">選項標題 (Label)</label>
                            <Input
                                value={field.label}
                                onChange={(e) => updateField(fIdx, 'label', e.target.value)}
                                placeholder="例如：尺寸、顏色"
                                className="font-bold text-slate-800"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">系統代號 (Field ID)</label>
                            <Input
                                value={field.name}
                                onChange={(e) => updateField(fIdx, 'name', e.target.value)}
                                placeholder="例如：size, color"
                                className="font-mono text-xs bg-slate-50 text-slate-600"
                            />
                        </div>
                    </div>

                    {/* Options Table Header */}
                    <div className="mt-4 pl-4 border-l-2 border-indigo-100">
                        <div className="flex gap-2 mb-2 text-xs font-bold text-slate-400 px-1">
                            <div className="flex-1">顯示名稱</div>
                            <div className="w-24">值 (Value)</div>
                            <div className="w-24">加價金額</div>
                            <div className="w-8"></div>
                        </div>

                        {/* Options List */}
                        <div className="space-y-2">
                            {field.options && field.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex gap-2 items-center">
                                    <Input
                                        value={opt.label}
                                        onChange={(e) => updateOption(fIdx, oIdx, 'label', e.target.value)}
                                        placeholder="顯示名稱 (如: 紅色)"
                                        className="flex-1 text-sm"
                                    />
                                    <Input
                                        value={opt.value}
                                        onChange={(e) => updateOption(fIdx, oIdx, 'value', e.target.value)}
                                        placeholder="如: red"
                                        className="w-24 font-mono text-xs text-slate-600"
                                    />

                                    {/* Price Modifier Input */}
                                    <div className="relative w-24">
                                        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">+$</div>
                                        <Input
                                            type="number"
                                            value={getPrice(field.name, opt.value)}
                                            onChange={(e) => updateOptionPrice(field.name, opt.value, e.target.value)}
                                            placeholder="0"
                                            className="pl-6 text-xs text-green-600 font-bold"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeOption(fIdx, oIdx)}
                                        className="text-slate-200 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => addOption(fIdx)}
                            className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                            <Plus size={14} className="mr-1" /> 新增選項項目
                        </Button>
                    </div>
                </div>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={addField}
                className="w-full border-dashed border-2 py-4 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
                <Plus size={20} className="mr-2" /> 新增選項類別 (Add Config Field)
            </Button>
        </div>
    );
}
