import React from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import AdvancedInventoryDashboard from '../components/inventory/AdvancedInventoryDashboard';

const InventoryPage: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>Inventory Management - IT ERP System</title>
        <meta name="description" content="Comprehensive inventory management with manufacturing capabilities" />
      </Head>
      <AdvancedInventoryDashboard />
    </Layout>
  );
};

export default InventoryPage;
