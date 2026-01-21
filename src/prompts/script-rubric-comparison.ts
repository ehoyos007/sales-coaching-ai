/**
 * Script-Rubric Comparison Prompts
 * AI prompts for analyzing sales scripts and generating rubric update suggestions
 */

import { RubricConfigWithRelations } from '../types/rubric.types.js';

/**
 * Build the main comparison prompt
 */
export function buildScriptRubricComparisonPrompt(
  scriptContent: string,
  currentRubric: RubricConfigWithRelations,
  productType: string
): string {
  const rubricJson = formatRubricAsJson(currentRubric);

  return `You are an expert sales training analyst. Your task is to analyze a sales script and compare it against an existing coaching rubric to identify necessary updates.

## Product Type
${productType}

## Current Coaching Rubric
\`\`\`json
${rubricJson}
\`\`\`

## New Sales Script Content
\`\`\`
${scriptContent}
\`\`\`

## Your Task
Analyze the sales script and compare it to the current rubric. Identify:

1. **Category Changes**: Are there new phases in the script that need new categories? Should existing categories be renamed, reweighted, or removed?

2. **Scoring Criteria Changes**: Does the script introduce new requirements that should be reflected in the 1-5 scoring criteria? Are current criteria outdated or misaligned?

3. **Red Flag Changes**: Are there new compliance requirements, prohibited phrases, or behaviors in the script that should trigger red flags? Should existing red flags be updated?

## Analysis Guidelines
- Focus on MEANINGFUL changes that will improve coaching accuracy
- Changes should be specific and actionable
- Provide a confidence score (0.0-1.0) for each change
- Include a quote from the script that supports each change
- Consider the weights: major phases should have higher weights
- Don't suggest changes just for the sake of it - only when the script clearly requires them

## Required Response Format
Respond with a valid JSON object matching this exact structure:
{
  "summary": "Brief summary of the analysis and overall alignment",
  "analysis_notes": "Detailed notes about what was found in the script",
  "category_changes": [
    {
      "change_type": "add|modify|remove",
      "category_slug": "slug_of_category",
      "current_name": "Current name (for modify/remove)",
      "proposed_name": "New name (for add/modify)",
      "current_weight": 10,
      "proposed_weight": 15,
      "current_description": "Current description",
      "proposed_description": "New description",
      "reason": "Why this change is needed",
      "confidence": 0.85,
      "script_reference": "Quote from script supporting this"
    }
  ],
  "criteria_changes": [
    {
      "change_type": "add|modify|remove",
      "category_slug": "which_category",
      "score": 5,
      "current_text": "Current criteria text (for modify/remove)",
      "proposed_text": "New criteria text (for add/modify)",
      "reason": "Why this change is needed",
      "confidence": 0.80,
      "script_reference": "Quote from script supporting this"
    }
  ],
  "red_flag_changes": [
    {
      "change_type": "add|modify|remove",
      "flag_key": "flag_identifier",
      "current_display_name": "Current name",
      "proposed_display_name": "New name",
      "current_description": "Current description",
      "proposed_description": "New description",
      "current_severity": "critical|high|medium",
      "proposed_severity": "critical|high|medium",
      "reason": "Why this change is needed",
      "confidence": 0.90,
      "script_reference": "Quote from script supporting this"
    }
  ],
  "total_changes": 5,
  "high_confidence_count": 3
}

If the rubric is already well-aligned with the script and no changes are needed, return:
{
  "summary": "The current rubric is well-aligned with the sales script.",
  "analysis_notes": "Detailed explanation of why no changes are needed",
  "category_changes": [],
  "criteria_changes": [],
  "red_flag_changes": [],
  "total_changes": 0,
  "high_confidence_count": 0
}

Important: Your response must be ONLY valid JSON, no additional text or markdown code blocks.`;
}

/**
 * Format rubric as JSON for the prompt
 */
function formatRubricAsJson(rubric: RubricConfigWithRelations): string {
  const formatted = {
    name: rubric.name,
    version: rubric.version,
    categories: rubric.categories.map(cat => ({
      slug: cat.slug,
      name: cat.name,
      weight: cat.weight,
      description: cat.description,
      is_enabled: cat.is_enabled,
      scoring_criteria: cat.scoring_criteria?.map(sc => ({
        score: sc.score,
        criteria_text: sc.criteria_text,
      })) || [],
    })),
    red_flags: rubric.red_flags.map(flag => ({
      flag_key: flag.flag_key,
      display_name: flag.display_name,
      description: flag.description,
      severity: flag.severity,
      threshold_type: flag.threshold_type,
      threshold_value: flag.threshold_value,
      is_enabled: flag.is_enabled,
    })),
  };

  return JSON.stringify(formatted, null, 2);
}

/**
 * Build a simpler quick-check prompt for detecting if sync is needed
 */
export function buildQuickAlignmentCheckPrompt(
  scriptContent: string,
  currentRubric: RubricConfigWithRelations
): string {
  const categoryNames = currentRubric.categories
    .filter(c => c.is_enabled)
    .map(c => c.name)
    .join(', ');

  return `You are a sales training expert. Quickly assess if this sales script aligns with the coaching rubric categories.

## Current Rubric Categories
${categoryNames}

## Script (first 2000 chars)
${scriptContent.slice(0, 2000)}

## Question
Does this script cover the same phases/sections as the rubric categories? Are there significant gaps or misalignments?

Respond with JSON:
{
  "is_aligned": true|false,
  "alignment_score": 0.0-1.0,
  "brief_reason": "One sentence explanation"
}`;
}

/**
 * Build prompt for generating suggested category weights based on script structure
 */
export function buildWeightSuggestionPrompt(
  scriptContent: string,
  categories: { slug: string; name: string }[]
): string {
  const categoryList = categories.map(c => `- ${c.name} (${c.slug})`).join('\n');

  return `Analyze this sales script and suggest appropriate weights (0-100%) for each coaching category based on how much emphasis the script places on each phase.

## Categories
${categoryList}

## Script
${scriptContent}

## Guidelines
- Weights must sum to exactly 100
- More emphasized/longer phases should have higher weights
- Consider the importance of each phase to successful outcomes

Respond with JSON:
{
  "suggested_weights": {
    "category_slug": 15,
    "another_category": 25
  },
  "reasoning": "Brief explanation of weight allocation"
}`;
}
