'use client';

import React, { useState } from 'react';
import { api } from '~/utils/api';

interface TestScenario {
  name: string;
  prompt: string;
  context?: {
    vehicleInfo?: {
      make: string;
      model: string;
      year: number;
      vin?: string;
    };
    codes?: string[];
    symptoms?: string[];
  };
}

interface AITestPromptProps {
  mechanicId: string;
  className?: string;
}

const predefinedTests: TestScenario[] = [
  {
    name: "VW GTI P0302 Misfire",
    prompt: "Customer reports rough idle and check engine light. Scanned P0302.",
    context: {
      vehicleInfo: {
        make: "Volkswagen",
        model: "GTI", 
        year: 2018,
        vin: "WVWZZZ1KZBW123456"
      },
      codes: ["P0302"],
      symptoms: ["rough idle", "check engine light"]
    }
  },
  {
    name: "Audi A4 Timing Chain",
    prompt: "Rattling noise on cold start, getting worse. P0016 and P0017 codes.",
    context: {
      vehicleInfo: {
        make: "Audi",
        model: "A4",
        year: 2015
      },
      codes: ["P0016", "P0017"],
      symptoms: ["rattling noise", "cold start", "getting worse"]
    }
  },
  {
    name: "Generic Diagnostic Question",
    prompt: "What should I check first when I see multiple misfire codes?",
    context: {
      codes: ["P0300", "P0301", "P0302"]
    }
  },
  {
    name: "VIN Analysis Test",
    prompt: "Decode this VIN and tell me common issues: WVWZZZ1KZBW123456",
    context: {}
  }
];

export default function AITestPrompt({ mechanicId, className = '' }: AITestPromptProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedTest, setSelectedTest] = useState<TestScenario | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<Array<{
    prompt: string;
    response: string;
    timestamp: Date;
    scenario?: string;
  }>>([]);

  const mechanicChat = api.ai.mechanicAssistant.mechanicChat.useMutation();

  const runTest = async (testPrompt?: string, context?: TestScenario['context']) => {
    const promptToUse = testPrompt || prompt;
    if (!promptToUse.trim()) return;

    setLoading(true);
    setResponse('');

    try {
      const sessionId = `test_${mechanicId}_${Date.now()}`;
      
      const result = await mechanicChat.mutateAsync({
        message: promptToUse,
        sessionId,
        mechanicId,
        // Enhanced context from test scenario
        ...context && {
          vehicleInfo: context.vehicleInfo,
          symptoms: context.symptoms,
          codes: context.codes,
        }
      });

      setResponse(result.reply);
      
      // Add to test history
      setTestHistory(prev => [{
        prompt: promptToUse,
        response: result.reply,
        timestamp: new Date(),
        scenario: selectedTest?.name
      }, ...prev.slice(0, 9)]); // Keep last 10 tests

    } catch (error) {
      console.error('AI test error:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadPredefinedTest = (test: TestScenario) => {
    setSelectedTest(test);
    setPrompt(test.prompt);
  };

  const clearTest = () => {
    setSelectedTest(null);
    setPrompt('');
    setResponse('');
  };

  return (
    <div className={`bg-white shadow-lg rounded-xl border max-w-4xl w-full ${className}`}>
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h3 className="font-bold text-xl text-gray-800">AI Diagnostic Test Console</h3>
        </div>
        <p className="text-gray-600 text-sm">Test diagnostic prompts and evaluate AI responses for accuracy and tone</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Predefined Test Scenarios */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Predefined Test Scenarios</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {predefinedTests.map((test, index) => (
              <button
                key={index}
                onClick={() => loadPredefinedTest(test)}
                className={`p-3 text-left border rounded-lg transition-colors hover:bg-gray-50 ${
                  selectedTest?.name === test.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="font-medium text-sm text-gray-800">{test.name}</div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">{test.prompt}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Test Context */}
        {selectedTest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Test Context: {selectedTest.name}</h4>
            {selectedTest.context?.vehicleInfo && (
              <div className="text-sm text-blue-700 mb-2">
                Vehicle: {selectedTest.context.vehicleInfo.year} {selectedTest.context.vehicleInfo.make} {selectedTest.context.vehicleInfo.model}
                {selectedTest.context.vehicleInfo.vin && (
                  <span className="font-mono ml-2">({selectedTest.context.vehicleInfo.vin})</span>
                )}
              </div>
            )}
            {selectedTest.context?.codes && selectedTest.context.codes.length > 0 && (
              <div className="text-sm text-blue-700 mb-2">
                Codes: {selectedTest.context.codes.join(', ')}
              </div>
            )}
            {selectedTest.context?.symptoms && selectedTest.context.symptoms.length > 0 && (
              <div className="text-sm text-blue-700">
                Symptoms: {selectedTest.context.symptoms.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Custom Test Input */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">Test Prompt</h4>
            {selectedTest && (
              <button
                onClick={clearTest}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear & Write Custom
              </button>
            )}
          </div>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter custom test prompt (e.g., 'P0302 misfire on BPY engine with rough idle')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-500">
              {prompt.length}/1000 characters
            </div>
            <button
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => runTest(prompt, selectedTest?.context)}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Testing...</span>
                </div>
              ) : (
                'Run Test'
              )}
            </button>
          </div>
        </div>

        {/* Response Display */}
        {response && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">AI Response</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{response}</pre>
            </div>
            
            {/* Response Evaluation */}
            <div className="mt-3 flex items-center space-x-4 text-sm">
              <span className="text-gray-600">Evaluate response:</span>
              <button className="text-green-600 hover:text-green-700 flex items-center space-x-1">
                <span>👍</span>
                <span>Good</span>
              </button>
              <button className="text-yellow-600 hover:text-yellow-700 flex items-center space-x-1">
                <span>🤔</span>
                <span>Needs Work</span>
              </button>
              <button className="text-red-600 hover:text-red-700 flex items-center space-x-1">
                <span>👎</span>
                <span>Poor</span>
              </button>
            </div>
          </div>
        )}

        {/* Test History */}
        {testHistory.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Recent Test History</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {testHistory.map((test, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      {test.scenario || 'Custom Test'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {test.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600 mb-2">
                    <strong>Prompt:</strong> {test.prompt}
                  </div>
                  <div className="text-gray-800 bg-gray-50 p-2 rounded">
                    <strong>Response:</strong> {test.response.slice(0, 200)}
                    {test.response.length > 200 && '...'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}