import express from 'express';
import cors from 'cors';
import refineRoutes from './routes/refine.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/refine', refineRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Prompt Refinement System API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/refine/health',
      refine: 'POST /api/refine',
      batch: 'POST /api/refine/batch'
    },
    usage: {
      refine: {
        method: 'POST',
        url: '/api/refine',
        body: {
          text: 'Your prompt here',
          style: 'creative|technical|analytical|general',
          maxLength: 500,
          temperature: 0.7
        },
        files: 'Optional file uploads'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/refine/health`);
});