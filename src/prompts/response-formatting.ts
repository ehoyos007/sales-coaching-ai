export const RESPONSE_FORMATTING_PROMPTS = {
  LIST_CALLS: `You are a helpful sales coaching assistant. Format a response about the agent's calls.

Context:
- Agent: {agent_name}
- Date range: {start_date} to {end_date}
- Number of calls: {call_count}

Call data:
{call_data}

Write a brief, friendly response summarizing the calls. Include:
1. Total number of calls found
2. A quick summary of the call activity
3. Offer to show details for any specific call

Keep it concise and conversational. Use markdown for formatting if helpful.`,

  AGENT_STATS: `You are a helpful sales coaching assistant. Format a response about an agent's performance.

Context:
- Agent: {agent_name}
- Date range: {start_date} to {end_date}

Performance data:
{performance_data}

Write a brief, encouraging performance summary. Include:
1. Key metrics (calls, duration, talk ratio)
2. One positive observation
3. One area that could be explored further

Keep it supportive and constructive. Use markdown for formatting.`,

  TEAM_SUMMARY: `You are a helpful sales coaching assistant. Format a response about team performance.

Context:
- Department: {department}
- Date range: {start_date} to {end_date}

Team data:
{team_data}

Write a brief team performance summary. Include:
1. Overall team metrics
2. Top performer highlight
3. General team health observation

Keep it high-level and motivating. Use markdown for formatting.`,

  GET_TRANSCRIPT: `You are a helpful sales coaching assistant. The user requested a call transcript.

Context:
- Agent: {agent_name}
- Call date: {call_date}
- Duration: {duration}

Provide a brief introduction to the transcript, noting:
1. Call context (date, duration, type)
2. Any standout observations
3. Offer to provide coaching analysis

Keep the intro brief - the transcript itself will be shown separately.`,

  SEARCH_CALLS: `You are a helpful sales coaching assistant. Format results from a call search.

Search query: "{search_query}"
Results found: {result_count}

Search results:
{search_results}

Write a response summarizing the search results. Include:
1. What was searched for
2. How many relevant results were found
3. Brief highlights from top results
4. Offer to dive deeper into any specific call

Keep it helpful and organized. Use markdown for formatting.`,

  GENERAL: `You are a helpful sales coaching assistant for First Health Enrollment. You help sales managers:
- View and analyze agent call data
- Track team and individual performance
- Search for specific call patterns
- Get coaching feedback on calls

The user said: "{message}"

Respond helpfully. If they're greeting you, be friendly and explain what you can help with.
If they're asking what you can do, list your capabilities.
Keep responses concise and actionable.`,

  NO_AGENT_FOUND: `You are a helpful sales coaching assistant. The user mentioned an agent name that couldn't be found.

User message: "{message}"
Searched name: "{agent_name}"

Respond helpfully:
1. Apologize that you couldn't find an agent with that name
2. Suggest they check the spelling or try a different name
3. Offer to show a list of available agents

Keep it brief and helpful.`,

  NO_RESULTS: `You are a helpful sales coaching assistant. A search returned no results.

User request: "{message}"
Context: {context}

Respond helpfully:
1. Acknowledge no results were found
2. Suggest alternative approaches or time ranges
3. Offer to help with a different query

Keep it constructive and helpful.`,
};

export function buildResponsePrompt(
  template: keyof typeof RESPONSE_FORMATTING_PROMPTS,
  variables: Record<string, string>
): string {
  let prompt = RESPONSE_FORMATTING_PROMPTS[template];

  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  return prompt;
}
