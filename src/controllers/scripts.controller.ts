/**
 * Scripts Controller
 * HTTP handlers for sales scripts management
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { scriptsService } from '../services/database/scripts.service.js';
import { storageService } from '../services/storage/supabase-storage.service.js';
import { scriptParserService } from '../services/scripts/script-parser.service.js';
import { scriptSyncService } from '../services/scripts/script-sync.service.js';
import {
  CreateScriptInput,
  UpdateScriptInput,
  ApplySyncInput,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_FILE_TYPES,
  ScriptFileType,
  ProductType,
} from '../types/scripts.types.js';

// Configure multer for memory storage (we'll process and forward to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (ext && SUPPORTED_FILE_TYPES[ext]) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Supported: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`));
    }
  },
});

/**
 * Multer middleware for single file upload
 */
export const uploadMiddleware = upload.single('file');

/**
 * Get all scripts grouped by product type
 */
export async function getAllScripts(_req: Request, res: Response): Promise<void> {
  try {
    const scripts = await scriptsService.getAllScripts();

    res.json({
      success: true,
      data: scripts,
    });
  } catch (error) {
    console.error('[Scripts] Get all error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get scripts: ${message}`,
    });
  }
}

/**
 * Get a specific script by ID
 */
export async function getScriptById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Script ID is required',
      });
      return;
    }

    const script = await scriptsService.getScriptById(id);

    if (!script) {
      res.status(404).json({
        success: false,
        error: 'Script not found',
      });
      return;
    }

    res.json({
      success: true,
      data: script,
    });
  } catch (error) {
    console.error('[Scripts] Get by ID error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get script: ${message}`,
    });
  }
}

/**
 * Upload a new script
 */
export async function uploadScript(req: Request, res: Response): Promise<void> {
  try {
    const file = req.file;
    const { name, product_type, version_notes } = req.body;

    // Validate required fields
    if (!file) {
      res.status(400).json({
        success: false,
        error: 'File is required',
      });
      return;
    }

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Script name is required',
      });
      return;
    }

    if (!product_type || !['aca', 'limited_medical', 'life_insurance'].includes(product_type)) {
      res.status(400).json({
        success: false,
        error: 'Valid product type is required (aca, limited_medical, life_insurance)',
      });
      return;
    }

    // Get file extension and MIME type
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    const mimeType = SUPPORTED_FILE_TYPES[ext] as ScriptFileType;

    if (!mimeType) {
      res.status(400).json({
        success: false,
        error: `Unsupported file type: ${ext}`,
      });
      return;
    }

    // Parse the file to extract text content
    console.log('[Scripts] Parsing file:', file.originalname);
    const parseResult = await scriptParserService.parseFile(file.buffer, mimeType);

    // Validate the content
    const validation = scriptParserService.validateScriptContent(parseResult.content);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid script content',
        details: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    // Upload file to Supabase Storage
    console.log('[Scripts] Uploading to storage...');
    const uploadResult = await storageService.uploadFile(file.buffer, file.originalname, mimeType);

    // Create the script record
    const input: CreateScriptInput = {
      name,
      product_type: product_type as ProductType,
      content: parseResult.content,
      file_url: uploadResult.url,
      file_name: uploadResult.fileName,
      file_size_bytes: uploadResult.fileSize,
      file_type: uploadResult.fileType,
      version_notes,
    };

    const script = await scriptsService.createScript(input, req.user?.id);

    console.log('[Scripts] Script created:', script.id);

    res.status(201).json({
      success: true,
      data: script,
      meta: {
        word_count: parseResult.wordCount,
        validation_warnings: validation.warnings,
      },
    });
  } catch (error) {
    console.error('[Scripts] Upload error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to upload script: ${message}`,
    });
  }
}

/**
 * Update script metadata
 */
