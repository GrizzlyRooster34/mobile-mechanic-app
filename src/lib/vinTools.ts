/**
 * Enhanced VIN Decoder Tools
 * Integrates NHTSA API with our existing diagnostic knowledge base
 */

import { DiagnosticHelper } from './diagnostic-helper';

export interface VinDecodeResult {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  engineCode?: string;
  displacement?: string;
  fuelType?: string;
  driveType?: string;
  transmission?: string;
  bodyClass?: string;
  raw?: NHTSAResult[];
  diagnosticInfo?: {
    knownIssues?: string[];
    diagnosticPriority?: string[];
    engineType?: string;
  };
  error?: string;
}

interface NHTSAResult {
  Variable: string;
  Value: string;
  ValueId: string;
}

interface NHTSAResponse {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: NHTSAResult[];
}

/**
 * Decode VIN using NHTSA API with enhanced diagnostic context
 */
export async function decodeVIN(vin: string): Promise<VinDecodeResult> {
  if (!vin || vin.length !== 17) {
    throw new Error('Invalid VIN: Must be exactly 17 characters');
  }

  // Clean and validate VIN
  const cleanVin = vin.replace(/[^A-HJ-NPR-Z0-9]/g, '').toUpperCase();
  if (cleanVin.length !== 17 || /[IOQ]/.test(cleanVin)) {
    throw new Error('Invalid VIN: Contains invalid characters (I, O, Q not allowed)');
  }

  try {
    // Call NHTSA API
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HeinicusMobileApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status} ${response.statusText}`);
    }

    const data: NHTSAResponse = await response.json();

    if (!data.Results || data.Results.length === 0) {
      throw new Error('No VIN decode results returned from NHTSA');
    }

    // Extract relevant information
    const result = extractVehicleInfo(data.Results, cleanVin);

    // Add diagnostic context using our existing knowledge base
    const diagnosticInfo = DiagnosticHelper.parseVehicleContext(cleanVin);
    result.diagnosticInfo = diagnosticInfo;

    return result;

  } catch (error) {
    console.error('VIN decode error:', error);
    
    // Fallback to our local VIN parser for known engines
    const fallbackInfo = DiagnosticHelper.parseVehicleContext(cleanVin);
    
    return {
      vin: cleanVin,
      make: 'Unknown',
      model: 'Unknown', 
      engineCode: fallbackInfo.engineCode || 'Unknown',
      diagnosticInfo: fallbackInfo,
      error: error instanceof Error ? error.message : 'VIN decode failed',
      raw: []
    };
  }
}

/**
 * Extract and format vehicle information from NHTSA results
 */
function extractVehicleInfo(results: NHTSAResult[], vin: string): VinDecodeResult {
  const getValue = (variableName: string): string | undefined => {
    const result = results.find(r => r.Variable === variableName);
    return result?.Value && result.Value !== 'Not Applicable' && result.Value !== '' ? result.Value : undefined;
  };

  const year = getValue('Model Year');
  
  return {
    vin,
    make: getValue('Make'),
    model: getValue('Model'),
    year: year ? parseInt(year) : undefined,
    engineCode: getValue('Engine Model') || getValue('Engine Configuration'),
    displacement: getValue('Displacement (L)') || getValue('Displacement (CC)'),
    fuelType: getValue('Fuel Type - Primary'),
    driveType: getValue('Drive Type'),
    transmission: getValue('Transmission Style'),
    bodyClass: getValue('Body Class'),
    raw: results
  };
}

/**
 * Batch decode multiple VINs (for processing large datasets)
 */
export async function batchDecodeVINs(vins: string[], batchSize: number = 5): Promise<VinDecodeResult[]> {
  const results: VinDecodeResult[] = [];
  
  for (let i = 0; i < vins.length; i += batchSize) {
    const batch = vins.slice(i, i + batchSize);
    const batchPromises = batch.map(vin => 
      decodeVIN(vin).catch(error => ({
        vin,
        error: error.message,
        make: 'Unknown',
        model: 'Unknown'
      } as VinDecodeResult))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting - wait between batches
    if (i + batchSize < vins.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Validate VIN checksum using the standard algorithm
 */
export function validateVINChecksum(vin: string): boolean {
  if (vin.length !== 17) return false;
  
  const transliteration: { [key: string]: number } = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };
  
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const checkDigit = vin[8];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    if (i === 8) continue; // Skip check digit position
    const char = vin[i];
    if (!char) return false;
    const value = transliteration[char];
    if (value === undefined) return false;
    const weight = weights[i];
    if (weight === undefined) return false;
    sum += value * weight;
  }
  
  const remainder = sum % 11;
  const expectedCheckDigit = remainder === 10 ? 'X' : remainder.toString();
  
  return checkDigit === expectedCheckDigit;
}

/**
 * Enhanced VIN parser that combines NHTSA data with our diagnostic knowledge
 */
export async function enhancedVinAnalysis(vin: string): Promise<{
  vehicleInfo: VinDecodeResult;
  diagnosticSuggestions: string[];
  maintenanceSchedule?: any;
}> {
  const vehicleInfo = await decodeVIN(vin);
  const diagnosticSuggestions: string[] = [];
  
  // Add diagnostic suggestions based on known issues
  if (vehicleInfo.diagnosticInfo?.knownIssues) {
    diagnosticSuggestions.push(
      `Known issues for ${vehicleInfo.diagnosticInfo.engineType}: ${vehicleInfo.diagnosticInfo.knownIssues.join(', ')}`
    );
  }
  
  if (vehicleInfo.diagnosticInfo?.diagnosticPriority) {
    diagnosticSuggestions.push(
      `Diagnostic priority: ${vehicleInfo.diagnosticInfo.diagnosticPriority.join(' → ')}`
    );
  }
  
  // Age-based suggestions
  if (vehicleInfo.year) {
    const age = new Date().getFullYear() - vehicleInfo.year;
    if (age > 10) {
      diagnosticSuggestions.push('High-mileage vehicle: Check wear items (timing chain, water pump, PCV system)');
    }
  }
  
  return {
    vehicleInfo,
    diagnosticSuggestions,
    // TODO: Add maintenance schedule based on make/model/year
  };
}

/**
 * Format VIN data for AI context
 */
export function formatVinForAI(vinData: VinDecodeResult): string {
  let context = '';
  
  if (vinData.year && vinData.make && vinData.model) {
    context += `Vehicle: ${vinData.year} ${vinData.make} ${vinData.model}\n`;
  }
  
  context += `VIN: ${vinData.vin}\n`;
  
  if (vinData.engineCode && vinData.engineCode !== 'Unknown') {
    context += `Engine: ${vinData.engineCode}`;
    if (vinData.diagnosticInfo?.engineType) {
      context += ` (${vinData.diagnosticInfo.engineType})`;
    }
    context += '\n';
  }
  
  if (vinData.diagnosticInfo?.knownIssues && vinData.diagnosticInfo.knownIssues.length > 0) {
    context += `Known Issues: ${vinData.diagnosticInfo.knownIssues.join(', ')}\n`;
  }
  
  if (vinData.diagnosticInfo?.diagnosticPriority && vinData.diagnosticInfo.diagnosticPriority.length > 0) {
    context += `Diagnostic Priority: ${vinData.diagnosticInfo.diagnosticPriority.join(' → ')}\n`;
  }
  
  return context;
}