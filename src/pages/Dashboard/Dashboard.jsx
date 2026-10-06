import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    ChevronRight,
    Loader2,
    RotateCcw
} from 'lucide-react';
import api from '../../utils/api';
import DateRangeFilter from '../../components/DateRangeFilter';
import { ALL_TIME, rangeParams } from '../../utils/dateRange';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}



export const Dashboard = () => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState(ALL_TIME);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const fetchDashboardData = async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await api.get('/admin/dashboard', {
                    params: rangeParams(dateRange), signal: controller.signal
                });
                if (!controller.signal.aborted) setDashboardData(data);
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError('Failed to load dashboard. Please try refreshing.');
                    console.error('Failed to load dashboard', err);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        fetchDashboardData();
        return () => controller.abort();
    }, [dateRange, refreshKey]);

    const handleRefresh = () => setRefreshKey(key => key + 1);

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
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
                    <DateRangeFilter value={dateRange} onChange={setDateRange} />
                </div>
            </div>

            {/* Stats Grid */}
            {error ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">{error}</div>
            ) : loading ? (
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
                                <button 
                                    onClick={() => navigate('/orders')}
                                    className="text-sm font-bold text-green-600 hover:text-green-700"
                                >
                                    View All
                                </button>
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
                                        {dashboardData?.recentOrders?.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-500">No orders found for this date range.</td></tr>}
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
                                                            <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight">
                                                                {order.shippingAddress?.name || order.admin?.name || 'Customer'}
                                                            </span>
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase px-1.5 py-0.5 rounded w-fit mt-1",
                                                                order.type === 'Business' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                                                            )}>
                                                                {order.type || 'Retail'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{order.totalPrice}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${statusColors[order.status] || 'bg-slate-100 text-slate-700'}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => navigate(`/orders/${order._id}`)}
                                                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors group-hover:translate-x-1 duration-200"
                                                        >
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
