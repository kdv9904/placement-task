// services/refineService.js - Main refinement service
import documentProcessor from './documentProcessor.js';
import imageProcessor from './imageProcessor.js';
import textProcessor from './textProcessor.js';
import PromptTemplate from '../tamplates/promptTemplate.js';
import path from 'path';

class refineService {
  async processInputs({ text, files = [], style = 'general', maxLength = 500, temperature = 0.7 }) {
    console.log('Processing inputs in refineService:', { 
      hasText: !!text, 
      filesCount: files.length, 
      style, 
      maxLength, 
      temperature 
    });
    
    const metadata = {
      style,
      maxLength,
      temperature,
      hasText: !!text,
      filesCount: files.length,
      fileTypes: files.map(f => f.mimetype),
      fileNames: files.map(f => f.originalname)
    };
    
    const assumptions = [];
    const extractedContent = {
      text: [],
      images: [],
      documents: []
    };
    
    // STEP 1: Process text if provided
    let textContent = '';
    if (text) {
      textContent = await this.processTextInput(text, style);
      extractedContent.text.push({ content: textContent, type: 'direct_input' });
      assumptions.push('Text prompt processed and refined');
    }
    
    // STEP 2: Process files if provided
    let fileContent = '';
    let extractedData = { images: [], documents: [], text: [] };
    
    if (files.length > 0) {
      const processedFiles = await this.processFileInputs(files, style);
      fileContent = processedFiles.content;
      extractedData = processedFiles.extractedData;
      
      // Organize extracted data by type
      if (extractedData.images && extractedData.images.length > 0) {
        extractedContent.images.push(...extractedData.images);
      }
      if (extractedData.documents && extractedData.documents.length > 0) {
        extractedContent.documents.push(...extractedData.documents);
      }
      
      assumptions.push(`${files.length} file(s) processed for content extraction`);
    }
    
    // STEP 3: Generate refined prompt using template
    const refinedPrompt = await this.generateRefinedPrompt({
      textContent,
      fileContent,
      extractedContent,
      style,
      maxLength,
      temperature,
      metadata,
      assumptions
    });
    
    // STEP 4: Validate and enhance the refined prompt
    const validation = this.validateRefinedPrompt(refinedPrompt, metadata);
    if (!validation.valid) {
      console.warn('Refined prompt validation warnings:', validation.warnings);
      assumptions.push(...validation.warnings.map(w => `Validation: ${w}`));
    }
    
    // STEP 5: Add metadata and structure information
    const finalPrompt = this.addPromptMetadata(refinedPrompt, {
      style,
      maxLength,
      temperature,
      inputSummary: this.generateInputSummary(text, files, assumptions)
    });
    
    return {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      refinedPrompt: finalPrompt,
      metadata: {
        ...metadata,
        contentTypes: Object.keys(extractedContent).filter(k => extractedContent[k].length > 0),
        validation: validation,
      },
      extractedContent: extractedContent,
      style,
      assumptions: assumptions,
      timestamp: new Date().toISOString()
    };
  }
  
  async processTextInput(text, style) {
    try {
      // Use textProcessor if available, otherwise use basic refinement
      if (textProcessor && typeof textProcessor.process === 'function') {
        return await textProcessor.process(text, { style });
      } else {
        return this.basicTextRefinement(text, style);
      }
    } catch (error) {
      console.error('Error processing text:', error);
      return `[TEXT INPUT]: ${text}\n[STYLE: ${style.toUpperCase()}]`;
    }
  }
  
  basicTextRefinement(text, style) {
    const refinements = {
      creative: `Creative Concept: ${text}\n\nFocus Areas:\n• Narrative development\n• Character/theme exploration\n• Emotional resonance\n• Vivid descriptions\n• Imaginative scenarios`,
      technical: `Technical Request: ${text}\n\nFocus Areas:\n• Specifications and parameters\n• Systematic analysis\n• Data and evidence\n• Practical applications\n• Clear methodology`,
      analytical: `Analytical Inquiry: ${text}\n\nFocus Areas:\n• Critical examination\n• Evidence evaluation\n• Multiple perspectives\n• Objective assessment\n• Logical conclusions`,
      concise: `Direct Request: ${text}\n\nFocus Areas:\n• Essential information only\n• Clear, direct points\n• No unnecessary elaboration\n• Bulleted format preferred`,
      detailed: `Comprehensive Request: ${text}\n\nFocus Areas:\n• Thorough coverage\n• All relevant aspects\n• Context and background\n• Detailed examples\n• Complete analysis`,
      general: `General Inquiry: ${text}\n\nFocus Areas:\n• Clear explanation\n• Balanced perspective\n• Practical examples\n• Useful insights\n• Accessible format`
    };
    
    return refinements[style] || refinements.general;
  }
  
