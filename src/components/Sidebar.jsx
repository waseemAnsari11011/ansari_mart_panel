import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Layers,
  Package,
  ShoppingBag,
  Settings,
  ChevronRight,
  LogOut,
  Map
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import logoImg from '../assets/logo.png';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Retail Customers', icon: Users, path: '/customers' },
  { name: 'Business Users', icon: Store, path: '/business' },
  { name: 'Categories', icon: Layers, path: '/categories' },
  { name: 'Products', icon: Package, path: '/products' },
  { name: 'Orders', icon: ShoppingBag, path: '/orders' },
  { name: 'Delivery Zones', icon: Map, path: '/delivery-zones' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

export const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 border-r border-slate-800 z-50 transition-all duration-300">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="py-6">
          <div className="flex items-center space-x-1">
            <img src={logoImg} alt="Ansari Mart Logo" className="h-18 w-auto" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">
                ANSARI<span className="text-orange-500">MART</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-green-500/10 text-green-400 font-semibold shadow-sm"
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                  "group-hover:text-green-400"
                )} />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl hover:bg-slate-800 hover:text-red-400 transition-all duration-200 text-slate-400"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
