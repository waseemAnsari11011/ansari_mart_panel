import React, { useState, useRef, useEffect } from 'react';
import {
    TrendingUp,
    ShoppingBag,
    Users,
    Store,
    AlertTriangle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    Filter,
    Calendar,
    ChevronRight,
    Loader2,
    RotateCcw
} from 'lucide-react';
import api from '../../utils/api';
import { useGlobalState } from '../../context/GlobalContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}



const FilterDropdown = ({ isOpen, onClose, onDateSelect }) => {
    const dropdownRef = useRef(null);
    const [showRange, setShowRange] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
                setShowRange(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const options = [
        { label: 'Yesterday', value: 'yesterday' },
        { label: '1 Week Ago', value: '1week' },
        { label: '1 Month Ago', value: '1month' },
        { label: 'Select Date Range', value: 'custom', icon: Calendar },
    ];

    const handleOptionClick = (option) => {
        if (option.value === 'custom') {
            setShowRange(true);
        } else {
            onDateSelect({ type: option.value });
            onClose();
        }
    };

    const handleApplyRange = () => {
        if (startDate && endDate) {
            onDateSelect({ start: startDate, end: endDate, type: 'custom' });
            onClose();
            setShowRange(false);
        } else {
            alert('Please select both start and end dates');
        }
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in duration-200"
        >
            {!showRange ? (
                options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleOptionClick(option)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-green-600 rounded-xl transition-colors"
                    >
                        <span>{option.label}</span>
                        {option.icon && <option.icon className="w-4 h-4" />}
                    </button>
                ))
            ) : (
                <div className="p-3 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Range</span>
                        <button
                            onClick={() => setShowRange(false)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                        >
                            Back
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleApplyRange}
                        className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-black rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-[0.98]"
                    >
                        Apply Range
                    </button>
                </div>
            )}
        </div>
    );
};

export const Dashboard = () => {
    const { dashboardData, updateDashboardData, lastFetched } = useGlobalState();
    const [activeFilter, setActiveFilter] = useState(null);
    const [loading, setLoading] = useState(!dashboardData);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!dashboardData) setLoading(true);
            try {
                const { data } = await api.get('/admin/dashboard');
                updateDashboardData(data);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        const shouldFetch = !dashboardData || (Date.now() - lastFetched.dashboard > 5 * 60 * 1000);
        if (shouldFetch) {
            fetchDashboardData();
        } else {
            setLoading(false);
        }
    }, [dashboardData, updateDashboardData, lastFetched.dashboard]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/dashboard');
            updateDashboardData(data);
        } catch (err) {
            console.error("Failed to refresh dashboard", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (range) => {
        if (range.type === 'custom') {
            alert(`Filtering Range: ${range.start} - ${range.end}`);
        } else {
            alert(`Filtering by: ${range.type}`);
        }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Dashboard Overview</h2>
                    <p className="text-slate-500 font-medium">Welcome back, Admin. Here's what's happening today.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleRefresh}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center"
                        title="Refresh Dashboard"
                    >
                        <RotateCcw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setActiveFilter(activeFilter === 'dashboard' ? null : 'dashboard')}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all group/filter text-slate-500 hover:text-slate-700 text-sm font-bold"
                        >
                            <Filter className="w-4 h-4 group-hover/filter:scale-110 transition-transform" />
                            <span>Filter</span>
                        </button>
                        <FilterDropdown
                            isOpen={activeFilter === 'dashboard'}
                            onClose={() => setActiveFilter(null)}
                            onDateSelect={handleDateSelect}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            {loading && !dashboardData ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                label: 'Total Sales',
                                value: `₹${(dashboardData?.stats?.totalSales || 0).toLocaleString()}`,
                                change: '+0%', // Placeholder for future comparison logic
                                isPositive: true,
                                icon: TrendingUp,
                                color: 'text-blue-600',
                                bg: 'bg-blue-50',
                                hasFilter: true
                            },
                            {
                                label: 'Total Orders',
                                value: dashboardData?.stats?.totalOrders || 0,
                                change: '+0%',
                                isPositive: true,
                                icon: ShoppingBag,
                                color: 'text-green-600',
                                bg: 'bg-green-50',
                                hasFilter: true
                            },
                            {
                                label: 'Retail Users',
                                value: dashboardData?.stats?.retailUsers || 0,
                                change: '+0%',
                                isPositive: true,
                                icon: Users,
                                color: 'text-purple-600',
                                bg: 'bg-purple-50',
                                hasFilter: false
                            },
                            {
                                label: 'Business Users',
                                value: dashboardData?.stats?.businessUsers || 0,
                                change: '+0%',
                                isPositive: true,
                                icon: Store,
                                color: 'text-orange-600',
                                bg: 'bg-orange-50',
                                hasFilter: false
                            }
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${stat.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                            {stat.change}
                                        </div>
                                        {/* Filters removed from individual cards */}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                                    <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Orders */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900">Recent Orders</h3>
                                <button className="text-sm font-bold text-green-600 hover:text-green-700">View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Order ID</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Customer</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {dashboardData?.recentOrders?.map((order) => {
                                            const statusColors = {
                                                'Delivered': 'bg-green-100 text-green-700',
                                                'Pending': 'bg-orange-100 text-orange-700',
                                                'Packing': 'bg-indigo-100 text-indigo-700',
                                                'On the way': 'bg-cyan-100 text-cyan-700',
                                                'Cancelled': 'bg-red-100 text-red-700'
                                            };
                                            return (
                                                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">#{order._id.substring(order._id.length - 8).toUpperCase()}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900">{order.admin?.name || 'Customer'}</span>
                                                            <span className="text-[11px] font-bold text-slate-400">{order.type || 'Retail'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{order.totalPrice}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors group-hover:translate-x-1 duration-200">
                                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Alerts & Verification */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black text-slate-900">Critical Alerts</h3>
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-xl border border-red-100">
                                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                            <Store className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-red-900 uppercase">Pending Verification</p>
                                            <p className="text-[13px] font-medium text-red-800 mt-0.5">{dashboardData?.alerts?.pendingVerifications || 0} new business user requests need your approval.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-orange-900 uppercase">Low Stock Alert</p>
                                            <p className="text-[13px] font-medium text-orange-800 mt-0.5">{dashboardData?.alerts?.lowStockProducts || 0} products are below their minimum stock level.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
