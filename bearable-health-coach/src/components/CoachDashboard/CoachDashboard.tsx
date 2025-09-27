import React, { useState, useEffect } from 'react';
import {
  CustomCoach,
  CoachDashboardFilter,
  CoachBulkOperation,
  CoachAnalytics,
  HealthConditionCategory
} from '../../types';
import { coachService } from '../../services/coachService';
import CoachCard from './CoachCard';
import CoachFilters from './CoachFilters';
import CoachAnalyticsPanel from './CoachAnalyticsPanel';
import BulkOperationModal from './BulkOperationModal';
import CoachBuilder from '../CoachBuilder/CoachBuilder';

type DashboardView = 'grid' | 'list' | 'analytics';

const CoachDashboard: React.FC = () => {
  // State
  const [coaches, setCoaches] = useState<CustomCoach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<CustomCoach[]>([]);
  const [selectedCoaches, setSelectedCoaches] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCoachBuilder, setShowCoachBuilder] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CustomCoach | null>(null);

  // Filter state
  const [filters, setFilters] = useState<CoachDashboardFilter>({
    categories: [],
    specializations: [],
    effectivenessRange: [0, 5],
    createdDateRange: [new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()],
    approvalStatus: [],
    isCustom: null,
    searchQuery: ''
  });

  // Load coaches on mount
  useEffect(() => {
    loadCoaches();
  }, []);

  // Apply filters when coaches or filters change
  useEffect(() => {
    applyFilters();
  }, [coaches, filters]);

  const loadCoaches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userCoaches = await coachService.getUserCoaches('current-user-id', filters);
      setCoaches(userCoaches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coaches');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...coaches];

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(coach =>
        coach.name.toLowerCase().includes(query) ||
        coach.description.toLowerCase().includes(query) ||
        coach.template?.name.toLowerCase().includes(query)
      );
    }

    // Categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter(coach =>
        coach.template && filters.categories.includes(coach.template.category)
      );
    }

    // Approval status
    if (filters.approvalStatus.length > 0) {
      filtered = filtered.filter(coach =>
        filters.approvalStatus.includes(coach.approvalStatus)
      );
    }

    // Effectiveness range
    filtered = filtered.filter(coach =>
      coach.effectivenessMetrics.averageRating >= filters.effectivenessRange[0] &&
      coach.effectivenessMetrics.averageRating <= filters.effectivenessRange[1]
    );

    // Date range
    filtered = filtered.filter(coach => {
      const coachDate = new Date(coach.createdAt);
      return coachDate >= filters.createdDateRange[0] && coachDate <= filters.createdDateRange[1];
    });

    setFilteredCoaches(filtered);
  };

  const handleCoachSelect = (coachId: string, selected: boolean) => {
    const newSelection = new Set(selectedCoaches);
    if (selected) {
      newSelection.add(coachId);
    } else {
      newSelection.delete(coachId);
    }
    setSelectedCoaches(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedCoaches.size === filteredCoaches.length) {
      setSelectedCoaches(new Set());
    } else {
      setSelectedCoaches(new Set(filteredCoaches.map(c => c.id)));
    }
  };

  const handleBulkOperation = async (operation: CoachBulkOperation) => {
    try {
      await coachService.performBulkOperation(operation, 'current-user-id');
      await loadCoaches();
      setSelectedCoaches(new Set());
      setShowBulkModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk operation failed');
    }
  };

  const handleCoachSave = async (coach: CustomCoach) => {
    try {
      await loadCoaches();
      setShowCoachBuilder(false);
      setEditingCoach(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save coach');
    }
  };

  const handleCoachEdit = (coach: CustomCoach) => {
    setEditingCoach(coach);
    setShowCoachBuilder(true);
  };

  const handleCoachDelete = async (coachId: string) => {
    try {
      await coachService.deleteCustomCoach(coachId, 'current-user-id');
      await loadCoaches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete coach');
    }
  };

  const handleCoachDuplicate = async (coach: CustomCoach) => {
    try {
      const duplicatedCoach = {
        ...coach,
        name: `${coach.name} (Copy)`,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      };
      await coachService.createCustomCoach(duplicatedCoach as any);
      await loadCoaches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate coach');
    }
  };

  if (showCoachBuilder) {
    return (
      <CoachBuilder
        initialCoach={editingCoach || undefined}
        onSave={handleCoachSave}
        onCancel={() => {
          setShowCoachBuilder(false);
          setEditingCoach(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coach Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your custom AI health coaches and monitor their performance
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setCurrentView('grid')}
              className={`px-3 py-2 text-sm ${
                currentView === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className={`px-3 py-2 text-sm ${
                currentView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`px-3 py-2 text-sm ${
                currentView === 'analytics'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Analytics
            </button>
          </div>

          <button
            onClick={() => setShowCoachBuilder(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Coach
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search coaches..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filters
            </span>
          </button>

          {/* Results Count */}
          <span className="text-sm text-gray-600">
            {filteredCoaches.length} of {coaches.length} coaches
          </span>
        </div>

        {/* Bulk Actions */}
        {selectedCoaches.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedCoaches.size} selected
            </span>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Bulk Actions
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6">
          <CoachFilters
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-gray-600">Loading coaches...</span>
          </div>
        </div>
      ) : currentView === 'analytics' ? (
        <CoachAnalyticsPanel coaches={filteredCoaches} />
      ) : filteredCoaches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No coaches found</h3>
          <p className="text-gray-600 mb-4">
            {coaches.length === 0
              ? "You haven't created any coaches yet. Get started by creating your first custom coach."
              : "No coaches match your current filters. Try adjusting your search criteria."
            }
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowCoachBuilder(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Coach
            </button>
            {coaches.length > 0 && (
              <button
                onClick={() => setFilters({
                  categories: [],
                  specializations: [],
                  effectivenessRange: [0, 5],
                  createdDateRange: [new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()],
                  approvalStatus: [],
                  isCustom: null,
                  searchQuery: ''
                })}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Select All */}
          {filteredCoaches.length > 0 && (
            <div className="mb-4 flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCoaches.size === filteredCoaches.length}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Select all {filteredCoaches.length} coaches
                </span>
              </label>
            </div>
          )}

          {/* Coach Grid/List */}
          <div className={
            currentView === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {filteredCoaches.map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                viewMode={currentView}
                isSelected={selectedCoaches.has(coach.id)}
                onSelect={(selected) => handleCoachSelect(coach.id, selected)}
                onEdit={() => handleCoachEdit(coach)}
                onDelete={() => handleCoachDelete(coach.id)}
                onDuplicate={() => handleCoachDuplicate(coach)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk Operation Modal */}
      {showBulkModal && (
        <BulkOperationModal
          selectedCoaches={Array.from(selectedCoaches)}
          coaches={filteredCoaches.filter(c => selectedCoaches.has(c.id))}
          onConfirm={handleBulkOperation}
          onCancel={() => setShowBulkModal(false)}
        />
      )}
    </div>
  );
};

export default CoachDashboard;