'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import AbacusAssistant from '~/components/AbacusAssistant';
import VinDecoder from '~/components/VinDecoder';
import AITestPrompt from '~/components/AITestPrompt';

// Mock job data - in a real app this would come from the database
const mockJobs = [
  {
    id: 'job_001',
    customerId: 'cust_001',
    customerName: 'John Smith',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      year: 2018,
      vin: '1HGBH41JXMN109186'
    },
    description: 'Engine making strange noise, rough idle',
    status: 'assigned',
    priority: 'high',
    location: '123 Main St, Anytown, ST 12345',
    scheduledDate: '2024-01-15T10:00:00Z'
  },
  {
    id: 'job_002',
    customerId: 'cust_002',
    customerName: 'Sarah Johnson',
    vehicleInfo: {
      make: 'Honda',
      model: 'Civic',
      year: 2020,
      vin: '2HGFC2F59MH123456'
    },
    description: 'Brake pads squealing, needs inspection',
    status: 'in_progress',
    priority: 'medium',
    location: '456 Oak Ave, Somewhere, ST 67890',
    scheduledDate: '2024-01-15T14:00:00Z'
  }
];

export default function MechanicJobsPage() {
  const { data: session } = useSession();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'tools' | 'test'>('jobs');

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access the mechanic dashboard.</p>
        </div>
      </div>
    );
  }

  const handleJobSelect = (jobId: string) => {
    setSelectedJob(jobId);
    setShowAssistant(true);
  };

  const selectedJobData = mockJobs.find(job => job.id === selectedJob);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mechanic Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {session.user.name || session.user.email}</p>
          
          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Jobs
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tools'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Diagnostic Tools
              </button>
              <button
                onClick={() => setActiveTab('test')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'test'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                AI Test Console
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'jobs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Jobs List */}
            <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Active Jobs</h2>
            </div>
            <div className="divide-y">
              {mockJobs.map((job) => (
                <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {job.vehicleInfo.year} {job.vehicleInfo.make} {job.vehicleInfo.model}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : job.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {job.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{job.description}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Customer: {job.customerName}</p>
                        <p>Location: {job.location}</p>
                        <p>Scheduled: {new Date(job.scheduledDate).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        job.status === 'assigned' 
                          ? 'bg-blue-100 text-blue-800'
                          : job.status === 'in_progress'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => handleJobSelect(job.id)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                      >
                        Get AI Help
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Assistant */}
          <div className="bg-white rounded-lg shadow-md">
            {showAssistant ? (
              <div className="h-full">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">AI Assistant</h2>
                  {selectedJobData && (
                    <div className="text-sm text-gray-600">
                      Job: {selectedJobData.vehicleInfo.year} {selectedJobData.vehicleInfo.make} {selectedJobData.vehicleInfo.model}
                    </div>
                  )}
                </div>
                <div className="p-4" style={{ height: 'calc(100vh - 300px)' }}>
                  <AbacusAssistant 
                    mechanicId={session.user.id} 
                    jobId={selectedJob || undefined}
                    className="h-full"
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">AI Mechanic Assistant</h3>
                <p className="text-gray-600 mb-4">
                  Select a job from the list to get AI-powered diagnostic help, repair procedures, and technical guidance.
                </p>
                <button
                  onClick={() => setShowAssistant(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Start General Chat
                </button>
              </div>
            )}
          </div>
            {/* Quick Actions */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Complete Job</h3>
                  <p className="text-sm text-gray-600 mt-1">Mark current job as completed</p>
                </button>
                
                <button 
                  onClick={() => setActiveTab('tools')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">VIN Decoder</h3>
                  <p className="text-sm text-gray-600 mt-1">Decode vehicle information</p>
                </button>
                
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-gray-900">Parts Lookup</h3>
                  <p className="text-sm text-gray-600 mt-1">Find compatible parts</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Tools Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <VinDecoder className="w-full" />
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-bold text-lg mb-4">Diagnostic Tools</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Engine Code Database</h4>
                    <p className="text-sm text-gray-600 mb-3">Quick lookup for VW/Audi engine codes and common issues</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                      Open Database
                    </button>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Diagnostic Flowcharts</h4>
                    <p className="text-sm text-gray-600 mb-3">Step-by-step diagnostic procedures for common symptoms</p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                      View Flowcharts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Test Console Tab */}
        {activeTab === 'test' && (
          <div className="flex justify-center">
            <AITestPrompt mechanicId={session.user.id} />
          </div>
        )}
      </div>
    </div>
  );
}