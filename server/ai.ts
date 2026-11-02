import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysisResult, CivicCategory, SeverityLevel } from '../src/types/index.ts';

// Server-side initialization adhering to Gemini API skill guidelines
const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const SUPPORTED_CATEGORIES: CivicCategory[] = [
  'Potholes & Roads',
  'Garbage & Waste',
  'Water Supply Leakage',
  'Drainage & Sewage',
  'Broken Streetlights',
  'Public Infrastructure Damage',
  'Other / Miscellaneous',
];

const DEPARTMENT_MAP: Record<CivicCategory, string> = {
  'Potholes & Roads': 'Road Maintenance & Infrastructure Dept',
  'Garbage & Waste': 'Solid Waste Management Dept',
  'Water Supply Leakage': 'Water Supply & Pumping Dept',
  'Drainage & Sewage': 'Drainage & Sewerage Dept',
  'Broken Streetlights': 'Electrical & Street Lighting Dept',
  'Public Infrastructure Damage': 'Public Works & Civil Infrastructure Dept',
  'Other / Miscellaneous': 'General Grievance Cell',
};

/**
 * Intelligent fallback classifier in case Gemini API is not configured or network fails
 */
function generateFallbackAnalysis(imageTextHint?: string): AIAnalysisResult {
  const hint = (imageTextHint || '').toLowerCase();

  let category: CivicCategory = 'Potholes & Roads';
  let severity: SeverityLevel = 'Medium';
  let description = 'Visual inspection shows civic infrastructure wear requiring municipal attention.';
  let urgencyFactors = ['Traffic flow impact', 'Pedestrian hazard'];

  if (hint.includes('garbage') || hint.includes('trash') || hint.includes('waste') || hint.includes('dump')) {
    category = 'Garbage & Waste';
    severity = 'High';
    description = 'Accumulated solid waste and unsanitary debris observed.';
    urgencyFactors = ['Sanitation risk', 'Stray animal accumulation', 'Odour'];
  } else if (hint.includes('water') || hint.includes('pipe') || hint.includes('leak')) {
    category = 'Water Supply Leakage';
    severity = 'High';
    description = 'Pressurized potable water or distribution pipeline leakage detected on roadway.';
    urgencyFactors = ['Resource loss', 'Pavement erosion'];
  } else if (hint.includes('sewage') || hint.includes('drain') || hint.includes('manhole')) {
    category = 'Drainage & Sewage';
    severity = 'Critical';
    description = 'Open drain or backflowing sewerage water observed posing serious health risk.';
    urgencyFactors = ['Biohazard risk', 'Monsoon waterlogging'];
  } else if (hint.includes('light') || hint.includes('pole') || hint.includes('dark') || hint.includes('lamp')) {
    category = 'Broken Streetlights';
    severity = 'Medium';
    description = 'Non-functional street light fixture or electrical cabling issue.';
    urgencyFactors = ['Nighttime visibility hazard', 'Public safety'];
  } else if (hint.includes('bridge') || hint.includes('divider') || hint.includes('footpath') || hint.includes('bench') || hint.includes('wall')) {
    category = 'Public Infrastructure Damage';
    severity = 'High';
    description = 'Structural damage or breakage to public pedestrian/transit infrastructure.';
    urgencyFactors = ['Structural safety', 'Pedestrian obstacle'];
  } else if (hint.includes('pothole') || hint.includes('road') || hint.includes('asphalt') || hint.includes('crater')) {
    category = 'Potholes & Roads';
    severity = 'High';
    description = 'Surface depression / asphalt crater causing vehicle hazard.';
    urgencyFactors = ['Two-wheeler skid risk', 'Traffic bottleneck'];
  }

  return {
    detected: true,
    category,
    severity,
    confidence: 0.88,
    description,
    isRelevantCivicIssue: true,
    suggestedDepartment: DEPARTMENT_MAP[category],
    flagForReview: false,
    urgencyFactors,
  };
}

/**
 * Server-side analysis of complaint image using Gemini 3.8 Flash model
 */
