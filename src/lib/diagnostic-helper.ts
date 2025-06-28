import { 
  ENGINE_KNOWLEDGE, 
  OBD_CODES, 
  VIN_PARSING,
  COMMUNICATION_TEMPLATES,
  DIAGNOSTIC_WORKFLOWS 
} from '~/config/mechanic-ai-knowledge';

export class DiagnosticHelper {
  /**
   * Parse VIN and identify engine for targeted diagnostics
   */
  static parseVehicleContext(vin?: string): {
    engineCode?: string;
    engineType?: string;
    knownIssues?: string[];
    diagnosticPriority?: string[];
  } {
    if (!vin) return {};
    
    const engineCode = VIN_PARSING.vinToEngine(vin);
    if (!engineCode || !(engineCode in ENGINE_KNOWLEDGE.engines)) {
      return { engineCode: engineCode || 'Unknown' };
    }
    
    const engineData = ENGINE_KNOWLEDGE.engines[engineCode as keyof typeof ENGINE_KNOWLEDGE.engines];
    
    return {
      engineCode,
      engineType: engineData.designation,
      knownIssues: [...engineData.commonIssues],
      diagnosticPriority: [...engineData.diagnosticPriority]
    };
  }

  /**
   * Get mechanic-focused explanation for OBD codes
   */
  static explainObdCode(code: string): string {
    const allCodes = { ...OBD_CODES.misfireCodes, ...OBD_CODES.timingCodes };
    const codeData = allCodes[code as keyof typeof allCodes];
    
    if (!codeData) {
      return `${code} - Code not in knowledge base. Check service manual for specific diagnostic steps.`;
    }
    
    return COMMUNICATION_TEMPLATES.codeExplanation(code, codeData.mechanicAction);
  }

  /**
   * Generate diagnostic workflow based on symptoms
   */
  static generateDiagnosticPath(symptoms: string[]): string[] {
    const hasElectricalSymptoms = symptoms.some(s => 
      s.toLowerCase().includes('code') || 
      s.toLowerCase().includes('sensor') ||
      s.toLowerCase().includes('light')
    );
    
    const hasMechanicalSymptoms = symptoms.some(s =>
      s.toLowerCase().includes('noise') ||
      s.toLowerCase().includes('vibration') ||
      s.toLowerCase().includes('rough')
    );
    
    const hasPerformanceSymptoms = symptoms.some(s =>
      s.toLowerCase().includes('power') ||
      s.toLowerCase().includes('fuel') ||
      s.toLowerCase().includes('mpg')
    );
    
    if (hasElectricalSymptoms) return [...DIAGNOSTIC_WORKFLOWS.electricalDiagnosis];
    if (hasMechanicalSymptoms) return [...DIAGNOSTIC_WORKFLOWS.mechanicalDiagnosis];
    if (hasPerformanceSymptoms) return [...DIAGNOSTIC_WORKFLOWS.performanceDiagnosis];
    
    return [...DIAGNOSTIC_WORKFLOWS.electricalDiagnosis]; // Default
  }

  /**
   * Format enhanced context for AI with vehicle-specific knowledge
   */
  static formatEnhancedContext(context: {
    vehicleInfo?: {
      make?: string;
      model?: string;
      year?: number;
      vin?: string;
    };
    symptoms?: string[];
    codes?: string[];
    jobId?: string;
  }): string {
    let enhancedContext = '';
    
    // Vehicle identification
    if (context.vehicleInfo) {
      const { make, model, year, vin } = context.vehicleInfo;
      enhancedContext += `VEHICLE: ${year} ${make} ${model}\n`;
      
      if (vin) {
        const engineInfo = this.parseVehicleContext(vin);
        enhancedContext += `VIN: ${vin}\n`;
        if (engineInfo.engineCode) {
          enhancedContext += `ENGINE: ${engineInfo.engineCode} (${engineInfo.engineType})\n`;
          if (engineInfo.knownIssues) {
            enhancedContext += `KNOWN ISSUES: ${engineInfo.knownIssues.join(', ')}\n`;
          }
          if (engineInfo.diagnosticPriority) {
            enhancedContext += `DIAGNOSTIC PRIORITY: ${engineInfo.diagnosticPriority.join(' → ')}\n`;
          }
        }
      }
    }
    
    // Codes with mechanic context
    if (context.codes && context.codes.length > 0) {
      enhancedContext += `\nDTC CODES:\n`;
      context.codes.forEach(code => {
        enhancedContext += `• ${this.explainObdCode(code)}\n`;
      });
    }
    
    // Symptoms with diagnostic path
    if (context.symptoms && context.symptoms.length > 0) {
      enhancedContext += `\nSYMPTOMS: ${context.symptoms.join(', ')}\n`;
      const diagnosticPath = this.generateDiagnosticPath(context.symptoms);
      enhancedContext += `SUGGESTED PATH: ${diagnosticPath.join(' → ')}\n`;
    }
    
    return enhancedContext;
  }

  /**
   * Validate mechanic mode access
   */
  static validateMechanicMode(userRole?: string, context?: string): boolean {
    // Ensure only mechanic-mode access
    if (userRole && userRole !== 'MECHANIC') return false;
    if (context && context.toLowerCase().includes('customer')) return false;
    return true;
  }
}