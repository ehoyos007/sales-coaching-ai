/**
 * Script Parser Service
 * Extracts text content from various file formats (txt, pdf, docx, md)
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { ScriptFileType } from '../../types/scripts.types.js';

export interface ParseResult {
  content: string;
  wordCount: number;
  pageCount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Parse a file buffer and extract text content
 */
export async function parseFile(buffer: Buffer, mimeType: ScriptFileType): Promise<ParseResult> {
  switch (mimeType) {
    case 'text/plain':
      return parseTextFile(buffer);
    case 'text/markdown':
      return parseMarkdownFile(buffer);
    case 'application/pdf':
      return parsePdfFile(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return parseDocxFile(buffer);
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Parse plain text file
 */
async function parseTextFile(buffer: Buffer): Promise<ParseResult> {
  const content = buffer.toString('utf-8');
  return {
    content: cleanText(content),
    wordCount: countWords(content),
  };
}

/**
 * Parse markdown file (treated same as plain text but preserves formatting)
 */
async function parseMarkdownFile(buffer: Buffer): Promise<ParseResult> {
  const content = buffer.toString('utf-8');
  return {
    content: cleanText(content),
    wordCount: countWords(content),
    metadata: { format: 'markdown' },
  };
}

/**
 * Parse PDF file using pdf-parse
 */
async function parsePdfFile(buffer: Buffer): Promise<ParseResult> {
  try {
    const data = await pdfParse(buffer);

    return {
      content: cleanText(data.text),
      wordCount: countWords(data.text),
      pageCount: data.numpages,
      metadata: {
        info: data.info,
        version: data.version,
      },
    };
  } catch (error) {
    console.error('[Parser] PDF parsing error:', error);
    throw new Error('Failed to parse PDF file. The file may be corrupted or password-protected.');
  }
}

/**
 * Parse DOCX file using mammoth
 */
async function parseDocxFile(buffer: Buffer): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    if (result.messages.length > 0) {
      console.warn('[Parser] DOCX parsing warnings:', result.messages);
    }

    return {
      content: cleanText(result.value),
      wordCount: countWords(result.value),
    };
  } catch (error) {
    console.error('[Parser] DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file. The file may be corrupted or in an unsupported format.');
  }
}

/**
 * Clean and normalize extracted text
 */
function cleanText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive whitespace but preserve paragraph structure
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final trim
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const words = text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
  return words.length;
}

/**
 * Extract structured sections from script content
 * Useful for understanding script structure
 */
export function extractSections(content: string): ScriptSection[] {
  const sections: ScriptSection[] = [];
  const lines = content.split('\n');

  let currentSection: ScriptSection | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check if line is a section header (various patterns)
    const headerMatch = line.match(
      /^(?:#{1,3}\s*)?(?:\d+[\.\)]\s*)?([A-Z][A-Z\s\-&]+):?\s*$/
    ) || line.match(
      /^(?:STEP|PHASE|SECTION|PART)\s*\d*[:\s-]*(.+)$/i
    );

    if (headerMatch && line.length < 100) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        if (currentSection.content) {
          sections.push(currentSection);
        }
      }

      // Start new section
      currentSection = {
        title: headerMatch[1]?.trim() || line.trim(),
        content: '',
        startLine: lines.indexOf(line),
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    } else if (line.trim()) {
      // Content before any section header
      if (!currentSection) {
        currentSection = {
          title: 'Introduction',
          content: '',
          startLine: 0,
        };
      }
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    if (currentSection.content) {
      sections.push(currentSection);
    }
  }

  return sections;
}

export interface ScriptSection {
  title: string;
  content: string;
  startLine: number;
}

/**
 * Validate that content is a valid sales script
 */
export function validateScriptContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum length
  const wordCount = countWords(content);
  if (wordCount < 100) {
    errors.push(`Script is too short (${wordCount} words). Sales scripts typically have at least 100 words.`);
  }

  // Check for common script elements
  const contentLower = content.toLowerCase();

  if (!contentLower.includes('hello') && !contentLower.includes('hi') && !contentLower.includes('good morning') && !contentLower.includes('good afternoon')) {
    warnings.push('Script may be missing a greeting/opening section.');
  }

  if (!contentLower.includes('question') && !contentLower.includes('?')) {
    warnings.push('Script appears to have no questions. Good scripts include discovery questions.');
  }

  if (!contentLower.includes('thank') && !contentLower.includes('appreciate')) {
    warnings.push('Script may be missing closing/thank you section.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    wordCount,
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  wordCount: number;
}

export const scriptParserService = {
  parseFile,
  extractSections,
  validateScriptContent,
};
