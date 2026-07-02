import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import api from '../../utils/api'
import {
    Bell,
    Send,
    History,
    Image,
    Package,
    Loader2
} from 'lucide-react';

const Notification = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        product: '',
        image: null
    });

    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const [productSearch, setProductSearch] = useState('');
    const [productPage, setProductPage] = useState(1);
    const [productPages, setProductPages] = useState(1);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const [showProducts, setShowProducts] = useState(false);

    useEffect(() => {
        if (!showProducts) return;

        setProductSearch('');
        fetchProducts(1, '');
    }, [showProducts]);

    useEffect(() => {
        if (!showProducts) return;

        const timer = setTimeout(() => {
            fetchProducts(1, productSearch);
        }, 400);

        return () => clearTimeout(timer);
    }, [productSearch, showProducts]);

    const fetchProducts = async (page = 1, search = '') => {
        try {
            setLoadingProducts(true);

            let url = `/products?page=${page}&limit=20`;

            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            const { data } = await api.get(url);

            if (page === 1) {
                setProducts(data.products);
            } else {
                setProducts(prev => [...prev, ...data.products]);
            }

            setProductPage(page);
            setProductPages(data.pages);

        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleFileChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            image: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append("title", formData.title);
        data.append("body", formData.message);
        data.append("productId", formData.product);

        if (formData.image) {
            data.append("image", formData.image);
        }

        try {
            const response = await api.post(
                '/notifications/send-all',
                data,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            alert(`Notification Sent Successfully\nSent: ${response.data.sent}`);

            setFormData({
                title: '',
                message: '',
                product: '',
                image: null
            });

            setSelectedProduct(null);
            setProductSearch('');
            setProducts([]);
            setProductPage(1);
            setProductPages(1);
            setShowProducts(false);

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                error.message ||
                'Failed to send notification'
            );
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">

                <div className="border-b border-slate-200 px-6 py-2 flex items-center justify-between">

                    <div className="flex items-center gap-2">
                        <Bell className="w-6 h-6 text-green-500" />
                        <h1 className="text-xl font-bold text-slate-800">
                            Notifications
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/notification-history")}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 flex items-center gap-2 hover:bg-slate-50"
                        >
                            <History size={16} />
                            History
                        </button>
                    </div>

                </div>

                <div className="p-6">

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <div>
                            <label className="block mb-2 font-medium text-slate-700">
                                Notification Title
                            </label>

                            <input
                                type="text"
                                name="title"
                                placeholder="Enter notification title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-slate-700">
                                Notification Message
                            </label>

                            <textarea
                                rows="5"
                                name="message"
                                placeholder="Enter notification message"
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="relative">
                            <label className="block mb-2 font-medium text-slate-700">
                                Link Product (Optional)
                            </label>

                            <div
                                onClick={() => setShowProducts(!showProducts)}
                                className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white cursor-pointer flex items-center justify-between"
                            >
                                <span className="text-slate-700">
                                    {selectedProduct?.name || "Select Product"}
                                </span>

                                <Package className="w-5 h-5 text-slate-400" />
                            </div>

                            {showProducts && (
                                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg">

                                    {/* Search Box */}
                                    <div className="p-3 border-b border-slate-200">
                                        <input
                                            type="text"
                                            placeholder="Search product..."
                                            value={productSearch}
                                            onChange={(e) => {
                                                setProductSearch(e.target.value);
                                            }}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    {/* Product List */}
                                    <div
                                        className="max-h-64 overflow-y-auto"
                                        onScroll={(e) => {
                                            const target = e.target;

                                            if (
                                                target.scrollTop + target.clientHeight >= target.scrollHeight - 20 &&
                                                !loadingProducts &&
                                                productPage < productPages
                                            ) {
                                                fetchProducts(productPage + 1, productSearch);
                                            }
                                        }}
                                    >
                                        {loadingProducts && products.length === 0 ? (
                                            <div className="flex items-center justify-center gap-2 p-3 text-slate-500">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading products...
                                            </div>
                                        ) : products.length > 0 ? (
                                            products.map((product) => (
                                                <button
                                                    type="button"
                                                    key={product._id}
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            product: product._id
                                                        }));
                                                        setSelectedProduct(product);
                                                        setProductSearch('');
                                                        setShowProducts(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-slate-100 last:border-b-0"
                                                >
                                                    <div className="font-medium">{product.name}</div>

                                                    <div className="text-xs text-slate-500">
                                                        {product.category?.name}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-slate-500">
                                                No products found
                                            </div>
                                        )}

                                        {loadingProducts && products.length > 0 && (
                                            <div className="flex items-center justify-center gap-2 p-3 text-slate-500">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading more products...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block mb-2 font-medium text-slate-700">
                                Notification Image (Optional)
                            </label>

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5">
                                <label className="cursor-pointer flex items-center gap-2 text-slate-600">
                                    <Image className="w-5 h-5" />

                                    <span>Choose Image</span>

                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>

                                {formData.image && (
                                    <p className="mt-2 text-sm text-green-600">
                                        {formData.image.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl flex items-center gap-2"
                        >
                            <Send size={18} />
                            Send Notification
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Notification;