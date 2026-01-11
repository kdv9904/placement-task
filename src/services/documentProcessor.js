// src/services/documentProcessor.js
import fs from 'fs/promises';
import path from 'path';

class documentProcessor {
  async extractText(filePath) {
    try {
      console.log(`📄 documentProcessor: Extracting text from ${filePath}`);
      
      if (!await this.fileExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const fileExt = path.extname(filePath).toLowerCase();
      const fileType = this.getFileType(fileExt);
      
      console.log(`📄 File type detected: ${fileType}`);
      
      let result;
      switch (fileType) {
        case 'pdf':
          result = await this.extractTextFromPDF(filePath);
          break;
        case 'docx':
        case 'doc':
          result = await this.extractTextFromDocx(filePath);
          break;
        case 'txt':
        case 'text':
        case 'md':
        case 'markdown':
        default:
          result = await this.extractTextFromTextFile(filePath);
      }
      
      // Return result as-is if it's already an object with success field
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }
      
      // Wrap plain text results
      return {
        success: true,
        text: result,
        metadata: {
          textLength: result.length,
          hasText: result.length > 0,
          extractionMethod: fileType
        }
      };
      
    } catch (error) {
      console.error(`❌ Document extraction error:`, error.message);
      
      const stats = await this.getFileMetadata(filePath);
      return {
        success: false,
        error: error.message,
        text: `[Document: ${path.basename(filePath)}]\n` +
              `Type: ${path.extname(filePath)}\n` +
              `Size: ${this.formatFileSize(stats.size)}\n` +
              `Error: ${error.message}`,
        metadata: {
          error: true,
          fileName: path.basename(filePath),
          fileSize: stats.size
        }
      };
    }
  }

