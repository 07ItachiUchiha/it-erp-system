import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { fileService, FileEntity } from '../services/fileService';
import {
  DocumentIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FolderIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fileService.getAllFiles();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const uploadedFile = await fileService.uploadFile(selectedFile, selectedCategory);
      
      // Add to state
      setFiles(prev => [uploadedFile, ...prev]);
      setSelectedFile(null);
      setSelectedCategory('general');
      
      // Reset the file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError('Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileService.deleteFile(id);
      setFiles(prev => prev.filter(file => file.id !== id));
    } catch (err) {
      setError('Failed to delete file');
      console.error('Error deleting file:', err);
    }
  };

  const handleDownloadFile = async (file: FileEntity) => {
    try {
      const blob = await fileService.downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download file');
      console.error('Error downloading file:', err);
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-green-500" />;
    } else if (mimetype.startsWith('video/')) {
      return <VideoCameraIcon className="h-8 w-8 text-red-500" />;
    } else if (mimetype.startsWith('audio/')) {
      return <MusicalNoteIcon className="h-8 w-8 text-purple-500" />;
    } else if (mimetype.includes('pdf')) {
      return <DocumentIcon className="h-8 w-8 text-red-500" />;
    } else if (mimetype.includes('word') || mimetype.includes('document')) {
      return <DocumentTextIcon className="h-8 w-8 text-blue-500" />;
    } else if (mimetype.includes('zip') || mimetype.includes('rar')) {
      return <ArchiveBoxIcon className="h-8 w-8 text-orange-500" />;
    } else {
      return <DocumentIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'hr_documents': return 'bg-blue-100 text-blue-800';
      case 'finance_reports': return 'bg-green-100 text-green-800';
      case 'marketing': return 'bg-pink-100 text-pink-800';
      case 'training': return 'bg-purple-100 text-purple-800';
      case 'templates': return 'bg-indigo-100 text-indigo-800';
      case 'contracts': return 'bg-orange-100 text-orange-800';
      case 'presentations': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFiles = Array.isArray(files) ? files.filter(file => {
    const matchesSearch = (file.originalName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (file.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesType = filterType === '' || (file.mimetype || '').startsWith(filterType);
    const matchesCategory = filterCategory === '' || file.category === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  }) : [];

  const totalSize = Array.isArray(files) ? files.reduce((sum, file) => sum + (file.size || 0), 0) : 0;

  if (loading && (!files || files.length === 0)) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">File Management</h1>
              <p className="text-gray-600 mt-2">Upload, organize, and manage your company files with database persistence</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Files</p>
                  <p className="text-2xl font-bold text-blue-900">{files.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DocumentIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Storage</p>
                  <p className="text-2xl font-bold text-green-900">{formatFileSize(totalSize)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FolderIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Categories</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Array.isArray(files) ? new Set(files.map(f => f.category).filter(Boolean)).size : 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <ArchiveBoxIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Recent Uploads</p>
                  <p className="text-2xl font-bold text-orange-900">{Array.isArray(files) ? files.filter(f => f.uploadedAt && new Date(f.uploadedAt) > new Date(Date.now() - 7*24*60*60*1000)).length : 0}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <CloudArrowUpIcon className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload New File</h2>
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="hr_documents">HR Documents</option>
                  <option value="finance_reports">Finance Reports</option>
                  <option value="marketing">Marketing</option>
                  <option value="training">Training</option>
                  <option value="templates">Templates</option>
                  <option value="contracts">Contracts</option>
                  <option value="presentations">Presentations</option>
                </select>
              </div>
            </div>
            
            {selectedFile && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CloudArrowUpIcon className="h-4 w-4" />
                        Upload File
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search files by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="image/">Images</option>
              <option value="video/">Videos</option>
              <option value="audio/">Audio</option>
              <option value="application/pdf">PDF</option>
              <option value="application/vnd.openxmlformats-officedocument">Office Documents</option>
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="hr_documents">HR Documents</option>
              <option value="finance_reports">Finance Reports</option>
              <option value="marketing">Marketing</option>
              <option value="training">Training</option>
              <option value="templates">Templates</option>
              <option value="contracts">Contracts</option>
              <option value="presentations">Presentations</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Files Grid */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Files ({filteredFiles.length})
          </h2>
          
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || filterType || filterCategory 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first file to get started'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.mimetype || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalName || 'Unnamed file'}
                        </p>
                        <div className="mt-1 flex items-center space-x-2">
                          {file.category && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadgeColor(file.category)}`}>
                              {(file.category || '').replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(file.size || 0)} • {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('en-IN') : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="text-green-600 hover:text-green-900"
                      title="Preview"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FilesPage;
