import React, { useState } from 'react';
import { Caregiver, CaregiverUpdate } from '../types';

interface CaregiverDashboardProps {
  userId: string;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({ userId }) => {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([
    {
      id: 'caregiver-1',
      name: 'Mom',
      email: 'mom@family.com',
      relationship: 'family',
      permissions: {
        viewProgress: true,
        receiveAlerts: true,
        sendEncouragement: true,
        accessHealthData: false,
        emergencyContact: true,
        modifyCarePlan: false,
        escalateToPhysician: false,
        accessMedicalHistory: false,
        coordinateWithAI: true
      },
      escalationLevel: 'primary' as const,
      communicationPreferences: {
        preferredChannel: 'app' as const,
        urgencyThreshold: 'medium' as const,
        quietHours: { start: '22:00', end: '07:00' },
        languages: ['en']
      },
      isActive: true,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: 'caregiver-2',
      name: 'Dr. Sarah Johnson',
      email: 'dr.johnson@mayoclinic.org',
      relationship: 'healthcare_provider',
      permissions: {
        viewProgress: true,
        receiveAlerts: true,
        sendEncouragement: true,
        accessHealthData: true,
        emergencyContact: true,
        modifyCarePlan: true,
        escalateToPhysician: true,
        accessMedicalHistory: true,
        coordinateWithAI: true
      },
      escalationLevel: 'emergency' as const,
      communicationPreferences: {
        preferredChannel: 'phone' as const,
        urgencyThreshold: 'high' as const,
        quietHours: { start: '23:00', end: '06:00' },
        languages: ['en']
      },
      isActive: true,
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      id: 'caregiver-3',
      name: 'Personal Trainer Mike',
      email: 'mike@fitnessstudio.com',
      relationship: 'coach',
      permissions: {
        viewProgress: true,
        receiveAlerts: false,
        sendEncouragement: true,
        accessHealthData: false,
        emergencyContact: false,
        modifyCarePlan: false,
        escalateToPhysician: false,
        accessMedicalHistory: false,
        coordinateWithAI: false
      },
      escalationLevel: 'secondary' as const,
      communicationPreferences: {
        preferredChannel: 'email' as const,
        urgencyThreshold: 'low' as const,
        quietHours: { start: '21:00', end: '08:00' },
        languages: ['en']
      },
      isActive: true,
      lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    }
  ]);

  const [updates, setUpdates] = useState<CaregiverUpdate[]>([
    {
      id: 'update-1',
      userId,
      caregiverId: 'caregiver-1',
      type: 'milestone',
      title: 'Goal Achievement!',
      message: "Jane completed her daily walking goal for 7 days straight! 🎉",
      data: { goal: 'daily_walking', streak: 7 },
      isRead: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'update-2',
      userId,
      caregiverId: 'caregiver-2',
      type: 'progress',
      title: 'Weekly Health Summary',
      message: "Jane's overall wellness score improved to 85%. Sleep quality and exercise consistency showing great improvement.",
      data: { wellness_score: 85, improvements: ['sleep', 'exercise'] },
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: 'update-3',
      userId,
      caregiverId: 'caregiver-3',
      type: 'encouragement',
      title: 'Keep Up the Great Work!',
      message: "Your consistency with morning stretches is impressive. Let's add some strength training next week!",
      isRead: false,
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
    }
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProgressShare, setShowProgressShare] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    name: '',
    relationship: 'family' as Caregiver['relationship']
  });

  const relationshipLabels = {
    family: '👨‍👩‍👧‍👦 Family',
    friend: '👫 Friend',
    healthcare_provider: '🩺 Healthcare Provider',
    physician: '👨‍⚕️ Physician',
    nurse: '👩‍⚕️ Nurse',
    coach: '💪 Coach',
    other: '👤 Other'
  };

  const relationshipColors = {
    family: 'bg-pink-100 text-pink-800',
    friend: 'bg-green-100 text-green-800',
    healthcare_provider: 'bg-blue-100 text-blue-800',
    physician: 'bg-blue-100 text-blue-800',
    nurse: 'bg-blue-100 text-blue-800',
    coach: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800'
  };

  const updateTypeIcons = {
    progress: '📊',
    milestone: '🏆',
    concern: '⚠️',
    celebration: '🎉',
    alert: '🔔',
    encouragement: '💪'
  };