  async extractTextFromTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Text file read error:', error);
      throw error;
    }
  }

  async extractTextFromPDF(filePath) {
    try {
      console.log(`📄 Processing PDF file: ${path.basename(filePath)}`);
      
      // Read the file
      const buffer = await fs.readFile(filePath);
      const fileSize = buffer.length;
      console.log(`📊 File size: ${this.formatFileSize(fileSize)}`);
      
      // Quick analysis to determine approach
      const analysis = await this.quickPDFAnalysis(filePath, buffer);
      
      // Always try parentheses extraction first (most reliable)
      console.log('🔄 Extracting text via parentheses...');
      const extraction = this.extractViaParentheses(buffer);
      
      console.log(`✅ Extracted ${extraction.wordCount} words`);
      
      // Process the text
      const processedText = this.processPDFText(extraction.text);
      const finalWordCount = (processedText.match(/\b\w+\b/g) || []).length;
      
      console.log(`📊 Cleaned to ${finalWordCount} words, ${processedText.length} chars`);
      
      // Create the result
      return await this.createPDFResult(filePath, processedText, extraction, analysis);
      
    } catch (error) {
      console.error(`❌ PDF processing failed:`, error.message);
      return await this.createErrorResult(filePath, error);
    }
  }

  async quickPDFAnalysis(filePath, buffer) {
    try {
      const fileName = path.basename(filePath);
      const stats = await fs.stat(filePath);
      
      // Quick check of first 50KB
      const sampleSize = Math.min(50000, buffer.length);
      const sample = buffer.slice(0, sampleSize).toString('latin1');
      
      // Count text indicators
      const parenCount = (sample.match(/\(([^)]+)\)/g) || []).length;
      const isPDF = sample.includes('%PDF');
      const versionMatch = sample.match(/%PDF-(\d\.\d)/);
      const pdfVersion = versionMatch ? versionMatch[1] : 'Unknown';
      
      // Document type from filename
      const docType = this.guessDocumentType(fileName, '');
      
      return {
        fileName,
        fileSize: stats.size,
        formattedSize: this.formatFileSize(stats.size),
        isPDF,
        pdfVersion,
        parenCount,
        docType,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        fileName: path.basename(filePath),
        error: 'Quick analysis failed'
      };
    }
  }

  extractViaParentheses(buffer) {
    try {
      // Convert entire buffer to string
      const content = buffer.toString('latin1');
      let extractedText = '';
      
      // Extract all text from parentheses
      const matches = content.match(/\(([^)]+)\)/g) || [];
      console.log(`🔍 Found ${matches.length} text segments in parentheses`);
      
      matches.forEach(match => {
        const text = match.slice(1, -1);
        // Keep all text, minimal filtering
        if (text.length > 0) {
          extractedText += text + ' ';
        }
      });
      
      const wordCount = (extractedText.match(/\b\w+\b/g) || []).length;
      
      return {
        text: extractedText,
        wordCount,
        charCount: extractedText.length,
        method: 'parentheses'
      };
    } catch (error) {
      console.error('Parentheses extraction failed:', error.message);
      return { text: '', wordCount: 0, charCount: 0, method: 'failed' };
    }
  }

  processPDFText(text) {
    if (!text) return '';
    
    console.log(`🔄 Processing ${text.length} characters...`);
    
    // Multi-stage cleaning process
    let processed = text;
    
    // Stage 1: Remove PDF artifacts
    processed = processed
      .replace(/\d+\s+\d+\s+obj/gi, ' ')
      .replace(/endobj/gi, ' ')
      .replace(/stream/gi, ' ')
      .replace(/endstream/gi, ' ')
      .replace(/BT/gi, ' ')
      .replace(/ET/gi, ' ')
      .replace(/\/[A-Z][a-zA-Z]+\b/g, ' ')
      .replace(/<<.*?>>/gs, ' ')
      .replace(/\[.*?\]/g, ' ')
      .replace(/\(\)/g, ' ')
      .replace(/\{\}/g, ' ');
    
    // Stage 2: Remove control characters
    processed = processed.replace(/[^\x20-\x7E\r\n]/g, ' ');
    
    // Stage 3: Fix spacing and formatting
    processed = processed
      .replace(/\s+/g, ' ')
      .replace(/\s+\./g, '.')
      .replace(/\s+,/g, ',')
      .replace(/\s+;/g, ';')
      .replace(/\s+:/g, ':')
      .replace(/\s+\)/g, ')')
      .replace(/\(\s+/g, '(')
      .replace(/\s+'(?=\w)/g, "'")
      .replace(/(?<=\w)'\s+/g, "'")
      .replace(/\s+"/g, '"')
      .replace(/"\s+/g, '"')
      .replace(/(\w)-\s+(\w)/g, '$1$2') // Fix hyphenated words
      .replace(/\s+-\s+/g, '-');
    
    // Stage 4: Extract proper sentences
    const sentences = processed.match(/[A-Z][^.!?]{10,}[.!?]/g) || [];
    
    if (sentences.length > 0) {
      // Use sentences if we found them
      processed = sentences.join(' ');
    } else {
      // Otherwise use paragraphs
      const paragraphs = processed.split(/\s{2,}/).filter(p => {
        const trimmed = p.trim();
        return trimmed.length > 30 && trimmed.includes(' ');
      });
      
      if (paragraphs.length > 0) {
        processed = paragraphs.join('\n\n');
      }
    }
    
    // Final cleanup
    processed = processed
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
    
    console.log(`✅ Cleaned to ${processed.length} characters`);
    
    return processed;
  }

  guessDocumentType(fileName, sampleText) {
    const combined = (fileName + ' ' + sampleText).toLowerCase();
    
    // Check for specific document types
    if (combined.includes('hackathon') || combined.includes('competition')) {
      return 'Hackathon/Competition';
    }
    
    if (combined.includes('assignment') || combined.includes('homework')) {
      return 'Assignment/Homework';
    }
    
    if (combined.includes('mern') || combined.includes('react') || 
        combined.includes('node') || combined.includes('mongodb')) {
      return 'MERN/Web Development';
    }
    
    if (combined.includes('human resource') || combined.includes('hr ') || 
        combined.includes('employee')) {
      return 'HR/Management';
    }
    
    if (fileName.includes('resume') || fileName.includes('cv')) {
      return 'Resume/CV';
    }
    
    if (fileName.includes('contract') || fileName.includes('agreement')) {
      return 'Legal Document';
    }
    
    if (fileName.includes('invoice') || fileName.includes('receipt')) {
      return 'Financial Document';
    }
    
    if (fileName.includes('report') || fileName.includes('analysis')) {
      return 'Report/Analysis';
    }
    
    return 'General Document';
  }

  analyzeTextContent(text) {
    const analysis = {
      wordCount: (text.match(/\b\w+\b/g) || []).length,
      sentenceCount: (text.match(/[^.!?]+[.!?]+/g) || []).length,
      paragraphCount: (text.split(/\n\s*\n/).filter(p => p.trim().length > 0)).length,
      hasCode: false,
      hasTechnicalTerms: false,
      hasLists: false,
      hasHeadings: false,
      hasUrls: false,
      hasEmails: false,
      hasDates: false
    };
    
    const lowerText = text.toLowerCase();
    
    // Check for code patterns
    analysis.hasCode = /function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|import\s+|export\s+/.test(text);
    
    // Check for technical terms
    const techTerms = ['api', 'endpoint', 'database', 'server', 'client', 'framework', 'library'];
    analysis.hasTechnicalTerms = techTerms.some(term => lowerText.includes(term));
    
    // Check for document structure
    analysis.hasLists = /\b(?:\d+[\.\)]|[•\-*])\s/.test(text);
    analysis.hasHeadings = /^[A-Z][A-Z\s]{2,}$/m.test(text);
    analysis.hasUrls = /https?:\/\/[\w\.-]+\.[\w\.-]+/.test(text);
    analysis.hasEmails = /[\w\.-]+@[\w\.-]+\.\w+/.test(text);
    analysis.hasDates = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(text);
    
    return analysis;
  }

  async createPDFResult(filePath, text, extraction, analysis) {
    const stats = await fs.stat(filePath);
    const textAnalysis = this.analyzeTextContent(text);
    const wordCount = textAnalysis.wordCount;
    
    // Determine confidence
    let confidence = 'low';
    if (wordCount > 10000) confidence = 'very-high';
    else if (wordCount > 5000) confidence = 'high';
    else if (wordCount > 2000) confidence = 'medium-high';
    else if (wordCount > 500) confidence = 'medium';
    else if (wordCount > 100) confidence = 'medium-low';
    
    // Prepare metadata
    const metadata = {
      fileName: analysis.fileName,
      fileSize: analysis.fileSize,
      formattedSize: analysis.formattedSize,
      textLength: text.length,
      wordCount,
      sentenceCount: textAnalysis.sentenceCount,
      paragraphCount: textAnalysis.paragraphCount,
      hasText: wordCount > 0,
      extractionMethod: extraction.method,
      confidence,
      contentType: analysis.docType,
      pdfVersion: analysis.pdfVersion,
      textAnalysis,
      extractionDetails: {
        rawWordCount: extraction.wordCount,
        rawCharCount: extraction.charCount,
        cleaningReduction: Math.round((1 - (text.length / extraction.charCount)) * 100) + '%'
      },
      processedAt: new Date().toISOString()
    };
    
    // For substantial documents, return the text directly
    if (wordCount > 200) {
      return {
        success: true,
        text: text,
        metadata
      };
    } else {
      // For small documents, create a report
      const report = this.createDocumentReport(analysis.fileName, text, metadata);
      return {
        success: wordCount > 10,
        text: report,
        metadata: {
          ...metadata,
          textLength: report.length,
          isReport: true
        }
      };
    }
  }

  createDocumentReport(fileName, text, metadata) {
    const sample = text.length > 800 ? text.substring(0, 800) + '...' : text;
    
    return `📄 PDF DOCUMENT EXTRACTION REPORT
${'='.repeat(70)}

📋 DOCUMENT: ${fileName}
📊 SIZE: ${metadata.formattedSize}
🎯 TYPE: ${metadata.contentType}
📈 STATUS: ${metadata.wordCount > 1000 ? '✅ Excellent' : 
             metadata.wordCount > 500 ? '✅ Good' : 
             metadata.wordCount > 100 ? '⚠️ Fair' : '❌ Limited'}

🔍 EXTRACTION SUMMARY:
• Method: ${metadata.extractionMethod}
• Words: ${metadata.wordCount.toLocaleString()}
• Sentences: ${metadata.sentenceCount}
• Paragraphs: ${metadata.paragraphCount}
• Confidence: ${metadata.confidence.toUpperCase()}

${metadata.wordCount > 0 ? `
📝 CONTENT PREVIEW:
${'='.repeat(70)}
${sample}
${'='.repeat(70)}
` : ''}

💡 CONTENT ANALYSIS:
${metadata.textAnalysis.hasCode ? '• 💻 Contains code/technical content' : ''}
${metadata.textAnalysis.hasTechnicalTerms ? '• 🔧 Contains technical terms' : ''}
${metadata.textAnalysis.hasLists ? '• 📋 Contains lists/bullet points' : ''}
${metadata.textAnalysis.hasHeadings ? '• 🏷️ Contains headings/sections' : ''}
${metadata.textAnalysis.hasUrls ? '• 🔗 Contains URLs' : ''}
${metadata.textAnalysis.hasEmails ? '• 📧 Contains email addresses' : ''}
${metadata.textAnalysis.hasDates ? '• 📅 Contains dates' : ''}

📊 EXTRACTION DETAILS:
• Raw extraction: ${metadata.extractionDetails.rawWordCount.toLocaleString()} words
• After cleaning: ${metadata.wordCount.toLocaleString()} words
• Cleaning reduction: ${metadata.extractionDetails.cleaningReduction}
• PDF Version: ${metadata.pdfVersion}

${metadata.wordCount > 1000 ? 
  '✅ Excellent text extraction. Document is ready for detailed analysis.' :
  metadata.wordCount > 500 ?
  '✅ Good text extraction. Suitable for most analysis tasks.' :
  metadata.wordCount > 100 ?
  '⚠️ Fair text extraction. May be sufficient for basic analysis.' :
  '❌ Limited text extraction. Consider using Adobe Acrobat for better results.'
}

🔧 FOR BETTER RESULTS:
${metadata.wordCount < 1000 ? 
  '1. Use Adobe Acrobat Pro for optimal text extraction\n' +
  '2. Try online PDF converters for complex documents\n' +
  '3. For scanned documents, use OCR software' :
  '✅ Current extraction is sufficient for analysis.'
}`;
  }

  async createErrorResult(filePath, error) {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);
      
      const report = `❌ PDF PROCESSING ERROR
${'='.repeat(50)}

Document: ${fileName}
Size: ${this.formatFileSize(stats.size)}
Error: ${error.message}

RECOMMENDATIONS:
1. Verify the PDF is not corrupted
2. Try opening with Adobe Acrobat Reader
3. Convert to text format if possible
4. Try a different PDF file`;

      return {
        success: false,
        text: report,
        metadata: {
          fileName,
          fileSize: stats.size,
          formattedSize: this.formatFileSize(stats.size),
          textLength: report.length,
          hasText: false,
          extractionMethod: 'error',
          error: error.message
        }
      };
    } catch (statsError) {
      return {
        success: false,
        text: `Failed to process PDF: ${error.message}`,
        metadata: {
          error: true,
          extractionMethod: 'failure'
        }
      };
    }
  }

  async extractTextFromDocx(filePath) {
    console.log(`🔍 Processing DOCX: ${path.basename(filePath)}`);
    
    try {
      const { default: mammoth } = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      
      return {
        success: true,
        text: this.cleanText(result.value || ''),
        metadata: {
          messages: result.messages || [],
          textLength: result.value?.length || 0,
          hasText: !!(result.value && result.value.length > 0),
          extractionMethod: 'mammoth'
        }
      };
    } catch (error) {
      console.error('DOCX extraction failed:', error.message);
      
      const stats = await fs.stat(filePath);
      const fallbackText = `DOCX DOCUMENT: ${path.basename(filePath)}
===============================
File Size: ${this.formatFileSize(stats.size)}

STATUS: DOCX parsing requires mammoth library.

TO ENABLE TEXT EXTRACTION:
Run: npm install mammoth
Then restart the application.

The document has been uploaded successfully.`;

      return {
        success: false,
        text: fallbackText,
        metadata: {
          error: true,
          fileName: path.basename(filePath),
          extractionMethod: 'none',
          warning: 'Install mammoth for DOCX text extraction'
        }
      };
    }
  }

  // Structure analysis for refineService.js
  analyzeStructure(text) {
    try {
      const lines = text.split('\n');
      const structure = {
        hasHeadings: false,
        hasLists: false,
        hasNumbers: false,
        hasReferences: false,
        paragraphCount: 0,
        estimatedSections: 0,
        lineCount: lines.length,
        averageLineLength: 0,
        wordCount: 0
      };
      
      let totalChars = 0;
      const words = text.match(/\b\w+\b/g) || [];
      structure.wordCount = words.length;
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        totalChars += trimmedLine.length;
        
        if (trimmedLine.length === 0) return;
        
        // Check for headings
        if ((trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length < 100) ||
            trimmedLine.match(/^[#]{1,6}\s/) ||
            trimmedLine.match(/^[A-Z][^.!?]*:$/)) {
          structure.hasHeadings = true;
          structure.estimatedSections++;
        }
        
        // Check for lists
        if (trimmedLine.match(/^[•\-*]\s/) || 
            trimmedLine.match(/^\d+[\.\)]\s/) ||
            trimmedLine.match(/^\[(x| |)\]\s/i)) {
          structure.hasLists = true;
        }
        
        // Check for numbers
        if (trimmedLine.match(/\b\d+\b/)) {
          structure.hasNumbers = true;
        }
        
        // Check for references
        if (trimmedLine.match(/\[.*?\]/) || 
            trimmedLine.match(/\(.*?\d{4}.*?\)/) ||
            trimmedLine.match(/https?:\/\//)) {
          structure.hasReferences = true;
        }
        
        // Count paragraphs (lines that look like prose)
        if (trimmedLine.length > 40 && 
            !trimmedLine.match(/^[#•\-*\[\(0-9]/) &&
            !trimmedLine.match(/^[A-Z][A-Z\s]+$/)) {
          structure.paragraphCount++;
        }
      });
      
      structure.averageLineLength = lines.length > 0 ? Math.round(totalChars / lines.length) : 0;
      structure.avgWordsPerLine = lines.length > 0 ? Math.round(structure.wordCount / lines.length) : 0;
      
      return structure;
    } catch (error) {
      console.error('Structure analysis error:', error);
      return { error: 'Structure analysis failed' };
    }
  }
  
  // Summarization method for refineService.js
  summarize(text, maxSentences = 3) {
    try {
      if (!text || text.length < 50) {
        return 'Document content is too brief for summarization.';
      }
      
      // Simple extractive summarization
      const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
      
      if (sentences.length <= maxSentences) {
        const summary = sentences.join('. ') + (text.trim().endsWith('.') ? '' : '.');
        return summary;
      }
      
      // Take key sentences (first, middle, last)
      const keyIndices = [
        0,
        Math.floor(sentences.length / 2),
        sentences.length - 1
      ];
      
      const summarySentences = keyIndices.map(i => sentences[i]);
      const summary = summarySentences.join('. ') + '.';
      
      return summary;
    } catch (error) {
      console.error('Summarization error:', error);
      return 'Summary generation failed. Please refer to the full document content.';
    }
  }
  
  // Topic extraction for refineService.js
  extractTopics(text, maxTopics = 5) {
    try {
      if (!text || text.length < 100) {
        return ['General Content', 'Document Analysis'];
      }
      
      const textLower = text.toLowerCase();
      const topics = new Set();
      
      // Common topic patterns
      const topicPatterns = [
        { pattern: /\b(hackathon|competition|contest|challenge)\b/gi, topic: 'Hackathon/Competition' },
        { pattern: /\b(mern|react|node|express|mongodb|javascript)\b/gi, topic: 'MERN/Web Development' },
        { pattern: /\b(api|interface|protocol|endpoint)\b/gi, topic: 'API/Technical' },
        { pattern: /\b(ai|artificial intelligence|machine learning|ml|neural)\b/gi, topic: 'AI/Machine Learning' },
        { pattern: /\b(design|ui|ux|interface|user experience)\b/gi, topic: 'Design/UI/UX' },
        { pattern: /\b(rules|guidelines|requirements|specifications)\b/gi, topic: 'Rules/Requirements' },
        { pattern: /\b(assignment|homework|project|task)\b/gi, topic: 'Assignment/Project' },
        { pattern: /\b(register|application|submit|participate)\b/gi, topic: 'Registration/Submission' },
        { pattern: /\b(student|participant|team|member)\b/gi, topic: 'Participants/Team' },
        { pattern: /\b(code|programming|software|development)\b/gi, topic: 'Coding/Development' },
        { pattern: /\b(data|analysis|statistics|metrics)\b/gi, topic: 'Data/Analysis' },
        { pattern: /\b(pdf|document|file|upload)\b/gi, topic: 'Document/File' },
        { pattern: /\b(hr|human resources|management|system)\b/gi, topic: 'HR/Management' }
      ];
      
      // Check for each pattern
      for (const { pattern, topic } of topicPatterns) {
        const matches = textLower.match(pattern);
        if (matches && matches.length >= 2) {
          topics.add(topic);
        }
      }
      
      // Add general topics based on content characteristics
      if (text.length > 1000) {
        topics.add('Detailed Document');
      }
      
      if (textLower.includes('http://') || textLower.includes('https://') || textLower.includes('www.')) {
        topics.add('Web/References');
      }
      
      if (text.match(/\d{4}-\d{2}-\d{2}/) || text.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/)) {
        topics.add('Date/Time Related');
      }
      
      // Ensure we have some topics
      if (topics.size === 0) {
        topics.add('General Document');
        topics.add('Information');
        topics.add('Content Analysis');
      }
      
      return Array.from(topics).slice(0, maxTopics);
    } catch (error) {
      console.error('Topic extraction error:', error);
      return ['Document Content', 'Information'];
    }
  }

  // Helper methods
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getFileType(extension) {
    const types = {
      '.pdf': 'pdf',
      '.docx': 'docx',
      '.doc': 'docx',
      '.txt': 'text',
      '.text': 'text',
      '.md': 'text',
      '.markdown': 'text'
    };
    return types[extension] || 'text';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  async getFileMetadata(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        formattedSize: this.formatFileSize(stats.size)
      };
    } catch (error) {
      return { size: 0 };
    }
  }
}

// Export singleton instance
export default new documentProcessor();