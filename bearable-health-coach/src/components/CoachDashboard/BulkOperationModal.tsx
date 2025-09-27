import React, { useState } from 'react';
import { CustomCoach, CoachBulkOperation } from '../../types';

interface BulkOperationModalProps {
  selectedCoaches: string[];
  coaches: CustomCoach[];
  onConfirm: (operation: CoachBulkOperation) => void;
  onCancel: () => void;
}

type OperationType = 'delete' | 'duplicate' | 'archive' | 'approve' | 'reject' | 'export';

const BulkOperationModal: React.FC<BulkOperationModalProps> = ({
  selectedCoaches,
  coaches,
  onConfirm,
  onCancel
}) => {
  const [selectedOperation, setSelectedOperation] = useState<OperationType>('delete');
  const [isConfirming, setIsConfirming] = useState(false);

  const operationOptions: { value: OperationType; label: string; description: string; color: string; icon: string }[] = [
    {
      value: 'delete',
      label: 'Delete Coaches',
      description: 'Permanently remove selected coaches from your account',
      color: 'text-red-600',
      icon: '🗑️'
    },
    {
      value: 'duplicate',
      label: 'Duplicate Coaches',
      description: 'Create copies of selected coaches with "(Copy)" suffix',
      color: 'text-green-600',
      icon: '📋'
    },
    {
      value: 'archive',
      label: 'Archive Coaches',
      description: 'Hide coaches from active use but keep them for reference',
      color: 'text-gray-600',
      icon: '📦'
    },
    {
      value: 'approve',
      label: 'Approve Coaches',
      description: 'Mark selected coaches as approved for public use',
      color: 'text-blue-600',
      icon: '✅'
    },
    {
      value: 'reject',
      label: 'Reject Coaches',
      description: 'Mark selected coaches as rejected',
      color: 'text-orange-600',
      icon: '❌'
    },
    {
      value: 'export',
      label: 'Export Coaches',
      description: 'Download coach configurations as JSON file',
      color: 'text-purple-600',
      icon: '📤'
    }
  ];

  const selectedOperationData = operationOptions.find(op => op.value === selectedOperation)!;

  const handleConfirm = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    const operation: CoachBulkOperation = {
      type: selectedOperation,
      coachIds: selectedCoaches,
      parameters: {}
    };

    onConfirm(operation);
  };

  const getAffectedCoachesText = () => {
    if (selectedCoaches.length === 1) {
      const coach = coaches.find(c => c.id === selectedCoaches[0]);
      return coach ? `"${coach.name}"` : '1 coach';
    }
    return `${selectedCoaches.length} coaches`;
  };

  const canPerformOperation = (operation: OperationType): boolean => {
    switch (operation) {
      case 'approve':
      case 'reject':
        // Only allow approve/reject if user has admin permissions
        // For now, we'll allow it for demonstration
        return true;
      case 'delete':
        // Can only delete coaches you own
        return coaches.every(coach => coach.createdBy === 'current-user-id');
      default:
        return true;
    }
  };

  const getOperationWarning = (operation: OperationType): string | null => {
    switch (operation) {
      case 'delete':
        return 'This action cannot be undone. All coach data, interactions, and analytics will be permanently lost.';
      case 'archive':
        return 'Archived coaches will no longer be available for new conversations but existing data will be preserved.';
      case 'approve':
        return 'Approved coaches will be visible to all users in the public coach library.';
      case 'reject':
        return 'Rejected coaches will be marked as not suitable for public use.';
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Bulk Operations</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isConfirming ? (
          <>
            {/* Operation Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Operation for {getAffectedCoachesText()}
              </label>
              <div className="space-y-2">
                {operationOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedOperation === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${
                      !canPerformOperation(option.value) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="operation"
                      value={option.value}
                      checked={selectedOperation === option.value}
                      onChange={(e) => setSelectedOperation(e.target.value as OperationType)}
                      disabled={!canPerformOperation(option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{option.icon}</span>
                        <span className={`font-medium ${option.color}`}>{option.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Selected Coaches Preview */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Coaches:</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {coaches.map((coach) => (
                  <div key={coach.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    {coach.name} ({coach.template?.category.replace('_', ' ') || 'Custom'})
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            {getOperationWarning(selectedOperation) && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-yellow-800 text-sm">{getOperationWarning(selectedOperation)}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canPerformOperation(selectedOperation)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedOperation === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                } disabled:cursor-not-allowed`}
              >
                {selectedOperationData.label}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Step */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833-.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Confirm Operation</h4>
              <p className="text-gray-600 mb-4">
                Are you sure you want to <span className="font-medium">{selectedOperationData.label.toLowerCase()}</span> {getAffectedCoachesText()}?
              </p>
              {selectedOperation === 'delete' && (
                <p className="text-sm text-red-600 font-medium">
                  This action is permanent and cannot be undone.
                </p>
              )}
            </div>

            {/* Confirmation Input for Delete */}
            {selectedOperation === 'delete' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE" to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}

            {/* Final Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsConfirming(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className={`px-6 py-2 rounded-lg font-medium ${
                  selectedOperation === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Confirm {selectedOperationData.label}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkOperationModal;