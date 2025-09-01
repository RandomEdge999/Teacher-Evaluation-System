'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  School, 
  Building2, 
  Upload, 
  Download, 
  Trash2, 
  Edit, 
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react';
import Navigation from '@/components/Navigation';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  branchName: string;
}

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  branchName: string;
  isActive: boolean;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

type EntityType = 'users' | 'teachers' | 'branches';

interface BulkOperation {
  id: string;
  type: EntityType;
  action: 'activate' | 'deactivate' | 'delete' | 'export' | 'import';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export default function BulkOperations() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('users');
  const [entities, setEntities] = useState<User[] | Teacher[] | Branch[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchEntities();
    fetchBulkOperations();
  }, [session, status, router, selectedEntity]);

  const fetchEntities = async () => {
    try {
      setIsLoading(true);
      let endpoint = '';
      switch (selectedEntity) {
        case 'users':
          endpoint = '/api/admin/users';
          break;
        case 'teachers':
          endpoint = '/api/teachers';
          break;
        case 'branches':
          endpoint = '/api/admin/branches';
          break;
      }
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setEntities(data);
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBulkOperations = async () => {
    try {
      const response = await fetch('/api/admin/bulk-operations');
      if (response.ok) {
        const data = await response.json();
        setBulkOperations(data);
      }
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === entities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(entities.map((entity: any) => entity.id));
    }
  };

  const handleSelectEntity = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return;

    try {
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: selectedEntity,
          action,
          entityIds: selectedIds
        })
      });

      if (response.ok) {
        // Refresh entities and operations
        fetchEntities();
        fetchBulkOperations();
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) return;

    try {
      const params = new URLSearchParams({
        entityType: selectedEntity,
        entityIds: selectedIds.join(','),
        format: 'csv'
      });
      
      const response = await fetch(`/api/admin/bulk-operations/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedEntity}-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('entityType', selectedEntity);

      const response = await fetch('/api/admin/bulk-operations/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowImportModal(false);
        setImportFile(null);
        fetchEntities();
        fetchBulkOperations();
      }
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const getEntityDisplayName = (entity: any) => {
    switch (selectedEntity) {
      case 'users':
        return entity.fullName;
      case 'teachers':
        return entity.fullName;
      case 'branches':
        return entity.name;
      default:
        return 'Unknown';
    }
  };

  const getEntityStatus = (entity: any) => {
    return entity.isActive ? 'Active' : 'Inactive';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getOperationStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bulk operations...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
          <p className="mt-2 text-gray-600">
            Manage multiple records at once with bulk actions
          </p>
        </div>

        {/* Entity Type Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedEntity('users')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedEntity === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setSelectedEntity('teachers')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedEntity === 'teachers'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <School className="w-4 h-4 inline mr-2" />
              Teachers
            </button>
            <button
              onClick={() => setSelectedEntity('branches')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedEntity === 'branches'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Branches
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedIds.length} {selectedEntity} selected
                </span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200"
                >
                  <Minus className="w-4 h-4 inline mr-1" />
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Export
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import/Export Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Data Operations</h3>
              <p className="text-sm text-gray-600">
                Import or export {selectedEntity} data
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Import
              </button>
              <button
                onClick={() => handleExport()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export All
              </button>
            </div>
          </div>
        </div>

        {/* Entities Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1)} ({entities.length})
              </h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center"
                    >
                      {selectedIds.length === entities.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entities
                  .filter((entity: any) => {
                    const matchesSearch = getEntityDisplayName(entity)
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase());
                    const matchesStatus = filterStatus === 'all' || 
                      (filterStatus === 'active' ? entity.isActive : !entity.isActive);
                    return matchesSearch && matchesStatus;
                  })
                  .map((entity: any) => (
                    <tr key={entity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectEntity(entity.id)}
                          className="flex items-center"
                        >
                          {selectedIds.includes(entity.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getEntityDisplayName(entity)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{entity.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{entity.branchName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(getEntityStatus(entity))}
                          <span className="ml-2 text-sm text-gray-900">
                            {getEntityStatus(entity)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Operations History */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Bulk Operations History</h3>
            <p className="text-sm text-gray-600">
              Track the status of recent bulk operations
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bulkOperations.slice(0, 10).map((operation) => (
                  <tr key={operation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {operation.action} {operation.type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {operation.totalItems} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getOperationStatusIcon(operation.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOperationStatusColor(operation.status)}`}>
                          {operation.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {operation.processedItems} / {operation.totalItems}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(operation.processedItems / operation.totalItems) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(operation.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Import {selectedEntity}</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>File should contain columns for:</p>
                  <ul className="list-disc list-inside mt-1">
                    {selectedEntity === 'users' && (
                      <>
                        <li>email</li>
                        <li>fullName</li>
                        <li>role</li>
                        <li>branchId</li>
                      </>
                    )}
                    {selectedEntity === 'teachers' && (
                      <>
                        <li>fullName</li>
                        <li>email</li>
                        <li>phone</li>
                        <li>branchId</li>
                      </>
                    )}
                    {selectedEntity === 'branches' && (
                      <>
                        <li>name</li>
                        <li>address</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importFile}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
