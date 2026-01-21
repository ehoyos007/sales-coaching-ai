import { HandlerParams, HandlerResult } from '../../../types/index.js';
import { searchService } from '../../database/search.service.js';
import { agentsService } from '../../database/agents.service.js';
import { embeddingsService } from '../../ai/embeddings.service.js';
import { getDateRange } from '../../../utils/date.utils.js';
import { ErrorMessages, buildErrorMessage, formatError } from '../../../utils/error-messages.js';

export async function handleSearchCalls(
  params: HandlerParams,
  _originalMessage: string
): Promise<HandlerResult> {
  try {
    const searchQuery = params.searchQuery;

    if (!searchQuery) {
      return formatError(ErrorMessages.searchQueryRequired());
    }

    // Resolve agent if specified
    let agentId = params.agentId;
    let agentName = params.agentName;

    if (!agentId && agentName) {
      const resolved = await agentsService.resolveByName(agentName);
      if (resolved) {
        agentId = resolved.agent_user_id;
        agentName = resolved.first_name;
      }
    }

    // Calculate date range
    const { startDate, endDate } = params.startDate && params.endDate
      ? { startDate: params.startDate, endDate: params.endDate }
      : getDateRange(params.daysBack);

    // Generate embedding for the search query
    const queryEmbedding = await embeddingsService.getEmbedding(searchQuery);

    // Perform semantic search
    const results = await searchService.semanticSearch(queryEmbedding, {
      agentUserId: agentId,
      startDate,
      endDate,
      limit: params.limit || 10,
      similarityThreshold: 0.5,
    });

    if (results.length === 0) {
      // Fall back to text search
      const textResults = await searchService.textSearch(searchQuery, {
        agentUserId: agentId,
        startDate,
        endDate,
        limit: params.limit || 10,
      });

      if (textResults.length === 0) {
        return {
          success: true,
          data: {
            type: 'search_results',
            search_query: searchQuery,
            agent_name: agentName,
            start_date: startDate,
            end_date: endDate,
            result_count: 0,
            results: [],
            message: ErrorMessages.noSearchResults(searchQuery),
          },
        };
      }

      return {
        success: true,
        data: {
          type: 'search_results',
          search_query: searchQuery,
          agent_name: agentName,
          start_date: startDate,
          end_date: endDate,
          result_count: textResults.length,
          results: textResults,
          search_type: 'text',
        },
      };
    }

    return {
      success: true,
      data: {
        type: 'search_results',
        search_query: searchQuery,
        agent_name: agentName,
        start_date: startDate,
        end_date: endDate,
        result_count: results.length,
        results,
        search_type: 'semantic',
      },
    };
  } catch (error) {
    return formatError(buildErrorMessage(error, { operation: 'search calls' }));
  }
}
