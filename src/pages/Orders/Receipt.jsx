import { useRef, useState, useLayoutEffect } from 'react';

const RECEIPT_WIDTH_MM = 80;
const HEIGHT_BUFFER_MM = 6;
const PX_PER_MM = 96 / 25.4;

const splitUnitFromName = (name = '') => {
    const trimmedName = String(name || '').trim();
    const unitMatch = trimmedName.match(/\s*\(([^()]+)\)\s*$/);

    if (!unitMatch) {
        return { name: trimmedName, unit: '' };
    }

    return {
        name: trimmedName.slice(0, unitMatch.index).trim() || trimmedName,
        unit: unitMatch[1].trim()
    };
};

const getItemQuantity = (item) => item.qty ?? item.quantity ?? 1;

const getReceiptItem = (item) => {
    const rawName = item.name || item.product?.name || 'Product';
    const parsedName = splitUnitFromName(rawName);
    const unit = String(item.unit || item.packageUnit || parsedName.unit || '').trim();
    const tierLabel = String(item.tierLabel || '').trim();
    const quantity = getItemQuantity(item);
    const selectedOption = tierLabel || unit;
    const weight = String(item.weight || item.product?.weight || item.product?.brand || item.brand || '').trim();

    return {
        name: parsedName.name,
        quantity,
        quantityLabel: selectedOption
            ? (quantity === 1 ? selectedOption : `${quantity} × ${selectedOption}`)
            : String(quantity),
        weight: weight || '-',
        price: item.price ?? item.product?.price ?? 0
    };
};

