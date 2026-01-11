import express from 'express';
import multer from 'multer';
import { 
  refinePrompt, 
  batchRefine, 
  getHealth 
} from '../controllers/refineController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
router.get('/health', getHealth);

// Single prompt refinement (with optional file upload)
router.post('/', upload.array('files', 5), refinePrompt);

// Batch refinement (text only)
router.post('/batch', batchRefine);

export default router;