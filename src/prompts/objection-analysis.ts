/**
 * Objection Analysis Prompts
 * Deep-dive analysis of objections in sales calls
 */

export const OBJECTION_ANALYSIS_SYSTEM_PROMPT = `You are an expert sales coach specializing in objection handling for First Health Enrollment, a Medicare and health insurance enrollment company.

Your task is to analyze call transcripts and identify:
1. Customer objections (explicit and implied)
2. How the agent responded to each objection
3. Whether the response was effective
4. Specific suggestions for improvement

Common objections in health insurance sales:
- Price/Cost: "Too expensive", "Can't afford it", "Need to check my budget"
- Timing: "Need to think about it", "Call me back later", "Not right now"
- Spouse/Family: "Need to talk to my spouse/children", "Let me discuss with family"
- Current Coverage: "Already have coverage", "Happy with what I have", "My employer provides insurance"
- Trust: "How do I know this is legitimate?", "Is this a scam?", "I don't give information over the phone"
- Health: "I'm healthy, don't need it", "I don't go to the doctor"
- Complexity: "This is too confusing", "Too many options", "I don't understand"
- Competitor: "I'm getting quotes from others", "Someone else offered a better deal"

Effective objection handling techniques:
- Acknowledge: Show you heard and understand the concern
- Clarify: Ask questions to understand the root cause
- Respond: Address the specific concern with relevant information
- Confirm: Check if the concern has been resolved
- Redirect: Move back toward the value proposition or next step`;

export interface ObjectionAnalysisVariables {
  agent_name: string;
  call_date: string;
  duration: string;
  transcript: string;
}

export function buildObjectionAnalysisPrompt(vars: ObjectionAnalysisVariables): string {
  return `Analyze this call transcript for objections and how they were handled.

**Call Details:**
- Agent: ${vars.agent_name}
- Date: ${vars.call_date}
- Duration: ${vars.duration}

**Transcript:**
${vars.transcript}

Analyze the transcript and respond with ONLY valid JSON (no markdown):

{
  "objections_found": [
    {
      "objection_type": "price|timing|spouse|coverage|trust|health|complexity|competitor|other",
      "objection_text": "Exact or close quote from customer",
      "customer_sentiment": "mild|moderate|strong",
      "agent_response": "What the agent said/did in response",
      "response_quality": 1-5,
      "techniques_used": ["acknowledge", "clarify", "respond", "confirm", "redirect"],
      "techniques_missed": ["techniques that would have helped"],
      "was_resolved": true|false,
      "improvement_suggestion": "Specific suggestion for better handling"
    }
  ],
  "overall_objection_handling_score": 1-5,
  "total_objections": <number>,
  "resolved_count": <number>,
  "missed_objections": [
    {
      "description": "Objection that was implied but not addressed",
      "where_in_call": "early|middle|late",
      "what_to_look_for": "How agent could have noticed this"
    }
  ],
  "strongest_moment": {
    "description": "Best objection handling moment in the call",
    "quote": "Relevant quote from agent"
  },
  "biggest_opportunity": {
    "description": "Biggest missed opportunity for better handling",
    "suggestion": "What agent should do differently"
  },
  "patterns": {
    "agent_tendencies": ["Patterns in how agent handles objections"],
    "customer_signals": ["Recurring concerns or hesitations from customer"]
  }
}

Scoring guide for response_quality:
- 5: Expert - Anticipated objection, validated concern, turned it into a reason to buy
- 4: Strong - Used empathy, asked clarifying questions, addressed root cause
- 3: Adequate - Addressed the objection but didn't fully resolve or lost momentum
- 2: Weak - Acknowledged but response was generic, didn't uncover real concern
- 1: Poor - Ignored, argued, used pressure tactics, or gave up immediately

If no objections were found in the call, return:
{
  "objections_found": [],
  "overall_objection_handling_score": null,
  "total_objections": 0,
  "resolved_count": 0,
  "missed_objections": [],
  "strongest_moment": null,
  "biggest_opportunity": null,
  "patterns": {
    "agent_tendencies": [],
    "customer_signals": []
  },
  "no_objections_note": "Brief note about why (e.g., 'Customer was receptive throughout' or 'Call ended before objections arose')"
}`;
}

export interface ObjectionSummaryVariables {
  analysis_json: string;
  agent_name: string;
  call_date: string;
}

export function buildObjectionSummaryPrompt(vars: ObjectionSummaryVariables): string {
  return `Based on this objection analysis, write a clear, actionable coaching summary for the agent.

**Agent:** ${vars.agent_name}
**Call Date:** ${vars.call_date}

**Analysis Data:**
${vars.analysis_json}

Write a conversational summary that:
1. Leads with the key finding (how many objections, overall handling quality)
2. Highlights what they did well with specific examples
3. Identifies 1-2 specific improvements with actionable advice
4. Uses a supportive, coaching tone
5. If applicable, includes a "Try this next time" suggestion with example phrasing

Keep it concise (under 300 words). Use markdown for formatting.
Do not include score numbers directly - describe performance qualitatively.`;
}

// ============================================================================
// Enhanced Prompts with Snippet Extraction
// ============================================================================

export interface EnhancedObjectionAnalysisVariables {
  agent_name: string;
  call_date: string;
  duration: string;
  transcript: string;
}

/**
 * Enhanced prompt that requests verbatim transcript snippets
 */