export const Receipt = ({ order, isBulk = false }) => {
    const receiptRef = useRef(null);
    const [receiptHeightMm, setReceiptHeightMm] = useState(null);

    useLayoutEffect(() => {
        if (isBulk || !receiptRef.current) {
            setReceiptHeightMm(null);
            return;
        }

        let active = true;

        const measureReceipt = () => {
            if (!active || !receiptRef.current) return;
            const heightPx = receiptRef.current.scrollHeight || receiptRef.current.offsetHeight;
            setReceiptHeightMm(Math.ceil(heightPx / PX_PER_MM + HEIGHT_BUFFER_MM));
        };

        measureReceipt();
        const frame = window.requestAnimationFrame(measureReceipt);
        document.fonts?.ready?.then(measureReceipt);

        return () => {
            active = false;
            window.cancelAnimationFrame(frame);
        };
    }, [order, isBulk]);

    if (!order) return null;
    const deliveryFee = Number(order.deliveryFee || 0);

    const subtotal =
        Number(order.totalPrice || 0) - deliveryFee;

    return (
        <>
            {/* Custom Print Styles */}
            {!isBulk && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                  @media print {
                    @page {
                        margin: 0;
                        size: ${RECEIPT_WIDTH_MM}mm ${receiptHeightMm || 180}mm;
                    }

                    html,
                    body {
                        width: ${RECEIPT_WIDTH_MM}mm !important;
                        min-width: ${RECEIPT_WIDTH_MM}mm !important;
                        max-width: ${RECEIPT_WIDTH_MM}mm !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background-color: white !important;
                        overflow: visible !important;
                        overscroll-behavior: none;
                    }

                    #root {
                        width: ${RECEIPT_WIDTH_MM}mm !important;
                        min-width: ${RECEIPT_WIDTH_MM}mm !important;
                        max-width: ${RECEIPT_WIDTH_MM}mm !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    .single-receipt,
                    .single-receipt * {
                        visibility: visible !important;
                    }

                    .receipt-container.single-receipt {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: ${RECEIPT_WIDTH_MM}mm !important;
                        max-width: ${RECEIPT_WIDTH_MM}mm !important;
                        margin: 0 !important;
                        padding: 5mm 4mm !important;
                        box-sizing: border-box !important;
                        background: white !important;
                        overflow: visible !important;
                    }

                    .receipt-container.single-receipt::after {
                        content: "";
                        display: block;
                        height: 2mm;
                    }
                }
                   @media screen {
                    .receipt-container.single-receipt {
                        position: absolute;
                        left: -9999px;
                        top: -9999px;
                        visibility: hidden;
                    }
                }
                `}} />
            )}

            {/* Thermal Receipt (Visible only on print or offscreen for calculation) */}
            <div
                ref={receiptRef}
                className={`receipt-container ${!isBulk ? 'single-receipt' : ''} mx-auto bg-white font-mono text-[12px] text-black leading-relaxed`}
                style={{
                    width: `${RECEIPT_WIDTH_MM}mm`,
                    maxWidth: `${RECEIPT_WIDTH_MM}mm`,
                    padding: '5mm 4mm',
                    boxSizing: 'border-box',
                    pageBreakInside: isBulk ? 'auto' : 'avoid',
                    breakInside: isBulk ? 'auto' : 'avoid'
                }}
            >
                <div className="text-center mb-4">
                    <h1 className="text-xl font-bold tracking-tighter uppercase mb-1">Ansari Mart</h1>
                    <p className="text-[14px] font-bold">Premium Quality Grocery</p>
                    <p className="text-[13px] ">Sector-63, Noida, UP</p>
                    <p className="text-[13px] ">Ph: +91 8707626377</p>
                    <div className="border-b border-dashed border-black/40 my-3"></div>
                    <div className="flex justify-between text-[12px] font-bold">
                        <span>CUST: {order.shippingAddress?.name || order.admin?.name || 'CASH CUSTOMER'}</span>
                    </div>
                    {(order.shippingAddress?.phone || order.phone) && (
                        <div className="flex justify-between text-[12px] font-bold">
                            <span>PH: {order.shippingAddress?.phone || order.phone}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[12px] font-bold">
                        <span>INV: {order._id?.substring(order._id.length - 8).toUpperCase() || order.id?.replace('#', '')}</span>
                        <span>{new Date(order.createdAt || order.date).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-black/40 mb-3"></div>

                <div className="space-y-2 mb-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_38px_50px_58px] gap-1 font-bold border-b border-black/10 pb-1 mb-1 text-[11px]">
                        <span>ITEM</span>
                        <span className="text-center">WT</span>
                        <span className="text-center">QTY</span>
                        <span className="text-right">PRICE</span>
                    </div>
                    {(order.orderItems || order.items || [])
                        .map(getReceiptItem)
                        .filter(item => item.quantity > 0)
                        .map((item, idx) => (
                        <div key={idx} className="grid grid-cols-[minmax(0,1fr)_38px_50px_58px] gap-1 items-start text-[11px]">
                            <span className="break-words uppercase font-bold">{item.name}</span>
                            <span className="text-center uppercase font-bold break-words">{item.weight}</span>
                            <span className="text-center uppercase font-bold break-words">{item.quantityLabel}</span>
                            <span className="text-right font-bold">₹{Math.round(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-b border-dashed border-black/40 my-3"></div>

                <div className="space-y-1 font-bold">
                    <div className="flex justify-between">
                        <span>SUBTOTAL:</span>
                        <span>₹{Math.round(subtotal)}</span>
                    </div>

                    {deliveryFee > 0 && (
                        <div className="flex justify-between">
                            <span>DELIVERY FEE:</span>
                            <span>₹{Math.round(deliveryFee)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm py-1 border-t border-black/10 mt-1">
                        <span className="text-[16px] font-bold" >NET TOTAL:</span>
                        <span className="text-[16px] font-bold">₹{Math.round(order.totalPrice || 0)}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-black/40 my-4"></div>

                <div className="text-center space-y-1">
                    <p className="font-bold">*** THANK YOU ***</p>
                    <p className="text-[8px] italic uppercase tracking-widest leading-tight">Follow us on Instagram for latest offers!</p>
                </div>

                <div className="text-center mt-6 text-[8px] opacity-40">
                    <p>--- COMPUTER GENERATED RECEIPT ---</p>
                </div>
            </div>
        </>
    );
};
