import React from 'react';
import Layout from '../components/layout/Layout';
import HRDashboard from '../components/hr/HRDashboard';
import { useAuth } from '../contexts/AuthContext';

const HRPage: React.FC = () => {
  const { user } = useAuth();

  // Check if user has access to HR module
  if (!user || !['admin', 'hr'].includes(user.role)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the HR module.</p>
            <p className="text-sm text-gray-500 mt-2">Required roles: Admin or HR</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Human Resources</h1>
            <p className="mt-2 text-gray-600">Manage employee resources, payroll, performance, and compliance</p>
          </div>
          <HRDashboard />
        </div>
      </div>
    </Layout>
  );
};

export default HRPage;
