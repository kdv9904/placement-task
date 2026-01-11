import refineService from '../services/refineService.js';

export const refinePrompt = async (req, res) => {
  try {
    const { text, style = 'general', maxLength, temperature } = req.body;
    const files = req.files || [];
    
    console.log('Received request:', { 
      text, 
      style, 
      maxLength, 
      temperature, 
      filesCount: files.length 
    });
    
    // Validation - check if at least one input exists
    const hasText = text && typeof text === 'string' && text.trim().length > 0;
    const hasFiles = files.length > 0;
    
    if (!hasText && !hasFiles) {
      return res.status(400).json({
        error: 'At least one input (text or file) is required',
        details: 'Please provide either text prompt or upload files'
      });
    }
    
    // If text is provided, validate it
    if (hasText && text.length > 5000) {
      return res.status(400).json({
        error: 'Text too long',
        details: 'Text input must be less than 5000 characters'
      });
    }
    
    // Process the inputs
    const result = await refineService.processInputs({
      text: hasText ? text.trim() : undefined,
      files,
      style,
      maxLength,
      temperature
    });
    
    res.json({
      success: true,
      id: result.id || `ref_${Date.now()}`,
      originalPrompt: text || 'File-based request',
      refinedPrompt: result.refinedPrompt,
      style: result.style || style,
      metadata: result.metadata || {},
      assumptions: result.assumptions || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Refinement error:', error);
    res.status(500).json({
      error: 'Failed to process inputs',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Additional controller methods
export const batchRefine = async (req, res) => {
  try {
    const { prompts, style = 'general', consistencyCheck = false } = req.body;
    
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({
        error: 'Invalid prompts',
        details: 'Prompts must be a non-empty array'
      });
    }
    
    const results = [];
    for (const prompt of prompts) {
      const result = await refineService.processInputs({
        text: prompt,
        style,
        maxLength: 500
      });
      results.push({
        original: prompt,
        refined: result.refinedPrompt
      });
    }
    
    res.json({
      success: true,
      batchId: `batch_${Date.now()}`,
      results,
      style,
      consistencyCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Batch refinement error:', error);
    res.status(500).json({
      error: 'Failed to batch refine prompts',
      details: error.message
    });
  }
};

export const getHealth = async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'prompt-refinement-system',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
};