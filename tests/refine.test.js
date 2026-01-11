import request from 'supertest';
import app from '../src/index.js';
import fs from 'fs/promises';

describe('Prompt Refinement API', () => {
  it('should process text input', async () => {
    const response = await request(app)
      .post('/api/refine')
      .field('text', 'Create a weather dashboard');
    
    expect(response.status).toBe(200);
    expect(response.body.refinedPrompt.core_intent).toContain('weather');
  });
});