export async function updateScript(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const input = req.body as UpdateScriptInput;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Script ID is required',
      });
      return;
    }

    const script = await scriptsService.updateScript(id, input);

    res.json({
      success: true,
      data: script,
    });
  } catch (error) {
    console.error('[Scripts] Update error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to update script: ${message}`,
    });
  }
}

/**
 * Delete a script
 */
export async function deleteScript(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Script ID is required',
      });
      return;
    }

    await scriptsService.deleteScript(id);

    res.json({
      success: true,
      message: 'Script deleted',
    });
  } catch (error) {
    console.error('[Scripts] Delete error:', error);
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
      error: `Failed to delete script: ${message}`,
    });
  }
}

/**
 * Activate a script
 */
export async function activateScript(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Script ID is required',
      });
      return;
    }

    const script = await scriptsService.activateScript(id);

    res.json({
      success: true,
      data: script,
      message: `Script "${script.name}" (v${script.version}) is now active`,
    });
  } catch (error) {
    console.error('[Scripts] Activate error:', error);
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
      error: `Failed to activate script: ${message}`,
    });
  }
}

// ============================================================================
// Sync Operations
// ============================================================================

/**
 * Start sync analysis for a script
 */
export async function startSync(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Script ID is required',
      });
      return;
    }

    console.log('[Scripts] Starting sync analysis for script:', id);
    const result = await scriptSyncService.startSyncAnalysis(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Scripts] Start sync error:', error);
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
      error: `Failed to start sync: ${message}`,
    });
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus(req: Request, res: Response): Promise<void> {
  try {
    const { logId } = req.params;

    if (!logId) {
      res.status(400).json({
        success: false,
        error: 'Sync log ID is required',
      });
      return;
    }

    const syncLog = await scriptSyncService.getSyncStatus(logId);

    if (!syncLog) {
      res.status(404).json({
        success: false,
        error: 'Sync log not found',
      });
      return;
    }

    res.json({
      success: true,
      data: syncLog,
    });
  } catch (error) {
    console.error('[Scripts] Get sync status error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: `Failed to get sync status: ${message}`,
    });
  }
}

/**
 * Apply approved sync changes
 */
export async function applySyncChanges(req: Request, res: Response): Promise<void> {
  try {
    const { logId } = req.params;
    const approvedChanges = req.body as ApplySyncInput;

    if (!logId) {
      res.status(400).json({
        success: false,
        error: 'Sync log ID is required',
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
      return;
    }

    const newRubric = await scriptSyncService.applySyncChanges(
      logId,
      approvedChanges,
      req.user.id
    );

    res.json({
      success: true,
      data: newRubric,
      message: 'Sync changes applied. New rubric version created as draft.',
    });
  } catch (error) {
    console.error('[Scripts] Apply sync error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: message,
      });
      return;
    }
    if (message.includes('Cannot apply')) {
      res.status(400).json({
        success: false,
        error: message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: `Failed to apply sync changes: ${message}`,
    });
  }
}

/**
 * Reject sync and cancel all proposed changes
 */
export async function rejectSync(req: Request, res: Response): Promise<void> {
  try {
    const { logId } = req.params;

    if (!logId) {
      res.status(400).json({
        success: false,
        error: 'Sync log ID is required',
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
      return;
    }

    const syncLog = await scriptSyncService.rejectSync(logId, req.user.id);

    res.json({
      success: true,
      data: syncLog,
      message: 'Sync rejected. No changes applied.',
    });
  } catch (error) {
    console.error('[Scripts] Reject sync error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: message,
      });
      return;
    }
    if (message.includes('Cannot reject')) {
      res.status(400).json({
        success: false,
        error: message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: `Failed to reject sync: ${message}`,
    });
  }
}

export const scriptsController = {
  uploadMiddleware,
  getAllScripts,
  getScriptById,
  uploadScript,
  updateScript,
  deleteScript,
  activateScript,
  startSync,
  getSyncStatus,
  applySyncChanges,
  rejectSync,
};
