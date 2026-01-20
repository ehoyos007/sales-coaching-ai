import { Request, Response } from 'express';
import { rubricService } from '../services/database/rubric.service.js';
import {
  CreateRubricConfigInput,
  UpdateRubricConfigInput,
  validateCategoryWeights,
} from '../types/index.js';

/**
 * Get the active rubric configuration with all relations
 */
export async function getActiveRubric(_req: Request, res: Response): Promise<void> {
  try {
    const config = await rubricService.getActiveConfig();

    if (!config) {
      res.status(404).json({
        success: false,
        error: 'No active rubric configuration found',
      });
      return;
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Get active rubric error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get active rubric: ${message}`,
    });
  }
}

/**
 * List all rubric versions (summary)
 */
export async function listRubricVersions(_req: Request, res: Response): Promise<void> {
  try {
    const versions = await rubricService.listVersions();

    res.json({
      success: true,
      data: {
        versions,
        count: versions.length,
      },
    });
  } catch (error) {
    console.error('List rubric versions error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to list rubric versions: ${message}`,
    });
  }
}

/**
 * Get a specific rubric configuration by ID
 */
export async function getRubricById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Rubric ID is required',
      });
      return;
    }

    const config = await rubricService.getConfigById(id);

    if (!config) {
      res.status(404).json({
        success: false,
        error: 'Rubric configuration not found',
      });
      return;
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Get rubric by ID error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get rubric: ${message}`,
    });
  }
}

/**
 * Create a new rubric configuration version
 */
export async function createRubric(req: Request, res: Response): Promise<void> {
  try {
    const input = req.body as CreateRubricConfigInput;

    // Validate required fields
    if (!input.name) {
      res.status(400).json({
        success: false,
        error: 'Rubric name is required',
      });
      return;
    }

    // Validate category weights if provided
    if (input.categories && input.categories.length > 0) {
      const weightValidation = validateCategoryWeights(input.categories);
      if (!weightValidation.isValid) {
        res.status(400).json({
          success: false,
          error: `Invalid category weights: ${weightValidation.message}. Total: ${weightValidation.total}%`,
        });
        return;
      }
    }

    const config = await rubricService.createVersion(input);

    res.status(201).json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Create rubric error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to create rubric: ${message}`,
    });
  }
}

/**
 * Update an existing draft rubric configuration
 */
export async function updateRubric(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateRubricConfigInput;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Rubric ID is required',
      });
      return;
    }

    // Validate category weights if provided
    if (input.categories && input.categories.length > 0) {
      const weightValidation = validateCategoryWeights(input.categories);
      if (!weightValidation.isValid) {
        res.status(400).json({
          success: false,
          error: `Invalid category weights: ${weightValidation.message}. Total: ${weightValidation.total}%`,
        });
        return;
      }
    }

    const config = await rubricService.updateVersion(id, input);

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Update rubric error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error cases
    if (message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: message,
      });
      return;
    }
    if (message.includes('non-draft')) {
      res.status(400).json({
        success: false,
        error: message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: `Failed to update rubric: ${message}`,
    });
  }
}

/**
 * Activate a rubric version
 */
export async function activateRubric(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Rubric ID is required',
      });
      return;
    }

    const config = await rubricService.activateVersion(id);

    res.json({
      success: true,
      data: config,
      message: `Rubric "${config.name}" (v${config.version}) is now active`,
    });
  } catch (error) {
    console.error('Activate rubric error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: `Failed to activate rubric: ${message}`,
    });
  }
}

/**
 * Delete a draft rubric configuration
 */
export async function deleteRubric(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Rubric ID is required',
      });
      return;
    }

    await rubricService.deleteVersion(id);

    res.json({
      success: true,
      message: 'Rubric configuration deleted',
    });
  } catch (error) {
    console.error('Delete rubric error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: message,
      });
      return;
    }
    if (message.includes('Cannot delete')) {
      res.status(400).json({
        success: false,
        error: message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: `Failed to delete rubric: ${message}`,
    });
  }
}

export const rubricController = {
  getActiveRubric,
  listRubricVersions,
  getRubricById,
  createRubric,
  updateRubric,
  activateRubric,
  deleteRubric,
};
