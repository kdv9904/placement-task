import documentProcessor from './documentProcessor.js';
import imageProcessor from './imageProcessor.js';
import PromptTemplate from '../utils/promptTemplate.js';
import path from 'path';

class PromptRefiner {
  constructor() {
    this.template = new PromptTemplate();
  }

  async processInputs(text, files) {
    const extractedData = {
      textContent: text || '',
      fileContents: [],
      combinedText: ''
    };

    // Process each file
    for (const file of files) {
      const fileType = path.extname(file.originalname).toLowerCase().substring(1);
      const filePath = file.path;
      
      let content;
      try {
        switch (fileType) {
          case 'jpg':
          case 'jpeg':
          case 'png':
            content = await imageProcessor.extractTextFromImage(filePath);
            extractedData.fileContents.push({
              type: 'image',
              filename: file.originalname,
              content: content.text,
              metadata: { confidence: content.confidence }
            });
            break;
            
          case 'pdf':
          case 'docx':
          case 'txt':
            content = await documentProcessor.processDocument(filePath, fileType);
            extractedData.fileContents.push({
              type: 'document',
              filename: file.originalname,
              content: content.text,
              metadata: content.metadata || {}
            });
            break;
        }
      } catch (error) {
        console.error(`Failed to process ${file.originalname}:`, error.message);
        extractedData.fileContents.push({
          type: fileType,
          filename: file.originalname,
          error: error.message,
          content: ''
        });
      }
    }

    // Combine all text content
    extractedData.combinedText = this.combineAllText(extractedData);
    
    // Generate refined prompt using template
    const refinedPrompt = this.template.generate(extractedData);
    
    return {
      refinedPrompt,
      metadata: {
        totalFiles: files.length,
        fileTypes: files.map(f => path.extname(f.originalname)),
        extractionSuccess: extractedData.fileContents.filter(f => !f.error).length
      },
      assumptions: this.template.getAssumptions()
    };
  }

  combineAllText(data) {
    let combined = data.textContent + '\n\n';
    
    data.fileContents.forEach(file => {
      if (file.content) {
        combined += `[From ${file.filename} (${file.type})]:\n${file.content}\n\n`;
      }
    });
    
    return combined.trim();
  }

  // Validation method
  validateInput(combinedText) {
    const minLength = 10;
    const maxLength = 10000;
    
    if (!combinedText || combinedText.length < minLength) {
      return {
        valid: false,
        reason: `Input too short (minimum ${minLength} characters required)`
      };
    }
    
    if (combinedText.length > maxLength) {
      return {
        valid: false,
        reason: `Input too long (maximum ${maxLength} characters allowed)`
      };
    }
    
    return { valid: true };
  }
}

export default new PromptRefiner();