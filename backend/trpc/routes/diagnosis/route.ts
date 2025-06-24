import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { DiagnosticResult, ServiceType } from "@/types/service";

const diagnosisInputSchema = z.object({
  vehicleInfo: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    mileage: z.number().optional(),
    engine: z.string().optional(),
    vin: z.string().optional(),
  }),
  symptoms: z.string(),
  additionalContext: z.string().optional(),
});

export const diagnosisProcedure = publicProcedure
  .input(diagnosisInputSchema)
  .mutation(async ({ input }): Promise<DiagnosticResult> => {
    try {
      // Production logging
      console.log('AI diagnosis requested:', {
        vehicleMake: input.vehicleInfo.make,
        vehicleModel: input.vehicleInfo.model,
        vehicleYear: input.vehicleInfo.year,
        symptomsLength: input.symptoms.length,
        timestamp: new Date().toISOString(),
        environment: 'production'
      });

      // Prepare the AI prompt
      const prompt = `You are an expert automotive diagnostic assistant. Analyze the following vehicle issue and provide a structured diagnosis.

Vehicle Information:
- Make: ${input.vehicleInfo.make}
- Model: ${input.vehicleInfo.model}
- Year: ${input.vehicleInfo.year}
- Mileage: ${input.vehicleInfo.mileage || 'Unknown'}
- Engine: ${input.vehicleInfo.engine || 'Unknown'}
- VIN: ${input.vehicleInfo.vin || 'Not provided'}

Symptoms: ${input.symptoms}

${input.additionalContext ? `Additional Context: ${input.additionalContext}` : ''}

Please provide a JSON response with the following structure:
{
  "likelyCauses": ["cause1", "cause2", "cause3"],
  "diagnosticSteps": ["step1", "step2", "step3"],
  "matchedServices": ["service1", "service2"],
  "confidence": "high|medium|low",
  "estimatedCost": {"min": 100, "max": 500},
  "urgencyLevel": "low|medium|high|emergency",
  "recommendedServiceTypes": ["oil_change", "brake_service", etc.]
}

Focus on practical, actionable advice. Be specific about likely causes and diagnostic steps.`;

      // Production: Use OpenAI API directly if available, otherwise fallback to proxy
      const useOpenAI = process.env.OPENAI_API_KEY;
      const endpoint = useOpenAI 
        ? 'https://api.openai.com/v1/chat/completions'
        : (process.env.EXPO_PUBLIC_OPENAI_ENDPOINT || 'https://toolkit.rork.com/text/llm/');
      
      console.log('Using AI endpoint:', { 
        endpoint: useOpenAI ? 'OpenAI Direct' : 'Toolkit Proxy',
        hasApiKey: !!process.env.OPENAI_API_KEY,
        environment: 'production'
      });

      // Call the AI API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(useOpenAI && { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }),
        },
        body: JSON.stringify(
          useOpenAI 
            ? {
                model: "gpt-3.5-turbo",
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert automotive diagnostic assistant. Always respond with valid JSON in the exact format requested. Focus on the top 3 most likely causes and provide practical diagnostic steps.'
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 1000,
              }
            : {
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert automotive diagnostic assistant. Always respond with valid JSON in the exact format requested. Focus on the top 3 most likely causes and provide practical diagnostic steps.'
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ]
              }
        ),
      });

      if (!response.ok) {
        console.error(`AI API request failed: ${response.status} ${response.statusText}`);
        throw new Error(`AI service unavailable (${response.status})`);
      }

      const aiResponse = await response.json();
      
      // Handle different response formats based on the API used
      let aiContent = '';
      if (useOpenAI) {
        // OpenAI API response format
        aiContent = aiResponse.choices?.[0]?.message?.content || '';
      } else {
        // Toolkit response format
        aiContent = aiResponse.completion || '';
      }

      if (!aiContent) {
        console.error('Invalid AI response format:', aiResponse);
        throw new Error('Invalid AI response format');
      }

      // Parse the AI response
      let parsedResponse;
      try {
        // Try to extract JSON from the response
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback to a structured response based on symptoms
        parsedResponse = generateFallbackDiagnosis(input);
      }

      // Validate and structure the response
      const diagnosis: DiagnosticResult = {
        id: Date.now().toString(),
        likelyCauses: Array.isArray(parsedResponse.likelyCauses) 
          ? parsedResponse.likelyCauses.slice(0, 3) 
          : ['General automotive issue requiring professional diagnosis'],
        diagnosticSteps: Array.isArray(parsedResponse.diagnosticSteps) 
          ? parsedResponse.diagnosticSteps.slice(0, 5) 
          : ['Visual inspection', 'Diagnostic scan', 'Component testing'],
        matchedServices: Array.isArray(parsedResponse.matchedServices) 
          ? parsedResponse.matchedServices.slice(0, 3) 
          : ['General repair'],
        confidence: ['high', 'medium', 'low'].includes(parsedResponse.confidence) 
          ? parsedResponse.confidence 
          : 'medium',
        estimatedCost: parsedResponse.estimatedCost && 
          typeof parsedResponse.estimatedCost.min === 'number' && 
          typeof parsedResponse.estimatedCost.max === 'number'
          ? parsedResponse.estimatedCost
          : { min: 100, max: 500 },
        urgencyLevel: ['emergency', 'high', 'medium', 'low'].includes(parsedResponse.urgencyLevel) 
          ? parsedResponse.urgencyLevel 
          : 'medium',
        recommendedServiceTypes: Array.isArray(parsedResponse.recommendedServiceTypes) 
          ? parsedResponse.recommendedServiceTypes
              .filter((type: string) => 
                ['oil_change', 'brake_service', 'tire_service', 'battery_service', 
                 'engine_diagnostic', 'transmission', 'ac_service', 'general_repair', 
                 'emergency_roadside'].includes(type)
              )
              .slice(0, 3) as ServiceType[]
          : ['general_repair'] as ServiceType[],
        createdAt: new Date(),
      };

      // Production logging
      console.log('AI diagnosis completed:', {
        diagnosisId: diagnosis.id,
        confidence: diagnosis.confidence,
        urgencyLevel: diagnosis.urgencyLevel,
        causesCount: diagnosis.likelyCauses.length,
        servicesCount: diagnosis.recommendedServiceTypes?.length || 0,
        timestamp: new Date().toISOString()
      });

      return diagnosis;

    } catch (error) {
      console.error('Diagnosis error:', error);
      
      // Production error logging
      console.error('AI diagnosis failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        vehicleMake: input.vehicleInfo.make,
        vehicleModel: input.vehicleInfo.model,
        timestamp: new Date().toISOString(),
        environment: 'production'
      });
      
      // Return a fallback diagnosis with user-friendly error message
      const fallback = generateFallbackDiagnosis(input);
      fallback.likelyCauses = [
        'AI diagnostic service temporarily unavailable',
        'Manual inspection recommended',
        'Contact professional mechanic for assessment'
      ];
      fallback.confidence = 'low';
      
      return fallback;
    }
  });

