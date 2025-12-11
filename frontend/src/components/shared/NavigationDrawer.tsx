'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, Scan, FileText, BarChart3, LogOut, Menu, FileCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Patrol Scanner',
    path: ROUTES.SCAN,
    icon: <Scan className="h-5 w-5" />,
  },
  {
    label: 'Patrol Logs',
    path: ROUTES.LOGS,
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Reports',
    path: ROUTES.REPORTS,
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: 'التقرير',
    path: ROUTES.PATROL_REPORT,
    icon: <FileCheck className="h-5 w-5" />,
  },
];

export function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  // Close drawer on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleNavigation = (path: string) => {
    if (pathname !== path) {
      router.push(path);
    }
    onClose();
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-80 shadow-xl z-50 transform transition-transform duration-300 ease-in-out border-r border-border',
          'bg-[hsl(222,47%,15%)]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'hsl(222, 47%, 15%)' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-border bg-muted">
              <p className="text-sm font-medium text-foreground">
                {user.guardName}
              </p>
              {user.permissions && user.permissions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {user.permissions.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer - Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Hamburger menu button component
export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="h-9 w-9"
      title="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

