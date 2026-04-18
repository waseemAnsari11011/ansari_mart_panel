import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt } from './Receipt';
import {
    ShoppingBag,
    MoreVertical,
    Download,
    Eye,
    CheckCircle2,
    Clock,
    FileText,
    Phone,
    MapPin,
    Loader2,
    RotateCcw,
    Users,
    Store,
    MessageCircle,
    ListChecks,
    Calendar,
    X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WhatsAppIcon } from '../../components/WhatsAppIcon';
import api from '../../utils/api';
import { useGlobalState } from '../../context/GlobalContext';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const statusTabs = ['B2C', 'B2B', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const BulkPrintSection = ({ orders }) => {
    const containerRef = useRef(null);
    const [pageHeight, setPageHeight] = useState('auto');

    useEffect(() => {
        if (containerRef.current) {
            const timer = setTimeout(() => {
                const receipts = containerRef.current.querySelectorAll('.receipt-container');
                let max = 0;
                receipts.forEach(r => {
                    if (r.offsetHeight > max) max = r.offsetHeight;
                });
                if (max > 0) {
                    setPageHeight(Math.ceil(max) + 20);
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [orders]);

    return (
        <div ref={containerRef} className="print-receipt-wrapper print:block" style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: '0', 
            width: '80mm',
            background: 'white',
            visibility: 'hidden',
            zIndex: -9999
        }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm ${pageHeight === 'auto' ? 'auto' : `${pageHeight}px`};
                    }
                    html, body {
                        width: 80mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    .print-receipt-wrapper {
                        position: static !important;
                        left: 0 !important;
                        display: block !important;
                        visibility: visible !important;
                        width: 80mm !important;
                        margin: 0 !important;
                    }
                    .receipt-container {
                        width: 80mm !important;
                        margin: 0 !important;
                        padding: 24px !important;
                        display: block !important;
                        background: #ffffff !important;
                        position: static !important;
                        visibility: visible !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        border-bottom: none !important;
                    }
                    .receipt-container:last-child {
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }
                }
            `}} />
            <div className="print-receipt-content bg-white" style={{ width: '80mm' }}>
                {orders.map((order) => (
                    <Receipt key={order._id || order.id} order={order} isBulk={true} />
                ))}
            </div>
        </div>
    );
};

export const Orders = () => {
    const { orders, updateOrders, lastFetched } = useGlobalState();
    const [typeFilter, setTypeFilter] = useState('Retail');
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(orders.length === 0);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [bulkPrintOrders, setBulkPrintOrders] = useState([]);
    const [dateFilter, setDateFilter] = useState('All');
    const [customDate, setCustomDate] = useState('');
    const dateInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (dateFilter === 'Custom' && dateInputRef.current) {
            try {
                dateInputRef.current.showPicker();
            } catch (e) {
                // Ignore if showPicker is not supported
                dateInputRef.current.focus();
            }
        }
    }, [dateFilter]);

    useEffect(() => {
        const fetchOrders = async () => {
            // Only show loader if no data exists
            if (orders.length === 0) setLoading(true);

            try {
                const { data } = await api.get('/orders/all');
                updateOrders(data);
            } catch (err) {
                setError('Failed to load orders');
            } finally {
                setLoading(false);
            }
        };

        // Fetch if no orders OR if cache is older than 2 minutes
        const shouldFetch = orders.length === 0 || (Date.now() - lastFetched.orders > 2 * 60 * 1000);
        if (shouldFetch) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [orders.length, updateOrders, lastFetched.orders]);

    const filteredOrders = orders.filter(order => {
        const matchesType = typeFilter === 'All' ||
            (typeFilter === 'Retail' && (order.type === 'Retail' || !order.type)) ||
            (typeFilter === 'Business' && order.type === 'Business');

        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

        const orderDateObj = new Date(order.createdAt);
        const orderYear = orderDateObj.getFullYear();
        const orderMonth = orderDateObj.getMonth();
        const orderDay = orderDateObj.getDate();

        const todayObj = new Date();
        const yesterdayObj = new Date();
        yesterdayObj.setDate(todayObj.getDate() - 1);

        let matchesDate = true;
        if (dateFilter === 'Today') {
            matchesDate = orderYear === todayObj.getFullYear() &&
                orderMonth === todayObj.getMonth() &&
                orderDay === todayObj.getDate();
        } else if (dateFilter === 'Yesterday') {
            matchesDate = orderYear === yesterdayObj.getFullYear() &&
                orderMonth === yesterdayObj.getMonth() &&
                orderDay === yesterdayObj.getDate();
        } else if (dateFilter === 'Custom' && customDate) {
            const [y, m, d] = customDate.split('-').map(Number);
            matchesDate = orderYear === y &&
                orderMonth === (m - 1) &&
                orderDay === d;
        }

        return matchesType && matchesStatus && matchesDate;
    });

    const counts = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'Pending').length,
        retail: orders.filter(o => o.type === 'Retail' || !o.type).length,
        business: orders.filter(o => o.type === 'Business').length
    };

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/orders/all');
            updateOrders(data);
        } catch (err) {
            setError('Failed to refresh orders');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (order) => {
        setSelectedOrder(order);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleWhatsAppShare = (order) => {
        const orderId = order._id.substring(order._id.length - 8).toUpperCase();
        const customerName = order.shippingAddress?.name || order.admin?.name || 'Customer';
        const phone = order.shippingAddress?.phone || order.phone || '';
        const address = order.shippingAddress
            ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
            : '';

        let itemsText = '';
        const itemsList = (order.orderItems || order.items || []).filter(item => {
            const q = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
            return q > 0;
        });
        if (itemsList.length > 0) {
            itemsText = itemsList.map(item => {
                const q = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
                const p = item.price || item.product?.price || 0;
                return `- ${item.name || item.product?.name} (x${q}) - ₹${Math.round(p)}`;
            }).join('\n');
        }

        const locationLink = order.shippingAddress?.latitude && order.shippingAddress?.longitude
            ? `\n\n*Location Tracking:* https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`
            : '';

        const rawMessage = `*AnsariMart Order Details*\n\n*Order ID:* #${orderId}\n*Customer:* ${customerName}${phone ? `\n*Phone:* ${phone}` : ''}${address ? `\n*Address:* ${address}` : ''}\n\n*Items:*\n${itemsText}${locationLink}\n\n*Total Amount:* ₹${Math.round(order.totalPrice)}`;

        // Open WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(rawMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    const toggleOrderSelection = (orderId) => {
        setSelectedOrderIds(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleBulkWhatsAppShare = () => {
        if (selectedOrderIds.length === 0) return;

        const selectedOrdersData = orders.filter(o => selectedOrderIds.includes(o._id));

        let combinedMessage = `*AnsariMart - ${selectedOrdersData.length} Orders*\n\n`;

        selectedOrdersData.forEach((order, index) => {
            const orderId = order._id.substring(order._id.length - 8).toUpperCase();
            const customerName = order.shippingAddress?.name || order.admin?.name || 'Customer';
            const phone = order.shippingAddress?.phone || order.phone || '';
            const address = order.shippingAddress
                ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
                : '';

            let itemsText = '';
            const itemsList = (order.orderItems || order.items || []).filter(item => {
                const q = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
                return q > 0;
            });
            if (itemsList.length > 0) {
                itemsText = itemsList.map(item => {
                    const q = item.qty !== undefined ? item.qty : (item.quantity !== undefined ? item.quantity : 1);
                    const p = item.price || item.product?.price || 0;
                    return `- ${item.name || item.product?.name} (x${q}) - ₹${Math.round(p)}`;
                }).join('\n');
            }

            const locationLink = order.shippingAddress?.latitude && order.shippingAddress?.longitude
                ? `\n*Location:* https://www.google.com/maps?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`
                : '';

            combinedMessage += `*${index + 1}. Order ID:* #${orderId}\n*Customer:* ${customerName}${phone ? `\n*Phone:* ${phone}` : ''}${address ? `\n*Address:* ${address}` : ''}\n*Items:*\n${itemsText}${locationLink}\n*Total:* ₹${Math.round(order.totalPrice)}\n\n`;
            if (index < selectedOrdersData.length - 1) {
                combinedMessage += `--------------------------------\n\n`;
            }
        });

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(combinedMessage)}`;
        window.open(whatsappUrl, '_blank');

        setIsMultiSelectMode(false);
        setSelectedOrderIds([]);
    };

    const handleBulkPrint = () => {
        if (selectedOrderIds.length === 0) return;
        const selectedOrdersData = orders.filter(o => selectedOrderIds.includes(o._id));
        setBulkPrintOrders(selectedOrdersData);
        setTimeout(() => {
            window.print();
            setBulkPrintOrders([]);
        }, 500);
    };

    const handleBulkStatusChange = async (newStatus, selectElement) => {
        if (selectedOrderIds.length === 0 || !newStatus) return;

        if (!window.confirm(`Are you sure you want to change the status of ${selectedOrderIds.length} orders to "${newStatus}"?`)) {
            if (selectElement) selectElement.value = '';
            return;
        }

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        try {
            // Process sequentially to prevent DB/Network overload on bulk actions
            for (const id of selectedOrderIds) {
                try {
                    await api.put(`/orders/${id}/status`, { status: newStatus });
                    successCount++;
                } catch (err) {
                    console.error(`Failed to update order ${id}:`, err);
                    failCount++;
                }
            }

            // Refresh orders to get updated data
            const { data } = await api.get('/orders/all');
            updateOrders(data);

            if (failCount === 0) {
                alert(`Successfully updated ${successCount} orders to ${newStatus}`);
            } else {
                alert(`Updated ${successCount} orders, but ${failCount} failed. Please check the console.`);
            }
            
            setIsMultiSelectMode(false);
            setSelectedOrderIds([]);
        } catch (err) {
            console.error('Bulk status update failed:', err);
            alert('A critical error occurred while updating statuses.');
        } finally {
            setLoading(false);
            if (selectElement) selectElement.value = '';
        }
    };

    return (
        <>
            {(selectedOrder && bulkPrintOrders.length === 0) && <Receipt order={selectedOrder} />}
            {bulkPrintOrders.length > 0 && (
                <BulkPrintSection orders={bulkPrintOrders} />
            )}
            <div className="space-y-6 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Order Management</h2>
                        <p className="text-slate-500 font-medium text-sm">Track, manage and update statuses for all B2C and B2B orders.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                            title="Refresh Orders"
                        >
                            <RotateCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center space-x-1 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-200/50 shadow-sm h-[42px]">
                                {['All', 'Today', 'Yesterday'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => {
                                            setDateFilter(tab);
                                            setCustomDate('');
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-wider h-full",
                                            dateFilter === tab
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        {tab === 'All' ? 'All Time' : tab}
                                    </button>
                                ))}
                                <div className="relative group h-full">
                                    <input
                                        ref={dateInputRef}
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => {
                                            setCustomDate(e.target.value);
                                            setDateFilter('Custom');
                                        }}
                                        className={cn(
                                            "px-3 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap bg-transparent focus:outline-none h-full w-[130px] cursor-pointer",
                                            dateFilter === 'Custom'
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-400 hover:text-slate-600"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    {/* Row 1: Status Filters (Moved up) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-1 p-1 bg-slate-100/50 rounded-2xl w-fit overflow-x-auto no-scrollbar border border-slate-200/50">
                            {['All', 'Pending', 'Packing', 'On the way', 'Delivered', 'Cancelled'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setStatusFilter(tab)}
                                    className={cn(
                                        "px-5 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-wider",
                                        statusFilter === tab
                                            ? "bg-white text-green-600 shadow-sm"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Bulk Actions Button */}
                        <div className="flex items-center gap-2">
                            {!isMultiSelectMode ? (
                                <button
                                    onClick={() => setIsMultiSelectMode(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all shadow-sm"
                                >
                                    <ListChecks className="w-3.5 h-3.5" />
                                    <span>Select</span>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
                                                setSelectedOrderIds([]);
                                            } else {
                                                setSelectedOrderIds(filteredOrders.map(o => o._id));
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all shadow-sm"
                                    >
                                        {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsMultiSelectMode(false);
                                            setSelectedOrderIds([]);
                                        }}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-xs hover:bg-red-100 transition-all shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleBulkPrint}
                                        disabled={selectedOrderIds.length === 0}
                                        className={cn(
                                            "flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm",
                                            selectedOrderIds.length > 0
                                                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20"
                                                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                        )}
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Invoice ({selectedOrderIds.length})</span>
                                    </button>
                                    <button
                                        onClick={handleBulkWhatsAppShare}
                                        disabled={selectedOrderIds.length === 0}
                                        className={cn(
                                            "flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm",
                                            selectedOrderIds.length > 0
                                                ? "bg-green-600 text-white hover:bg-green-700 shadow-green-600/20"
                                                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                        )}
                                    >
                                        <WhatsAppIcon className="w-3.5 h-3.5" />
                                        <span>WhatsApp ({selectedOrderIds.length})</span>
                                    </button>

                                    <div className="relative group">
                                        <select
                                            onChange={(e) => handleBulkStatusChange(e.target.value, e.target)}
                                            value=""
                                            disabled={selectedOrderIds.length === 0}
                                            className={cn(
                                                "pl-4 pr-10 py-2 rounded-xl font-bold text-xs transition-all shadow-sm appearance-none outline-none cursor-pointer",
                                                selectedOrderIds.length > 0
                                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                            )}
                                        >
                                            <option value="" disabled>Change Status ({selectedOrderIds.length})</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Packing">Packing</option>
                                            <option value="On the way">On the way</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                        <div className={cn(
                                            "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
                                            selectedOrderIds.length > 0 ? "text-white/70" : "text-slate-300"
                                        )}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Type Filters (Left) + Statistics (Right) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit overflow-x-auto no-scrollbar">
                            {['Retail', 'Business'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setTypeFilter(tab)}
                                    className={cn(
                                        "px-8 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap",
                                        typeFilter === tab
                                            ? tab === 'Retail' ? "bg-blue-600 text-white shadow-md scale-[1.02]" :
                                                tab === 'Business' ? "bg-orange-600 text-white shadow-md scale-[1.02]" :
                                                    "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {tab === 'Retail' ? 'Retail (B2C)' : tab === 'Business' ? 'Business (B2B)' : tab}
                                </button>
                            ))}
                        </div>

                        {/* Redesigned Statistics Row */}
                        <div className="flex items-center gap-3">
                            {/* Total Stat Card */}
                            <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all h-[60px]">
                                <div className="p-2.5 bg-indigo-50 rounded-xl">
                                    <ShoppingBag className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total Orders</p>
                                    <p className="text-xl font-black text-slate-900 leading-none">{counts.total}</p>
                                </div>
                            </div>

                            {/* Retail/Business Split Card */}
                            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm h-[60px]">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-3 group">
                                        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                            <Users className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Retail</p>
                                            <p className="text-xl font-black text-blue-600 leading-none">{counts.retail}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100" />
                                    <div className="flex items-center gap-3 group">
                                        <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                            <Store className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Business</p>
                                            <p className="text-xl font-black text-orange-600 leading-none">{counts.business}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Stat Card */}
                            <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-2xl border border-orange-200 shadow-sm hover:shadow-md transition-all h-[60px]">
                                <div className="p-2.5 bg-orange-50 rounded-xl animate-pulse">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-tighter mb-0.5">Pending</p>
                                    <p className="text-xl font-black text-orange-600 leading-none">{counts.pending}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>



                {loading && orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                        <p className="font-bold text-slate-500">Loading Orders...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-600 text-center font-bold">
                        {error}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-slate-50 p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                        <p className="text-slate-500 font-bold">No orders found.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        {isMultiSelectMode && (
                                            <th className="px-6 py-4 w-12 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-600 cursor-pointer"
                                                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                                                    onChange={(e) => setSelectedOrderIds(e.target.checked ? filteredOrders.map(o => o._id) : [])}
                                                />
                                            </th>
                                        )}
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Order Info</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date & Status</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Shipping</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.map((order) => (
                                        <tr
                                            key={order._id}
                                            className={cn(
                                                "hover:bg-slate-50/50 transition-colors group",
                                                isMultiSelectMode && "cursor-pointer",
                                                selectedOrderIds.includes(order._id) && "bg-green-50/50 hover:bg-green-50"
                                            )}
                                            onClick={() => isMultiSelectMode ? toggleOrderSelection(order._id) : null}
                                        >
                                            {isMultiSelectMode && (
                                                <td className="px-6 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-600 cursor-pointer pointer-events-none"
                                                        checked={selectedOrderIds.includes(order._id)}
                                                        readOnly
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200">
                                                        <ShoppingBag className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">#{order._id.substring(order._id.length - 8)}</p>
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                                            order.type === 'Business' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                                        )}>
                                                            {order.type || 'Retail'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-slate-900">₹{Math.round(order.totalPrice)}</td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-[11px] font-bold text-slate-500">
                                                        <span>{new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                        {
                                                            'bg-orange-100 text-orange-700': order.status === 'Pending',
                                                            'bg-indigo-100 text-indigo-700': order.status === 'Packing',
                                                            'bg-cyan-100 text-cyan-700': order.status === 'On the way',
                                                            'bg-green-100 text-green-700': order.status === 'Delivered',
                                                            'bg-red-100 text-red-700': order.status === 'Cancelled',
                                                        }
                                                    )}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1.5 flex flex-col font-bold">
                                                    <div className="flex items-center space-x-2 text-[11px] text-slate-900 border-b border-slate-100 pb-1 mb-1">
                                                        <span className="font-black uppercase tracking-wider">{order.shippingAddress?.name || order.admin?.name || 'Customer'}</span>
                                                    </div>
                                                    <div className="flex items-start space-x-2 text-[11px] font-medium text-slate-500 leading-tight">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                                        <span className="max-w-[180px]">{order.shippingAddress?.address}, {order.shippingAddress?.city}</span>
                                                    </div>
                                                    {(order.shippingAddress?.phone || order.phone) && (
                                                        <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-500">
                                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{order.shippingAddress?.phone || order.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/orders/${order._id}`)}
                                                        title="View Order"
                                                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleWhatsAppShare(order)}
                                                        title="Share on WhatsApp"
                                                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    >
                                                        <WhatsAppIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrint(order)}
                                                        title="Print Bill"
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
