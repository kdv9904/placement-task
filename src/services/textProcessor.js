import natural from 'natural';
import { removeStopwords } from 'stopword';

// If natural library gives issues, we can implement basic NLP ourselves
export default class textProcessor {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.sentences = natural.SentenceTokenizer;
  }

  /**
   * Extract key phrases from text
   */
  extractKeyPhrases(text, maxPhrases = 10) {
    try {
      // Tokenize and clean
      const tokens = this.tokenizer.tokenize(text.toLowerCase());
      const filteredTokens = removeStopwords(tokens);
      
      // Count frequency
      const frequency = {};
      filteredTokens.forEach(token => {
        const stemmed = this.stemmer.stem(token);
        frequency[stemmed] = (frequency[stemmed] || 0) + 1;
      });
      
      // Get top phrases
      const sortedPhrases = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxPhrases)
        .map(([word, count]) => ({ word, count }));
      
      return sortedPhrases;
    } catch (error) {
      console.error('Key phrase extraction failed:', error);
      return [];
    }
  }

  /**
   * Categorize intent based on keywords
   */
  categorizeIntent(text) {
    const textLower = text.toLowerCase();
    
    const categories = {
      'development': ['build', 'create', 'develop', 'code', 'program', 'app', 'website', 'software'],
      'design': ['design', 'ui', 'ux', 'interface', 'mockup', 'wireframe', 'prototype'],
      'analysis': ['analyze', 'report', 'research', 'study', 'data', 'insights'],
      'content': ['write', 'content', 'article', 'blog', 'copy', 'documentation'],
      'business': ['strategy', 'plan', 'proposal', 'business', 'marketing', 'sales']
    };
    
    const scores = {};
    
    Object.entries(categories).forEach(([category, keywords]) => {
      scores[category] = keywords.filter(keyword => 
        textLower.includes(keyword)
      ).length;
    });
    
    // Get top category
    const topCategory = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .find(([_, score]) => score > 0);
    
    return topCategory ? topCategory[0] : 'general';
  }

  /**
   * Extract entities (simple version)
   */
  extractEntities(text) {
    const entities = {
      technologies: [],
      platforms: [],
      timelines: [],
      budgets: []
    };
    
    // Technology detection
    const techKeywords = [
      'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript',
      'typescript', 'mongodb', 'mysql', 'postgresql', 'aws', 'azure',
      'docker', 'kubernetes', 'api', 'rest', 'graphql'
    ];
    
    techKeywords.forEach(tech => {
      if (text.toLowerCase().includes(tech)) {
        entities.technologies.push(tech);
      }
    });
    
    // Platform detection
    const platformKeywords = [
      'web', 'mobile', 'desktop', 'ios', 'android', 'windows', 'mac',
      'linux', 'cloud', 'server', 'responsive'
    ];
    
    platformKeywords.forEach(platform => {
      if (text.toLowerCase().includes(platform)) {
        entities.platforms.push(platform);
      }
    });
    
    // Budget extraction (simple regex)
    const budgetMatches = text.match(/\$(\d+(?:,\d+)*(?:\.\d+)?)|\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(dollars|usd|dollar)\b/gi);
    if (budgetMatches) {
      entities.budgets = budgetMatches;
    }
    
    // Timeline extraction
    const timelineMatches = text.match(/\b(\d+)\s*(days|weeks|months|years)\b|\bdeadline\b|\btimeline\b|\bby\s+\w+\s+\d+/gi);
    if (timelineMatches) {
      entities.timelines = timelineMatches;
    }
    
    return entities;
  }

  /**
   * Calculate text complexity score
   */
  calculateComplexity(text) {
    if (!text) return 0;
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Simple complexity calculation
    let complexity = 0.3; // Base
    
    if (avgWordsPerSentence > 15) complexity += 0.2;
    if (avgWordsPerSentence > 25) complexity += 0.2;
    
    if (avgWordLength > 5) complexity += 0.2;
    if (avgWordLength > 7) complexity += 0.1;
    
    // Check for technical terms
    const technicalTerms = ['api', 'database', 'server', 'client', 'framework', 'library', 'algorithm'];
    const hasTechnicalTerms = technicalTerms.some(term => 
      text.toLowerCase().includes(term)
    );
    
    if (hasTechnicalTerms) complexity += 0.1;
    
    return Math.min(complexity, 1).toFixed(2);
  }

  /**
   * Summarize text (basic extraction-based summary)
   */
  summarizeText(text, maxSentences = 3) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= maxSentences) {
      return sentences.join('. ') + '.';
    }
    
    // Simple scoring: longer sentences and those with keywords are more important
    const scoredSentences = sentences.map((sentence, index) => {
      const words = sentence.split(/\s+/).length;
      const hasKeywords = this.hasImportantKeywords(sentence);
      const score = (words * 0.5) + (hasKeywords ? 10 : 0) + (index === 0 ? 5 : 0); // First sentence gets bonus
      return { sentence, score, index };
    });
    
    // Get top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index) // Restore original order
      .map(item => item.sentence.trim());
    
    return topSentences.join('. ') + '.';
  }

  /**
   * Check if sentence has important keywords
   */
  hasImportantKeywords(sentence) {
    const keywords = [
      'should', 'must', 'need', 'require', 'important', 'critical',
      'essential', 'necessary', 'goal', 'objective', 'target', 'aim'
    ];
    
    return keywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    );
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\n\s*\n/g, '\n\n') // Multiple newlines to double
      .trim();
  }

  /**
   * Extract requirements using pattern matching
   */
  extractRequirementsWithPatterns(text) {
    const patterns = [
      /(?:should|must|need to|requires?|shall)\s+(.+?)(?=[.!;]|$)/gi,
      /(?:feature|functionality|capability)\s+(?:of|to|that)\s+(.+?)(?=[.!;]|$)/gi,
      /(?:able to|capable of)\s+(.+?)(?=[.!;]|$)/gi,
      /(?:support|include|have)\s+(.+?)(?=[.!;]|$)/gi
    ];
    
    const requirements = new Set();
    
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          requirements.add(match[1].trim());
        }
      }
    });
    
    return Array.from(requirements);
  }

  /**
   * Extract constraints
   */
  extractConstraints(text) {
    const constraintPatterns = [
      /(?:cannot|can't|must not|should not)\s+(.+?)(?=[.!;]|$)/gi,
      /(?:limited to|restricted to|only)\s+(.+?)(?=[.!;]|$)/gi,
      /(?:budget|cost|price)\s+(?:of|is|:)\s*(.+?)(?=[.!;]|$)/gi,
      /(?:deadline|due|timeline)\s+(?:is|:)\s*(.+?)(?=[.!;]|$)/gi,
      /(?:constraint|limitation|restriction)\s+(?:is|:)\s*(.+?)(?=[.!;]|$)/gi
    ];
    
    const constraints = new Set();
    
    constraintPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          constraints.add(match[1].trim());
        }
      }
    });
    
    return Array.from(constraints);
  }

  /**
   * Calculate prompt clarity score
   */
  calculateClarityScore(text) {
    let score = 0.5; // Base score
    
    // Length factor
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 100) score += 0.1;
    if (wordCount > 200) score += 0.1;
    
    // Structure factors
    const hasBulletPoints = text.includes('- ') || text.includes('* ') || text.includes('• ');
    const hasNumberedList = text.match(/\d+\.\s/);
    const hasHeadings = text.includes(':') || text.match(/[A-Z][a-z]+:/g);
    
    if (hasBulletPoints || hasNumberedList) score += 0.1;
    if (hasHeadings) score += 0.1;
    
    // Specificity factors
    const requirements = this.extractRequirementsWithPatterns(text);
    const constraints = this.extractConstraints(text);
    
    if (requirements.length > 0) score += 0.1;
    if (requirements.length > 2) score += 0.1;
    if (constraints.length > 0) score += 0.1;
    
    // Technical specification factor
    const hasTechTerms = text.match(/\b(api|database|server|client|frontend|backend|ui|ux)\b/i);
    if (hasTechTerms) score += 0.1;
    
    return Math.min(Math.max(score, 0), 1).toFixed(2);
  }
}

// Alternative: Simple text processor without external dependencies
export class SimpleTextProcessor {
  static extractSentences(text) {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  static extractWords(text) {
    return text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  }

  static findPatterns(text, patterns) {
    const matches = [];
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push(match[0]);
      }
    });
    return matches;
  }

  static calculateReadability(text) {
    const sentences = this.extractSentences(text);
    const words = this.extractWords(text);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const wordsPerSentence = words.length / sentences.length;
    const uniqueWords = new Set(words).size;
    const uniquenessRatio = uniqueWords / words.length;
    
    return {
      wordsPerSentence: wordsPerSentence.toFixed(1),
      uniquenessRatio: uniquenessRatio.toFixed(2),
      score: Math.min((uniquenessRatio * 0.7 + (wordsPerSentence > 10 ? 0.3 : 0)), 1)
    };
  }
}

// Export default instance