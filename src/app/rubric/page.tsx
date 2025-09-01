'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, 
  Target, 
  Star, 
  BookOpen, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { RubricDomain, RubricItem } from '@/types';
import Navigation from '@/components/Navigation';
import BackButton from '@/components/BackButton';

export default function RubricPage() {
  const { data: session } = useSession();
  const [domains, setDomains] = useState<RubricDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/rubric');
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      }
    } catch (error) {
      console.error('Error fetching rubric data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDomains = () => {
    if (selectedDomain === 'ALL') {
      return domains.filter(domain => 
        domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.items.some(item => 
          item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    return domains.filter(domain => 
      domain.id === selectedDomain && (
        domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.items.some(item => 
          item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    );
  };

  const getRatingDescription = (rating: number) => {
    switch (rating) {
      case 5: return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 4: return { label: 'Very Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 3: return { label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 2: return { label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-100' };
      case 1: return { label: 'Unsatisfactory', color: 'text-red-600', bgColor: 'bg-red-100' };
      default: return { label: 'Not Rated', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredDomains = getFilteredDomains();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/" text="← Dashboard" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluation Rubric</h1>
          <p className="text-gray-600">Review the complete evaluation criteria and rating scale for teacher observations</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search rubric items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Domains</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>{domain.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rating Scale Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Scale</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const ratingInfo = getRatingDescription(rating);
              return (
                <div key={rating} className="flex items-center space-x-2 p-3 rounded-lg border">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ratingInfo.bgColor}`}>
                    <span className={`text-sm font-bold ${ratingInfo.color}`}>{rating}</span>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${ratingInfo.color}`}>{ratingInfo.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rubric Domains */}
        <div className="space-y-6">
          {filteredDomains.map((domain) => (
            <div key={domain.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{domain.name}</h3>
                      <p className="text-sm text-gray-600">{domain.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Items</div>
                    <div className="text-lg font-bold text-blue-600">{domain.items.length}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {domain.items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">Item {item.number}</h4>
                          <p className="text-sm text-gray-600">{item.prompt}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm text-gray-500">Max Score</div>
                          <div className="text-lg font-bold text-gray-900">{item.maxScore}</div>
                        </div>
                      </div>
                      
                      {/* Rating Criteria */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">Rating Criteria:</div>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const ratingInfo = getRatingDescription(rating);
                            return (
                              <div key={rating} className="flex items-center space-x-2 text-sm">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ratingInfo.bgColor}`}>
                                  <span className={`text-xs font-bold ${ratingInfo.color}`}>{rating}</span>
                                </div>
                                <span className="text-gray-600">{ratingInfo.label}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">
                                  {rating === 5 ? 'Exceptional performance' :
                                   rating === 4 ? 'Above average performance' :
                                   rating === 3 ? 'Satisfactory performance' :
                                   rating === 2 ? 'Below average performance' :
                                   'Unsatisfactory performance'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDomains.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rubric items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedDomain !== 'ALL'
                ? 'Try adjusting your search or filter criteria.'
                : 'No rubric domains are currently available.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
