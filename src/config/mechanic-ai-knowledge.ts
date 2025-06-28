/**
 * Automotive Diagnostic Knowledge Base for Abacus AI
 * Domain: High-Mileage VW/Audi Engines + General Diagnostics
 */

export const ENGINE_KNOWLEDGE = {
  // VW/Audi Specific Engine Data
  engines: {
    BPY: {
      code: 'BPY',
      designation: '2.0T FSI',
      commonIssues: [
        'Cam follower wear',
        'Intake valve carbon buildup', 
        'PCV failure',
        'Timing chain tensioner issues'
      ],
      diagnosticPriority: [
        'Check cam follower condition',
        'Test PCV system operation',
        'Inspect timing chain tensioner',
        'Scope intake valves for carbon'
      ]
    },
    CCTA: {
      code: 'CCTA',
      designation: '2.0T TSI',
      commonIssues: [
        'Wastegate rattle',
        'Water pump leaks',
        'Intake manifold runner faults'
      ],
      diagnosticPriority: [
        'Test wastegate actuator',
        'Check coolant system pressure',
        'Verify intake runner operation'
      ]
    },
    CBFA: {
      code: 'CBFA', 
      designation: '2.0T TSI',
      commonIssues: [
        'Wastegate rattle',
        'Water pump leaks', 
        'Intake manifold runner faults'
      ],
      diagnosticPriority: [
        'Test wastegate actuator',
        'Check coolant system pressure',
        'Verify intake runner operation'
      ]
    }
  }
} as const;

export const DIAGNOSTIC_LOGIC = {
  // Core diagnostic decision trees
  misfireDiagnosis: {
    condition: 'Misfire detected',
    logic: [
      {
        test: 'Compression test',
        goodResult: 'Check coil packs → spark plugs → injector flow',
        badResult: 'Investigate mechanical issues (valves, rings, head gasket)'
      }
    ]
  },
  mafIssues: {
    condition: 'MAF signal missing/erratic',
    logic: [
      {
        test: 'Visual inspection',
        steps: ['Confirm harness continuity', 'Check sensor ground', 'Verify power supply']
      }
    ]
  }
} as const;

export const OBD_CODES = {
  // OBD-II codes with mechanic-focused context
  misfireCodes: {
    P0300: {
      description: 'Random/Multiple Cylinder Misfire',
      mechanicAction: 'Check fuel pressure, ignition timing, or vacuum leaks before individual cylinders',
      priority: 'high'
    },
    P0301: {
      description: 'Cylinder 1 Misfire',
      mechanicAction: 'Swap coil 1 with cylinder 3. If misfire moves → coil. If stays → plug or injector.',
      priority: 'medium'
    },
    P0302: {
      description: 'Cylinder 2 Misfire',
      mechanicAction: 'Check coil, plug gap, or injector. If new coils don\'t help, test compression.',
      priority: 'medium'
    },
    P0303: {
      description: 'Cylinder 3 Misfire', 
      mechanicAction: 'Swap coil 3 with cylinder 1. If misfire moves → coil. If stays → plug or injector.',
      priority: 'medium'
    },
    P0304: {
      description: 'Cylinder 4 Misfire',
      mechanicAction: 'Check coil, plug gap, or injector. If new coils don\'t help, test compression.',
      priority: 'medium'
    }
  },
  timingCodes: {
    P0016: {
      description: 'Crankshaft Position - Camshaft Position Correlation (Bank 1 Sensor A)',
      mechanicAction: 'Check timing chain stretch, cam sensor, or crank sensor. Verify timing marks.',
      priority: 'high'
    },
    P0017: {
      description: 'Crankshaft Position - Camshaft Position Correlation (Bank 1 Sensor B)', 
      mechanicAction: 'Check timing chain stretch, cam sensor, or crank sensor. Verify timing marks.',
      priority: 'high'
    }
  }
} as const;

export const COMMUNICATION_TEMPLATES = {
  // Response templates for consistent mechanic communication
  codeExplanation: (code: string, action: string) => 
    `${code} = ${action}`,
  
  diagnosticFlow: (currentStep: string, nextSteps: string[]) =>
    `${currentStep} → Next: ${nextSteps.join(' or ')}`,
    
  troubleshootingTree: (symptom: string, tests: string[]) =>
    `${symptom} diagnostic path: ${tests.map((test, i) => `${i + 1}. ${test}`).join(', ')}`,
    
  partReplacement: (part: string, confirm: boolean) =>
    confirm 
      ? `Replace ${part} - failure confirmed by testing`
      : `Test ${part} before replacement - failure not yet confirmed`
} as const;

export const AI_BEHAVIOR_RULES = {
  // Core behavior constraints for mechanic assistant
  restrictions: [
    'Mechanic-mode views only',
    'No customer questions or pricing logic',
    'No generic repair manuals - focus on probable causes',
    'Never recommend replacement without confirmed failure'
  ],
  
  communicationStyle: {
    tone: 'Direct, technical, brief',
    audience: 'Professional mechanic',
    assumption: 'Mechanic understands automotive basics',
    focus: 'Probable causes, test paths, diagnostic shortcuts'
  },
  
  responseFormat: {
    preferred: 'Root cause tree with action steps',
    avoid: 'Generic code definitions without context',
    examples: {
      good: 'P0302 = Misfire Cylinder 2. Check coil, plug gap, or injector. If new coils don\'t help, test compression.',
      bad: 'P0302 means Cylinder 2 misfire.'
    }
  }
} as const;

export const VIN_PARSING = {
  // VIN parsing logic for engine identification
  vinToEngine: (vin: string): string | null => {
    if (vin.length !== 17) return null;
    
    // VW/Audi VIN patterns (simplified)
    const makeChar = vin[0];
    const engineChar = vin[7];
    
    if (makeChar && ['W', '1', '3'].includes(makeChar)) {
      // Basic VW/Audi engine detection logic
      if (engineChar) {
        switch (engineChar) {
          case 'B': return 'BPY';
          case 'C': return 'CCTA';
          case 'D': return 'CBFA';
          default: return 'Unknown VW/Audi engine';
        }
      }
    }
    
    return null;
  }
} as const;

export const DIAGNOSTIC_WORKFLOWS = {
  // Common diagnostic workflows
  electricalDiagnosis: [
    'Check for DTCs',
    'Verify power and ground',
    'Test component operation', 
    'Check wiring continuity',
    'Confirm ECM input/output'
  ],
  
  mechanicalDiagnosis: [
    'Verify symptoms',
    'Check compression/leakdown',
    'Test related systems',
    'Isolate root cause',
    'Confirm repair'
  ],
  
  performanceDiagnosis: [
    'Read all DTCs',
    'Check fuel trims',
    'Test fuel pressure',
    'Verify air intake',
    'Check exhaust flow'
  ]
} as const;