  async processFileInputs(files, style) {
    const extractedData = {
      images: [],
      documents: [],
      text: []
    };
    
    let combinedContent = `## UPLOADED FILES ANALYSIS\n\n`;
    
    for (const [index, file] of files.entries()) {
      const fileNum = index + 1;
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      
      combinedContent += `### File ${fileNum}: ${file.originalname}\n`;
      combinedContent += `- **Type:** ${file.mimetype}\n`;
      combinedContent += `- **Size:** ${fileSizeMB} MB\n`;
      combinedContent += `- **Extension:** ${fileExt || 'N/A'}\n`;
      
      try {
        if (file.mimetype.startsWith('image/')) {
          // Image processing
          if (imageProcessor && typeof imageProcessor.analyze === 'function') {
            const imageAnalysis = await imageProcessor.analyze(file.path);
            combinedContent += `- **Content:** Image analysis available\n`;
            combinedContent += `- **Description:** ${imageAnalysis.description || 'Visual content'}\n`;
            combinedContent += `- **Format:** ${imageAnalysis.format || 'Unknown'}\n`;
            combinedContent += `- **Dimensions:** ${imageAnalysis.width || '?'}x${imageAnalysis.height || '?'}\n`;
            
            extractedData.images.push({
              filename: file.originalname,
              analysis: imageAnalysis,
              path: file.path
            });
          } else {
            combinedContent += `- **Content:** Image file\n`;
            combinedContent += `- **Note:** Detailed image analysis not available\n`;
            
            extractedData.images.push({
              filename: file.originalname,
              analysis: { description: 'Image file', keyElements: ['Visual content'] },
              path: file.path
            });
          }
          
        } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('text')) {
          // Document processing
          try {
            const extraction = await documentProcessor.extractText(file.path);
            
            combinedContent += `- **Content Type:** Document/text\n`;
            
            if (extraction && typeof extraction === 'object') {
              // Check if extraction was successful
              if (extraction.success === true) {
                const docText = extraction.text || '';
                
                // Try to get summary, topics, and structure - with error handling
                let summary = 'No summary available';
                let topics = ['General Content'];
                let structure = { hasHeadings: false, hasLists: false };
                
                try {
                  if (typeof documentProcessor.summarize === 'function') {
                    summary = await documentProcessor.summarize(docText) || summary;
                  }
                } catch (e) {
                  console.log('Summarize error:', e.message);
                }
                
                try {
                  if (typeof documentProcessor.extractTopics === 'function') {
                    topics = await documentProcessor.extractTopics(docText) || topics;
                  }
                } catch (e) {
                  console.log('Extract topics error:', e.message);
                }
                
                try {
                  if (typeof documentProcessor.analyzeStructure === 'function') {
                    structure = await documentProcessor.analyzeStructure(docText) || structure;
                  }
                } catch (e) {
                  console.log('Analyze structure error:', e.message);
                }
                
                combinedContent += `- **Extraction:** Successful\n`;
                combinedContent += `- **Summary:** ${summary.substring(0, 150)}${summary.length > 150 ? '...' : ''}\n`;
                combinedContent += `- **Word Count:** ${Math.floor(docText.length / 5)}\n`;
                combinedContent += `- **Key Topics:** ${topics.slice(0, 5).join(', ')}\n`;
                
                // Add structure analysis if available
                if (structure && !structure.error) {
                  if (structure.hasHeadings) combinedContent += `- **Structure:** Contains headings\n`;
                  if (structure.hasLists) combinedContent += `- **Format:** Includes lists\n`;
                  if (structure.hasReferences) combinedContent += `- **References:** Contains citations\n`;
                }
                
                extractedData.documents.push({
                  filename: file.originalname,
                  content: docText.substring(0, 500) + (docText.length > 500 ? '...' : ''),
                  summary: summary,
                  wordCount: Math.floor(docText.length / 5),
                  keyTopics: topics,
                  structure: structure,
                  metadata: extraction.metadata || {},
                  extractionSuccess: true
                });
                
              } else if (extraction.success === false) {
                // Extraction failed
                combinedContent += `- **Extraction:** Failed\n`;
                combinedContent += `- **Error:** ${extraction.error || 'Unknown error'}\n`;
                combinedContent += `- **Note:** File included as context reference\n`;
                
                extractedData.documents.push({
                  filename: file.originalname,
                  error: extraction.error || 'Extraction failed',
                  content: extraction.text || 'No content extracted',
                  extractionSuccess: false
                });
                
              } else {
                // Legacy format or unknown structure
                const docText = extraction.text || extraction || '';
                combinedContent += `- **Content:** ${docText.substring(0, 150)}${docText.length > 150 ? '...' : ''}\n`;
                
                extractedData.documents.push({
                  filename: file.originalname,
                  content: docText,
                  summary: 'Content extracted',
                  wordCount: Math.floor(docText.length / 5),
                  keyTopics: ['Document', 'Content'],
                  extractionSuccess: true
                });
              }
            } else if (typeof extraction === 'string') {
              // Direct string response
              combinedContent += `- **Content:** ${extraction.substring(0, 150)}${extraction.length > 150 ? '...' : ''}\n`;
              
              extractedData.documents.push({
                filename: file.originalname,
                content: extraction,
                summary: 'Document content extracted',
                wordCount: Math.floor(extraction.length / 5),
                keyTopics: ['General', 'Content'],
                extractionSuccess: true
              });
            } else {
              // Unknown response format
              combinedContent += `- **Status:** Unknown response format\n`;
              combinedContent += `- **Fallback:** File included as context reference\n`;
              
              extractedData.documents.push({
                filename: file.originalname,
                error: 'Unknown extraction format',
                extractionSuccess: false
              });
            }
          } catch (docError) {
            console.error(`Document processing error for ${file.originalname}:`, docError);
            combinedContent += `- **Status:** Document processing error\n`;
            combinedContent += `- **Error:** ${docError.message.substring(0, 50)}\n`;
            combinedContent += `- **Fallback:** File included as context reference\n`;
            
            extractedData.documents.push({
              filename: file.originalname,
              error: docError.message,
              extractionSuccess: false
            });
          }
          
        } else {
          // Other file types
          combinedContent += `- **Content:** Unsupported file type for detailed extraction\n`;
          combinedContent += `- **Note:** File included but content extraction limited\n`;
          
          extractedData.text.push({
            filename: file.originalname,
            type: 'unsupported',
            note: 'Limited extraction available',
            mimeType: file.mimetype
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        combinedContent += `- **Status:** Processing error\n`;
        combinedContent += `- **Error:** ${error.message.substring(0, 50)}\n`;
        combinedContent += `- **Fallback:** File included as context reference\n`;
      }
      
      combinedContent += `\n`;
      
      // Add style-specific guidance
      combinedContent += this.getFileStyleGuidance(file.mimetype, style);
      combinedContent += `\n`;
    }
    
    return {
      content: combinedContent,
      extractedData: extractedData
    };
  }
  
  getFileStyleGuidance(mimeType, style) {
    const guidance = {
      creative: {
        image: 'Consider visual storytelling, emotional impact, and creative interpretation.',
        document: 'Extract narrative elements, themes, characters, or creative concepts.',
        text: 'Look for storytelling elements, descriptive language, and creative potential.'
      },
      technical: {
        image: 'Analyze diagrams, schematics, data visualizations, or technical illustrations.',
        document: 'Extract specifications, procedures, data, requirements, and technical details.',
        text: 'Identify technical terms, parameters, measurements, and systematic information.'
      },
      analytical: {
        image: 'Examine for data patterns, visual arguments, evidence presentation, or analytical content.',
        document: 'Analyze arguments, evidence, logic, structure, and conclusions.',
        text: 'Evaluate reasoning, evidence, assumptions, and analytical frameworks.'
      }
    };
    
    let fileType = 'other';
    if (mimeType.startsWith('image/')) fileType = 'image';
    else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) fileType = 'document';
    
    const styleGuidance = guidance[style] || guidance.analytical;
    return styleGuidance[fileType] || 'Consider relevance to the overall request.';
  }
  
  async generateRefinedPrompt(params) {
    const {
      textContent,
      fileContent,
      extractedContent,
      style,
      maxLength,
      temperature,
      metadata,
      assumptions
    } = params;
    
    // Use template system if available
    if (PromptTemplate && typeof PromptTemplate.generate === 'function') {
      return await PromptTemplate.generate({
        textContent,
        fileContent,
        extractedContent,
        style,
        maxLength,
        temperature,
        metadata
      });
    } else {
      // Fallback to basic template generation
      return this.generateBasicTemplate(params);
    }
  }
  
  generateBasicTemplate(params) {
    const { textContent, fileContent, style, maxLength, temperature, extractedContent } = params;
    
    let prompt = `# PROMPT REFINEMENT SYSTEM OUTPUT\n`;
    prompt += `## Input Analysis and Structured Request\n\n`;
    
    if (textContent) {
      prompt += `### Text Input Processing\n`;
      prompt += `${textContent}\n\n`;
    }
    
    if (fileContent) {
      prompt += `${fileContent}\n\n`;
    }
    
    prompt += `## Refined Prompt Structure\n\n`;
    prompt += `**Primary Objective:** ${this.getObjectiveDescription(style)}\n\n`;
    
    prompt += `### Response Requirements\n`;
    prompt += `1. **Length:** Approximately ${maxLength} words\n`;
    prompt += `2. **Style:** ${style} (${this.getStyleDescription(style)})\n`;
    prompt += `3. **Creativity Level:** ${temperature}/1.0 (${this.getCreativityLevel(temperature)})\n`;
    prompt += `4. **Structure:** ${this.getStructureRequirements(style)}\n`;
    
    prompt += `\n### Content Expectations\n`;
    prompt += `${this.getContentExpectations(style, extractedContent)}\n`;
    
    prompt += `\n### Formatting Guidelines\n`;
    prompt += `${this.getFormattingGuidelines(style)}\n`;
    
    prompt += `\n### Quality Standards\n`;
    prompt += `${this.getQualityStandards(style, temperature)}\n`;
    
    return prompt;
  }
  
  getObjectiveDescription(style) {
    const objectives = {
      creative: 'Create engaging, imaginative content with strong narrative and emotional elements',
      technical: 'Provide precise, detailed technical information with clear specifications',
      analytical: 'Deliver critical analysis with balanced perspective and evidence-based conclusions',
      concise: 'Present essential information clearly and efficiently',
      detailed: 'Offer comprehensive, thorough coverage of all relevant aspects',
      general: 'Provide balanced, informative response with practical examples'
    };
    return objectives[style] || objectives.general;
  }
  
  getStyleDescription(style) {
    const descriptions = {
      creative: 'Imaginative, expressive, narrative-focused',
      technical: 'Precise, systematic, data-driven',
      analytical: 'Critical, evaluative, evidence-based',
      concise: 'Direct, brief, to-the-point',
      detailed: 'Thorough, comprehensive, exhaustive',
      general: 'Balanced, informative, accessible'
    };
    return descriptions[style] || descriptions.general;
  }
  
  getCreativityLevel(temperature) {
    if (temperature >= 0.8) return 'Highly creative/innovative';
    if (temperature >= 0.6) return 'Creative with some constraints';
    if (temperature >= 0.4) return 'Balanced approach';
    if (temperature >= 0.2) return 'Focused and direct';
    return 'Precise and factual';
  }
  
  getStructureRequirements(style) {
    const structures = {
      creative: 'Narrative flow with introduction, development, and conclusion',
      technical: 'Logical sequence: overview → details → applications → summary',
      analytical: 'Thesis → evidence → analysis → conclusion format',
      concise: 'Bulleted lists or very short paragraphs',
      detailed: 'Hierarchical structure with multiple levels of detail',
      general: 'Clear sections with headings and logical progression'
    };
    return structures[style] || structures.general;
  }
  
  getContentExpectations(style, extractedContent) {
    let expectations = '';
    
    if (extractedContent.images && extractedContent.images.length > 0) {
      expectations += `• Incorporate visual analysis from ${extractedContent.images.length} image(s)\n`;
    }
    
    if (extractedContent.documents && extractedContent.documents.length > 0) {
      expectations += `• Reference and analyze content from ${extractedContent.documents.length} document(s)\n`;
    }
    
    const styleExpectations = {
      creative: `• Develop characters/themes/narrative\n• Use vivid sensory descriptions\n• Create emotional resonance\n• Include imaginative elements\n• Ensure engaging storytelling`,
      technical: `• Include specifications and data\n• Provide practical applications\n• Use precise terminology\n• Follow systematic approach\n• Reference relevant frameworks`,
      analytical: `• Present balanced arguments\n• Cite specific evidence\n• Consider multiple perspectives\n• Identify assumptions/biases\n• Draw logical conclusions`,
      concise: `• Prioritize key information\n• Eliminate redundancy\n• Use clear, direct language\n• Focus on essentials\n• Avoid elaboration`,
      detailed: `• Cover all relevant aspects\n• Provide thorough explanations\n• Include multiple examples\n• Add context and background\n• Address nuances`,
      general: `• Clear explanations\n• Practical examples\n• Balanced perspective\n• Useful insights\n• Accessible language`
    };
    
    expectations += styleExpectations[style] || styleExpectations.general;
    return expectations;
  }
  
  getFormattingGuidelines(style) {
    const guidelines = {
      creative: `• Use paragraphs for narrative flow\n• Include descriptive sections\n• Vary sentence structure for rhythm\n• Use emphasis for emotional impact`,
      technical: `• Use headings and subheadings\n• Include lists for specifications\n• Use code blocks if applicable\n• Add tables for comparisons`,
      analytical: `• Clear section headers\n• Evidence presented in lists\n• Conclusions highlighted\n• Citations formatted consistently`,
      concise: `• Bulleted or numbered lists\n• Short, direct sentences\n• Clear, uncluttered layout\n• Prioritized information`,
      detailed: `• Hierarchical structure\n• Multiple subsections\n• Detailed examples indented\n• Cross-references if needed`,
      general: `• Clear section breaks\n• Mix of paragraphs and lists\n• Consistent formatting\n• Readable layout`
    };
    
    return guidelines[style] || guidelines.general;
  }
  
  getQualityStandards(style, temperature) {
    let standards = `• Accuracy and relevance\n• Clarity and coherence\n• Completeness of response\n`;
    
    if (temperature > 0.7) {
      standards += `• High creativity and innovation\n• Originality of approach\n• Engaging presentation\n`;
    } else if (temperature > 0.4) {
      standards += `• Appropriate creativity level\n• Balanced approach\n• Effective communication\n`;
    } else {
      standards += `• Precision and factuality\n• Direct communication\n• Minimal ambiguity\n`;
    }
    
    if (style === 'analytical' || style === 'technical') {
      standards += `• Evidence-based claims\n• Logical reasoning\n• Systematic approach\n`;
    }
    
    return standards;
  }
  
  validateRefinedPrompt(prompt, metadata) {
    const warnings = [];
    
    // Check for minimum length
    if (prompt.length < 100) {
      warnings.push('Prompt may be too brief for effective refinement');
    }
    
    // Check for structure
    if (!prompt.includes('#') && !prompt.includes('##')) {
      warnings.push('Prompt lacks clear section headers');
    }
    
    // Check for instructions
    if (!prompt.toLowerCase().includes('response') && !prompt.toLowerCase().includes('include')) {
      warnings.push('Prompt may lack clear response requirements');
    }
    
    // Check style adherence
    if (metadata.style === 'technical' && !prompt.toLowerCase().includes('specif')) {
      warnings.push('Technical prompt may lack specificity requirements');
    }
    
    return {
      valid: warnings.length === 0,
      warnings: warnings,
      promptLength: prompt.length,
      sectionCount: (prompt.match(/#{1,3}\s/g) || []).length
    };
  }
  
  addPromptMetadata(prompt, metadata) {
    let metadataSection = `\n\n---\n**PROMPT METADATA**\n`;
    metadataSection += `• Generated: ${new Date().toISOString()}\n`;
    metadataSection += `• Style: ${metadata.style}\n`;
    metadataSection += `• Target Length: ${metadata.maxLength} words\n`;
    metadataSection += `• Creativity: ${metadata.temperature}/1.0\n`;
    metadataSection += `• Input Summary: ${metadata.inputSummary}\n`;
    metadataSection += `• System: Multi-Modal Prompt Refinement System v1.0\n`;
    
    return prompt + metadataSection;
  }
  
  generateInputSummary(text, files, assumptions) {
    let summary = '';
    
    if (text) {
      summary += `Text input (${text.length} chars)`;
    }
    
    if (files.length > 0) {
      if (summary) summary += ' + ';
      summary += `${files.length} file(s): ${files.map(f => {
        const ext = path.extname(f.originalname) || 'unknown';
        return `${ext.toUpperCase().replace('.', '')}`;
      }).join(', ')}`;
    }
    
    if (assumptions.length > 0) {
      summary += ` [${assumptions.length} processing assumptions]`;
    }
    
    return summary || 'No input specified';
  }
}

// Export singleton instance
export default new refineService();