  const handleInviteCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvite.email.trim() || !newInvite.name.trim()) return;

    const newCaregiver: Caregiver = {
      id: `caregiver-${Date.now()}`,
      name: newInvite.name,
      email: newInvite.email,
      relationship: newInvite.relationship,
      permissions: {
        viewProgress: true,
        receiveAlerts: newInvite.relationship === 'healthcare_provider',
        sendEncouragement: true,
        accessHealthData: newInvite.relationship === 'healthcare_provider',
        emergencyContact: newInvite.relationship === 'family' || newInvite.relationship === 'healthcare_provider',
        modifyCarePlan: newInvite.relationship === 'healthcare_provider',
        escalateToPhysician: newInvite.relationship === 'healthcare_provider',
        accessMedicalHistory: newInvite.relationship === 'healthcare_provider',
        coordinateWithAI: newInvite.relationship === 'healthcare_provider'
      },
      escalationLevel: newInvite.relationship === 'healthcare_provider' ? 'primary' : 'secondary',
      communicationPreferences: {
        preferredChannel: newInvite.relationship === 'healthcare_provider' ? 'email' : 'sms',
        urgencyThreshold: newInvite.relationship === 'healthcare_provider' ? 'medium' : 'low',
        quietHours: {
          start: '22:00',
          end: '07:00'
        },
        languages: ['en']
      },
      isActive: false, // Will be active once they accept
      lastActive: new Date()
    };

    setCaregivers(prev => [...prev, newCaregiver]);
    setNewInvite({ email: '', name: '', relationship: 'family' });
    setShowInviteModal(false);
  };

  const generateProgressSummary = () => {
    return {
      weeklyScore: 85,
      improvements: ['Sleep consistency up 23%', 'Exercise streak: 7 days', 'Stress management improving'],
      challenges: ['Vegetable intake below target', 'Weekend sleep schedule inconsistent'],
      milestones: ['Completed first week of mindfulness practice', '10,000 steps achieved 5/7 days']
    };
  };

  const progressSummary = generateProgressSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Caregiver Network</h2>
            <p className="text-gray-600">Share your health journey with loved ones and healthcare providers</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowProgressShare(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              📤 Share Progress
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              + Invite Caregiver
            </button>
          </div>
        </div>

        {/* Network Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{caregivers.length}</div>
            <div className="text-sm text-blue-800">Total Caregivers</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {caregivers.filter(c => c.isActive).length}
            </div>
            <div className="text-sm text-green-800">Active</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {updates.filter(u => !u.isRead).length}
            </div>
            <div className="text-sm text-orange-800">New Updates</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{progressSummary.weeklyScore}%</div>
            <div className="text-sm text-purple-800">Wellness Score</div>
          </div>
        </div>
      </div>

      {/* Active Caregivers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Care Team</h3>
        <div className="space-y-4">
          {caregivers.map((caregiver) => (
            <div key={caregiver.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl">
                    {caregiver.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{caregiver.name}</h4>
                    <p className="text-sm text-gray-600">{caregiver.email}</p>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${relationshipColors[caregiver.relationship]}`}>
                      {relationshipLabels[caregiver.relationship]}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    caregiver.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${caregiver.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    {caregiver.isActive ? 'Active' : 'Pending'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last active: {caregiver.lastActive.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {caregiver.permissions.viewProgress && (
                    <span className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded">📊 View Progress</span>
                  )}
                  {caregiver.permissions.receiveAlerts && (
                    <span className="bg-red-50 text-red-800 text-xs px-2 py-1 rounded">🔔 Receive Alerts</span>
                  )}
                  {caregiver.permissions.sendEncouragement && (
                    <span className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded">💬 Send Messages</span>
                  )}
                  {caregiver.permissions.accessHealthData && (
                    <span className="bg-purple-50 text-purple-800 text-xs px-2 py-1 rounded">📋 Health Data</span>
                  )}
                  {caregiver.permissions.emergencyContact && (
                    <span className="bg-orange-50 text-orange-800 text-xs px-2 py-1 rounded">🚨 Emergency Contact</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Updates */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Updates & Messages</h3>
        <div className="space-y-4">
          {updates.map((update) => {
            const caregiver = caregivers.find(c => c.id === update.caregiverId);
            return (
              <div
                key={update.id}
                className={`border border-gray-200 rounded-lg p-4 ${!update.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {updateTypeIcons[update.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{update.title}</h4>
                      <div className="text-sm text-gray-500">
                        {update.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{update.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        From: {caregiver?.name}
                      </span>
                      {!update.isRead && (
                        <button
                          onClick={() => {
                            setUpdates(prev => prev.map(u =>
                              u.id === update.id ? { ...u, isRead: true } : u
                            ));
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite Caregiver Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Invite Caregiver</h3>
            <form onSubmit={handleInviteCaregiver} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newInvite.name}
                  onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter their name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter their email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <select
                  value={newInvite.relationship}
                  onChange={(e) => setNewInvite({ ...newInvite, relationship: e.target.value as Caregiver['relationship'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="family">Family Member</option>
                  <option value="friend">Friend</option>
                  <option value="healthcare_provider">Healthcare Provider</option>
                  <option value="coach">Coach/Trainer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  Send Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Share Modal */}
      {showProgressShare && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Share Progress Update</h3>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Weekly Summary</h4>

              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-green-800 mb-2">✅ Improvements</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {progressSummary.improvements.map((improvement, index) => (
                      <li key={index}>• {improvement}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-orange-800 mb-2">🎯 Milestones</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {progressSummary.milestones.map((milestone, index) => (
                      <li key={index}>• {milestone}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-blue-800 mb-2">🔄 Focus Areas</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {progressSummary.challenges.map((challenge, index) => (
                      <li key={index}>• {challenge}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  // In a real app, this would send updates to all caregivers
                  // For demo purposes, we'll just close the modal
                  setShowProgressShare(false);
                  console.log('Progress shared with all caregivers');
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Share with All Caregivers
              </button>
              <button
                onClick={() => setShowProgressShare(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};