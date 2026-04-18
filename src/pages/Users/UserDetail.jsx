import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Phone,
    MapPin,
    Calendar,
    ShoppingBag,
    ShieldCheck,
    Ban,
    Unlock,
    Store,
    Users,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../utils/api';
import { Loader2 } from 'lucide-react';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}


export const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/users/${id}`);
            setUserData(data);
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, [id]);

    const handleUpdateStatus = async (newStatus) => {
        try {
            setActionLoading(true);
            await api.patch(`/users/${id}/status`, { status: newStatus });
            await fetchUserDetails();
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <AlertCircle className="w-12 h-12 text-slate-300" />
                <p className="text-slate-500 font-bold">User not found</p>
                <button onClick={() => navigate(-1)} className="text-green-600 font-black">Go Back</button>
            </div>
        );
    }

    const { user, stats, recentOrders } = userData;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm group"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:-translate-x-0.5 transition-all" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
                            <span className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                user.status === 'Active' ? 'bg-green-100 text-green-700' :
                                    user.status === 'Blocked' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            )}>
                                {user.status}
                            </span>
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">#{user._id?.slice(-8).toUpperCase()} • {user.type} Customer</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {user.status === 'Blocked' ? (
                        <button 
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus('Active')}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl font-black text-sm hover:bg-green-100 transition-all disabled:opacity-50"
                        >
                            <Unlock className="w-4 h-4" />
                            <span>{actionLoading ? 'Updating...' : 'Unblock User'}</span>
                        </button>
                    ) : (
                        <button 
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus('Blocked')}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl font-black text-sm hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                            <Ban className="w-4 h-4" />
                            <span>{actionLoading ? 'Updating...' : 'Block User'}</span>
                        </button>
                    )}
                    {user.type === 'Business' && (user.status === 'Pending' || user.businessDetails?.verificationStatus === 'Pending') && (
                        <button 
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus('Active')}
                            className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-black text-sm shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>{actionLoading ? 'Verifying...' : 'Verify Business'}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 text-center">
                            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                {user.type === 'Business' ? (
                                    <Store className="w-10 h-10 text-slate-300" />
                                ) : (
                                    <Users className="w-10 h-10 text-slate-300" />
                                )}
                            </div>
                            <h3 className="text-xl font-black text-slate-900">{user.name}</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{user.type} Profile</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Mobile Number</p>
                                    <p className="text-sm font-bold text-slate-700">{user.phone || "Not provided"}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Delivery Address</p>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                        {user.addresses && user.addresses.length > 0 
                                            ? `${user.addresses[0].address}, ${user.addresses[0].city}, ${user.addresses[0].state} - ${user.addresses[0].pincode}` 
                                            : "No address added"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Member Since</p>
                                    <p className="text-sm font-bold text-slate-700">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg w-fit mb-3">
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Orders</p>
                            <h4 className="text-xl font-black text-slate-900">{stats.ordersCount}</h4>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg w-fit mb-3">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Total Spent</p>
                            <h4 className="text-xl font-black text-slate-900">{stats.totalSpent}</h4>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {user.type === 'Business' && user.businessDetails && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900">Business Documentation</h3>
                                <div className={cn(
                                    "flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase",
                                    user.businessDetails.verificationStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                                        user.businessDetails.verificationStatus === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                )}>
                                    {user.businessDetails.verificationStatus === 'Approved' ? <CheckCircle2 className="w-3 h-3" /> :
                                        user.businessDetails.verificationStatus === 'Pending' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                    <span>Verification: {user.businessDetails.verificationStatus}</span>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shop Name</p>
                                        <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{user.businessDetails.shopName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Type</p>
                                        <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{user.businessDetails.businessType || "Not specified"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Address (KYC)</p>
                                        <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">{user.businessDetails.businessAddress || "Not provided"}</p>
                                    </div>
                                    {user.businessDetails.shopPhoto && (
                                        <div className="mt-2 text-left">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Shop Photo Preview</p>
                                            <a 
                                                href={user.businessDetails.shopPhoto} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="relative group block w-full h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in"
                                            >
                                                <img 
                                                    src={user.businessDetails.shopPhoto} 
                                                    alt="Shop" 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Store className="w-6 h-6 text-white" />
                                                    <span className="ml-2 text-white text-[10px] font-black uppercase tracking-wider">Click to view</span>
                                                </div>
                                            </a>
                                        </div>
                                    )}
                                    {user.businessDetails.gstNo && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GST Number</p>
                                            <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{user.businessDetails.gstNo}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {user.businessDetails.panNo && (
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PAN Number</p>
                                            <p className="text-sm font-bold text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{user.businessDetails.panNo}</p>
                                        </div>
                                    )}
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-[11px] font-black text-slate-500 mb-3 uppercase tracking-wider">Verification Documents</p>
                                        <div className="flex flex-col gap-3">
                                            {user.businessDetails.gstFile && (
                                                <a 
                                                    href={user.businessDetails.gstFile} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 text-xs font-bold text-green-600 hover:text-green-700 transition-colors bg-white p-2 rounded-lg border border-slate-100 shadow-sm"
                                                >
                                                    <ShieldCheck className="w-3 h-3" />
                                                    <span>View GST Document</span>
                                                </a>
                                            )}
                                            
                                            {user.businessDetails.panFile && (
                                                <a 
                                                    href={user.businessDetails.panFile} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 text-xs font-bold text-green-600 hover:text-green-700 transition-colors bg-white p-2 rounded-lg border border-slate-100 shadow-sm"
                                                >
                                                    <CreditCard className="w-3 h-3" />
                                                    <span>View PAN Card</span>
                                                </a>
                                            )}

                                            {!user.businessDetails.gstFile && !user.businessDetails.panFile && !user.businessDetails.shopPhoto && (
                                                <p className="text-[10px] text-slate-400 italic">No verification documents uploaded</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900">Recent Order History</h3>
                            <button className="text-sm font-bold text-green-600 hover:text-green-700">View All Orders</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Order ID</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-bold">
                                    {recentOrders.length > 0 ? recentOrders.map((order) => (
                                        <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-slate-900">#{order._id.slice(-6).toUpperCase()}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900">₹{order.totalPrice.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                )}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-sm italic">No recent orders found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
