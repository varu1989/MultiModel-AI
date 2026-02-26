import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Toaster } from './ui/sonner';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Noise overlay */}
      <div className="noise-overlay" />
      
      <Sidebar />
      
      {/* Main content */}
      <main className="ml-[280px] min-h-screen p-8">
        <Outlet />
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
};

export default DashboardLayout;
