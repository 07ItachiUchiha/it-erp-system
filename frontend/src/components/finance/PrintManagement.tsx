import React, { useState, useEffect } from 'react';
import { 
  Printer, FilePlus, Eye, Edit, Trash2, Download, 
  Clock, CheckCircle, XCircle, Settings, Copy,
  FileType, MoreHorizontal, RefreshCw, Search,
  Palette, Layout, Code, Image
} from 'lucide-react';

// Types for Print Management
interface PrintTemplate {
  id: string;
  name: string;
  templateType: 'invoice' | 'receipt' | 'statement';
  description: string;
  htmlTemplate: string;
  cssStyles: string;
  renderOptions: {
    paperSize: 'A4' | 'A3' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  variables: string[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface PrintJob {
  id: string;
  templateId: string;
  templateName: string;
  entityType: 'invoice' | 'receipt' | 'customer';
  entityIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  renderOptions: {
    includeGSTDetails: boolean;
    paperSize: string;
    orientation: string;
    copies: number;
    combinePages: boolean;
    addPageBreaks: boolean;
  };
  pdfUrl?: string;
  fileSize?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

const PrintManagement: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'templates' | 'jobs' | 'preview'>('templates');
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    templateType: '',
    status: '',
    search: ''
  });

  // Load print templates
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/finance/print/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Mock data for development
      setTemplates(generateMockTemplates());
    } finally {
      setLoading(false);
    }
  };

  // Load print jobs
  const loadPrintJobs = async () => {
    try {
      const response = await fetch('/api/v1/finance/print', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPrintJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load print jobs:', error);
      // Mock data for development
      setPrintJobs(generateMockPrintJobs());
    }
  };

  // Generate mock templates
  const generateMockTemplates = (): PrintTemplate[] => {
    return [
      {
        id: 'template-1',
        name: 'Standard Invoice Template',
        templateType: 'invoice',
        description: 'Professional invoice template with company branding',
        htmlTemplate: `
          <div class="invoice">
            <div class="header">
              <h1>INVOICE</h1>
              <div class="invoice-number">{{invoiceNumber}}</div>
            </div>
            <div class="company-info">
              <h2>{{companyName}}</h2>
              <p>{{companyAddress}}</p>
            </div>
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p>{{customerName}}</p>
              <p>{{customerAddress}}</p>
            </div>
            <table class="items">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {{#each items}}
                <tr>
                  <td>{{description}}</td>
                  <td>{{quantity}}</td>
                  <td>{{rate}}</td>
                  <td>{{amount}}</td>
                </tr>
                {{/each}}
              </tbody>
            </table>
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>{{subtotal}}</span>
              </div>
              <div class="total-row">
                <span>GST:</span>
                <span>{{gstAmount}}</span>
              </div>
              <div class="total-row final">
                <span>Total:</span>
                <span>{{totalAmount}}</span>
              </div>
            </div>
          </div>
        `,
        cssStyles: `
          .invoice { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-info, .customer-info { margin-bottom: 20px; }
          .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .totals { margin-top: 20px; text-align: right; }
          .total-row { margin: 5px 0; }
          .final { font-weight: bold; font-size: 1.2em; }
        `,
        renderOptions: {
          paperSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 }
        },
        variables: ['invoiceNumber', 'companyName', 'companyAddress', 'customerName', 'customerAddress', 'items', 'subtotal', 'gstAmount', 'totalAmount'],
        isActive: true,
        version: 1,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      },
      {
        id: 'template-2',
        name: 'Receipt Template',
        templateType: 'receipt',
        description: 'Simple receipt template for payments',
        htmlTemplate: '<div class="receipt">Receipt content here</div>',
        cssStyles: '.receipt { font-family: monospace; }',
        renderOptions: {
          paperSize: 'A4',
          orientation: 'portrait',
          margins: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        variables: ['receiptNumber', 'date', 'amount'],
        isActive: true,
        version: 1,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      }
    ];
  };

  // Generate mock print jobs
  const generateMockPrintJobs = (): PrintJob[] => {
    const statuses: PrintJob['status'][] = ['pending', 'processing', 'completed', 'failed'];
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: `print-${i + 1}`,
      templateId: `template-${(i % 2) + 1}`,
      templateName: i % 2 === 0 ? 'Standard Invoice Template' : 'Receipt Template',
      entityType: 'invoice',
      entityIds: [`inv-${i + 1}`],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      progress: Math.floor(Math.random() * 100),
      renderOptions: {
        includeGSTDetails: true,
        paperSize: 'A4',
        orientation: 'portrait',
        copies: 1,
        combinePages: false,
        addPageBreaks: true
      },
      pdfUrl: Math.random() > 0.5 ? '/downloads/print.pdf' : undefined,
      fileSize: Math.floor(Math.random() * 1000000) + 100000,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      error: Math.random() > 0.8 ? 'Template rendering failed' : undefined
    }));
  };

  // Create print job
  const createPrintJob = async (printData: {
    templateId: string;
    entityType: string;
    entityIds: string[];
    renderOptions: any;
  }) => {
    try {
      const response = await fetch('/api/v1/finance/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(printData)
      });

      if (response.ok) {
        const data = await response.json();
        await loadPrintJobs();
        setShowPrintModal(false);
        return data;
      }
    } catch (error) {
      console.error('Failed to create print job:', error);
    }
  };

  // Download print job
  const downloadPrintJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/v1/finance/print/${jobId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `print-${jobId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download print job:', error);
    }
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: PrintJob['status']; progress?: number }> = ({ status, progress }) => {
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
    loadTemplates();
    loadPrintJobs();
  }, []);

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      {/* Templates Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Print Templates</h3>
          <p className="text-gray-600">Manage templates for invoices, receipts, and statements</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FilePlus className="w-5 h-5" />
            New Template
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.templateType}
          onChange={(e) => setFilters(prev => ({ ...prev, templateType: e.target.value }))}
        >
          <option value="">All Types</option>
          <option value="invoice">Invoice</option>
          <option value="receipt">Receipt</option>
          <option value="statement">Statement</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {template.templateType}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className="text-xs text-gray-500">v{template.version}</span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Paper Size:</span>
                <span>{template.renderOptions.paperSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Orientation:</span>
                <span>{template.renderOptions.orientation}</span>
              </div>
              <div className="flex justify-between">
                <span>Variables:</span>
                <span>{template.variables.length}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTemplate(template)}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm flex items-center justify-center gap-1"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setEditingTemplate(template)}
                className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  // Duplicate template
                }}
                className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="space-y-6">
      {/* Jobs Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Print Jobs</h3>
          <p className="text-gray-600">Track and manage print jobs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Printer className="w-5 h-5" />
            New Print Job
          </button>
          <button
            onClick={loadPrintJobs}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Print Jobs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entities
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
              {printJobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.id}</div>
                      <div className="text-sm text-gray-500">
                        {job.renderOptions.copies} {job.renderOptions.copies === 1 ? 'copy' : 'copies'} · {job.renderOptions.paperSize}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.templateName}</div>
                    <div className="text-sm text-gray-500">{job.entityType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={job.status} progress={job.progress} />
                    {job.error && (
                      <div className="text-xs text-red-600 mt-1">{job.error}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {job.entityIds.length} {job.entityIds.length === 1 ? 'item' : 'items'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(job.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {job.status === 'completed' && job.pdfUrl && (
                        <button
                          onClick={() => downloadPrintJob(job.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Download PDF"
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
                          className="text-red-600 hover:text-red-900"
                          title="Cancel Job"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
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

  const renderPreviewTab = () => (
    <div className="space-y-6">
      {selectedTemplate ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                <p className="text-gray-600">{selectedTemplate.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Use Template
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-inner">
              <div
                className="print-preview"
                dangerouslySetInnerHTML={{ 
                  __html: selectedTemplate.htmlTemplate
                    .replace(/{{(\w+)}}/g, '<span class="variable">$1</span>')
                    .replace(/{{#each (\w+)}}/g, '<div class="loop">Loop: $1</div>')
                    .replace(/{{\/each}}/g, '')
                }}
                style={{ fontFamily: 'Arial, sans-serif' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <FileType className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Template Preview</h3>
          <p className="text-gray-600">Select a template to preview its layout and design</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Print Management</h2>
        <p className="text-gray-600">Create templates and manage print jobs for invoices and receipts</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', label: 'Templates', icon: Layout },
            { id: 'jobs', label: 'Print Jobs', icon: Printer },
            { id: 'preview', label: 'Preview', icon: Eye }
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
      {activeTab === 'templates' && renderTemplatesTab()}
      {activeTab === 'jobs' && renderJobsTab()}
      {activeTab === 'preview' && renderPreviewTab()}

      {/* Create Print Job Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Print Job</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg">
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.templateType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg">
                  <option value="invoice">Invoices</option>
                  <option value="receipt">Receipts</option>
                  <option value="customer">Customers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity IDs</label>
                <input
                  type="text"
                  placeholder="INV-001, INV-002, ..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated list of IDs</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Copies</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="1"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="includeGST" className="mr-2" defaultChecked />
                  <label htmlFor="includeGST" className="text-sm text-gray-700">Include GST details</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="combinePages" className="mr-2" />
                  <label htmlFor="combinePages" className="text-sm text-gray-700">Combine into single PDF</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="pageBreaks" className="mr-2" defaultChecked />
                  <label htmlFor="pageBreaks" className="text-sm text-gray-700">Add page breaks</label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Create print job
                  setShowPrintModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Print Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal (simplified) */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Template: {editingTemplate.name}</h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">HTML Template</h4>
                <textarea
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  value={editingTemplate.htmlTemplate}
                  onChange={() => {/* Handle change */}}
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">CSS Styles</h4>
                <textarea
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  value={editingTemplate.cssStyles}
                  onChange={() => {/* Handle change */}}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintManagement;