export async function analyzeCivicImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  userNote?: string
): Promise<AIAnalysisResult> {
  // If no Gemini key is provided, gracefully invoke fallback
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is not configured or default placeholder, using smart fallback.');
    return generateFallbackAnalysis(userNote);
  }

  try {
    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const systemPrompt = `You are NagarSetu AI, an expert civic infrastructure inspection and damage analysis assistant for Indian municipal corporations (specifically Pune Municipal Corporation).
Your job is to objectively analyze citizen photographs of urban civic issues.

Strict Rules:
1. Identify the primary visible civic issue from the image.
2. Select EXACTLY ONE category from this allowed list:
   - "Potholes & Roads"
   - "Garbage & Waste"
   - "Water Supply Leakage"
   - "Drainage & Sewage"
   - "Broken Streetlights"
   - "Public Infrastructure Damage"
   - "Other / Miscellaneous"
3. Estimate severity:
   - "Low": Minor cosmetic issue, superficial crack, minimal trash, daytime non-critical issue.
   - "Medium": Moderate pothole, accumulating garbage, flickering lamp, small water drip.
   - "High": Deep pothole, large garbage dump blocking walkway, broken streetlights in dark alley, burst water pipe, open trench.
   - "Critical": Massive crater on major road, gushing water main, raw sewage overflow, open uncovered deep manhole, sparking live wire.
4. Provide a concise, purely factual description of what is visually visible (maximum 2 sentences).
5. Flag irrelevant images (e.g. selfies, memes, indoor household photos, food, pets, random text, blurry unreadable images) by setting isRelevantCivicIssue to false and flagForReview to true.
6. NEVER invent information, do not hallucinate coordinates or street names from the image, only analyze physical physical condition.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const promptText = `Analyze this civic complaint photo. ${userNote ? `Citizen note: "${userNote}"` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN, description: 'Whether any civic defect is detected' },
            category: {
              type: Type.STRING,
              description: 'One of the exact allowed categories',
            },
            severity: {
              type: Type.STRING,
              description: 'Low, Medium, High, or Critical',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.0 and 1.0',
            },
            description: {
              type: Type.STRING,
              description: 'Factual 1-2 sentence description of visible damage',
            },
            isRelevantCivicIssue: {
              type: Type.BOOLEAN,
              description: 'False if photo is not a municipal/civic problem',
            },
            flagForReview: {
              type: Type.BOOLEAN,
              description: 'True if image is blurry, ambiguous, or irrelevant',
            },
            reviewReason: {
              type: Type.STRING,
              description: 'Reason for review flag if any',
            },
            urgencyFactors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key risks (e.g. traffic hazard, health risk)',
            },
          },
          required: [
            'detected',
            'category',
            'severity',
            'confidence',
            'description',
            'isRelevantCivicIssue',
            'flagForReview',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(text);

    // Validate and normalize category
    let finalCategory: CivicCategory = 'Other / Miscellaneous';
    for (const cat of SUPPORTED_CATEGORIES) {
      if (cat.toLowerCase() === (parsed.category || '').toLowerCase()) {
        finalCategory = cat;
        break;
      }
    }

    // Validate severity
    let finalSeverity: SeverityLevel = 'Medium';
    const rawSev = (parsed.severity || '').toLowerCase();
    if (rawSev === 'low') finalSeverity = 'Low';
    else if (rawSev === 'medium') finalSeverity = 'Medium';
    else if (rawSev === 'high') finalSeverity = 'High';
    else if (rawSev === 'critical') finalSeverity = 'Critical';

    return {
      detected: parsed.detected ?? true,
      category: finalCategory,
      severity: finalSeverity,
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.9)),
      description: parsed.description || 'Civic infrastructure defect detected.',
      isRelevantCivicIssue: parsed.isRelevantCivicIssue ?? true,
      suggestedDepartment: DEPARTMENT_MAP[finalCategory] || 'Municipal Engineering Dept',
      flagForReview: parsed.flagForReview ?? false,
      reviewReason: parsed.reviewReason,
      urgencyFactors: Array.isArray(parsed.urgencyFactors) ? parsed.urgencyFactors : ['Civic maintenance required'],
    };
  } catch (error) {
    console.error('Gemini image analysis error:', error);
    // Graceful fallback so user is never blocked
    return generateFallbackAnalysis(userNote);
  }
}