export function buildEnhancedObjectionAnalysisPrompt(vars: EnhancedObjectionAnalysisVariables): string {
  return `Analyze this call transcript for objections and how they were handled. For each objection, extract VERBATIM quotes from the transcript.

**Call Details:**
- Agent: ${vars.agent_name}
- Date: ${vars.call_date}
- Duration: ${vars.duration}

**Transcript:**
${vars.transcript}

Analyze the transcript and respond with ONLY valid JSON (no markdown):

{
  "objections_found": [
    {
      "objection_type": "price|timing|spouse|coverage|trust|health|complexity|competitor|other",
      "objection_text": "Exact or close quote from customer",
      "customer_sentiment": "mild|moderate|strong",
      "agent_response": "What the agent said/did in response",
      "response_quality": 1-5,
      "techniques_used": ["acknowledge", "clarify", "respond", "confirm", "redirect"],
      "techniques_missed": ["techniques that would have helped"],
      "was_resolved": true|false,
      "improvement_suggestion": "Specific suggestion for better handling",
      "snippet": {
        "objection_text": "VERBATIM customer quote - exact words from transcript",
        "rebuttal_text": "VERBATIM agent reply - exact words from transcript",
        "full_exchange": "Optional: 2-3 surrounding turns for context"
      }
    }
  ],
  "overall_objection_handling_score": 1-5,
  "total_objections": <number>,
  "resolved_count": <number>,
  "missed_objections": [
    {
      "description": "Objection that was implied but not addressed",
      "where_in_call": "early|middle|late",
      "what_to_look_for": "How agent could have noticed this"
    }
  ],
  "strongest_moment": {
    "description": "Best objection handling moment in the call",
    "quote": "Relevant quote from agent"
  },
  "biggest_opportunity": {
    "description": "Biggest missed opportunity for better handling",
    "suggestion": "What agent should do differently"
  },
  "patterns": {
    "agent_tendencies": ["Patterns in how agent handles objections"],
    "customer_signals": ["Recurring concerns or hesitations from customer"]
  }
}

IMPORTANT: The "snippet" field must contain VERBATIM quotes from the transcript, NOT paraphrased versions.
- objection_text: The exact words the customer used when raising the objection
- rebuttal_text: The exact words the agent used in response
- full_exchange: Optional surrounding context (keep it brief, 2-3 turns max)

Scoring guide for response_quality:
- 5: Expert - Anticipated objection, validated concern, turned it into a reason to buy
- 4: Strong - Used empathy, asked clarifying questions, addressed root cause
- 3: Adequate - Addressed the objection but didn't fully resolve or lost momentum
- 2: Weak - Acknowledged but response was generic, didn't uncover real concern
- 1: Poor - Ignored, argued, used pressure tactics, or gave up immediately

If no objections were found in the call, return:
{
  "objections_found": [],
  "overall_objection_handling_score": null,
  "total_objections": 0,
  "resolved_count": 0,
  "missed_objections": [],
  "strongest_moment": null,
  "biggest_opportunity": null,
  "patterns": {
    "agent_tendencies": [],
    "customer_signals": []
  },
  "no_objections_note": "Brief note about why (e.g., 'Customer was receptive throughout' or 'Call ended before objections arose')"
}`;
}

// ============================================================================
// Pattern-Aware Summary Prompt
// ============================================================================

export interface PatternAwareSummaryVariables {
  analysis_json: string;
  agent_name: string;
  call_date: string;
  agent_history?: {
    weak_areas: Array<{
      objection_type: string;
      avg_score: number;
      total_occurrences: number;
    }>;
    strong_areas: Array<{
      objection_type: string;
      avg_score: number;
      total_occurrences: number;
    }>;
    total_analyzed: number;
    overall_avg_score: number | null;
  };
}

/**
 * Summary prompt that incorporates agent's historical patterns
 */
export function buildPatternAwareObjectionSummaryPrompt(vars: PatternAwareSummaryVariables): string {
  let historyContext = '';

  if (vars.agent_history && vars.agent_history.total_analyzed > 0) {
    historyContext = `\n\n**Agent's Historical Patterns (${vars.agent_history.total_analyzed} objections analyzed):**\n`;

    if (vars.agent_history.overall_avg_score !== null) {
      historyContext += `- Overall average score: ${vars.agent_history.overall_avg_score}/5\n`;
    }

    if (vars.agent_history.weak_areas.length > 0) {
      historyContext += `- Recurring challenges: ${vars.agent_history.weak_areas.map(a =>
        `${a.objection_type} (avg ${a.avg_score}/5 over ${a.total_occurrences} instances)`
      ).join(', ')}\n`;
    }

    if (vars.agent_history.strong_areas.length > 0) {
      historyContext += `- Consistent strengths: ${vars.agent_history.strong_areas.map(a =>
        `${a.objection_type} (avg ${a.avg_score}/5 over ${a.total_occurrences} instances)`
      ).join(', ')}\n`;
    }
  }

  return `Based on this objection analysis, write a clear, actionable coaching summary for the agent.

**Agent:** ${vars.agent_name}
**Call Date:** ${vars.call_date}${historyContext}

**Analysis Data:**
${vars.analysis_json}

Write a conversational summary that:
1. Leads with the key finding (how many objections, overall handling quality)
2. Highlights what they did well with specific examples
3. Identifies 1-2 specific improvements with actionable advice
4. Uses a supportive, coaching tone
5. If applicable, includes a "Try this next time" suggestion with example phrasing
${vars.agent_history && vars.agent_history.total_analyzed > 0 ? `6. If this call shows improvement or regression in their historically weak/strong areas, mention it briefly` : ''}

Keep it concise (under 300 words). Use markdown for formatting.
Do not include score numbers directly - describe performance qualitatively.`;
}
