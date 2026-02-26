import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  FileText, Code, Search, Mic, Image, Video, Database,
  History, CreditCard, Settings, ChevronLeft, ChevronRight,
  LogOut, Moon, Sun, Users, LayoutDashboard, Zap, ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/content', icon: FileText, label: 'Content' },
  { path: '/code', icon: Code, label: 'Code' },
  { path: '/research', icon: Search, label: 'Research' },
  { path: '/audio', icon: Mic, label: 'Audio' },
  { path: '/image', icon: Image, label: 'Image' },
  { path: '/video', icon: Video, label: 'Video' },
  { path: '/knowledge', icon: Database, label: 'Knowledge Base' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/billing', icon: CreditCard, label: 'Billing' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, credits, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="fixed left-0 top-0 h-screen glass border-r border-white/10 z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg font-heading">JaipurEye</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Credits */}
      <div className={cn("px-4 py-3 mx-3 mt-4 rounded-xl bg-primary/10 border border-primary/20", collapsed && "mx-2 px-2")}>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          {!collapsed && (
            <div>
              <p className="text-xs text-muted-foreground">Credits</p>
              <p className="font-semibold text-primary" data-testid="credits-display">{credits}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "sidebar-item",
                    isActive && "active"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
          
          {/* Admin link - only visible for admins */}
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className={cn(
                  "sidebar-item",
                  location.pathname === '/admin' && "active"
                )}
                data-testid="nav-admin"
              >
                <Users className={cn("w-5 h-5", location.pathname === '/admin' ? "text-primary" : "text-muted-foreground")} />
                {!collapsed && <span>Admin</span>}
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Join Live Session */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <a
            href="https://meet.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors"
            data-testid="join-live-session"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm font-medium">Join Live Session</span>
          </a>
        </div>
      )}

      {/* Bottom section */}
      <div className="p-3 border-t border-white/10">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          className={cn("w-full justify-start gap-3 mb-2", collapsed && "justify-center")}
          onClick={toggleTheme}
          data-testid="theme-toggle"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </Button>

        {/* User info & logout */}
        <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
