import React, { useState, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface AdvancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
  onExport?: (format: 'csv' | 'excel' | 'pdf') => void;
  bulkActions?: Array<{ key: string; label: string; variant?: 'danger' | 'primary' | 'secondary' }>;
  searchable?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  selectable?: boolean;
  getRowId?: (item: T) => string;
  exportFileName?: string;
}

function AdvancedTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onSort,
  onFilter,
  onBulkAction,
  onExport,
  bulkActions = [],
  searchable = true,
  pagination,
  selectable = true,
  getRowId = (item) => item.id,
  exportFileName = 'export'
}: AdvancedTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  // Handle filtering
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  // Handle search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredData.map(getRowId));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const isAllSelected = filteredData.length > 0 && filteredData.every(item => selectedIds.has(getRowId(item)));
  const isPartiallySelected = filteredData.some(item => selectedIds.has(getRowId(item))) && !isAllSelected;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header with search and actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          {/* Search */}
          {searchable && (
            <div className="flex-1 max-w-lg">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Filters
            </button>

            {/* Bulk actions */}
            {selectable && selectedIds.size > 0 && bulkActions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Bulk Actions ({selectedIds.size})
                </button>
                {showBulkActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {bulkActions.map((action) => (
                      <button
                        key={action.key}
                        onClick={() => {
                          onBulkAction?.(action.key, Array.from(selectedIds));
                          setShowBulkActions(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                          action.variant === 'danger' ? 'text-red-600' : 'text-gray-700'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Export */}
            {onExport && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onExport(e.target.value as 'csv' | 'excel' | 'pdf');
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  defaultValue=""
                >
                  <option value="">Export</option>
                  <option value="csv">Export CSV</option>
                  <option value="excel">Export Excel</option>
                  <option value="pdf">Export PDF</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.filter(col => col.filterable).map((column) => (
                <div key={String(column.key)}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column.header}
                  </label>
                  <input
                    type="text"
                    value={filters[String(column.key)] || ''}
                    onChange={(e) => handleFilterChange(String(column.key), e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder={`Filter by ${column.header.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.width || ''}`}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon
                          className={`h-3 w-3 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDownIcon
                          className={`h-3 w-3 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-blue-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              filteredData.map((item) => {
                const rowId = getRowId(item);
                const isSelected = selectedIds.has(rowId);
                return (
                  <tr key={rowId} className={isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    {selectable && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.render ? column.render(item) : String(item[column.key] || '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                {pagination.total} results
              </span>
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedTable;
