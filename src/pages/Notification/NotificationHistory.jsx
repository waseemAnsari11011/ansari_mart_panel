import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import {
    Bell,
    Trash2,
    Package,
    Image as ImageIcon,
    Loader2,
    RotateCcw
} from "lucide-react";

const NotificationHistory = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [resendingId, setResendingId] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notifications/history");

            setNotifications(
                res.data.notifications || []
            );
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this notification?"
        );

        if (!confirmDelete) return;

        try {
            setDeletingId(id);

            await api.delete(`/notifications/${id}`);

            setNotifications((prev) =>
                prev.filter((item) => item._id !== id)
            );
        } catch (error) {
            console.error(error);
            alert("Failed to delete notification");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    const handleResend = async (item) => {
        try {
            setResendingId(item._id);

            await api.post(
                `/notifications/resend/${item._id}`
            );

            alert("Notification resent successfully");
        } catch (error) {
            console.error(error);
            alert("Failed to resend notification");
        } finally {
            setResendingId(null);
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">

                <div className="border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                    <Bell className="w-6 h-6 text-green-500" />
                    <h1 className="text-xl font-bold text-slate-800">
                        Notification History
                    </h1>

                    <span className="ml-auto bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm">
                        {notifications.length} Notifications
                    </span>
                </div>

                <div className="p-6">

                    {notifications.length === 0 ? (
                        <div className="text-center py-20">
                            <Bell className="mx-auto w-16 h-16 text-slate-300" />

                            <h3 className="mt-4 text-xl font-semibold text-slate-700">
                                No Notifications Found
                            </h3>

                            <p className="mt-2 text-slate-500">
                                Notifications sent from admin panel will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {notifications.map((item) => (
                                <div
                                    key={item._id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-all duration-200"
                                >
                                    {item.imageUrl && (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-56 object-cover"
                                        />
                                    )}

                                    <div className="p-5">

                                        <div className="flex items-center justify-between">

                                            <button
                                                onClick={() => handleResend(item)}
                                                disabled={resendingId === item._id}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                                            >
                                                {resendingId === item._id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <RotateCcw size={16} />
                                                )}
                                                Re-send
                                            </button>

                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                disabled={deletingId === item._id}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                            >
                                                {deletingId === item._id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                                Delete
                                            </button>

                                        </div>

                                        <div className="mt-5 space-y-4">

                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase">
                                                    Title
                                                </p>

                                                <p className="text-slate-800 font-medium">
                                                    {item.title}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase">
                                                    Message
                                                </p>

                                                <p className="text-slate-600 whitespace-pre-wrap">
                                                    {item.body}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 uppercase">
                                                    Sent On
                                                </p>

                                                <p className="text-slate-600">
                                                    {new Date(item.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            {item.productId && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase">
                                                        Linked Product
                                                    </p>

                                                    <div className="inline-flex items-center gap-2 mt-1 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
                                                        <Package size={16} />
                                                        {item.productId?.name || "Product"}
                                                    </div>
                                                </div>
                                            )}

                                        </div>

                                    </div>
                                </div>
                            ))}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationHistory;