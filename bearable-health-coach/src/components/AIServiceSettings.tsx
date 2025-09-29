import React, { useState, useEffect } from 'react';
import { AIServiceConfig, aiServiceManager } from '../services/realAIService';

interface AIServiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (services: AIServiceConfig[]) => void;
}

export const AIServiceSettings: React.FC<AIServiceSettingsProps> = ({
  isOpen,
  onClose,
  onSettingsChange
}) => {
  const [services, setServices] = useState<AIServiceConfig[]>([]);
  const [newService, setNewService] = useState<Partial<AIServiceConfig>>({
    id: '',
    name: '',
    provider: 'openai',
    apiKey: '',
    model: ''
  });
  const [isAddingService, setIsAddingService] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);

  const providers = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      placeholder: 'sk-...'
    },
    {
      id: 'anthropic',
      name: 'Anthropic (Claude)',
      models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
      placeholder: 'sk-ant-...'
    },
    {
      id: 'google',
      name: 'Google (Gemini)',
      models: ['gemini-pro', 'gemini-pro-vision'],
      placeholder: 'AIza...'
    },
    {
      id: 'azure',
      name: 'Azure OpenAI',
      models: ['gpt-4', 'gpt-35-turbo'],
      placeholder: 'your-api-key'
    }
  ];

  useEffect(() => {
    // Load saved services from localStorage
    const savedServices = localStorage.getItem('bearable-ai-services');
    if (savedServices) {
      try {
        const parsed = JSON.parse(savedServices);
        setServices(parsed);
        // Add services to manager
        parsed.forEach((service: AIServiceConfig) => {
          aiServiceManager.addService(service);
        });
      } catch (error) {
        console.error('Failed to load AI services:', error);
      }
    }
  }, []);

  const saveServices = (updatedServices: AIServiceConfig[]) => {
    setServices(updatedServices);
    localStorage.setItem('bearable-ai-services', JSON.stringify(updatedServices));
    if (onSettingsChange) {
      onSettingsChange(updatedServices);
    }
  };

  const handleAddService = () => {
    if (!newService.name || !newService.apiKey || !newService.provider) {
      alert('Please fill in all required fields');
      return;
    }

    const serviceConfig: AIServiceConfig = {
      id: `${newService.provider}-${Date.now()}`,
      name: newService.name,
      provider: newService.provider as any,
      apiKey: newService.apiKey,
      model: newService.model || getDefaultModel(newService.provider as any),
      baseUrl: newService.baseUrl
    };

    const updatedServices = [...services, serviceConfig];
    saveServices(updatedServices);
    aiServiceManager.addService(serviceConfig);

    // Reset form
    setNewService({
      id: '',
      name: '',
      provider: 'openai',
      apiKey: '',
      model: ''
    });
    setIsAddingService(false);
  };

  const getDefaultModel = (provider: string): string => {
    const providerData = providers.find(p => p.id === provider);
    return providerData?.models[0] || '';
  };

  const handleDeleteService = (serviceId: string) => {
    const updatedServices = services.filter(s => s.id !== serviceId);
    saveServices(updatedServices);
    aiServiceManager.removeService(serviceId);
  };

  const handleTestService = async (service: AIServiceConfig) => {
    setTestingService(service.id);
    try {
      const response = await aiServiceManager.generateResponse(
        [
          { role: 'system', content: 'You are a helpful health coach. Respond briefly.' },
          { role: 'user', content: 'Say hello and confirm you are working correctly.' }
        ],
        { maxTokens: 100 },
        service.id
      );
      alert(`✅ Service test successful!\n\nResponse: ${response.content}`);
    } catch (error) {
      alert(`❌ Service test failed:\n\n${error}`);
    } finally {
      setTestingService(null);
    }
  };

  const getSelectedProvider = () => {
    return providers.find(p => p.id === newService.provider);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                🤖
              </div>
              <h2 className="text-xl font-semibold text-slate-800">AI Service Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Configure your AI services to enable real-time health consultations with multiple providers.
          </p>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(80vh-120px)] overflow-y-auto">
          {/* Existing Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configured AI Services</h3>
            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔧</div>
                <p>No AI services configured yet.</p>
                <p className="text-sm">Add your first AI service to enable intelligent health coaching.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium text-gray-900">{service.name}</div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {service.provider.toUpperCase()}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {service.model}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        API Key: {service.apiKey.substring(0, 8)}...
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTestService(service)}
                        disabled={testingService === service.id}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          testingService === service.id
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {testingService === service.id ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Service */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New AI Service</h3>
              {!isAddingService && (
                <button
                  onClick={() => setIsAddingService(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Add Service
                </button>
              )}
            </div>

            {isAddingService && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Service Name</label>
                    <input
                      type="text"
                      value={newService.name || ''}
                      onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="My OpenAI Service"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Provider</label>
                    <select
                      value={newService.provider || 'openai'}
                      onChange={(e) => setNewService({
                        ...newService,
                        provider: e.target.value as any,
                        model: getDefaultModel(e.target.value)
                      })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                    <input
                      type="password"
                      value={newService.apiKey || ''}
                      onChange={(e) => setNewService({ ...newService, apiKey: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={getSelectedProvider()?.placeholder || 'Your API key'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                    <select
                      value={newService.model || ''}
                      onChange={(e) => setNewService({ ...newService, model: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getSelectedProvider()?.models.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newService.provider === 'azure' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Base URL</label>
                      <input
                        type="text"
                        value={newService.baseUrl || ''}
                        onChange={(e) => setNewService({ ...newService, baseUrl: e.target.value })}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://your-resource.openai.azure.com"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsAddingService(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddService}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Service
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-yellow-400 mr-3">⚠️</div>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  API keys are stored locally in your browser and are never sent to our servers.
                  They are only used to communicate directly with your chosen AI providers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};