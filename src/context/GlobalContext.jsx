import React, { createContext, useContext, useState, useCallback } from 'react';

const GlobalContext = createContext();

export const useGlobalState = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobalState must be used within a GlobalProvider');
    }
    return context;
};

export const GlobalProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [retailUsers, setRetailUsers] = useState([]);
    const [businessUsers, setBusinessUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [dashboardData, setDashboardData] = useState(null);
    const [settings, setSettings] = useState(null);
    const [lastFetched, setLastFetched] = useState({
        orders: 0,
        retailUsers: 0,
        businessUsers: 0,
        categories: 0,
        products: 0,
        dashboard: 0,
        settings: 0
    });

    const updateProducts = useCallback((newProducts) => {
        setProducts(newProducts);
        setLastFetched(prev => ({ ...prev, products: Date.now() }));
    }, []);

    const updateOrders = useCallback((newOrders) => {
        setOrders(newOrders);
        setLastFetched(prev => ({ ...prev, orders: Date.now() }));
    }, []);

    const updateRetailUsers = useCallback((newUsers) => {
        setRetailUsers(newUsers);
        setLastFetched(prev => ({ ...prev, retailUsers: Date.now() }));
    }, []);

    const updateBusinessUsers = useCallback((newUsers) => {
        setBusinessUsers(newUsers);
        setLastFetched(prev => ({ ...prev, businessUsers: Date.now() }));
    }, []);

    const updateCategories = useCallback((newCats) => {
        setCategories(newCats);
        setLastFetched(prev => ({ ...prev, categories: Date.now() }));
    }, []);

    const updateDashboardData = useCallback((newData) => {
        setDashboardData(newData);
        setLastFetched(prev => ({ ...prev, dashboard: Date.now() }));
    }, []);

    const updateSettings = useCallback((newSettings) => {
        setSettings(newSettings);
        setLastFetched(prev => ({ ...prev, settings: Date.now() }));
    }, []);

    const clearCache = useCallback(() => {
        setLastFetched({
            orders: 0,
            retailUsers: 0,
            businessUsers: 0,
            categories: 0,
            products: 0,
            dashboard: 0,
            settings: 0
        });
    }, []);

    const value = {
        orders,
        products,
        retailUsers,
        businessUsers,
        categories,
        dashboardData,
        settings,
        lastFetched,
        updateOrders,
        updateProducts,
        updateRetailUsers,
        updateBusinessUsers,
        updateCategories,
        updateDashboardData,
        updateSettings,
        clearCache
    };

    return (
        <GlobalContext.Provider value={value}>
            {children}
        </GlobalContext.Provider>
    );
};
