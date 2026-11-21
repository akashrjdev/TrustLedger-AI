import React from 'react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';
import {
  LayoutDashboard,
  FileText,
  Building2,
  CreditCard,
  Receipt,
  ShieldCheck,
  FileSearch,
  BarChart3,
  ScrollText,
  Settings,
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, stats } = useApp();

  const navItems: Array<{
    key: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      key: 'invoices',
      label: 'Invoice Management',
      icon: <FileText className="w-4 h-4 shrink-0" />,
      badge: stats.totalInvoicesCount,
    },
    {
      key: 'vendors',
      label: 'Vendor Management',
      icon: <Building2 className="w-4 h-4 shrink-0" />,
      badge: stats.totalVendorsCount,
    },
    {
      key: 'payments',
      label: 'Payment Monitoring',
      icon: <CreditCard className="w-4 h-4 shrink-0" />,
      badge: stats.totalPaymentsCount,
    },
    {
      key: 'expenses',
      label: 'Employee Expenses',
      icon: <Receipt className="w-4 h-4 shrink-0" />,
      badge: stats.totalExpensesCount,
    },
    {
      key: 'fraud-centre',
      label: 'Fraud Detection Centre',
      icon: <ShieldCheck className="w-4 h-4 shrink-0 text-[#F58220]" />,
    },
    {
      key: 'investigations',
      label: 'Investigation Queue',
      icon: <FileSearch className="w-4 h-4 shrink-0" />,
      badge: stats.pendingInvestigations,
      badgeColor: 'bg-red-600 text-white',
    },
    {
      key: 'reports',
      label: 'Reports & Analytics',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      key: 'audit-logs',
      label: 'Audit Logs',
      icon: <ScrollText className="w-4 h-4 shrink-0" />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[77px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center space-x-1 overflow-x-auto py-2.5 scrollbar-thin">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#F58220] text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                role="tab"
                aria-selected={isActive}
              >
                {item.icon}
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-black font-mono leading-none ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-white text-[#F58220]'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
