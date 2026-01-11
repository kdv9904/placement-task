class PromptTemplate {
  constructor() {
    this.assumptions = [];
  }

  generate(extractedData) {
    const text = extractedData.combinedText;
    
    // Extract key information (simplified - enhance with NLP/LLM)
    const coreIntent = this.extractCoreIntent(text);
    const requirements = this.extractRequirements(text);
    const constraints = this.extractConstraints(text);
    
    // Build structured prompt
    const structuredPrompt = {
      core_intent: coreIntent,
      functional_requirements: requirements,
      technical_constraints: constraints,
      expected_outputs: this.deriveExpectedOutputs(coreIntent),
      priority_level: this.assessPriority(text),
      assumptions_made: this.assumptions,
      missing_information: this.identifyMissingInfo(text),
      source_summary: this.createSourceSummary(extractedData),
      timestamp: new Date().toISOString(),
      confidence_score: this.calculateConfidence(text)
    };

    return structuredPrompt;
  }

  extractCoreIntent(text) {
    // Simplified extraction - enhance with NLP
    const sentences = text.split(/[.!?]+/);
    this.assumptions.push('First sentence likely contains main intent');
    return sentences[0]?.trim() || 'Intent not clearly specified';
  }

  extractRequirements(text) {
    const requirements = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('should') || 
          line.toLowerCase().includes('must') ||
          line.toLowerCase().includes('need to')) {
        requirements.push(line.trim());
      }
    });
    
    if (requirements.length === 0) {
      this.assumptions.push('No explicit requirements found, inferring from context');
      requirements.push('Requirements to be derived from core intent');
    }
    
    return requirements;
  }

  extractConstraints(text) {
    const constraints = [];
    const constraintKeywords = ['cannot', 'must not', 'limited to', 'budget', 'time', 'deadline'];
    
    constraintKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        constraints.push(`Constraint identified: ${keyword}`);
      }
    });
    
    return constraints;
  }

  deriveExpectedOutputs(coreIntent) {
    // Map intent to likely outputs
    const outputMap = {
      'app': ['UI mockups', 'API specifications', 'database schema'],
      'website': ['Wireframes', 'Content plan', 'SEO strategy'],
      'analysis': ['Report', 'Dashboard', 'Recommendations'],
      'default': ['Documentation', 'Implementation plan', 'Test cases']
    };

    for (const [key, outputs] of Object.entries(outputMap)) {
      if (coreIntent.toLowerCase().includes(key)) {
        return outputs;
      }
    }
    
    return outputMap.default;
  }

  assessPriority(text) {
    if (text.toLowerCase().includes('urgent') || 
        text.toLowerCase().includes('asap') ||
        text.toLowerCase().includes('immediate')) {
      return 'high';
    }
    if (text.toLowerCase().includes('important')) {
      return 'medium';
    }
    return 'low';
  }

  identifyMissingInfo(text) {
    const missing = [];
    if (!text.toLowerCase().includes('budget')) missing.push('Budget not specified');
    if (!text.toLowerCase().includes('timeline')) missing.push('Timeline not specified');
    if (!text.toLowerCase().includes('target')) missing.push('Target audience not specified');
    return missing;
  }

  createSourceSummary(extractedData) {
    const sources = [];
    if (extractedData.textContent) sources.push('Direct text input');
    extractedData.fileContents.forEach(file => {
      if (!file.error) {
        sources.push(`${file.type.toUpperCase()}: ${file.filename}`);
      }
    });
    return sources;
  }

  calculateConfidence(text) {
    let score = 0.5; // Base score
    
    // Increase confidence based on clarity indicators
    if (text.length > 200) score += 0.1;
    if (this.extractRequirements(text).length > 0) score += 0.2;
    if (this.extractConstraints(text).length > 0) score += 0.1;
    
    return Math.min(score, 1.0).toFixed(2);
  }

  getAssumptions() {
    return this.assumptions;
  }
}

export default PromptTemplate;