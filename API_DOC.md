API Documentation

Base URL:
http://localhost:3000/api

----------------------------------------

Health Check API

Endpoint:
GET /refine/health

Description:
Checks whether the server is running and healthy.

Response:
{
  "status": "healthy",
  "service": "prompt-refinement-system",
  "timestamp": "2024-01-11T10:00:00.000Z",
  "version": "1.0.0"
}

----------------------------------------

Single Prompt Refinement (Text Only)

Endpoint:
POST /refine

Headers:
Content-Type: application/json

Request Body:
{
  "text": "Explain artificial intelligence",
  "style": "technical",
  "maxLength": 500,
  "temperature": 0.7
}

Response:
{
  "success": true,
  "id": "ref_1768109681429_2s3x7frz1",
  "originalPrompt": "Explain artificial intelligence",
  "refinedPrompt": "...",
  "style": "technical",
  "metadata": {
    "style": "technical",
    "maxLength": 500,
    "temperature": 0.7,
    "hasText": true,
    "filesCount": 0
  },
  "assumptions": [
    "Text prompt processed and refined"
  ],
  "timestamp": "2026-01-11T05:34:41.429Z"
}

----------------------------------------

Single Prompt Refinement (With File Upload)

Endpoint:
POST /refine

Headers:
Content-Type: multipart/form-data

Form Data:
text: Analyze this document
style: analytical
files: any supported file

Supported File Types:
Images: .jpg, .jpeg, .png, .gif
Documents: .pdf, .docx, .doc, .txt, .md

Response:
{
  "success": true,
  "id": "ref_1768110284821_3hodc7sem",
  "originalPrompt": "Analyze this document",
  "refinedPrompt": "...",
  "style": "analytical",
  "metadata": {
    "filesCount": 1,
    "fileTypes": ["application/pdf"]
  },
  "assumptions": [
    "Text prompt processed and refined",
    "1 file processed for content extraction"
  ],
  "timestamp": "2026-01-11T05:44:44.821Z"
}

----------------------------------------

Batch Prompt Refinement

Endpoint:
POST /refine/batch

Headers:
Content-Type: application/json

Request Body:
{
  "prompts": [
    "Explain photosynthesis",
    "Describe the water cycle",
    "What is gravity?"
  ],
  "style": "technical",
  "consistencyCheck": true,
  "maxLength": 500,
  "temperature": 0.7
}

Response:
{
  "success": true,
  "batchId": "batch_1768122431639",
  "results": [
    {
      "original": "Explain photosynthesis",
      "refined": "..."
    },
    {
      "original": "Describe the water cycle",
      "refined": "..."
    },
    {
      "original": "What is gravity?",
      "refined": "..."
    }
  ],
  "style": "technical",
  "consistencyCheck": true,
  "timestamp": "2026-01-11T09:07:11.639Z"
}
