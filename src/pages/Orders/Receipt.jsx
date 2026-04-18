import React, { useRef, useState, useEffect } from 'react';

export const Receipt = ({ order, isBulk = false }) => {
    const receiptRef = useRef(null);
    const [receiptHeight, setReceiptHeight] = useState('auto');

    useEffect(() => {
        if (receiptRef.current) {
            // Add a 20px buffer to prevent any edge clipping 
            setReceiptHeight(receiptRef.current.offsetHeight + 20);
        }
    }, [order]);

    if (!order) return null;

    return (
        <>
            {/* Custom Print Styles */}
            {!isBulk && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page {
                            margin: 0;
                            size: 80mm ${receiptHeight === 'auto' ? 'auto' : `${receiptHeight}px`};
                        }
                        body {
                            background-color: white !important;
                            overscroll-behavior: none;
                        }
                        .receipt-container {
                            display: block !important;
                            position: static !important;
                        }
                    }
                    @media screen {
                        .receipt-container {
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
                className="receipt-container w-[80mm] mx-auto bg-white p-6 font-mono text-[10px] text-black leading-relaxed"
            >
                <div className="text-center mb-4">
                    <h1 className="text-xl font-bold tracking-tighter uppercase mb-1">Ansari Mart</h1>
                    <p className="font-bold">Premium Quality Grocery</p>
                    <p>Sector-63, Noida, UP</p>
                    <p>Ph: +91 98765 43210</p>
                    <div className="border-b border-dashed border-black/40 my-3"></div>
                    <div className="flex justify-between text-[9px] font-bold">
                        <span>CUST: {order.shippingAddress?.name || order.admin?.name || 'CASH CUSTOMER'}</span>
                    </div>
                    {(order.shippingAddress?.phone || order.phone) && (
                        <div className="flex justify-between text-[9px] font-bold">
                            <span>PH: {order.shippingAddress?.phone || order.phone}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-[9px] font-bold">
                        <span>INV: {order._id?.substring(order._id.length - 8).toUpperCase() || order.id?.replace('#', '')}</span>
                        <span>{new Date(order.createdAt || order.date).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="border-b border-dashed border-black/40 mb-3"></div>

                <div className="space-y-3 mb-3">
                    <div className="grid grid-cols-[1fr_20px_60px] font-bold border-b border-black/10 pb-1 mb-1">
                        <span>ITEM</span>
                        <span className="text-center">QTY</span>
                        <span className="text-right">PRICE</span>
                    </div>
                    {(order.orderItems || order.items || []).filter(item => (item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1)) > 0).map((item, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_20px_60px] gap-1 items-start">
                            <span className="break-words uppercase">{item.name || item.product?.name}</span>
                            <span className="text-center">{item.qty || item.quantity}</span>
                            <span className="text-right">₹{Math.round((item.price || item.product?.price) * (item.qty || item.quantity))}</span>
                        </div>
                    ))}
                </div>

                <div className="border-b border-dashed border-black/40 my-3"></div>

                <div className="space-y-1 font-bold">
                    <div className="flex justify-between">
                        <span>SUBTOTAL:</span>
                        <span>₹{Math.round(order.totalPrice || order.summary?.subtotal)}</span>
                    </div>
                    {order.summary?.deliveryFee > 0 && (
                        <div className="flex justify-between">
                            <span>DELIVERY:</span>
                            <span>₹{Math.round(order.summary.deliveryFee)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm py-1 border-t border-black/10 mt-1">
                        <span>NET TOTAL:</span>
                        <span>₹{Math.round(order.totalPrice || order.summary?.total)}</span>
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
