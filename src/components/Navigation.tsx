'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, School, Home, BookOpen, Users, BarChart3, Settings, Building2, Target } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const getNavLinks = () => {
    if (!session) return [];

    const links = [
      { href: '/', label: 'Home', icon: Home },
      { href: '/observations', label: 'Observations', icon: BookOpen },
      { href: '/teachers', label: 'Teachers', icon: Users },
      { href: '/branches', label: 'Branches', icon: Building2 },
      { href: '/rubric', label: 'Rubric', icon: Target },
    ];

    // Add admin-only links
    if (session.user.role === 'ADMIN') {
      links.push(
        { href: '/admin', label: 'Admin', icon: BarChart3 },
        { href: '/admin/settings', label: 'Settings', icon: Settings }
      );
    }

    return links;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <School className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">
              Teacher Evaluation System
            </h1>
          </div>
          
          {session && (
            <div className="flex items-center space-x-6">
              {/* Navigation Links */}
              <div className="flex items-center space-x-1">
                {getNavLinks().map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive(link.href)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{session.user.name}</span>
                  {session.user.branchName && (
                    <span className="text-gray-500">• {session.user.branchName}</span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
