'use client';

import React, { useState } from 'react';
import { api } from '~/utils/api';

interface VinDecodeResult {
  engineCode?: string;
  make?: string;
  model?: string;
  year?: string;
  displacement?: string;
  fuelType?: string;
  driveType?: string;
  transmission?: string;
  raw?: any[];
  error?: string;
}

interface VinDecoderProps {
  onVinDecoded?: (result: VinDecodeResult & { vin: string }) => void;
  jobId?: string;
  className?: string;
  mode?: 'standalone' | 'embedded';
}

export default function VinDecoder({ 
  onVinDecoded, 
  jobId, 
  className = '', 
  mode = 'standalone' 
}: VinDecoderProps) {
  const [vin, setVin] = useState('');
  const [result, setResult] = useState<VinDecodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tRPC mutations
  const decodeVinMutation = api.vin.decode.useMutation();
  const setJobVinMutation = api.vin.setJobVin.useMutation();

  const validateVin = (vinString: string): boolean => {
    // Basic VIN validation
    const cleanVin = vinString.replace(/[^A-HJ-NPR-Z0-9]/g, '').toUpperCase();
    return cleanVin.length === 17 && !/[IOQ]/.test(cleanVin);
  };

  const handleDecode = async () => {
    if (!vin.trim()) {
      setError('Please enter a VIN');
      return;
    }

    const cleanVin = vin.replace(/[^A-HJ-NPR-Z0-9]/g, '').toUpperCase();
    
    if (!validateVin(cleanVin)) {
      setError('Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use our VIN decoder API
      const vinData = await decodeVinMutation.mutateAsync({ vin: cleanVin });
      
      const decodedResult: VinDecodeResult = {
        engineCode: vinData.engineCode || 'Unknown',
        make: vinData.make || 'Unknown',
        model: vinData.model || 'Unknown', 
        year: vinData.year?.toString() || 'Unknown',
        displacement: vinData.displacement || 'Unknown',
        fuelType: vinData.fuelType || 'Unknown',
        driveType: vinData.driveType || 'Unknown',
        transmission: vinData.transmission || 'Unknown',
        raw: vinData.raw || []
      };

      setResult(decodedResult);

      // Save to job if jobId provided
      if (jobId) {
        try {
          await setJobVinMutation.mutateAsync({
            jobId,
            vin: cleanVin
          });
        } catch (jobError) {
          console.error('Failed to save VIN to job:', jobError);
        }
      }

      // Callback for parent components
      if (onVinDecoded) {
        onVinDecoded({ ...decodedResult, vin: cleanVin });
      }

    } catch (err) {
      console.error('VIN decode error:', err);
      setError(err instanceof Error ? err.message : 'Failed to decode VIN');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^A-HJ-NPR-Z0-9]/g, '').toUpperCase();
    if (value.length <= 17) {
      setVin(value);
      setError(null);
    }
  };

  const containerClass = mode === 'embedded' 
    ? `border rounded-lg shadow-sm bg-white ${className}`
    : `p-6 border rounded-xl shadow-lg bg-white w-full max-w-2xl ${className}`;

  return (
    <div className={containerClass}>
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-bold text-lg">VIN Decoder</h3>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter 17-character VIN (e.g. 1HGBH41JXMN109186)"
              value={vin}
              onChange={handleVinChange}
              maxLength={17}
              disabled={loading}
            />
            <div className="text-xs text-gray-500 mt-1">
              {vin.length}/17 characters
            </div>
          </div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDecode}
            disabled={loading || vin.length !== 17}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Decoding...</span>
              </div>
            ) : (
              'Decode'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Vehicle Information Decoded</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Make:</span>
                  <span className="text-gray-800">{result.make}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Model:</span>
                  <span className="text-gray-800">{result.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Year:</span>
                  <span className="text-gray-800">{result.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Engine:</span>
                  <span className="text-gray-800 font-mono">{result.engineCode}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Displacement:</span>
                  <span className="text-gray-800">{result.displacement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Fuel Type:</span>
                  <span className="text-gray-800">{result.fuelType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Drive Type:</span>
                  <span className="text-gray-800">{result.driveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Transmission:</span>
                  <span className="text-gray-800">{result.transmission}</span>
                </div>
              </div>
            </div>

            {jobId && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>VIN data saved to job {jobId}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}