'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, 
  MapPin, 
  Users, 
  BookOpen, 
  TrendingUp,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import { Branch, Teacher, ObservationStatus } from '@/types';
import Navigation from '@/components/Navigation';
import BackButton from '@/components/BackButton';

interface BranchWithStats extends Branch {
  teacherCount: number;
  observationCount: number;
  averageRating: number;
}

export default function BranchesPage() {
  const { data: session } = useSession();
  const [branches, setBranches] = useState<BranchWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [branchesRes, teachersRes, observationsRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/teachers'),
        fetch('/api/observations')
      ]);

      if (branchesRes.ok && teachersRes.ok && observationsRes.ok) {
        const branchesData = await branchesRes.json();
        const teachersData = await teachersRes.json();
        const observationsData = await observationsRes.json();

        // Calculate stats for each branch
        const branchesWithStats = branchesData.branches.map((branch: Branch) => {
          const branchTeachers = teachersData.teachers.filter((teacher: Teacher) => teacher.branchId === branch.id);
          const branchObservations = observationsData.observations.filter((obs: any) => obs.branchId === branch.id);
          
          const averageRating = branchObservations.length > 0 
            ? branchObservations.reduce((sum: number, obs: any) => sum + (obs.overallRating || 0), 0) / branchObservations.length
            : 0;

          return {
            ...branch,
            teacherCount: branchTeachers.length,
            observationCount: branchObservations.length,
            averageRating
          };
        });

        setBranches(branchesWithStats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBranches = () => {
    return branches.filter(branch => 
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredBranches = getFilteredBranches();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/" text="← Dashboard" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Branches</h1>
          <p className="text-gray-600">View information about all school branches and their performance</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div key={branch.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Branch Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                      <p className="text-sm text-gray-500">{branch.address}</p>
                    </div>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Branch
                  </span>
                </div>

                {/* Branch Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      Teachers
                    </div>
                    <span className="text-sm font-medium text-gray-900">{branch.teacherCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                      Observations
                    </div>
                    <span className="text-sm font-medium text-gray-900">{branch.observationCount}</span>
                  </div>
                  
                  {branch.averageRating > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                        Avg Rating
                      </div>
                      <span className={`text-sm font-medium ${getRatingColor(branch.averageRating)}`}>
                        {branch.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Branch Details */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Location</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{branch.address}</p>
                  
                  <div className="text-xs text-gray-400">
                    Created: {new Date(branch.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBranches.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No branches found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'No branches are currently available.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
