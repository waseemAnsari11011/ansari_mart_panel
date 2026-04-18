import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Edit2, 
    Package, 
    Tag, 
    Layers, 
    IndianRupee, 
    TrendingUp, 
    AlertCircle,
    CheckCircle2,
    Truck,
    Info,
    Box,
    ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api, { resolveImageUrl } from '../../utils/api';
import { useGlobalState } from '../../context/GlobalContext';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { products } = useGlobalState();
    
    // Try to find product in cache for instant preview
    const cachedProduct = products.find(p => p._id === id);
    const [product, setProduct] = useState(cachedProduct || null);
    const [loading, setLoading] = useState(!cachedProduct);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/products/${id}`);
                setProduct(data);
            } catch (err) {
                console.error('Failed to fetch product', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading && !product) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex items-center space-x-5">
                    <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
                        <div className="h-4 w-32 bg-slate-100 rounded-md" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 h-[400px] bg-slate-200 rounded-[2.5rem]" />
                    <div className="lg:col-span-7 space-y-6">
                        <div className="h-40 bg-slate-100 rounded-[2.5rem]" />
                        <div className="grid grid-cols-2 gap-6">
                            <div className="h-64 bg-slate-50 rounded-[2.5rem]" />
                            <div className="h-64 bg-slate-50 rounded-[2.5rem]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg mx-auto mt-10">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-900 mb-2">Oops! Product not found</h3>
                <p className="text-slate-500 font-medium mb-8">The product you're looking for might have been removed or the ID is incorrect.</p>
                <button 
                    onClick={() => navigate('/products')}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                >
                    Back to Inventory
                </button>
            </div>
        );
    }

    const PricingTier = ({ tier, type }) => (
        <div className={cn(
            "p-5 rounded-2xl border transition-all hover:shadow-md",
            type === 'business' 
                ? 'bg-blue-50/30 border-blue-100 hover:border-blue-200' 
                : 'bg-green-50/30 border-green-100 hover:border-green-200'
        )}>
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {tier.unit || 'Unit'}{tier.label ? ` (${tier.label})` : ''}
                </span>
                <span className={cn(
                    "text-lg font-black",
                    type === 'business' ? 'text-blue-600' : 'text-green-600'
                )}>
                    ₹{tier.price}
                </span>
            </div>
            <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-bold text-slate-500">
                    Stock Allocation: <span className="text-slate-900 font-black">{tier.stock || 0}</span>
                </span>
            </div>
            <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className={cn(
                        "absolute top-0 left-0 h-full rounded-full transition-all duration-1000",
                        type === 'business' ? 'bg-blue-500' : 'bg-green-500'
                    )} 
                    style={{ width: `${Math.min((tier.stock / (product.stock || 1)) * 100, 100)}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                    <button 
                        onClick={() => navigate('/products')}
                        className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 group"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-3 mb-1">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{product.name}</h2>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                    product.retailStatus === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                                )}>
                                    Retail: {product.retailStatus || 'Active'}
                                </span>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                    product.businessStatus === 'Active' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-red-50 text-red-600 border-red-100'
                                )}>
                                    Business: {product.businessStatus || 'Active'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400 font-bold text-sm">
                            <span className="uppercase tracking-widest text-xs text-green-600/70">{product.brand || 'No Brand'}</span>
                            <span>•</span>
                            <span>SKU: {product._id?.substring(product._id.length - 8).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => navigate(`/products/edit/${product._id}`)}
                    className="flex items-center justify-center space-x-2 px-8 py-3.5 bg-green-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-green-600/30 hover:bg-green-700 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Product Info</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Gallery & Info */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Visual Gallery */}
                    <div className="bg-white p-5 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Box className="w-32 h-32 text-slate-900 -mr-8 -mt-8" />
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner relative z-10">
                            <img 
                                src={resolveImageUrl(product.images?.[0]) || 'https://placehold.co/600?text=Ansari+Mart'} 
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        {product.images?.length > 1 && (
                            <div className="grid grid-cols-4 gap-3 mt-5 relative z-10">
                                {product.images.slice(1, 5).map((img, i) => (
                                    <div key={i} className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-green-500/50 cursor-pointer transition-colors shadow-sm">
                                        <img src={resolveImageUrl(img)} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Specs */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-5">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-green-600" />
                           Product Specifications
                       </h4>
                        {[
                            { label: 'Inventory', value: `${product.stock} Units`, icon: Package, color: 'text-orange-500' },
                            { label: 'Category', value: product.category?.name || 'Uncategorized', icon: Tag, color: 'text-purple-500' },
                            { label: 'Brand Name', value: product.brand || 'General', icon: CheckCircle2, color: 'text-green-500' }
                        ].map((spec, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className={cn("p-2 rounded-xl bg-white shadow-sm", spec.color)}>
                                        <spec.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500">{spec.label}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">{spec.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column - Deep Details & Pricing */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Description Card */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                             <div className="p-2 bg-green-50 rounded-xl">
                                <Info className="w-6 h-6 text-green-600" />
                             </div>
                             Product Description
                        </h3>
                        <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100/50 relative">
                            <p className="text-slate-600 font-medium leading-loose text-base italic">
                                "{product.description || 'No detailed description available for this item yet. Please contact the administrator for more information.'}"
                            </p>
                        </div>
                    </div>

                    {/* Pricing Architecture */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Retail Architecture */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-green-50 rounded-2xl">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">Retail Model</h3>
                                </div>
                                <span className="px-3 py-1 bg-green-100/50 text-green-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-green-100">B2C</span>
                            </div>
                            
                            <div className="space-y-4">
                                {product.retailPricing?.length > 0 ? (
                                    product.retailPricing.map((tier, i) => (
                                        <PricingTier key={i} tier={tier} type="retail" />
                                    ))
                                ) : (
                                    <div className="p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-center">
                                        <IndianRupee className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-black text-slate-400">No Retail Prices Configured</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Business Architecture */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 rounded-2xl">
                                        <Layers className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900">Business Model</h3>
                                </div>
                                <span className="px-3 py-1 bg-blue-100/50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">B2B</span>
                            </div>

                            <div className="space-y-4">
                                {product.businessPricing?.length > 0 ? (
                                    product.businessPricing.map((tier, i) => (
                                        <PricingTier key={i} tier={tier} type="business" />
                                    ))
                                ) : (
                                    <div className="p-10 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                        <div className="p-3 bg-white rounded-full w-fit mx-auto mb-4 shadow-sm border border-slate-100">
                                            <Layers className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Standard Pricing</p>
                                        <p className="text-[11px] font-bold text-slate-400 leading-tight">No bulk discount tiers configured for business accounts.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
