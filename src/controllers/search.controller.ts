import { Request, Response } from 'express';
import { searchService } from '../services/database/search.service.js';
import { embeddingsService } from '../services/ai/embeddings.service.js';
import { agentsService } from '../services/database/agents.service.js';
import { getDateRange, isValidDate } from '../utils/date.utils.js';

interface SearchRequestBody {
  query: string;
  agent_user_id?: string;
  agent_name?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export async function searchCalls(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as SearchRequestBody;

    if (!body.query || typeof body.query !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Search query is required and must be a string',
      });
      return;
    }

    // Resolve agent if name is provided
    let agentId = body.agent_user_id;
    if (!agentId && body.agent_name) {
      const resolved = await agentsService.resolveByName(body.agent_name);
      if (resolved) {
        agentId = resolved.agent_user_id;
      }
    }

    // Parse date range
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (body.start_date && body.end_date) {
      if (!isValidDate(body.start_date) || !isValidDate(body.end_date)) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
        return;
      }
      startDate = body.start_date;
      endDate = body.end_date;
    } else {
      // Default to last 30 days for search
      const range = getDateRange(30);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const limit = body.limit || 10;

    // Generate embedding for search query
    const queryEmbedding = await embeddingsService.getEmbedding(body.query);

    // Perform semantic search
    const results = await searchService.semanticSearch(queryEmbedding, {
      agentUserId: agentId,
      startDate,
      endDate,
      limit,
      similarityThreshold: 0.5,
    });

    res.json({
      success: true,
      data: {
        query: body.query,
        agent_user_id: agentId,
        start_date: startDate,
        end_date: endDate,
        result_count: results.length,
        results,
      },
    });
  } catch (error) {
    console.error('Search calls error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to search calls: ${message}`,
    });
  }
}

export const searchController = {
  searchCalls,
};
