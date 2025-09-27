import React from 'react';
import { CoachDashboardFilter, HealthConditionCategory } from '../../types';

interface CoachFiltersProps {
  filters: CoachDashboardFilter;
  onChange: (filters: CoachDashboardFilter) => void;
  onClose: () => void;
}

const CoachFilters: React.FC<CoachFiltersProps> = ({
  filters,
  onChange,
  onClose
}) => {
  const updateFilter = (key: keyof CoachDashboardFilter, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const categoryOptions: { value: HealthConditionCategory; label: string }[] = [
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'cardiovascular', label: 'Heart Health' },
    { value: 'mental_health', label: 'Mental Health' },
    { value: 'chronic_pain', label: 'Chronic Pain' },
    { value: 'cancer_care', label: 'Cancer Care' },
    { value: 'weight_management', label: 'Weight Management' },
    { value: 'substance_recovery', label: 'Substance Recovery' },
    { value: 'respiratory', label: 'Respiratory' },
    { value: 'autoimmune', label: 'Autoimmune' },
    { value: 'aging_wellness', label: 'Aging & Wellness' },
    { value: 'pediatric', label: 'Pediatric' },
    { value: 'womens_health', label: "Women's Health" },
    { value: 'mens_health', label: "Men's Health" },
    { value: 'general_wellness', label: 'General Wellness' }
  ];

  const approvalStatusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const clearAllFilters = () => {
    onChange({
      categories: [],
      specializations: [],
      effectivenessRange: [0, 5],
      createdDateRange: [new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()],
      approvalStatus: [],
      isCustom: null,
      searchQuery: ''
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.categories.length > 0 ||
      filters.specializations.length > 0 ||
      filters.approvalStatus.length > 0 ||
      filters.effectivenessRange[0] > 0 ||
      filters.effectivenessRange[1] < 5 ||
      filters.isCustom !== null ||
      filters.searchQuery.length > 0
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Filter Coaches</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Health Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Health Categories
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categoryOptions.map((category) => (
              <label key={category.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateFilter('categories', [...filters.categories, category.value]);
                    } else {
                      updateFilter('categories', filters.categories.filter(c => c !== category.value));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{category.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Approval Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Approval Status
          </label>
          <div className="space-y-2">
            {approvalStatusOptions.map((status) => (
              <label key={status.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.approvalStatus.includes(status.value as any)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateFilter('approvalStatus', [...filters.approvalStatus, status.value]);
                    } else {
                      updateFilter('approvalStatus', filters.approvalStatus.filter(s => s !== status.value));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Effectiveness Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Effectiveness Rating
          </label>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Minimum: {filters.effectivenessRange[0]}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={filters.effectivenessRange[0]}
                onChange={(e) => updateFilter('effectivenessRange', [
                  parseFloat(e.target.value),
                  filters.effectivenessRange[1]
                ])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Maximum: {filters.effectivenessRange[1]}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={filters.effectivenessRange[1]}
                onChange={(e) => updateFilter('effectivenessRange', [
                  filters.effectivenessRange[0],
                  parseFloat(e.target.value)
                ])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="text-center text-sm text-gray-600">
              {filters.effectivenessRange[0]} - {filters.effectivenessRange[1]} stars
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Created Date Range
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={filters.createdDateRange[0].toISOString().split('T')[0]}
                onChange={(e) => updateFilter('createdDateRange', [
                  new Date(e.target.value),
                  filters.createdDateRange[1]
                ])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={filters.createdDateRange[1].toISOString().split('T')[0]}
                onChange={(e) => updateFilter('createdDateRange', [
                  filters.createdDateRange[0],
                  new Date(e.target.value)
                ])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilter('approvalStatus', ['approved'])}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.approvalStatus.includes('approved')
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            Approved Only
          </button>
          <button
            onClick={() => updateFilter('effectivenessRange', [4, 5])}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.effectivenessRange[0] >= 4
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            High Rated (4+ stars)
          </button>
          <button
            onClick={() => updateFilter('createdDateRange', [
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              new Date()
            ])}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.createdDateRange[0] > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            Recent (30 days)
          </button>
          <button
            onClick={() => updateFilter('categories', ['mental_health', 'chronic_pain'])}
            className={`px-3 py-1 text-sm rounded-full border ${
              filters.categories.includes('mental_health')
                ? 'bg-purple-100 text-purple-800 border-purple-200'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            Mental Health & Pain
          </button>
        </div>
      </div>

      {/* Summary */}
      {hasActiveFilters() && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.categories.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                  {filters.categories.length} categories
                </span>
              )}
              {filters.approvalStatus.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                  {filters.approvalStatus.length} statuses
                </span>
              )}
              {(filters.effectivenessRange[0] > 0 || filters.effectivenessRange[1] < 5) && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs">
                  Rating: {filters.effectivenessRange[0]}-{filters.effectivenessRange[1]}
                </span>
              )}
              {filters.searchQuery && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">
                  Search: "{filters.searchQuery}"
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachFilters;