import { formatCurrency } from '../utils/currency';

// Export data to CSV format
export const exportToCSV = (data: any[], filename: string = 'export') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first item
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        let value = row[header];
        
        // Handle nested objects (like employee.firstName)
        if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            value = `"${value}"`;
          }
        }
        
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export data to Excel format (actually CSV with .xlsx extension for simplicity)
export const exportToExcel = (data: any[], filename: string = 'export') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // For now, we'll export as CSV with .xlsx extension
  // In a real application, you might want to use a library like xlsx or exceljs
  const headers = Object.keys(data[0]);
  
  const csvContent = [
    headers.join('\t'), // Use tabs for better Excel compatibility
    ...data.map(row => 
      headers.map(header => {
        let value = row[header];
        
        if (typeof value === 'object' && value !== null) {
          // For nested objects, extract meaningful values
          if (value.firstName && value.lastName) {
            value = `${value.firstName} ${value.lastName}`;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        return value || '';
      }).join('\t')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export data to PDF format (simple table)
export const exportToPDF = (data: any[], filename: string = 'export', title: string = 'Export Report') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for PDF export');
    return;
  }

  const headers = Object.keys(data[0]);
  
  // Format headers (convert camelCase to Title Case)
  const formatHeader = (header: string) => {
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Generate HTML table
  const tableHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .date {
          font-size: 14px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .currency {
          text-align: right;
          font-family: monospace;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${title}</div>
        <div class="date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${formatHeader(header)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => {
                let value = row[header];
                let className = '';
                
                // Handle nested objects
                if (typeof value === 'object' && value !== null) {
                  if (value.firstName && value.lastName) {
                    value = `${value.firstName} ${value.lastName}`;
                  } else if (value.email) {
                    value = value.email;
                  } else {
                    value = JSON.stringify(value);
                  }
                }
                
                // Format currency values
                if (typeof value === 'number' && (header.toLowerCase().includes('salary') || 
                    header.toLowerCase().includes('amount') || header.toLowerCase().includes('pay'))) {
                  value = formatCurrency(value);
                  className = 'currency';
                }
                
                // Format dates
                if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
                  value = new Date(value).toLocaleDateString();
                }
                
                return `<td class="${className}">${value || ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="footer">
        Total Records: ${data.length} | Generated by ERP System
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        };
        
        window.onafterprint = function() {
          window.close();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(tableHTML);
  printWindow.document.close();
};

// Utility function to flatten nested objects for export
export const flattenObject = (obj: any, prefix: string = ''): any => {
  const flattened: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
  }
  
  return flattened;
};

// Format data for export with proper formatting
export const formatDataForExport = (data: any[], type: 'csv' | 'excel' | 'pdf' = 'csv') => {
  return data.map(item => {
    const formatted = { ...item };
    
    // Format currency fields
    ['basicSalary', 'allowances', 'deductions', 'overtime', 'grossPay', 'netPay', 'taxDeductions'].forEach(field => {
      if (formatted[field] !== undefined && typeof formatted[field] === 'number') {
        if (type === 'pdf') {
          formatted[field] = formatCurrency(formatted[field]);
        }
      }
    });
    
    // Format dates
    ['startDate', 'endDate', 'payDate', 'createdAt', 'updatedAt'].forEach(field => {
      if (formatted[field]) {
        formatted[field] = new Date(formatted[field]).toLocaleDateString();
      }
    });
    
    // Flatten nested employee object
    if (formatted.employee) {
      formatted.employeeName = `${formatted.employee.firstName || ''} ${formatted.employee.lastName || ''}`.trim();
      formatted.employeeEmail = formatted.employee.email || '';
      delete formatted.employee;
    }
    
    return formatted;
  });
};
