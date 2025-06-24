import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { VinDecodeResult, Vehicle } from '@/src/types';
import * as Icons from 'lucide-react-native';

interface VinScannerProps {
  onVehicleDecoded: (vehicle: Partial<Vehicle>, vinResult: VinDecodeResult) => void;
  onCancel?: () => void;
  initialVin?: string;
}

const VIN_VALIDATION_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

// NHTSA API endpoint for VIN decoding
const NHTSA_API_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

// Fallback VIN decode patterns (simplified)
const VIN_DECODE_PATTERNS = {
  // World Manufacturer Identifier (WMI) - first 3 characters
  manufacturers: {
    '1': 'United States',
    '4': 'United States',
    '5': 'United States',
    'J': 'Japan',
    'K': 'South Korea',
    'W': 'Germany',
    'Y': 'Sweden',
    'Z': 'Italy',
    'S': 'United Kingdom',
    'V': 'France',
    '3': 'Mexico',
    '2': 'Canada',
  },
  // Common manufacturer codes
  wmi: {
    '1G1': 'Chevrolet',
    '1G6': 'Cadillac',
    '1GM': 'Pontiac',
    '1GC': 'Chevrolet Truck',
    '1FA': 'Ford',
    '1FD': 'Ford Truck',
    '1FT': 'Ford Truck',
    '1HC': 'Peterbilt',
    '1HG': 'Honda',
    '1J4': 'Jeep',
    '1L1': 'Lincoln',
    '1ME': 'Mercury',
    '1N4': 'Nissan',
    '1NX': 'Toyota',
    '1VW': 'Volkswagen',
    '1YV': 'Mazda',
    '2C3': 'Chrysler',
    '2FA': 'Ford',
    '2G1': 'Chevrolet',
    '2HG': 'Honda',
    '2HK': 'Honda',
    '2T1': 'Toyota',
    '3FA': 'Ford',
    '3G5': 'Oldsmobile',
    '3N1': 'Nissan',
    '3VW': 'Volkswagen',
    '4F2': 'Mazda',
    '4F4': 'Mazda',
    '4T1': 'Toyota',
    '4T3': 'Toyota',
    '5J6': 'Honda',
    '5N1': 'Nissan',
    '5NP': 'Hyundai',
    '5TD': 'Toyota',
    'JH4': 'Acura',
    'JHM': 'Honda',
    'JN1': 'Nissan',
    'JN8': 'Nissan',
    'JT2': 'Toyota',
    'JT3': 'Toyota',
    'KM8': 'Hyundai',
    'KNA': 'Kia',
    'KNL': 'Kia',
    'WBA': 'BMW',
    'WBS': 'BMW',
    'WDB': 'Mercedes-Benz',
    'WDD': 'Mercedes-Benz',
    'WVW': 'Volkswagen',
    'YV1': 'Volvo',
    'ZAM': 'Maserati',
    'ZAR': 'Alfa Romeo',
    'ZFF': 'Ferrari',
  }
};

