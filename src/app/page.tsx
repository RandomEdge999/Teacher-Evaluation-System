'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Building2, 
  Target, 
  TrendingUp,
  Calendar,
  Clock,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { 
  RubricDomain, 
  Branch, 
  Teacher, 
  ObservationStatus,

} from '@/types';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface DashboardStats {
  totalObservations: number;
  totalTeachers: number;
  totalBranches: number;
  totalDomains: number;
  recentObservations: number;
  pendingReviews: number;
  averageRating: number;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalObservations: 0,
    totalTeachers: 0,
    totalBranches: 0,
    totalDomains: 0,
    recentObservations: 0,
    pendingReviews: 0,
    averageRating: 0
  });
  const [recentObservations, setRecentObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const [observationsRes, teachersRes, branchesRes, rubricRes] = await Promise.all([
        fetch('/api/observations'),
        fetch('/api/teachers'),
        fetch('/api/branches'),
        fetch('/api/rubric')
      ]);

      if (observationsRes.ok && teachersRes.ok && branchesRes.ok && rubricRes.ok) {
        const observationsData = await observationsRes.json();
        const teachersData = await teachersRes.json();
        const branchesData = await branchesRes.json();
        const rubricData = await rubricRes.json();

        const observations = observationsData.observations || [];
        const teachers = teachersData.teachers || [];
        const branches = branchesData.branches || [];
        const domains = rubricData || [];

        // Calculate stats
        const totalObservations = observations.length;
        const totalTeachers = teachers.length;
        const totalBranches = branches.length;
        const totalDomains = domains.length;
        
        const recentObservations = observations.filter((obs: any) => {
          const obsDate = new Date(obs.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return obsDate >= weekAgo;
        }).length;

        const pendingReviews = observations.filter((obs: any) => 
          obs.status === 'submitted' || obs.status === 'reviewed'
        ).length;

        const averageRating = observations.length > 0 
          ? observations.reduce((sum: number, obs: any) => sum + (obs.overallRating || 0), 0) / observations.length
          : 0;

        setStats({
          totalObservations,
          totalTeachers,
          totalBranches,
          totalDomains,
          recentObservations,
          pendingReviews,
          averageRating
        });

        // Get recent observations for display
        const recent = observations
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentObservations(recent);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ObservationStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'finalized': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (status === 'unauthenticated') {
    window.location.href = '/auth/signin';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {session?.user?.name}. Here's an overview of your teacher evaluation system.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/observations" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">New Observation</h3>
                  <p className="text-sm text-gray-500">Create a new teacher evaluation</p>
                </div>
              </div>
            </Link>
            
            <Link href="/observations" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">View Observations</h3>
                  <p className="text-sm text-gray-500">Review all evaluations</p>
                </div>
              </div>
            </Link>
            
            <Link href="/teachers" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Manage Teachers</h3>
                  <p className="text-sm text-gray-500">View teacher information</p>
                </div>
              </div>
            </Link>
            
            <Link href="/rubric" className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">View Rubric</h3>
                  <p className="text-sm text-gray-500">Evaluation criteria</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Observations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalObservations}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Branches</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBranches}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className={`text-2xl font-bold ${getRatingColor(stats.averageRating)}`}>
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Observations</h3>
                <Link href="/observations" className="text-sm text-blue-600 hover:text-blue-800">
                  View all →
                </Link>
              </div>
            </div>
            
            {recentObservations.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentObservations.map((observation) => (
                  <div key={observation.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {observation.teacher.fullName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {observation.subject} • {observation.topic}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(observation.date).toLocaleDateString()}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(observation.status)}`}>
                              {observation.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">Rating</p>
                          <p className={`text-lg font-bold ${getRatingColor(observation.overallRating || 0)}`}>
                            {(observation.overallRating || 0).toFixed(1)}
                          </p>
                        </div>
                        <Link href={`/observations`} className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No observations yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first observation.
                </p>
                <div className="mt-6">
                  <Link
                    href="/observations"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Observation
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Observations</span>
                <span className="text-sm font-medium text-gray-900">{stats.recentObservations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Reviews</span>
                <span className="text-sm font-medium text-gray-900">{stats.pendingReviews}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Evaluation Domains</span>
                <span className="text-sm font-medium text-gray-900">{stats.totalDomains}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Branches</span>
                <span className="text-sm font-medium text-gray-900">{stats.totalBranches}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