function generateFallbackDiagnosis(input: any): DiagnosticResult {
  // Generate a basic diagnosis based on common symptoms
  const symptoms = input.symptoms.toLowerCase();
  
  let likelyCauses = ['General automotive issue requiring professional diagnosis'];
  let urgencyLevel: 'low' | 'medium' | 'high' | 'emergency' = 'medium';
  let recommendedServiceTypes: ServiceType[] = ['general_repair'];
  let estimatedCost = { min: 100, max: 500 };

  // Basic symptom matching
  if (symptoms.includes('noise') || symptoms.includes('grinding') || symptoms.includes('squealing')) {
    likelyCauses = ['Worn brake pads', 'Belt issues', 'Bearing problems'];
    recommendedServiceTypes = ['brake_service', 'general_repair'];
    urgencyLevel = 'high';
    estimatedCost = { min: 150, max: 800 };
  } else if (symptoms.includes('oil') || symptoms.includes('leak')) {
    likelyCauses = ['Oil leak', 'Worn seals', 'Drain plug issues'];
    recommendedServiceTypes = ['oil_change', 'general_repair'];
    urgencyLevel = 'medium';
    estimatedCost = { min: 50, max: 300 };
  } else if (symptoms.includes('battery') || symptoms.includes('start') || symptoms.includes('electrical')) {
    likelyCauses = ['Weak battery', 'Alternator issues', 'Starter problems'];
    recommendedServiceTypes = ['battery_service', 'engine_diagnostic'];
    urgencyLevel = 'high';
    estimatedCost = { min: 100, max: 600 };
  } else if (symptoms.includes('tire') || symptoms.includes('vibration')) {
    likelyCauses = ['Tire wear', 'Wheel alignment', 'Suspension issues'];
    recommendedServiceTypes = ['tire_service', 'general_repair'];
    urgencyLevel = 'medium';
    estimatedCost = { min: 80, max: 400 };
  } else if (symptoms.includes('engine') || symptoms.includes('performance')) {
    likelyCauses = ['Engine performance issue', 'Fuel system problem', 'Ignition system fault'];
    recommendedServiceTypes = ['engine_diagnostic', 'general_repair'];
    urgencyLevel = 'high';
    estimatedCost = { min: 200, max: 1000 };
  }

  console.log('Generated fallback diagnosis:', {
    symptoms: symptoms.substring(0, 50),
    urgencyLevel,
    serviceTypes: recommendedServiceTypes,
    timestamp: new Date().toISOString()
  });

  return {
    id: Date.now().toString(),
    likelyCauses,
    diagnosticSteps: [
      'Visual inspection of the affected area',
      'Diagnostic scan for error codes',
      'Component testing and measurement',
      'Road test if safe to do so'
    ],
    matchedServices: ['Professional diagnostic', 'Repair service'],
    confidence: 'low',
    estimatedCost,
    urgencyLevel,
    recommendedServiceTypes: recommendedServiceTypes || ['general_repair'],
    createdAt: new Date(),
  };
}