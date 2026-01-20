/**
 * Coaching Analysis Prompts
 *
 * These prompts are used to analyze call transcripts against the
 * First Health Enrollment sales coaching rubric.
 *
 * Reference: /COACHING_RUBRIC.md
 */

export const COACHING_SYSTEM_PROMPT = `You are an expert sales coach for First Health Enrollment, a health insurance agency selling ACA plans, Limited Medical Plans, and Life Insurance.

Your role is to analyze sales call transcripts and provide constructive, actionable coaching feedback based on the company's coaching rubric.

Be encouraging but honest. Focus on specific examples from the transcript. Provide feedback that will actually help the agent improve.`;

export const COACHING_ANALYSIS_PROMPT = `Analyze this sales call transcript and provide coaching feedback.

## Call Information
- Agent: {agent_name}
- Call Date: {call_date}
- Duration: {duration}
- Customer Talk Ratio: {customer_talk_ratio}%
- Agent Talk Ratio: {agent_talk_ratio}%

## Transcript
{transcript}

## Scoring Rubric

Score each category from 1-5:
- 1 = Needs Improvement (missing or ineffective)
- 2 = Below Standard (attempted but significant gaps)
- 3 = Meets Standard (competent, room for improvement)
- 4 = Above Standard (strong with minor refinements possible)
- 5 = Excellent (exemplary, use as training example)

### Categories to Evaluate:

**1. Opening & Rapport (10% weight)**
Required elements: Agent name, "licensed agent for First Health Enrollment", state licensing, reason for calling, recording disclosure, consent to ask questions.
- Score 5: All elements present naturally, built rapport, set expectations
- Score 3: All required elements present but mechanical
- Score 1: Missing multiple required elements

**2. Needs Discovery & Qualification (30% weight)**
Required questions: Individual/family, current insurance status, zip code, tax filing status, dependents, employment, expected income, pre-existing conditions (with reassurance), medications, doctor preferences.
Critical: Must verify income to determine ACA vs Limited Medical path.
- Score 5: All questions asked, great follow-ups, correctly identified product path, smooth transition if Limited Medical needed
- Score 3: Most questions covered, correct product path, adequate but surface-level
- Score 1: Skipped discovery, didn't verify income, wrong product pitched

**3. Product Presentation (20% weight)**
Required elements: Subsidy explanation, copays, preventative care (gender-appropriate examples), deductible/coinsurance, dental benefits (CareConnect), vision benefits (CareConnect), accidental death benefits, total price breakdown.
Key principle: Connect benefits to discovered needs (medications, doctors, conditions).
- Score 5: Personalized presentation connecting benefits to customer's specific situation
- Score 3: Covered all elements clearly but not personalized
- Score 1: Generic, missed major benefits, confusing

**4. Objection Handling (20% weight)**
Common objections: "Too expensive", "Need to talk to spouse", "I'm healthy, don't need it", "Need to think about it", "Already have coverage"
- Score 5: Anticipated objections, validated concerns, turned objections into reasons to buy
- Score 3: Acknowledged and addressed adequately
- Score 1: Ignored, argued, or gave up immediately

**5. Compliance & Disclosures (10% weight)**
Must-have: Recording disclosure, citizenship/residency verification before SSN, CareConnect clarification ("NOT health insurance"), verbal confirmations, warning about not picking another plan on healthcare.gov.
- Score 5: All elements delivered naturally, built trust through transparency
- Score 3: All critical elements present
- Score 1: Critical elements missing, compliance risk

**6. Closing & Enrollment (10% weight)**
Required: Address for ID cards, SSN with citizenship verification, name as on SS card, payment info, consent forms explained, next steps communication, transfer to verification.
- Score 5: Smooth close, customer confident about next steps, professional transfer
- Score 3: All info collected, process complete but mechanical
- Score 1: Incomplete, didn't transfer, customer confused

## Red Flags to Check

**Critical (immediate manager alert):**
- SSN collected before citizenship/residency verification
- Recording disclosure missing entirely
- Guaranteed specific subsidy amount before income verification
- Payment collected before consent forms sent/explained

**High Priority:**
- ACA pitch without income verification
- Missing "NOT health insurance" clarification for CareConnect
- Missing rogue agent warning or healthcare.gov duplicate warning
- Agent talk ratio >70%

**Medium Priority:**
- Skipped pre-existing conditions or medications questions
- Skipped doctor preference question
- Rushed closing without verbal confirmations
- No enrollment urgency created

## Response Format

Respond with valid JSON (no markdown code blocks):
{
  "scores": {
    "opening_rapport": <1-5>,
    "needs_discovery": <1-5>,
    "product_presentation": <1-5>,
    "objection_handling": <1-5>,
    "compliance_disclosures": <1-5>,
    "closing_enrollment": <1-5>
  },
  "overall_score": <weighted average to 2 decimal places>,
  "performance_level": "<Top Performer|Solid Performer|Developing|Needs Coaching|Performance Issue>",
  "strengths": [
    "<Specific strength with example from transcript>",
    "<Specific strength with example from transcript>"
  ],
  "improvements": [
    "<Specific area for improvement with example from transcript>",
    "<Specific area for improvement with example from transcript>"
  ],
  "action_items": [
    "<Concrete, actionable coaching tip>",
    "<Concrete, actionable coaching tip>",
    "<Concrete, actionable coaching tip>"
  ],
  "red_flags": {
    "critical": ["<flag key if detected>"],
    "high": ["<flag key if detected>"],
    "medium": ["<flag key if detected>"]
  },
  "notable_moments": [
    {
      "type": "<positive|needs_work>",
      "category": "<category name>",
      "description": "<Brief description of the moment>",
      "quote": "<Relevant quote from transcript if available>"
    }
  ]
}

Performance level thresholds:
- 4.5-5.0: Top Performer
- 3.5-4.4: Solid Performer
- 2.5-3.4: Developing
- 1.5-2.4: Needs Coaching
- 1.0-1.4: Performance Issue

Calculate overall_score using weights:
opening_rapport × 0.10 + needs_discovery × 0.30 + product_presentation × 0.20 + objection_handling × 0.20 + compliance_disclosures × 0.10 + closing_enrollment × 0.10`;

