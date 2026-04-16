import { useState, useEffect, useMemo } from 'react';
import { Select } from './ui/Select';
import { calculateLeadDays } from '../lib/utils';

const PICKUP_LOCATIONS = [
    { value: '全家永康勝華店', label: '全家便利商店 永康勝華店' },
    { value: '7-11北園門市',   label: '7-ELEVEN 北園門市' },
];

function generateTimeSlots(isWeekend) {
    const startHour = isWeekend ? 9 : 19;
    const endHour = 22;
    const slots = [];
    for (let h = startHour; h <= endHour; h++) {
        const time = `${h.toString().padStart(2, '0')}:00`;
        slots.push({ value: time, label: time });
        if (h !== endHour) {
            const time30 = `${h.toString().padStart(2, '0')}:30`;
            slots.push({ value: time30, label: time30 });
        }
    }
    return slots;
}

export default function PickupScheduler({ pickupLocation, pickupDate, pickupTime, onChange, totalQuantity }) {
    const leadDays = calculateLeadDays(totalQuantity);

    const minDate = (() => {
        const today = new Date();
        const min = new Date(today);
        min.setDate(today.getDate() + leadDays);
        return min.toISOString().split('T')[0];
    })();

    // Default pickup location on first render
    useEffect(() => {
        if (!pickupLocation) {
            onChange('pickupLocation', PICKUP_LOCATIONS[0].value);
        }
    }, [pickupLocation, onChange]);

    // Compute time slots from selected date
    const timeSlots = useMemo(() => {
        if (!pickupDate) return [];
        const day = new Date(pickupDate).getDay();
        return generateTimeSlots(day === 0 || day === 6);
    }, [pickupDate]);

    // Default / reset pickup time when slots change
    useEffect(() => {
        if (timeSlots.length > 0) {
            const isValid = timeSlots.some(t => t.value === pickupTime);
            if (!pickupTime || !isValid) {
                onChange('pickupTime', timeSlots[0].value);
            }
        }
    }, [timeSlots, pickupTime, onChange]);

    return (
        <>
            <div className="md:col-span-2">
                <Select
                    id="pickupLocation"
                    label="取貨地點"
                    value={pickupLocation || ''}
                    onChange={(e) => onChange('pickupLocation', e.target.value)}
                    options={PICKUP_LOCATIONS}
                    required
                />
            </div>

            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-bcs-black mb-1">
                    預計取貨日期
                </label>
                <input
                    type="date"
                    id="pickupDate"
                    value={pickupDate || ''}
                    min={minDate}
                    onChange={(e) => onChange('pickupDate', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-bcs-border bg-white px-3 py-2 text-sm placeholder:text-bcs-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-300 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                />
                <p className="text-xs text-bcs-muted mt-1">
                    {totalQuantity > 50
                        ? '大量訂購需約 21 個工作天 (實際交期將主動聯繫確認)'
                        : `預計備貨需 ${leadDays} 個工作天`}
                </p>
            </div>

            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-bcs-black mb-1">
                    預計取貨時間
                </label>
                <select
                    id="pickupTime"
                    value={pickupTime || ''}
                    onChange={(e) => onChange('pickupTime', e.target.value)}
                    disabled={!pickupDate}
                    className="flex h-10 w-full rounded-md border border-bcs-border bg-white px-3 py-2 text-sm placeholder:text-bcs-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-store-300 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                >
                    <option value="" disabled>請選擇時間</option>
                    {timeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                </select>
                <p className="text-xs text-bcs-muted mt-1">平日 19:00-22:00 / 假日 09:00-22:00</p>
            </div>
        </>
    );
}
