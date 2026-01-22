/**
 * Search Endpoint
 * POST /api/v1/search - Semantic search across calls
 */
import type { VercelResponse } from '@vercel/node';
import { createApiHandler, ApiException } from '../../../lib/api-handler';
import {
  withAuthAndScope,
  AuthenticatedRequest,
} from '../../../lib/middleware/auth';
import { searchService } from '../../../lib/services/search.service';
import { embeddingsService } from '../../../lib/services/embeddings.service';
import { agentsService } from '../../../lib/services/agents.service';

interface SearchRequest {
  query: string;
  agent_user_id?: string;
  agent_name?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export default createApiHandler({
  POST: withAuthAndScope(
    async (req: AuthenticatedRequest, res: VercelResponse) => {
      const body = req.body as SearchRequest;

      if (!body.query || typeof body.query !== 'string') {
        throw ApiException.badRequest('Query is required and must be a string');
      }

      const dataScope = req.dataScope!;

      // Resolve agent name if provided
      let agentUserIds = dataScope.agentUserIds;
      if (body.agent_name) {
        const resolved = await agentsService.resolveByNameScoped(
          body.agent_name,
          dataScope.agentUserIds
        );
        if (resolved) {
          agentUserIds = [resolved.agent_user_id];
        } else {
          throw ApiException.notFound(
            `Agent "${body.agent_name}" not found in your accessible agents`
          );
        }
      } else if (body.agent_user_id) {
        // Verify access to specific agent
        if (!dataScope.agentUserIds.includes(body.agent_user_id)) {
          throw ApiException.forbidden('You do not have access to this agent');
        }
        agentUserIds = [body.agent_user_id];
      }

      // Generate embedding for query
      const embedding = await embeddingsService.getEmbedding(body.query);

      // Perform search
      const results = await searchService.semanticSearch({
        embedding,
        agentUserIds: agentUserIds.length > 0 ? agentUserIds : undefined,
        startDate: body.start_date,
        endDate: body.end_date,
        limit: body.limit || 10,
      });

      res.status(200).json({
        success: true,
        data: results,
        query: body.query,
        filters: {
          agent_user_id: body.agent_user_id,
          agent_name: body.agent_name,
          start_date: body.start_date,
          end_date: body.end_date,
          limit: body.limit || 10,
        },
        scope: {
          isFloorWide: dataScope.isFloorWide,
          isTeamScope: dataScope.isTeamScope,
          teamName: dataScope.teamName,
        },
      });
    }
  ),
});