export const COACHING_SUMMARY_PROMPT = `You are a sales coach providing a summary of coaching feedback.

## Coaching Analysis Results
{coaching_json}

## Call Information
- Agent: {agent_name}
- Call Date: {call_date}
- Duration: {duration}

Write a friendly, constructive coaching summary for this agent. Include:

1. **Overall Assessment** - A one-sentence summary of how they did
2. **Score Breakdown** - List each category with its score (use emoji: ⭐ for 4-5, ✓ for 3, ⚠️ for 1-2)
3. **Top Strengths** - 2-3 things they did well with specific examples
4. **Focus Areas** - 2-3 things to improve with specific examples
5. **Action Items** - 3 concrete things to practice on the next call
6. **Red Flags** - Only mention if critical or high priority flags were detected

Keep the tone encouraging but honest. Use their name. Format with markdown for readability.`;

export interface CoachingVariables {
  agent_name: string;
  call_date: string;
  duration: string;
  customer_talk_ratio: string;
  agent_talk_ratio: string;
  transcript: string;
}

export interface CoachingSummaryVariables {
  coaching_json: string;
  agent_name: string;
  call_date: string;
  duration: string;
}

export function buildCoachingAnalysisPrompt(variables: CoachingVariables): string {
  let prompt = COACHING_ANALYSIS_PROMPT;

  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value || 'N/A');
  }

  return prompt;
}

export function buildCoachingSummaryPrompt(variables: CoachingSummaryVariables): string {
  let prompt = COACHING_SUMMARY_PROMPT;

  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value || 'N/A');
  }

  return prompt;
}
