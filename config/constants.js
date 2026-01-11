// config/constants.js - Application constants and configuration

export const APP_CONFIG = {
  NAME: 'Prompt Refinement System',
  VERSION: '1.0.0',
  DESCRIPTION: 'Multi-modal prompt refinement and structuring system',
  AUTHOR: 'Your Name',
  REPOSITORY: 'https://github.com/yourusername/prompt-refinement-system'
};

export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: '/api'
};

export const FILE_CONFIG = {
  // Upload settings
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5,
  
  // Allowed file types
  ALLOWED_IMAGE_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
  ALLOWED_DOCUMENT_TYPES: ['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf'],
  ALLOWED_ALL_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.pdf', '.docx', '.doc', '.txt', '.md', '.rtf'],
  
  // File type mappings
  MIME_TYPES: {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.rtf': 'application/rtf'
  }
};

export const PROCESSING_CONFIG = {
  // Text processing
  MAX_TEXT_LENGTH: 10000,
  MIN_TEXT_LENGTH: 10,
  
  // OCR settings
  OCR_LANGUAGE: 'eng',
  OCR_CONFIDENCE_THRESHOLD: 0.6,
  
  // Extraction settings
  MAX_KEYWORDS: 10,
  MAX_REQUIREMENTS: 15,
  MAX_CONSTRAINTS: 10,
  
  // Timing
  PROCESS_TIMEOUT: 30000, // 30 seconds
  FILE_PROCESS_TIMEOUT: 10000 // 10 seconds per file
};

export const TEMPLATE_CONFIG = {
  VERSION: '1.0.0',
  
  // Template structure
  REQUIRED_FIELDS: [
    'core_intent',
    'functional_requirements', 
    'technical_constraints',
    'expected_outputs',
    'timestamp'
  ],
  
  OPTIONAL_FIELDS: [
    'non_functional_requirements',
    'user_stories',
    'acceptance_criteria',
    'business_constraints',
    'timeline_constraints',
    'budget_constraints',
    'technologies',
    'platforms',
    'integrations',
    'data_requirements',
    'deliverables',
    'success_metrics',
    'priority_level',
    'scope_inclusions',
    'scope_exclusions',
    'quality_attributes',
    'performance_requirements',
    'security_requirements',
    'assumptions_made',
    'missing_information',
    'source_summary',
    'extraction_quality',
    'confidence_score',
    'notes'
  ],
  
  // Priority levels
  PRIORITY_LEVELS: {
    HIGH: 'high',
    MEDIUM: 'medium', 
    LOW: 'low',
    UNKNOWN: 'unknown'
  },
  
  // Confidence score ranges
  CONFIDENCE_RANGES: {
    HIGH: 0.8,
    MEDIUM: 0.5,
    LOW: 0.3
  }
};

export const ERROR_MESSAGES = {
  // Validation errors
  NO_INPUT: 'At least one input (text or file) is required',
  TEXT_TOO_SHORT: `Text must be at least ${PROCESSING_CONFIG.MIN_TEXT_LENGTH} characters`,
  TEXT_TOO_LONG: `Text exceeds maximum length of ${PROCESSING_CONFIG.MAX_TEXT_LENGTH} characters`,
  FILE_TOO_LARGE: 'File exceeds maximum size',
  UNSUPPORTED_FILE_TYPE: 'File type not supported',
  TOO_MANY_FILES: 'Too many files uploaded',
  
  // Processing errors
  PDF_EXTRACTION_FAILED: 'Failed to extract text from PDF',
  DOCX_EXTRACTION_FAILED: 'Failed to extract text from DOCX',
  IMAGE_PROCESSING_FAILED: 'Failed to process image',
  OCR_FAILED: 'OCR text extraction failed',
  
  // System errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  TIMEOUT_ERROR: 'Processing timeout exceeded'
};

export const SUCCESS_MESSAGES = {
  PROCESSING_COMPLETE: 'Prompt refinement completed successfully',
  FILE_UPLOAD_SUCCESS: 'File uploaded successfully',
  EXTRACTION_SUCCESS: 'Content extracted successfully'
};

export const LOGGING_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || 'info',
  FILE: process.env.LOG_FILE || './logs/app.log',
  MAX_SIZE: '10m',
  MAX_FILES: '5'
};

export const SECURITY_CONFIG = {
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173']
};

export const API_ENDPOINTS = {
  REFINE: '/refine',
  HEALTH: '/health',
  INFO: '/info',
  UPLOAD: '/upload',
  STATUS: '/status'
};

// Helper functions
export const getFileCategory = (filename) => {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  
  if (FILE_CONFIG.ALLOWED_IMAGE_TYPES.includes(ext)) {
    return 'image';
  } else if (FILE_CONFIG.ALLOWED_DOCUMENT_TYPES.includes(ext)) {
    return 'document';
  }
  
  return 'unknown';
};

export const isValidFileType = (filename) => {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  return FILE_CONFIG.ALLOWED_ALL_TYPES.includes(ext);
};

export const getMimeType = (filename) => {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  return FILE_CONFIG.MIME_TYPES[ext] || 'application/octet-stream';
};

// Export all constants as default
export default {
  APP_CONFIG,
  SERVER_CONFIG,
  FILE_CONFIG,
  PROCESSING_CONFIG,
  TEMPLATE_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOGGING_CONFIG,
  SECURITY_CONFIG,
  API_ENDPOINTS,
  getFileCategory,
  isValidFileType,
  getMimeType
};