export function VinScanner({ onVehicleDecoded, onCancel, initialVin = '' }: VinScannerProps) {
  const [vin, setVin] = useState(initialVin);
  const [isLoading, setIsLoading] = useState(false);
  const [vinResult, setVinResult] = useState<VinDecodeResult | null>(null);
  const [error, setError] = useState<string>('');
  const [manualEntry, setManualEntry] = useState(false);
  const [manualVehicleData, setManualVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
  });

  useEffect(() => {
    if (vin.length === 17 && isValidVin(vin)) {
      handleVinDecode();
    }
  }, [vin]);

  const isValidVin = (vinCode: string): boolean => {
    if (!vinCode || vinCode.length !== 17) return false;
    return VIN_VALIDATION_REGEX.test(vinCode.toUpperCase());
  };

  const calculateCheckDigit = (vinCode: string): string => {
    // Simplified VIN check digit calculation
    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    const values: { [key: string]: number } = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
      'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9, 'S': 2,
      'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
    };

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      if (i !== 8) { // Skip check digit position
        const char = vinCode[i];
        sum += (values[char] || 0) * weights[i];
      }
    }

    const remainder = sum % 11;
    return remainder === 10 ? 'X' : remainder.toString();
  };

  const decodeVinNHTSA = async (vinCode: string): Promise<VinDecodeResult> => {
    try {
      const response = await fetch(
        `${NHTSA_API_BASE}/DecodeVin/${vinCode}?format=json`
      );
      
      if (!response.ok) {
        throw new Error(`NHTSA API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.Results && data.Results.length > 0) {
        const results = data.Results;
        const getValueByVariable = (variableName: string) => {
          const item = results.find((r: any) => r.Variable === variableName);
          return item?.Value || '';
        };

        return {
          vin: vinCode,
          make: getValueByVariable('Make'),
          model: getValueByVariable('Model'),
          year: parseInt(getValueByVariable('Model Year'), 10) || undefined,
          bodyClass: getValueByVariable('Body Class'),
          engineSize: getValueByVariable('Engine Number of Cylinders'),
          fuelType: getValueByVariable('Fuel Type - Primary'),
          transmission: getValueByVariable('Transmission Style'),
          driveType: getValueByVariable('Drive Type'),
          valid: true,
          source: 'nhtsa',
        };
      }

      throw new Error('No data returned from NHTSA API');
    } catch (error) {
      console.error('NHTSA API error:', error);
      throw error;
    }
  };

  const decodeVinFallback = (vinCode: string): VinDecodeResult => {
    const wmi = vinCode.substring(0, 3);
    const make = VIN_DECODE_PATTERNS.wmi[wmi] || 'Unknown';
    
    // Extract year from VIN (10th character)
    const yearMap: { [key: string]: number } = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014, 'F': 2015,
      'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
      'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025, 'T': 2026, 'V': 2027,
      'W': 2028, 'X': 2029, 'Y': 2030, '1': 2001, '2': 2002, '3': 2003,
      '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009
    };
    
    const yearChar = vinCode[9];
    const year = yearMap[yearChar];

    return {
      vin: vinCode,
      make,
      model: 'Unknown', // Cannot reliably decode model from VIN pattern
      year,
      valid: isValidVin(vinCode),
      source: 'fallback',
    };
  };

  const handleVinDecode = async () => {
    if (!isValidVin(vin)) {
      setError('Invalid VIN format. VIN must be exactly 17 characters.');
      setVinResult(null);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First try NHTSA API
      let result: VinDecodeResult;
      
      try {
        result = await decodeVinNHTSA(vin.toUpperCase());
        
        // Log successful NHTSA decode in production
        if (__DEV__) {
          console.log('VIN decoded successfully via NHTSA:', result);
        }
      } catch (nhtsaError) {
        console.warn('NHTSA API failed, using fallback decode:', nhtsaError);
        
        // Fallback to pattern matching
        result = decodeVinFallback(vin.toUpperCase());
        
        if (__DEV__) {
          console.log('VIN decoded via fallback:', result);
        }
      }

      setVinResult(result);
      
      if (!result.make || result.make === 'Unknown') {
        setError('VIN decoded but some vehicle information could not be determined. Please verify the details below.');
      }
    } catch (error) {
      console.error('VIN decode error:', error);
      setError('Failed to decode VIN. Please check the VIN number and try again.');
      setVinResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVinInput = (text: string) => {
    const cleanText = text.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    setVin(cleanText);
    setError('');
    
    if (vinResult) {
      setVinResult(null);
    }
  };

  const handleManualSubmit = () => {
    if (!manualVehicleData.make.trim() || !manualVehicleData.model.trim()) {
      Alert.alert('Error', 'Make and model are required fields.');
      return;
    }

    const year = parseInt(manualVehicleData.year, 10);
    if (manualVehicleData.year && (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1)) {
      Alert.alert('Error', 'Please enter a valid year.');
      return;
    }

    const manualResult: VinDecodeResult = {
      vin: vin || 'MANUAL_ENTRY',
      make: manualVehicleData.make.trim(),
      model: manualVehicleData.model.trim(),
      year: year || undefined,
      valid: false,
      source: 'manual',
    };

    const vehicleData: Partial<Vehicle> = {
      vin: vin || undefined,
      make: manualVehicleData.make.trim(),
      model: manualVehicleData.model.trim(),
      year: year || undefined,
      color: manualVehicleData.color.trim() || undefined,
    };

    onVehicleDecoded(vehicleData, manualResult);
  };

  const handleDecodeSubmit = () => {
    if (!vinResult) return;

    const vehicleData: Partial<Vehicle> = {
      vin: vinResult.vin,
      make: vinResult.make,
      model: vinResult.model,
      year: vinResult.year,
    };

    onVehicleDecoded(vehicleData, vinResult);
  };

  const renderVinInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vehicle Identification Number (VIN)</Text>
      <Text style={styles.sectionDescription}>
        Enter the 17-character VIN to automatically decode vehicle information
      </Text>
      
      <View style={styles.vinInputContainer}>
        <TextInput
          style={[styles.vinInput, error && styles.inputError]}
          value={vin}
          onChangeText={handleVinInput}
          placeholder="Enter VIN (17 characters)"
          maxLength={17}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isLoading}
        />
        {vin.length > 0 && (
          <Text style={[
            styles.vinCounter,
            vin.length === 17 ? styles.vinCounterComplete : styles.vinCounterIncomplete
          ]}>
            {vin.length}/17
          </Text>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Icons.AlertCircle size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {vin.length === 17 && (
        <Button
          title="Decode VIN"
          onPress={handleVinDecode}
          variant="primary"
          size="medium"
          loading={isLoading}
          style={styles.decodeButton}
        />
      )}
    </View>
  );

  const renderVinResult = () => {
    if (!vinResult) return null;

    return (
      <View style={styles.section}>
        <View style={styles.resultHeader}>
          <Icons.CheckCircle size={20} color={Colors.success} />
          <Text style={styles.resultTitle}>Vehicle Information Decoded</Text>
        </View>

        <View style={styles.resultCard}>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>VIN:</Text>
            <Text style={styles.resultValue}>{vinResult.vin}</Text>
          </View>
          
          {vinResult.make && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Make:</Text>
              <Text style={styles.resultValue}>{vinResult.make}</Text>
            </View>
          )}
          
          {vinResult.model && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Model:</Text>
              <Text style={styles.resultValue}>{vinResult.model}</Text>
            </View>
          )}
          
          {vinResult.year && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Year:</Text>
              <Text style={styles.resultValue}>{vinResult.year}</Text>
            </View>
          )}
          
          {vinResult.bodyClass && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Body Class:</Text>
              <Text style={styles.resultValue}>{vinResult.bodyClass}</Text>
            </View>
          )}
          
          {vinResult.fuelType && (
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Fuel Type:</Text>
              <Text style={styles.resultValue}>{vinResult.fuelType}</Text>
            </View>
          )}

          <View style={styles.sourceIndicator}>
            <Text style={styles.sourceLabel}>
              Data source: {vinResult.source === 'nhtsa' ? 'NHTSA Database' : 'Pattern Matching'}
            </Text>
            <View style={[
              styles.sourceDot,
              { backgroundColor: vinResult.source === 'nhtsa' ? Colors.success : Colors.warning }
            ]} />
          </View>
        </View>

        <Button
          title="Use This Vehicle Information"
          onPress={handleDecodeSubmit}
          variant="primary"
          size="medium"
          style={styles.useButton}
        />
      </View>
    );
  };

  const renderManualEntry = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Manual Vehicle Entry</Text>
      <Text style={styles.sectionDescription}>
        Enter vehicle information manually if VIN is not available or decode failed
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Make *</Text>
        <TextInput
          style={styles.formInput}
          value={manualVehicleData.make}
          onChangeText={(text) => setManualVehicleData(prev => ({ ...prev, make: text }))}
          placeholder="e.g. Toyota, Honda, Ford"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Model *</Text>
        <TextInput
          style={styles.formInput}
          value={manualVehicleData.model}
          onChangeText={(text) => setManualVehicleData(prev => ({ ...prev, model: text }))}
          placeholder="e.g. Camry, Civic, F-150"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Year</Text>
        <TextInput
          style={styles.formInput}
          value={manualVehicleData.year}
          onChangeText={(text) => setManualVehicleData(prev => ({ ...prev, year: text }))}
          placeholder="e.g. 2020"
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Color</Text>
        <TextInput
          style={styles.formInput}
          value={manualVehicleData.color}
          onChangeText={(text) => setManualVehicleData(prev => ({ ...prev, color: text }))}
          placeholder="e.g. Red, Blue, Silver"
          autoCapitalize="words"
        />
      </View>

      <Button
        title="Add Vehicle Information"
        onPress={handleManualSubmit}
        variant="primary"
        size="medium"
        style={styles.submitButton}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icons.Car size={24} color={Colors.primary} />
        <Text style={styles.title}>Vehicle Information</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!manualEntry && renderVinInput()}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>Decoding VIN...</Text>
          </View>
        )}

        {vinResult && renderVinResult()}

        {!manualEntry && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setManualEntry(!manualEntry)}
        >
          <Icons.Edit size={16} color={Colors.primary} />
          <Text style={styles.toggleButtonText}>
            {manualEntry ? 'Switch to VIN Scanner' : 'Enter Vehicle Info Manually'}
          </Text>
        </TouchableOpacity>

        {manualEntry && renderManualEntry()}
      </ScrollView>

      {onCancel && (
        <View style={styles.actionButtons}>
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            size="medium"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  vinInputContainer: {
    position: 'relative',
  },
  vinInput: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: Colors.text,
    fontFamily: 'monospace',
    letterSpacing: 1,
    textAlign: 'center',
  },
  inputError: {
    borderColor: Colors.error,
  },
  vinCounter: {
    position: 'absolute',
    right: 12,
    top: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  vinCounterComplete: {
    color: Colors.success,
  },
  vinCounterIncomplete: {
    color: Colors.textMuted,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 8,
    flex: 1,
  },
  decodeButton: {
    marginTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.separator,
  },
  resultLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.separator,
  },
  sourceLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  useButton: {
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  toggleButtonText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  submitButton: {
    marginTop: 8,
  },
  actionButtons: {
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});