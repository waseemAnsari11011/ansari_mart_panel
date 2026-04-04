import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGlobalState } from '../../context/GlobalContext';
import { Receipt } from './Receipt';
import {
    ArrowLeft,
    ShoppingBag,
    Phone,
    MapPin,
    CheckCircle2,
    Clock,
    Package,
    IndianRupee,
    Printer,
    ExternalLink,
    Loader2,
    MessageCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api, { resolveImageUrl } from '../../utils/api';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { orders, updateOrders } = useGlobalState();

    // Try to find order in cache for instant preview
    const cachedOrder = orders.find(o => o._id === id);
    const [order, setOrder] = useState(cachedOrder || null);
    const [loading, setLoading] = useState(!cachedOrder);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/orders/${id}`);
                setOrder(data);
            } catch (err) {
                setError('Failed to load order details');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        if (!order) return;
        const orderId = order._id.substring(order._id.length - 8).toUpperCase();
        const customerName = order.shippingAddress?.name || order.admin?.name || 'Customer';
        const phone = order.shippingAddress?.phone || order.phone || '';
        const address = order.shippingAddress
            ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
            : '';

        let itemsText = '';
        const itemsList = order.orderItems || order.items || [];
        if (itemsList.length > 0) {
            itemsText = itemsList.map(item => `- ${item.name || item.product?.name} (x${item.qty || item.quantity || 1}) - ₹${Math.round(item.price || item.product?.price)}`).join('\n');
        }

        const rawMessage = `*AnsariMart Order Details*\n\n*Order ID:* #${orderId}\n*Customer:* ${customerName}${phone ? `\n*Phone:* ${phone}` : ''}${address ? `\n*Address:* ${address}` : ''}\n\n*Items:*\n${itemsText}\n\n*Total Amount:* ₹${Math.round(order.totalPrice)}`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(rawMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    const updateStatus = async (newStatus) => {
        try {
            await api.put(`/orders/${id}/status`, { status: newStatus });

            // Update local state
            const updatedOrder = { ...order, status: newStatus };
            setOrder(updatedOrder);

            // Update global cache
            if (orders.length > 0) {
                const updatedOrders = orders.map(o => o._id === id ? updatedOrder : o);
                updateOrders(updatedOrders);
            }

            alert('Status updated successfully');
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="font-bold text-slate-500">Loading Order Details...</p>
        </div>
    );

    if (error || !order) return (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-600 text-center font-bold">
            {error || 'Order not found'}
        </div>
    );

    return (
        <>
            <Receipt order={order} />

            {/* Main Application UI (Hidden on print) */}
            <div className="space-y-6 pb-12 print:hidden">
                {/* Header & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/orders')}
                            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h2 className="text-2xl font-black text-slate-900 leading-none">#{order._id.substring(order._id.length - 8).toUpperCase()}</h2>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    order.status === 'Delivered' ? "bg-green-50 text-green-600 border-green-100" :
                                        order.status === 'Pending' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                            "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                                <p className="text-slate-900 font-black text-sm">{order.shippingAddress?.name || order.admin?.name || 'Customer'}</p>
                                <span className="text-slate-300">•</span>
                                <p className="text-slate-500 font-medium text-xs tracking-wide flex items-center space-x-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleWhatsAppShare}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold text-sm hover:bg-green-100 transition-all shadow-sm active:scale-95"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Share</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print Bill</span>
                        </button>
                        <div className="relative">
                            <select
                                value={order.status}
                                onChange={(e) => updateStatus(e.target.value)}
                                className="px-5 py-2.5 pr-10 bg-slate-900 text-white rounded-xl font-bold text-sm outline-none cursor-pointer hover:bg-slate-800 transition-all appearance-none border-none"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Packing">Packing</option>
                                <option value="On the way">On the way</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white opacity-70">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Items & Summary */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Items Table */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-green-50 rounded-xl">
                                        <ShoppingBag className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h3 className="font-black text-slate-900 tracking-tight">Order Items</h3>
                                </div>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                    {(order.orderItems || []).length} Items
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Unit Price</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Quantity</th>
                                            <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(order.orderItems || []).map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className={cn(
                                                        "flex items-center space-x-4",
                                                        item.product ? "cursor-pointer group/item" : ""
                                                    )}
                                                        onClick={() => item.product && navigate(`/products/${item.product._id || item.product}`)}
                                                    >
                                                        <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shadow-sm flex-shrink-0 group-hover/item:scale-105 transition-transform">
                                                            <img src={resolveImageUrl(item.image || item.product?.images?.[0]) || 'https://placehold.co/100x100?text=Product'} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 leading-tight group-hover/item:text-green-600 transition-colors">{item.name || item.product?.name || 'Unknown Product'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{item.product?._id || item.product || 'ID N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center text-sm font-black text-slate-700">₹{Math.round(item.price)}</td>
                                                <td className="px-8 py-5 text-center text-sm font-black text-slate-700">x{item.qty}</td>
                                                <td className="px-8 py-5 text-right text-sm font-black text-slate-900">₹{Math.round(item.price * item.qty)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Customer & Summary */}
                    <div className="space-y-6">
                        {/* Order Summary Card */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20">
                            <h3 className="text-lg font-black mb-8 tracking-tight flex items-center space-x-3">
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                    <IndianRupee className="w-5 h-5" />
                                </div>
                                <span className="opacity-90">Payment Summary</span>
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-slate-400 text-sm font-bold pb-4 border-b border-white/5">
                                    <span>Subtotal</span>
                                    <span>₹{Math.round(order.totalPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                                        <span className="text-xs font-bold text-slate-500">Includes all taxes</span>
                                    </div>
                                    <span className="text-3xl font-black text-orange-500">₹{Math.round(order.totalPrice)}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full animate-pulse",
                                        order.isPaid ? "bg-green-500" : "bg-orange-500"
                                    )} />
                                    <span className="text-xs font-black uppercase tracking-widest">{order.isPaid ? 'Payment Success' : 'Payment Pending'}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic opacity-80">
                                    Method: {order.paymentMethod}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8 space-y-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <h3 className="font-black text-slate-900 tracking-tight">Shipping Address</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                <span className="text-slate-900 font-black block mb-1">{order.shippingAddress?.name || order.admin?.name || 'Customer'}</span>
                                {order.shippingAddress?.address}, {order.shippingAddress?.city}<br />
                                Ph: {order.shippingAddress?.phone}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
