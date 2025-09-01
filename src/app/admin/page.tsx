'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  School, 
  FileText, 
  Settings, 
  BarChart3, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  UserCheck,
  Award,
  TrendingUp,
  Database,
  Activity
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import BackButton from '@/components/BackButton';

interface DashboardStats {
  totalUsers: number;
  totalTeachers: number;
  totalObservations: number;
  totalBranches: number;
  recentObservations: number;
  pendingReviews: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTeachers: 0,
    totalObservations: 0,
    totalBranches: 0,
    recentObservations: 0,
    pendingReviews: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchDashboardStats();
  }, [session, status, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'manage-users',
      title: 'Manage Users',
      description: 'Add, edit, and manage system users',
      icon: <Users className="w-6 h-6" />,
      action: () => router.push('/admin/users'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'manage-teachers',
      title: 'Manage Teachers',
      description: 'Add, edit, and manage teacher profiles',
      icon: <School className="w-6 h-6" />,
      action: () => router.push('/admin/teachers'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'manage-rubric',
      title: 'Customize Rubric',
      description: 'Edit evaluation criteria and domains',
      icon: <FileText className="w-6 h-6" />,
      action: () => router.push('/admin/rubric'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'manage-branches',
      title: 'Manage Branches',
      description: 'Add and manage school branches',
      icon: <School className="w-6 h-6" />,
      action: () => router.push('/admin/branches'),
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      description: 'Monitor system activities and changes',
      icon: <FileText className="w-6 h-6" />,
      action: () => router.push('/admin/audit-logs'),
      color: 'bg-red-500 hover:bg-red-600'
    },
          {
        id: 'system-health',
        title: 'System Health',
        description: 'Monitor system performance and status',
        icon: <Activity className="w-6 h-6" />,
        action: () => router.push('/admin/system-health'),
        color: 'bg-teal-500 hover:bg-teal-600'
      },
      {
        id: 'bulk-operations',
        title: 'Bulk Operations',
        description: 'Perform bulk actions on users, teachers, and branches',
        icon: <Database className="w-6 h-6" />,
        action: () => router.push('/admin/bulk-operations'),
        color: 'bg-purple-500 hover:bg-purple-600'
      },
      {
        id: 'system-settings',
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: <Settings className="w-6 h-6" />,
      action: () => router.push('/admin/settings'),
      color: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'View detailed reports and analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      action: () => router.push('/admin/reports'),
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage system notifications and alerts',
      icon: <Activity className="w-6 h-6" />,
      action: () => router.push('/admin/notifications'),
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    {
      id: 'backup-restore',
      title: 'Backup & Restore',
      description: 'Create and restore database backups',
      icon: <Database className="w-6 h-6" />,
      action: () => router.push('/admin/backup'),
      color: 'bg-cyan-500 hover:bg-cyan-600'
    }
  ];

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/" text="← Dashboard" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-900">
            Manage your teacher evaluation system and customize everything
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <School className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Observations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalObservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <School className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBranches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Observations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentObservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.action}
                className={`${action.color} text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-left group`}
              >
                <div className="flex items-center mb-3">
                  {action.icon}
                  <Plus className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">New user registered</p>
                  <p className="text-sm text-gray-600">John Doe joined as an Observer</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">Observation submitted</p>
                  <p className="text-sm text-gray-600">Math class observation by Sarah Smith</p>
                </div>
                <span className="text-sm text-gray-500">4 hours ago</span>
              </div>
              
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-4 h-4 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">System settings updated</p>
                  <p className="text-sm text-gray-600">Rubric scoring criteria modified</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
