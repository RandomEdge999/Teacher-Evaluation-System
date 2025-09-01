'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Download, 
  Upload, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  FileText,
  Shield
} from 'lucide-react';
import Navigation from '@/components/Navigation';

interface BackupInfo {
  timestamp: string;
  version: string;
  dataSize: number;
  recordCount: number;
}

export default function BackupRestore() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setBackupInfo({
          timestamp: result.backup.timestamp,
          version: result.backup.version,
          dataSize: JSON.stringify(result.backup).length,
          recordCount: Object.values(result.backup.data).reduce((acc: number, curr: any) => acc + (Array.isArray(curr) ? curr.length : 0), 0)
        });
        setMessage({ type: 'success', text: 'Backup created successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to create backup' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while creating backup' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setRestoreFile(file);
      setMessage(null);
    } else {
      setMessage({ type: 'error', text: 'Please select a valid JSON backup file' });
    }
  };

  const handleRestore = async () => {
    if (!restoreFile || !confirmRestore) {
      setMessage({ type: 'error', text: 'Please select a file and confirm restore' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const fileContent = await restoreFile.text();
      const backupData = JSON.parse(fileContent);

      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupData,
          confirmRestore: true
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Database restored successfully!' });
        setRestoreFile(null);
        setConfirmRestore(false);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to restore database' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Invalid backup file format' });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackup = () => {
    if (!backupInfo) return;
    
    // Create a sample backup data structure
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
              data: {
          users: [],
          teachers: [],
          branches: [],
          observations: [],
          observationItemScores: [],
          rubricDomains: [],
          rubricItems: [],
          notifications: [],
          notificationRecipients: [],
          auditLogs: [],
          settings: []
        }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Backup & Restore</h1>
          <p className="mt-2 text-gray-600">
            Manage database backups and restore operations
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Backup Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-3">Create Backup</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Create a complete backup of your database. This will export all data in JSON format.
            </p>

            <button
              onClick={handleCreateBackup}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Create Backup
                </>
              )}
            </button>

            {backupInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Backup Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(backupInfo.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{backupInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Size:</span>
                    <span className="font-medium">{(backupInfo.dataSize / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Records:</span>
                    <span className="font-medium">{backupInfo.recordCount}</span>
                  </div>
                </div>
                
                <button
                  onClick={downloadBackup}
                  className="mt-3 w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Backup
                </button>
              </div>
            )}
          </div>

          {/* Restore Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-3">Restore Database</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Backup File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only JSON backup files are supported
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confirmRestore"
                  checked={confirmRestore}
                  onChange={(e) => setConfirmRestore(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="confirmRestore" className="ml-2 text-sm text-gray-700">
                  I understand this will overwrite all existing data
                </label>
              </div>

              <button
                onClick={handleRestore}
                disabled={!restoreFile || !confirmRestore || isLoading}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Restore Database
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warning:</p>
                  <p>Restoring a backup will completely replace all existing data. This action cannot be undone.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Best Practices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Before Restoring</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create a backup of current data</li>
                <li>• Verify backup file integrity</li>
                <li>• Schedule maintenance window</li>
                <li>• Notify all users</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Backup Strategy</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create daily automated backups</li>
                <li>• Store backups in secure location</li>
                <li>• Test restore procedures regularly</li>
                <li>• Keep multiple backup versions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
