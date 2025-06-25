import React, { useState, useRef, useEffect } from 'react';
import { api } from '~/utils/api';
import type { MechanicContext } from '~/lib/ai/mechanic-assistant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  diagnosticSuggestions?: Array<{
    issue: string;
    probability: number;
    tests: string[];
    parts?: string[];
  }>;
  partsRecommendations?: Array<{
    partNumber: string;
    description: string;
    supplier: string;
    estimatedCost: number;
    availability: 'in_stock' | 'order_required' | 'unknown';
  }>;
  procedureSteps?: Array<{
    step: number;
    description: string;
    tools: string[];
    safetyNotes?: string[];
    estimatedTime: number;
  }>;
  safetyAlerts?: Array<{
    level: 'info' | 'warning' | 'danger';
    message: string;
  }>;
}

interface MechanicAssistantWidgetProps {
  mechanicId: string;
  context?: MechanicContext;
  onDiagnosticUpdate?: (diagnostics: Message['diagnosticSuggestions']) => void;
  onPartsUpdate?: (parts: Message['partsRecommendations']) => void;
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export const MechanicAssistantWidget: React.FC<MechanicAssistantWidgetProps> = ({
  mechanicId,
  context,
  onDiagnosticUpdate,
  onPartsUpdate,
  className = '',
  minimized = false,
  onToggleMinimize,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI mechanic assistant. I can help with diagnostics, parts identification, repair procedures, and more. What are you working on today?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'diagnostics' | 'parts' | 'procedures'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatMutation = api.ai.mechanicAssistant.chat.useMutation({
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        diagnosticSuggestions: response.diagnosticSuggestions,
        partsRecommendations: response.partsRecommendations,
        procedureSteps: response.procedureSteps,
        safetyAlerts: response.safetyAlerts,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSessionId(response.sessionId);

      if (response.diagnosticSuggestions && onDiagnosticUpdate) {
        onDiagnosticUpdate(response.diagnosticSuggestions);
      }

      if (response.partsRecommendations && onPartsUpdate) {
        onPartsUpdate(response.partsRecommendations);
      }

      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm experiencing technical difficulties. Please refer to your service manual and follow standard safety protocols.",
        timestamp: new Date(),
        safetyAlerts: [{
          level: 'warning',
          message: 'AI assistant unavailable. Proceed with extra caution.'
        }]
      }]);
      setIsLoading(false);
    },
  });

  const vinDecodeMutation = api.ai.mechanicAssistant.decodeVIN.useMutation({
    onSuccess: (data) => {
      const message = `VIN decoded successfully: ${JSON.stringify(data, null, 2)}`;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
      }]);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    chatMutation.mutate({
      message,
      sessionId,
      mechanicId,
      context,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log('File uploaded:', file);
    }
  };

  const handleVINDecode = () => {
    const vin = prompt('Enter VIN to decode:');
    if (vin && vin.length === 17) {
      vinDecodeMutation.mutate({ vin });
    }
  };

  const quickActions = [
    { label: 'Decode VIN', action: handleVINDecode },
    { label: 'Safety Check', action: () => handleSendMessage('Perform safety check for current procedure') },
    { label: 'Parts Lookup', action: () => handleSendMessage('Help me find parts for this repair') },
    { label: 'Diagnostic Help', action: () => handleSendMessage('Help me diagnose this issue') },
  ];

  if (minimized) {
    return (
      <div className={`fixed bottom-4 left-4 z-50 ${className}`}>
        <button
          onClick={onToggleMinimize}
          className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 left-4 w-[500px] h-[600px] bg-white rounded-lg shadow-xl border z-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Mechanic Assistant</h3>
          <p className="text-sm opacity-90">AI-powered repair assistance</p>
        </div>
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(['chat', 'diagnostics', 'parts', 'procedures'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    
                    {/* Safety Alerts */}
                    {message.safetyAlerts && message.safetyAlerts.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.safetyAlerts.map((alert, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-xs ${
                              alert.level === 'danger' ? 'bg-red-100 text-red-800' :
                              alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <strong>{alert.level.toUpperCase()}:</strong> {alert.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="p-2 border-t">
              <div className="flex flex-wrap gap-1 mb-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about diagnostics, parts, procedures..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*,.pdf"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg px-3 py-2 text-sm transition-colors"
                  title="Upload image or document"
                >
                  📎
                </button>
                <button
                  onClick={() => handleSendMessage(inputMessage)}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content would go here */}
        {activeTab !== 'chat' && (
          <div className="p-4 text-center text-gray-500">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} panel coming soon...
          </div>
        )}
      </div>
    </div>
  );
};

export default MechanicAssistantWidget;