import React, { useState, useEffect } from 'react';
import { 
  Download, FileSpreadsheet, FilePlus, Clock, CheckCircle, 
  XCircle, RefreshCw, Calendar, Filter, Search, Eye,
  Settings, Trash2, Edit, MoreHorizontal, AlertCircle
} from 'lucide-react';

// Types for Export Management
interface ExportJob {
  id: string;
  name: string;
  exportType: 'invoices' | 'bills' | 'customers' | 'gst-report';
  format: 'excel' | 'csv' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  fileSize?: number;
  recordCount: number;
  filters: Record<string, any>;
  error?: string;
}

interface ExportTemplate {
  id: string;
  name: string;
  exportType: string;
  format: string;
  fields: string[];
  filters: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
}

const ExportManagement: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'jobs' | 'templates' | 'scheduled'>('jobs');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportTemplates, setExportTemplates] = useState<ExportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewExportModal, setShowNewExportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    format: '',
    dateRange: { from: '', to: '' },
    search: ''
  });

  // Load export jobs
  const loadExportJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/finance/exports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExportJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load export jobs:', error);
      // Mock data for development
      setExportJobs(generateMockExportJobs());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock export jobs
  const generateMockExportJobs = (): ExportJob[] => {
    const statuses: ExportJob['status'][] = ['pending', 'processing', 'completed', 'failed'];
    const formats: ExportJob['format'][] = ['excel', 'csv', 'pdf'];
    const types: ExportJob['exportType'][] = ['invoices', 'bills', 'customers', 'gst-report'];

    return Array.from({ length: 12 }, (_, i) => ({
      id: `export-${i + 1}`,
      name: `Export Job ${i + 1}`,
      exportType: types[Math.floor(Math.random() * types.length)],
      format: formats[Math.floor(Math.random() * formats.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      progress: Math.floor(Math.random() * 100),
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      downloadUrl: Math.random() > 0.5 ? '/downloads/export.xlsx' : undefined,
      fileSize: Math.floor(Math.random() * 5000000) + 100000,
      recordCount: Math.floor(Math.random() * 10000) + 100,
      filters: { dateRange: '2025-01-01 to 2025-01-31' },
      error: Math.random() > 0.8 ? 'Connection timeout during export' : undefined
    }));
  };

  // Create new export job
  const createExportJob = async (exportData: {
    exportType: string;
    format: string;
    filters: Record<string, any>;
    includeDetails: boolean;
  }) => {
    try {
      const response = await fetch('/api/v1/finance/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(exportData)
      });

      if (response.ok) {
        const data = await response.json();
        await loadExportJobs();
        setShowNewExportModal(false);
        return data;
      }
    } catch (error) {
      console.error('Failed to create export job:', error);
    }
  };

  // Download export file
  const downloadExport = async (jobId: string) => {
    try {
      const response = await fetch(`/api/v1/finance/exports/${jobId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${jobId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download export:', error);
    }
  };

  // Cancel export job
  const cancelExportJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/v1/finance/exports/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        await loadExportJobs();
      }
    } catch (error) {
      console.error('Failed to cancel export job:', error);
    }
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: ExportJob['status']; progress?: number }> = ({ status, progress }) => {
    const configs = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          <Icon className={`w-3 h-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {status === 'processing' && progress !== undefined && (
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  useEffect(() => {
    loadExportJobs();
  }, []);

  const renderJobsTab = () => (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search export jobs..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.format}
            onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
          >
            <option value="">All Formats</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewExportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FilePlus className="w-5 h-5" />
            New Export
          </button>
          <button
            onClick={loadExportJobs}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Export Jobs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Export Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exportJobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.name}</div>
                      <div className="text-sm text-gray-500">{job.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {job.exportType}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium uppercase">
                        {job.format}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={job.status} progress={job.progress} />
                    {job.error && (
                      <div className="text-xs text-red-600 mt-1">{job.error}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.recordCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(job.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <button
                          onClick={() => downloadExport(job.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {(job.status === 'pending' || job.status === 'processing') && (
                        <button
                          onClick={() => cancelExportJob(job.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="More Actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Template Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export Templates</h3>
          <p className="text-gray-600">Create reusable export configurations</p>
        </div>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FilePlus className="w-5 h-5" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mock templates */}
        {[
          { name: 'Monthly Invoice Report', type: 'invoices', format: 'excel', active: true },
          { name: 'GST Compliance Export', type: 'gst-report', format: 'csv', active: true },
          { name: 'Customer Database', type: 'customers', format: 'excel', active: false }
        ].map((template, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {template.type}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium uppercase">
                    {template.format}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${template.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div>Last run: 3 days ago</div>
              <div>Next run: Tomorrow at 9:00 AM</div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm">
                Run Now
              </button>
              <button className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScheduledTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduled Exports</h3>
        <p className="text-gray-600 mb-4">Automate your exports with scheduled jobs</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Create Schedule
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Export Management</h2>
        <p className="text-gray-600">Manage data exports in Excel, CSV, and PDF formats</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'jobs', label: 'Export Jobs', icon: Download },
            { id: 'templates', label: 'Templates', icon: FileSpreadsheet },
            { id: 'scheduled', label: 'Scheduled', icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`mr-2 w-5 h-5 ${
                  activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'jobs' && renderJobsTab()}
      {activeTab === 'templates' && renderTemplatesTab()}
      {activeTab === 'scheduled' && renderScheduledTab()}

      {/* Quick Export Modal */}
      {showNewExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Export</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Type</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg">
                  <option value="invoices">Invoices</option>
                  <option value="bills">Bills</option>
                  <option value="customers">Customers</option>
                  <option value="gst-report">GST Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg">
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex gap-2">
                  <input type="date" className="flex-1 p-3 border border-gray-300 rounded-lg" />
                  <input type="date" className="flex-1 p-3 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="includeDetails" className="mr-2" />
                <label htmlFor="includeDetails" className="text-sm text-gray-700">Include detailed information</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewExportModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Create export job
                  setShowNewExportModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportManagement;
