export const validateRefinementRequest = (data) => {
  const errors = [];
  
  // Check if prompt exists and is a non-empty string
  if (!data.prompt || typeof data.prompt !== 'string' || data.prompt.trim().length === 0) {
    errors.push('Prompt is required and must be a non-empty string');
  }
  
  if (data.prompt && data.prompt.length > 5000) {
    errors.push('Prompt must be less than 5000 characters');
  }
  
  if (data.maxLength && (typeof data.maxLength !== 'number' || data.maxLength < 10 || data.maxLength > 5000)) {
    errors.push('maxLength must be a number between 10 and 5000');
  }
  
  if (data.temperature && (typeof data.temperature !== 'number' || data.temperature < 0 || data.temperature > 1)) {
    errors.push('temperature must be a number between 0 and 1');
  }
  
  // Validate style if provided
  const validStyles = ['general', 'creative', 'technical', 'analytical', 'concise', 'detailed', 'visual'];
  if (data.style && !validStyles.includes(data.style)) {
    errors.push(`Style must be one of: ${validStyles.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Simple file validation
export const validateFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }
  
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('File type not supported. Allowed: images, PDF, text, Word documents');
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    errors.push('File size exceeds 10MB limit');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

