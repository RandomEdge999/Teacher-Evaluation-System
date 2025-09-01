'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  User,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import { ObservationFormData, ObservationStatus, RubricDomain, Branch, Teacher } from '@/types';
import { ObservationForm } from '@/components/ObservationForm';
import { calculateOverallRating } from '@/utils/scoring';
import BackButton from '@/components/BackButton';

interface ObservationWithDetails extends ObservationFormData {
  id: string;
  status: ObservationStatus;
  createdAt: string;
  updatedAt: string;
  teacher: Teacher;
  branch: Branch;
  overallRating: number;
}

export default function ObservationsPage() {
  const { data: session } = useSession();
  const [observations, setObservations] = useState<ObservationWithDetails[]>([]);
  const [domains, setDomains] = useState<RubricDomain[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingObservation, setEditingObservation] = useState<ObservationWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ObservationStatus | 'ALL'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [observationsRes, domainsRes, branchesRes, teachersRes] = await Promise.all([
        fetch('/api/observations'),
        fetch('/api/rubric'),
        fetch('/api/branches'),
        fetch('/api/teachers')
      ]);

      if (observationsRes.ok) {
        const observationsData = await observationsRes.json();
        setObservations(observationsData.observations || []);
      }

      if (domainsRes.ok) {
        const domainsData = await domainsRes.json();
        setDomains(domainsData);
      }

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(branchesData.branches || []);
      }

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData.teachers || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObservation = async (data: ObservationFormData) => {
    try {
      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const newObservation = await response.json();
        setObservations(prev => [newObservation, ...prev]);
        setShowCreateForm(false);
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating observation:', error);
    }
  };

  const handleSaveDraft = async (data: ObservationFormData) => {
    try {
      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'draft' })
      });

      if (response.ok) {
        const newObservation = await response.json();
        setObservations(prev => [newObservation, ...prev]);
        setShowCreateForm(false);
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleUpdateObservation = async (data: ObservationFormData) => {
    if (!editingObservation) return;

    try {
      const response = await fetch(`/api/observations/${editingObservation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        fetchData(); // Refresh the list
        setEditingObservation(null);
      }
    } catch (error) {
      console.error('Error updating observation:', error);
    }
  };

  const handleDeleteObservation = async (observationId: string) => {
    if (!confirm('Are you sure you want to delete this observation?')) return;

    try {
      const response = await fetch(`/api/observations/${observationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setObservations(prev => prev.filter(obs => obs.id !== observationId));
      }
    } catch (error) {
      console.error('Error deleting observation:', error);
    }
  };

  const handleStatusChange = async (observationId: string, newStatus: ObservationStatus) => {
    try {
      const response = await fetch(`/api/observations/${observationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const exportObservation = async (observationId: string) => {
    try {
      const response = await fetch(`/api/observations/${observationId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `observation-${observationId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting observation:', error);
    }
  };

  const getFilteredObservations = () => {
    return observations.filter(observation => {
      const matchesSearch = 
        observation.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        observation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        observation.topic.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || observation.status === statusFilter;
      const matchesBranch = branchFilter === 'ALL' || observation.branchId === branchFilter;

      return matchesSearch && matchesStatus && matchesBranch;
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredObservations = getFilteredObservations();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <BackButton href="/" text="← Dashboard" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Observations</h1>
          <p className="text-gray-600">Manage and review teacher observations</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search observations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ObservationStatus | 'ALL')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="finalized">Finalized</option>
              </select>

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Observation
            </button>
          </div>
        </div>

        {/* Observations List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredObservations.map((observation) => (
                  <tr key={observation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {observation.teacher.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {observation.branch.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {observation.subject}
                        </div>
                        <div className="text-sm text-gray-500">
                          {observation.topic}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(observation.date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(observation.status)}`}>
                        {observation.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                        <span className={`text-sm font-medium ${getRatingColor(observation.overallRating || 0)}`}>
                          {(observation.overallRating || 0).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => exportObservation(observation.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Export"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingObservation(observation)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteObservation(observation.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredObservations.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No observations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL' || branchFilter !== 'ALL' 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating a new observation.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateForm || editingObservation) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingObservation ? 'Edit Observation' : 'Create New Observation'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingObservation(null);
                  }}
                  className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6">
                <ObservationForm
                  domains={domains}
                  branches={branches}
                  teachers={teachers}
                  initialData={editingObservation || undefined}
                  onSubmit={editingObservation ? handleUpdateObservation : handleCreateObservation}
                  onSaveDraft={handleSaveDraft}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
