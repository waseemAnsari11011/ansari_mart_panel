import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import api, { resolveImageUrl } from '../../utils/api';
import { useGlobalState } from '../../context/GlobalContext';
import { RotateCcw } from 'lucide-react';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Categories = () => {
    const navigate = useNavigate();
    const { categories, updateCategories, lastFetched } = useGlobalState();
    const [loading, setLoading] = useState(categories.length === 0);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCategories = async () => {
            if (categories.length === 0) setLoading(true);
            try {
                const { data } = await api.get('/categories');
                updateCategories(data);
            } catch (err) {
                setError('Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        const shouldFetch = categories.length === 0 || (Date.now() - lastFetched.categories > 10 * 60 * 1000);
        if (shouldFetch) {
            loadCategories();
        } else {
            setLoading(false);
        }
    }, [categories.length, updateCategories, lastFetched.categories]);

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/categories');
            updateCategories(data);
        } catch (err) {
            setError('Failed to refresh categories');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await api.delete(`/categories/${id}`);
                updateCategories(categories.filter(c => c._id !== id));
            } catch (err) {
                alert('Failed to delete category');
            }
        }
    };

    const filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );



    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Category Management</h2>
                    <p className="text-slate-500 font-medium text-sm">Organize your products into easy-to-navigate categories.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                        title="Refresh Categories"
                    >
                        <RotateCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => navigate('/categories/add')}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Category</span>
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                    />
                </div>
            </div>

            {loading && categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white/50 rounded-3xl border border-slate-100 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                    <p className="font-black text-slate-500 animate-pulse uppercase text-xs tracking-[0.2em]">Loading Categories...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-600 text-center font-bold">
                    {error}
                </div>
            ) : categories.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-slate-500 font-bold mb-4">No categories found.</p>
                    <button 
                        onClick={() => navigate('/categories/add')}
                        className="text-green-600 font-black uppercase text-xs tracking-widest hover:underline"
                    >
                        Create your first category
                    </button>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-slate-500 font-bold mb-4">No categories match your search.</p>
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="text-green-600 font-black uppercase text-xs tracking-widest hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCategories.map((category) => (
                        <div key={category._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner group-hover:scale-110 transition-transform">
                                    <img 
                                        src={resolveImageUrl(category.image) || 'https://placehold.co/100x100?text=Category'} 
                                        alt={category.name} 
                                        className="w-full h-full object-cover" 
                                    />
                                </div>
                                <div className="flex space-x-1">
                                    <button 
                                        onClick={() => navigate(`/categories/edit/${category._id}`)}
                                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(category._id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-lg font-black text-slate-900">{category.name}</h3>
                                    <span className={cn(
                                        "flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                        category.status === 'Active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    )}>
                                        {category.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        <span>{category.status || 'Active'}</span>
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">ID: {category._id?.substring(0, 8)}...</p>
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-500">Products:</span>
                                    <span className="text-sm font-black text-slate-900">{category.productCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
