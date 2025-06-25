import React, { useState, useRef, useEffect } from 'react';
import { api } from '~/utils/api';
import type { CustomerSupportContext } from '~/lib/ai/customer-support';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actionRequired?: {
    type: 'booking' | 'payment' | 'escalation' | 'information';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    details: Record<string, any>;
  };
}

interface CustomerSupportWidgetProps {
  customerId?: string;
  context?: CustomerSupportContext;
  onActionRequired?: (action: Message['actionRequired']) => void;
  className?: string;
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export const CustomerSupportWidget: React.FC<CustomerSupportWidgetProps> = ({
  customerId,
  context,
  onActionRequired,
  className = '',
  minimized = false,
  onToggleMinimize,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm here to help you with any questions about your vehicle service. How can I assist you today?",
      timestamp: new Date(),
      suggestions: [
        "Schedule an appointment",
        "Check service status",
        "Get pricing information",
        "Ask about my vehicle"
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = api.ai.customerSupport.chat.useMutation({
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        suggestions: response.suggestedResponses,
        actionRequired: response.actionRequired,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setSessionId(response.sessionId);

      if (response.actionRequired && onActionRequired) {
        onActionRequired(response.actionRequired);
      }

      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }]);
      setIsLoading(false);
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
      customerId,
      context,
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  if (minimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={onToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl border z-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Customer Support</h3>
          <p className="text-sm opacity-90">We're here to help!</p>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm">{message.content}</p>
              {message.actionRequired && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  message.actionRequired.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  message.actionRequired.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  Action Required: {message.actionRequired.type}
                </div>
              )}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded p-1 transition-colors"
                    >
                      {suggestion}
                    </button>
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

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 text-sm transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportWidget;