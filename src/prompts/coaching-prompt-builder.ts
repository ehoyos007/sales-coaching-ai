/**
 * Dynamic Coaching Prompt Builder
 *
 * Builds coaching analysis prompts dynamically from database configuration.
 * Falls back to static prompts if no database config is available.
 */

import { RubricConfigWithRelations } from '../types/index.js';

export interface DynamicCoachingVariables {
  agent_name: string;
  call_date: string;
  duration: string;
  customer_talk_ratio: string;
  agent_talk_ratio: string;
  transcript: string;
}

/**
 * Build the coaching system prompt from rubric config
 */
export function buildDynamicSystemPrompt(rubric: RubricConfigWithRelations): string {
  return `You are an expert sales coach for First Health Enrollment, a health insurance agency selling ACA plans, Limited Medical Plans, and Life Insurance.

Your role is to analyze sales call transcripts and provide constructive, actionable coaching feedback based on the company's coaching rubric.

Be encouraging but honest. Focus on specific examples from the transcript. Provide feedback that will actually help the agent improve.

You are using the "${rubric.name}" rubric (version ${rubric.version}).`;
}

/**
 * Build the category evaluation section of the prompt
 */
function buildCategorySection(rubric: RubricConfigWithRelations): string {
  const categories = rubric.categories.filter(c => c.is_enabled);

  const categoryDescriptions = categories.map(cat => {
    const criteriaText = cat.scoring_criteria
      .sort((a, b) => b.score - a.score) // 5 to 1
      .slice(0, 3) // Show top 3 examples (5, 3, 1)
      .map(sc => `- Score ${sc.score}: ${sc.criteria_text.substring(0, 150)}${sc.criteria_text.length > 150 ? '...' : ''}`)
      .join('\n');

    return `**${cat.sort_order}. ${cat.name} (${cat.weight}% weight)**
${cat.description || 'Evaluate this category based on the agent\'s performance.'}
${criteriaText}`;
  });

  return categoryDescriptions.join('\n\n');
}

/**
 * Build the red flags section of the prompt
 */
function buildRedFlagsSection(rubric: RubricConfigWithRelations): string {
  const enabledFlags = rubric.red_flags.filter(f => f.is_enabled);

  const criticalFlags = enabledFlags.filter(f => f.severity === 'critical');
  const highFlags = enabledFlags.filter(f => f.severity === 'high');
  const mediumFlags = enabledFlags.filter(f => f.severity === 'medium');

  const sections: string[] = [];

  if (criticalFlags.length > 0) {
    const flagList = criticalFlags.map(f => {
      const threshold = f.threshold_type === 'percentage' ? ` (threshold: ${f.threshold_value}%)` : '';
      return `- ${f.display_name}${threshold}: ${f.description}`;
    }).join('\n');
    sections.push(`**Critical (immediate manager alert):**\n${flagList}`);
  }

  if (highFlags.length > 0) {
    const flagList = highFlags.map(f => {
      const threshold = f.threshold_type === 'percentage' ? ` (threshold: ${f.threshold_value}%)` : '';
      return `- ${f.display_name}${threshold}: ${f.description}`;
    }).join('\n');
    sections.push(`**High Priority:**\n${flagList}`);
  }

  if (mediumFlags.length > 0) {
    const flagList = mediumFlags.map(f => {
      const threshold = f.threshold_type === 'percentage' ? ` (threshold: ${f.threshold_value}%)` : '';
      return `- ${f.display_name}${threshold}: ${f.description}`;
    }).join('\n');
    sections.push(`**Medium Priority:**\n${flagList}`);
  }

  return sections.join('\n\n');
}

/**
 * Build the score calculation formula
 */
function buildScoreFormula(rubric: RubricConfigWithRelations): string {
  const categories = rubric.categories.filter(c => c.is_enabled);
  const formula = categories
    .map(c => `${c.slug} × ${(c.weight / 100).toFixed(2)}`)
    .join(' + ');

  return formula;
}

/**
 * Build the JSON response format section
 */
function buildResponseFormat(rubric: RubricConfigWithRelations): string {
  const categories = rubric.categories.filter(c => c.is_enabled);
  const scoreFields = categories.map(c => `    "${c.slug}": <1-5>`).join(',\n');

  return `{
  "scores": {
${scoreFields}
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
      "category": "<category slug>",
      "description": "<Brief description of the moment>",
      "quote": "<Relevant quote from transcript if available>"
    }
  ]
}`;
}

/**
 * Build the complete coaching analysis prompt from rubric config
 */
export function buildDynamicCoachingPrompt(
  rubric: RubricConfigWithRelations,
  variables: DynamicCoachingVariables
): string {
  const categorySection = buildCategorySection(rubric);
  const redFlagsSection = buildRedFlagsSection(rubric);
  const responseFormat = buildResponseFormat(rubric);
  const scoreFormula = buildScoreFormula(rubric);

  const prompt = `Analyze this sales call transcript and provide coaching feedback.

## Call Information
- Agent: ${variables.agent_name}
- Call Date: ${variables.call_date}
- Duration: ${variables.duration}
- Customer Talk Ratio: ${variables.customer_talk_ratio}%
- Agent Talk Ratio: ${variables.agent_talk_ratio}%

## Transcript
${variables.transcript}

## Scoring Rubric

Score each category from 1-5:
- 1 = Needs Improvement (missing or ineffective)
- 2 = Below Standard (attempted but significant gaps)
- 3 = Meets Standard (competent, room for improvement)
- 4 = Above Standard (strong with minor refinements possible)
- 5 = Excellent (exemplary, use as training example)

### Categories to Evaluate:

${categorySection}

## Red Flags to Check

${redFlagsSection}

## Response Format

Respond with valid JSON (no markdown code blocks):
${responseFormat}

Performance level thresholds:
- 4.5-5.0: Top Performer
- 3.5-4.4: Solid Performer
- 2.5-3.4: Developing
- 1.5-2.4: Needs Coaching
- 1.0-1.4: Performance Issue

Calculate overall_score using weights:
${scoreFormula}`;

  return prompt;
}

/**
 * Build the coaching summary prompt
 */
export function buildDynamicSummaryPrompt(
  rubric: RubricConfigWithRelations,
  variables: {
    coaching_json: string;
    agent_name: string;
    call_date: string;
    duration: string;
  }
): string {
  const categories = rubric.categories.filter(c => c.is_enabled);
  const categoryList = categories.map(c => `- ${c.name} (${c.weight}%)`).join('\n');

  return `You are a sales coach providing a summary of coaching feedback.

## Coaching Analysis Results
${variables.coaching_json}

## Call Information
- Agent: ${variables.agent_name}
- Call Date: ${variables.call_date}
- Duration: ${variables.duration}

## Rubric Categories
${categoryList}

Write a friendly, constructive coaching summary for this agent. Include:

1. **Overall Assessment** - A one-sentence summary of how they did
2. **Score Breakdown** - List each category with its score (use emoji: ⭐ for 4-5, ✓ for 3, ⚠️ for 1-2)
3. **Top Strengths** - 2-3 things they did well with specific examples
4. **Focus Areas** - 2-3 things to improve with specific examples
5. **Action Items** - 3 concrete things to practice on the next call
6. **Red Flags** - Only mention if critical or high priority flags were detected

Keep the tone encouraging but honest. Use their name. Format with markdown for readability.`;
}
