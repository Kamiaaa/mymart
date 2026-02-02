'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiShoppingCart,
  FiUser,
  FiUsers,
  FiPackage,
  FiBarChart2,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
  FiDollarSign,
  FiTag,
  FiTruck
} from 'react-icons/fi';

interface LayoutProps {
  children: ReactNode;
}

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const Sidebar = ({ isCollapsed, isMobileOpen, setIsMobileOpen }: { 
  isCollapsed: boolean; 
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}) => {
  const pathname = usePathname();

  const sidebarItems: SidebarItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <FiHome className="w-5 h-5" /> },
    { name: 'Orders', href: '/admin/orders', icon: <FiShoppingCart className="w-5 h-5" /> },
    { name: 'Products', href: '/products/crud', icon: <FiPackage className="w-5 h-5" /> },
    { name: 'Customers', href: '/dashboard/customers', icon: <FiUsers className="w-5 h-5" /> },
    { name: 'Inventory', href: '/dashboard/inventory', icon: <FiTag className="w-5 h-5" /> },
    { name: 'Shipping', href: '/dashboard/shipping', icon: <FiTruck className="w-5 h-5" /> },
    { name: 'Analytics', href: '/dashboard/analytics', icon: <FiBarChart2 className="w-5 h-5" /> },
    { name: 'Revenue', href: '/dashboard/revenue', icon: <FiDollarSign className="w-5 h-5" /> },
    { name: 'Manage Users', href: '/admin', icon: <FiUser className="w-5 h-5" /> },
    { name: 'Settings', href: '/dashboard/settings', icon: <FiSettings className="w-5 h-5" /> },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-64'}
        h-full flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <span className="text-xl font-bold text-gray-800">E-Commerce</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">EC</span>
            </div>
          )}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              onClick={() => setIsMobileOpen(false)}
            >
              <div className={`${isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}`}>
                {item.icon}
              </div>
              {!isCollapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* User profile */}
        <div className={`
          p-4 border-t border-gray-200
          ${isCollapsed ? 'text-center' : ''}
        `}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">AD</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-sm text-gray-500 truncate">admin@example.com</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const Layout = ({ children }: LayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100"
              >
                {isCollapsed ? (
                  <FiChevronRight className="w-5 h-5" />
                ) : (
                  <FiChevronLeft className="w-5 h-5" />
                )}
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <FiShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">AD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;