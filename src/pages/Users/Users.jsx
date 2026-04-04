import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users as UsersIcon,
    Search,
    ShieldCheck,
    MoreVertical,
    Phone,
    MapPin,
    Ban,
    Unlock,
    Eye,
    Store,
    Clock,
    RotateCcw,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../utils/api';
import { useGlobalState } from '../../context/GlobalContext';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const UsersManagement = ({ type }) => {
    const navigate = useNavigate();
    const { 
        retailUsers, businessUsers,
        updateRetailUsers, updateBusinessUsers,
        lastFetched 
    } = useGlobalState();
    const [searchTerm, setSearchTerm] = useState('');
    
    const users = type === 'Business' ? businessUsers : retailUsers;
    const [loading, setLoading] = useState(users.length === 0);

    useEffect(() => {
        const fetchUsers = async () => {
            if (users.length === 0) setLoading(true);
            try {
                const { data } = await api.get(`/users?type=${type}`);
                if (type === 'Business') updateBusinessUsers(data);
                else updateRetailUsers(data);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        const lastFetchTime = type === 'Business' ? lastFetched.businessUsers : lastFetched.retailUsers;
        const shouldFetch = users.length === 0 || (Date.now() - lastFetchTime > 5 * 60 * 1000);
        
        if (shouldFetch) {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [type, users.length, updateBusinessUsers, updateRetailUsers, lastFetched.businessUsers, lastFetched.retailUsers]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/users?type=${type}`);
            if (type === 'Business') updateBusinessUsers(data);
            else updateRetailUsers(data);
        } catch (error) {
            console.error('Error refreshing users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await api.patch(`/users/${id}/status`, { status: newStatus });
            const updatedUsers = users.map(u => u._id === id ? { ...u, status: newStatus } : u);
            if (type === 'Business') {
                updateBusinessUsers(updatedUsers);
            } else {
                updateRetailUsers(updatedUsers);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredUsers = users.filter(u => 
        u.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const activeCount = users.filter(u => u.status === 'Active').length;



    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{type} User Management</h2>
                    <p className="text-slate-500 font-medium text-sm">View details, order history, and manage account status.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                        title="Refresh Users"
                    >
                        <RotateCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                    {type === 'Business' && users.some(u => u.status === 'Pending') && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-xl">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-black text-orange-700">
                                {users.filter(u => u.status === 'Pending').length} Pending Verifications
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total {type}s</p>
                    <h3 className="text-2xl font-black text-slate-900">
                        {users.length}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Active Now</p>
                    <h3 className="text-2xl font-black text-green-600">
                        {activeCount}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Last Update</p>
                    <h3 className="text-2xl font-black text-blue-600">
                        {new Date().toLocaleDateString()}
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name, phone..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading && users.length === 0 ? (
                        <div className="flex items-center justify-center py-20 bg-white/50 rounded-3xl border border-slate-100 backdrop-blur-sm">
                            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">User Details</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Join Date</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200">
                                                {user.type === 'Business' ? <Store className="w-5 h-5" /> : <UsersIcon className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{user.name || 'Anonymous User'}</p>
                                                <p className="text-[11px] font-bold text-slate-400">ID: {user._id.slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1.5 max-w-[200px]">
                                            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                                                <Phone className="w-3.5 h-3.5 text-green-600" />
                                                <span>{user.phone}</span>
                                            </div>
                                            <div className="flex items-start space-x-2 text-xs font-medium text-slate-500">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                                <span className="leading-tight truncate">{user.address || 'No address added'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                            user.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                user.status === 'Blocked' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                        )}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => navigate(`/${user.type === 'Business' ? 'business' : 'customers'}/${user._id}`)}
                                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {user.status === 'Blocked' ? (
                                                <button 
                                                    onClick={() => handleUpdateStatus(user._id, 'Active')}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleUpdateStatus(user._id, 'Blocked')}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Ban className="w-4 h-4" />
                                                </button>
                                            )}
                                            {user.type === 'Business' && user.status === 'Pending' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(user._id, 'Active')}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <ShieldCheck className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    </div>
    );
};
