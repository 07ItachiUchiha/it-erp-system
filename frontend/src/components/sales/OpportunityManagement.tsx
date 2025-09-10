import React, { useState } from 'react';
import { Opportunity, Customer, salesService, CreateOpportunityDto } from '../../services/salesService';
import { Plus, Search, Edit, Trash2, Target, Calendar, IndianRupee } from 'lucide-react';

interface OpportunityManagementProps {
  opportunities: Opportunity[];
  customers: Customer[];
  onOpportunitiesChange: (opportunities: Opportunity[]) => void;
  onRefresh: () => void;
}

const OpportunityManagement: React.FC<OpportunityManagementProps> = ({
  opportunities,
  customers,
  onOpportunitiesChange,
  onRefresh
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const [newOpportunity, setNewOpportunity] = useState<CreateOpportunityDto>({
    title: '',
    description: '',
    value: 0,
    stage: 'prospecting',
    probability: 0,
    expectedCloseDate: '',
    customerId: '',
    assignedTo: ''
  });

  // Filter opportunities based on search and filters
  const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const filteredOpportunities = safeOpportunities.filter(opportunity => {
    const matchesSearch = 
      opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opportunity.description && opportunity.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStage = stageFilter === 'all' || opportunity.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  const handleCreateOpportunity = async () => {
    try {
      setLoading(true);
      const createdOpportunity = await salesService.createOpportunity(newOpportunity);
      onOpportunitiesChange([createdOpportunity, ...safeOpportunities]);
      setShowCreateModal(false);
      setNewOpportunity({
        title: '',
        description: '',
        value: 0,
        stage: 'prospecting',
        probability: 0,
        expectedCloseDate: '',
        customerId: '',
        assignedTo: ''
      });
    } catch (error) {
      console.error('Error creating opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpportunity = async () => {
    if (!selectedOpportunity) return;
    
    try {
      setLoading(true);
      const updatedOpportunity = await salesService.updateOpportunity(selectedOpportunity.id, selectedOpportunity);
      onOpportunitiesChange(Array.isArray(opportunities) ? opportunities.map(opp => opp.id === selectedOpportunity.id ? updatedOpportunity : opp) : []);
      setShowEditModal(false);
      setSelectedOpportunity(null);
    } catch (error) {
      console.error('Error updating opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    
    try {
      setLoading(true);
      await salesService.deleteOpportunity(opportunityId);
      onOpportunitiesChange(opportunities.filter(opp => opp.id !== opportunityId));
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'prospecting': 'bg-blue-100 text-blue-800',
      'qualification': 'bg-yellow-100 text-yellow-800',
      'needs_analysis': 'bg-purple-100 text-purple-800',
      'proposal': 'bg-orange-100 text-orange-800',
      'negotiation': 'bg-red-100 text-red-800',
      'closed_won': 'bg-green-100 text-green-800',
      'closed_lost': 'bg-gray-100 text-gray-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 60) return 'text-yellow-600';
    if (probability >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const stageOptions = ['prospecting', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

  const getCustomerName = (customerId: string) => {
    const customer = safeCustomers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Stages</option>
            {stageOptions.map(stage => (
              <option key={stage} value={stage}>
                {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Opportunity
        </button>
      </div>

      {/* Opportunities Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Target className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {opportunity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getCustomerName(opportunity.customerId)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(opportunity.stage)}`}>
                    {opportunity.stage.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        ₹{(opportunity.value || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${getProbabilityColor(opportunity.probability)}`}>
                      {opportunity.probability}%
                    </span>
                  </div>
                  
                  {opportunity.expectedCloseDate && (
                    <div className="flex items-center mt-2">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">
                        {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {opportunity.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {opportunity.description}
                    </p>
                  )}
                </div>
                
                <div className="mt-5 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setSelectedOpportunity(opportunity);
                      setShowEditModal(true);
                    }}
                    className="text-gray-400 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteOpportunity(opportunity.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No opportunities found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Create Opportunity Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Opportunity</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={newOpportunity.title}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <select
                    value={newOpportunity.customerId}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, customerId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Customer</option>
                    {safeCustomers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.company}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <input
                    type="number"
                    value={newOpportunity.value}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, value: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage</label>
                  <select
                    value={newOpportunity.stage}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, stage: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {stageOptions.map(stage => (
                      <option key={stage} value={stage}>
                        {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newOpportunity.probability}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, probability: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Close Date</label>
                  <input
                    type="date"
                    value={newOpportunity.expectedCloseDate}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, expectedCloseDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newOpportunity.description}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOpportunity}
                  disabled={loading || !newOpportunity.title || !newOpportunity.customerId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Opportunity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Opportunity Modal */}
      {showEditModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Opportunity</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={selectedOpportunity.title}
                    onChange={(e) => setSelectedOpportunity({ ...selectedOpportunity, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <input
                    type="number"
                    value={selectedOpportunity.value}
                    onChange={(e) => setSelectedOpportunity({ ...selectedOpportunity, value: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage</label>
                  <select
                    value={selectedOpportunity.stage}
                    onChange={(e) => setSelectedOpportunity({ ...selectedOpportunity, stage: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {stageOptions.map(stage => (
                      <option key={stage} value={stage}>
                        {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={selectedOpportunity.probability}
                    onChange={(e) => setSelectedOpportunity({ ...selectedOpportunity, probability: Number(e.target.value) })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Close Date</label>
                  <input
                    type="date"
                    value={selectedOpportunity.expectedCloseDate?.split('T')[0] || ''}
                    onChange={(e) => setSelectedOpportunity({ ...selectedOpportunity, expectedCloseDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={selectedOpportunity.description || ''}
                    onChange={(e) => setSelectedOpportunity({ ...selectedOpportunity, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedOpportunity(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditOpportunity}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Opportunity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityManagement;
