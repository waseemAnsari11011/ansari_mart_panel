import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    ChevronDown,
    ArrowUpDown,
    Loader2,
    Eye
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import api, { resolveImageUrl } from '../../utils/api';
import { useGlobalState } from '../../context/GlobalContext';
import { RotateCcw } from 'lucide-react'; // Import RotateCcw for refresh

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Products = () => {
    const navigate = useNavigate();
    const { products, updateProducts, lastFetched } = useGlobalState();
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');

    const productsRef = useRef(products);
    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    const lastLoadedSearchTerm = useRef('');

    // Reset to page 1 when search term changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    useEffect(() => {
        let active = true;

        const loadProducts = async () => {
            // Guard: If page > 1 but search term has changed, a page reset to 1 is already scheduled.
            // Skip this fetch to prevent mismatched page results.
            if (page > 1 && searchTerm !== lastLoadedSearchTerm.current) {
                return;
            }

            if (page === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }
            setError('');
            try {
                let url = `/products?page=${page}&limit=20`;
                if (searchTerm) {
                    url += `&search=${encodeURIComponent(searchTerm)}`;
                }
                const { data } = await api.get(url);
                
                if (!active) return;

                if (page === 1) {
                    updateProducts(data.products);
                } else {
                    updateProducts([...productsRef.current, ...data.products]);
                }
                setTotalPages(data.pages);
                lastLoadedSearchTerm.current = searchTerm;
            } catch (err) {
                if (active) {
                    setError(page === 1 ? 'Failed to load products' : 'Failed to load more products');
                }
            } finally {
                if (active) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        };

        const debounceTimer = setTimeout(() => {
            loadProducts();
        }, page === 1 ? 500 : 0); // debounced search only, immediate scroll pagination loading

        return () => {
            active = false;
            clearTimeout(debounceTimer);
        };
    }, [page, searchTerm, updateProducts]);

    const handleRefresh = async () => {
        setPage(1);
        setLoading(true);
        setError('');
        try {
            let url = `/products?page=1&limit=20`;
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            const { data } = await api.get(url);
            updateProducts(data.products);
            setTotalPages(data.pages);
            lastLoadedSearchTerm.current = searchTerm;
        } catch (err) {
            setError('Failed to refresh products');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                updateProducts(products.filter(p => p._id !== id));
            } catch (err) {
                alert('Failed to delete product');
            }
        }
    };

    const observer = useRef();
    const lastProductElementRef = useCallback((node) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && page < totalPages) {
                setPage((prevPage) => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, page, totalPages]);

    const filteredProducts = products;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Product Management</h2>
                    <p className="text-slate-500 font-medium text-sm">Manage your inventory and dynamic pricing tiers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                        title="Refresh Inventory"
                    >
                        <RotateCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => navigate('/products/add')}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New Product</span>
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, weight or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all"
                    />
                </div>
            </div>

            {loading && products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                    <p className="font-bold text-slate-500">Loading Inventory...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-red-600 text-center font-bold">
                    {error}
                </div>
            ) : products.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-slate-500 font-bold mb-4">Your shop is empty.</p>
                    <button
                        onClick={() => navigate('/products/add')}
                        className="text-green-600 font-black uppercase text-xs tracking-widest hover:underline"
                    >
                        Add your first product
                    </button>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-slate-500 font-bold mb-4">No products match your search.</p>
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="text-green-600 font-black uppercase text-xs tracking-widest hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Product Details</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">MRP (₹)</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Retail Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Business Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map((product) => (
                                    <tr 
                                        key={product._id} 
                                        onClick={() => navigate(`/products/${product._id}`)}
                                        className={cn(
                                            "hover:bg-slate-50/50 transition-colors group cursor-pointer",
                                            (Number(product.mrp) === 0 || !product.mrp) && "bg-red-100/80 hover:bg-red-200/80"
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-slate-200">
                                                    <img src={resolveImageUrl(product.images?.[0]) || 'https://placehold.co/100x100?text=Product'} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{product.name}</p>
                                                    <p className="text-[11px] font-bold text-slate-400">{product._id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-700">{product.category?.name || 'Uncategorized'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-black text-slate-900">
                                                ₹{product.mrp || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                                product.retailStatus === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                                            )}>
                                                {product.retailStatus || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                                product.businessStatus === 'Active' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-red-50 text-red-600 border-red-100'
                                            )}>
                                                {product.businessStatus || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/products/${product._id}`);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/products/edit/${product._id}`);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(product._id);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Infinite Scroll Trigger Spacer */}
                    <div ref={lastProductElementRef} className="py-8 flex flex-col justify-center items-center gap-2">
                        {loadingMore && (
                            <div className="flex items-center space-x-2 text-green-600 font-bold text-sm bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading more products...</span>
                            </div>
                        )}
                        {!loadingMore && page >= totalPages && products.length > 0 && (
                            <p className="text-slate-400 font-bold text-sm bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-2xl shadow-inner">
                                ✨ You've reached the end of the inventory. Total: {products.length} products.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
