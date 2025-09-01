'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Settings
} from 'lucide-react';
import Navigation from '@/components/Navigation';

interface RubricDomain {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  isActive: boolean;
  items: RubricItem[];
}

interface RubricItem {
  id: string;
  number: number;
  prompt: string;
  orderIndex: number;
  maxScore: number;
  scaleMin: number;
  scaleMax: number;
  isActive: boolean;
}

export default function RubricManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [domains, setDomains] = useState<RubricDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDomain, setEditingDomain] = useState<RubricDomain | null>(null);
  const [editingItem, setEditingItem] = useState<RubricItem | null>(null);
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  // Form state for domain
  const [domainForm, setDomainForm] = useState({
    name: '',
    description: '',
    orderIndex: 0
  });

  // Form state for item
  const [itemForm, setItemForm] = useState({
    number: 1,
    prompt: '',
    orderIndex: 1,
    maxScore: 5,
    scaleMin: 0,
    scaleMax: 5
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchRubric();
  }, [session, status, router]);

  const fetchRubric = async () => {
    try {
      const response = await fetch('/api/admin/rubric');
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
        // Expand all domains by default
        setExpandedDomains(new Set(data.map((d: RubricDomain) => d.id)));
      }
    } catch (error) {
      console.error('Error fetching rubric:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/rubric/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(domainForm)
      });

      if (response.ok) {
        setShowAddDomainModal(false);
        setDomainForm({ name: '', description: '', orderIndex: 0 });
        fetchRubric();
      }
    } catch (error) {
      console.error('Error adding domain:', error);
    }
  };

  const handleEditDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomain) return;

    try {
      const response = await fetch(`/api/admin/rubric/domains/${editingDomain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(domainForm)
      });

      if (response.ok) {
        setEditingDomain(null);
        setDomainForm({ name: '', description: '', orderIndex: 0 });
        fetchRubric();
      }
    } catch (error) {
      console.error('Error updating domain:', error);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain? This will also delete all its items.')) return;

    try {
      const response = await fetch(`/api/admin/rubric/domains/${domainId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchRubric();
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomain) return;

    try {
      const response = await fetch('/api/admin/rubric/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemForm,
          domainId: editingDomain.id
        })
      });

      if (response.ok) {
        setShowAddItemModal(false);
        setItemForm({ number: 1, prompt: '', orderIndex: 1, maxScore: 5, scaleMin: 0, scaleMax: 5 });
        fetchRubric();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/admin/rubric/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm)
      });

      if (response.ok) {
        setEditingItem(null);
        setItemForm({ number: 1, prompt: '', orderIndex: 1, maxScore: 5, scaleMin: 0, scaleMax: 5 });
        fetchRubric();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/admin/rubric/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchRubric();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const toggleDomainExpansion = (domainId: string) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domainId)) {
      newExpanded.delete(domainId);
    } else {
      newExpanded.add(domainId);
    }
    setExpandedDomains(newExpanded);
  };

  const openEditDomainModal = (domain: RubricDomain) => {
    setEditingDomain(domain);
    setDomainForm({
      name: domain.name,
      description: domain.description,
      orderIndex: domain.orderIndex
    });
  };

  const openEditItemModal = (item: RubricItem) => {
    setEditingItem(item);
    setItemForm({
      number: item.number,
      prompt: item.prompt,
      orderIndex: item.orderIndex,
      maxScore: item.maxScore,
      scaleMin: item.scaleMin,
      scaleMax: item.scaleMax
    });
  };

  const openAddItemModal = (domain: RubricDomain) => {
    setEditingDomain(domain);
    setShowAddItemModal(true);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rubric management...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rubric Management</h1>
              <p className="mt-2 text-gray-600">
                Customize evaluation criteria, domains, and scoring scales
              </p>
            </div>
            <button
              onClick={() => setShowAddDomainModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Domain
            </button>
          </div>
        </div>

        {/* Rubric Structure */}
        <div className="space-y-4">
          {domains.map((domain) => (
            <div key={domain.id} className="bg-white rounded-lg shadow">
              {/* Domain Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleDomainExpansion(domain.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedDomains.has(domain.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {domain.name}
                      </h3>
                      <p className="text-sm text-gray-600">{domain.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditDomainModal(domain)}
                      className="text-blue-600 hover:text-blue-900 p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="text-red-600 hover:text-red-900 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Domain Items */}
              {expandedDomains.has(domain.id) && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Evaluation Items</h4>
                    <button
                      onClick={() => openAddItemModal(domain)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {domain.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">
                              {item.number}.
                            </span>
                            <p className="text-sm text-gray-700">{item.prompt}</p>
                          </div>
                          <div className="ml-6 mt-1 text-xs text-gray-500">
                            Score: {item.scaleMin}-{item.scaleMax} | Max: {item.maxScore}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditItemModal(item)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Domain Modal */}
      {showAddDomainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Domain</h3>
            <form onSubmit={handleAddDomain}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    required
                    value={domainForm.name}
                    onChange={(e) => setDomainForm({...domainForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={domainForm.description}
                    onChange={(e) => setDomainForm({...domainForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Index
                  </label>
                  <input
                    type="number"
                    required
                    value={domainForm.orderIndex}
                    onChange={(e) => setDomainForm({...domainForm, orderIndex: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddDomainModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Domain Modal */}
      {editingDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Domain</h3>
            <form onSubmit={handleEditDomain}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domain Name
                  </label>
                  <input
                    type="text"
                    required
                    value={domainForm.name}
                    onChange={(e) => setDomainForm({...domainForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    value={domainForm.description}
                    onChange={(e) => setDomainForm({...domainForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Index
                  </label>
                  <input
                    type="number"
                    required
                    value={domainForm.orderIndex}
                    onChange={(e) => setDomainForm({...domainForm, orderIndex: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingDomain(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && editingDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Item to {editingDomain.name}
            </h3>
            <form onSubmit={handleAddItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Number
                  </label>
                  <input
                    type="number"
                    required
                    value={itemForm.number}
                    onChange={(e) => setItemForm({...itemForm, number: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt/Question
                  </label>
                  <textarea
                    required
                    value={itemForm.prompt}
                    onChange={(e) => setItemForm({...itemForm, prompt: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Index
                    </label>
                    <input
                      type="number"
                      required
                      value={itemForm.orderIndex}
                      onChange={(e) => setItemForm({...itemForm, orderIndex: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Score
                    </label>
                    <input
                      type="number"
                      required
                      value={itemForm.scaleMin}
                      onChange={(e) => setItemForm({...itemForm, scaleMin: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      required
                      value={itemForm.maxScore}
                      onChange={(e) => setItemForm({...itemForm, maxScore: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Item</h3>
            <form onSubmit={handleEditItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Number
                  </label>
                  <input
                    type="number"
                    required
                    value={itemForm.number}
                    onChange={(e) => setItemForm({...itemForm, number: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt/Question
                  </label>
                  <textarea
                    required
                    value={itemForm.prompt}
                    onChange={(e) => setItemForm({...itemForm, prompt: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Index
                    </label>
                    <input
                      type="number"
                      required
                      value={itemForm.orderIndex}
                      onChange={(e) => setItemForm({...itemForm, orderIndex: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Score
                    </label>
                    <input
                      type="number"
                      required
                      value={itemForm.scaleMin}
                      onChange={(e) => setItemForm({...itemForm, scaleMin: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      required
                      value={itemForm.maxScore}
                      onChange={(e) => setItemForm({...itemForm, maxScore: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
