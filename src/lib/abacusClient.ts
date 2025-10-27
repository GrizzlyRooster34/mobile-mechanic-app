/**
 * Simplified Abacus AI client for mechanic assistant functionality
 */

export async function queryAbacus(sessionId: string, message: string, agentId?: string): Promise<string> {
  const apiKey = process.env.ABACUS_AI_API_KEY || process.env.NEXT_PUBLIC_ABACUS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Abacus AI API key not found in environment variables');
  }

  const response = await fetch('https://api.abacus.ai/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      sessionId, 
      message,
      agentId: agentId || process.env.MECHANIC_ASSISTANT_AGENT_ID || 'default'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Abacus API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.reply || data.message || data.response || 'No response received';
}

import { DiagnosticHelper } from './diagnostic-helper';
import { formatVinForAI } from './vinTools';
import type { VinDecodeResult } from './vinTools';

const MECHANIC_SYSTEM_PROMPT = `
🚘 AUTOMOTIVE DIAGNOSTIC SPECIALIST - MECHANIC MODE ONLY

DOMAIN EXPERTISE: High-Mileage VW/Audi Engines (BPY, CCTA, CBFA)

ENGINE-SPECIFIC KNOWLEDGE:
• BPY (2.0T FSI): Cam follower wear, intake valve carbon buildup, PCV failure, timing chain tensioner issues
• CCTA/CBFA (2.0T TSI): Wastegate rattle, water pump leaks, intake manifold runner faults

DIAGNOSTIC LOGIC:
• Misfire + good compression → Check coil packs, plugs, injector flow
• Missing MAF signal → Confirm harness continuity and sensor ground
• P0300-P0304 = Misfires (prioritize coils → plugs → injectors)
• P0016-P0017 = Cam/crank correlation (timing chain or cam sensor)

COMMUNICATION RULES:
✓ Speak directly to mechanic (not customer)
✓ Assume mechanic understands basics
✓ Focus on probable causes, test paths, shortcuts
✓ Brief, clean output unless detail requested
✓ Give root cause tree, not just definitions

EXAMPLE RESPONSES:
❌ "P0302 means Cylinder 2 misfire"
✅ "P0302 = Misfire Cylinder 2. Check coil, plug gap, or injector. If new coils don't help, test compression."

FLOW RULES:
• Parse VIN when supplied to identify engine type
• Tailor suggestions to engine type when known
• Continue logic chain when asked "what next?"
• Never recommend replacement unless failure confirmed
• Flag pattern failures → refer to wiring, ground check, ECM input check

RESTRICTION: Mechanic-mode views only. No customer questions or pricing logic.
`;

export async function queryAbacusMechanicAssistant(
  sessionId: string,
  message: string,
  context?: {
    mechanicId?: string;
    jobId?: string;
    vehicleInfo?: {
      make?: string;
      model?: string;
      year?: number;
      vin?: string;
    };
    symptoms?: string[];
    codes?: string[];
    userRole?: string;
    vinData?: VinDecodeResult; // Enhanced: Full VIN decode data
  }
): Promise<{
  reply: string;
  suggestions?: string[];
  confidence?: number;
}> {
  const apiKey = process.env.ABACUS_AI_API_KEY || process.env.NEXT_PUBLIC_ABACUS_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Abacus AI API key not found in environment variables');
  }

  // Validate mechanic mode access
  if (!DiagnosticHelper.validateMechanicMode(context?.userRole, message)) {
    throw new Error('Access denied: Mechanic assistant is only available in mechanic mode');
  }

  const agentId = process.env.MECHANIC_ASSISTANT_AGENT_ID;
  
  // Generate enhanced context using diagnostic helper
  let enhancedContext = DiagnosticHelper.formatEnhancedContext({
    vehicleInfo: context?.vehicleInfo,
    symptoms: context?.symptoms,
    codes: context?.codes,
    jobId: context?.jobId
  });
  
  // Enhanced: Add VIN decode data if available
  if (context?.vinData) {
    const vinContext = formatVinForAI(context.vinData);
    enhancedContext = `${vinContext}\n${enhancedContext}`;
  }
  
  // Enhanced message with system prompt and diagnostic context
  const enhancedMessage = `${MECHANIC_SYSTEM_PROMPT}

${enhancedContext}

MECHANIC QUESTION: ${message}`;
  
  const response = await fetch('https://api.abacus.ai/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      sessionId, 
      message: enhancedMessage,
      agentId,
      context: {
        role: 'mechanic_assistant',
        systemPrompt: MECHANIC_SYSTEM_PROMPT,
        enhancedContext,
        ...context
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Abacus API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    reply: data.reply || data.message || data.response || 'No response received',
    suggestions: data.suggestions || [],
    confidence: data.confidence || undefined
  };
}