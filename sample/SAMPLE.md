## API Document:
* Base URL:http://localhost:3000/api
- health url:
-  Check that server is running
* GET /refine/health
{
  "status": "healthy",
  "service": "prompt-refinement-system",
  "timestamp": "2024-01-11T10:00:00.000Z",
  "version": "1.0.0"
}
* single prompt refinement
- post /refine
: content-Type: application/json
: Body:
{
  "text": "Explain artificial intelligence",
  "style": "technical",
  "maxLength": 500,
  "temperature": 0.7
}
- {
    "success": true,
    "id": "ref_1768109681429_2s3x7frz1",
    "originalPrompt": "Explain artificial intelligence",
    "refinedPrompt": "# PROMPT REFINEMENT SYSTEM OUTPUT\n## Input Analysis and Structured Request\n\n### Text Input Processing\nTechnical Request: Explain artificial intelligence\n\nFocus Areas:\n• Specifications and parameters\n• Systematic analysis\n• Data and evidence\n• Practical applications\n• Clear methodology\n\n## Refined Prompt Structure\n\n*Primary Objective:* Provide precise, detailed technical information with clear specifications\n\n### Response Requirements\n1. *Length:* Approximately 500 words\n2. *Style:* technical (Precise, systematic, data-driven)\n3. *Creativity Level:* 0.7/1.0 (Creative with some constraints)\n4. *Structure:* Logical sequence: overview → details → applications → summary\n\n### Content Expectations\n• Include specifications and data\n• Provide practical applications\n• Use precise terminology\n• Follow systematic approach\n• Reference relevant frameworks\n\n### Formatting Guidelines\n• Use headings and subheadings\n• Include lists for specifications\n• Use code blocks if applicable\n• Add tables for comparisons\n\n### Quality Standards\n• Accuracy and relevance\n• Clarity and coherence\n• Completeness of response\n• Appropriate creativity level\n• Balanced approach\n• Effective communication\n• Evidence-based claims\n• Logical reasoning\n• Systematic approach\n\n\n\n---\n*PROMPT METADATA*\n• Generated: 2026-01-11T05:34:41.425Z\n• Style: technical\n• Target Length: 500 words\n• Creativity: 0.7/1.0\n• Input Summary: Text input (31 chars) [1 processing assumptions]\n• System: Multi-Modal Prompt Refinement System v1.0\n",
    "style": "technical",
    "metadata": {
        "style": "technical",
        "maxLength": 500,
        "temperature": 0.7,
        "hasText": true,
        "filesCount": 0,
        "fileTypes": [],
        "fileNames": [],
        "contentTypes": [
            "text"
        ],
        "validation": {
            "valid": true,
            "warnings": [],
            "promptLength": 1261,
            "sectionCount": 8
        }
    },
    "assumptions": [
        "Text prompt processed and refined"
    ],
    "timestamp": "2026-01-11T05:34:41.429Z"
}
- single prompt Refinement(with file upload):
- post :/refine
- Content-Type:multipart/form-data
text: Analyze this document
style: analytical
files: [any file]
Supported File Types:
Images: .jpg, .jpeg, .png, .gif
Documents: .pdf, .docx, .doc, .txt, .md
output:
{
    "success": true,
    "id": "ref_1768110284821_3hodc7sem",
    "originalPrompt": "Analyze this document",
    "refinedPrompt": "# PROMPT REFINEMENT SYSTEM OUTPUT\n## Input Analysis and Structured Request\n\n### Text Input Processing\nAnalytical Inquiry: Analyze this document\n\nFocus Areas:\n• Critical examination\n• Evidence evaluation\n• Multiple perspectives\n• Objective assessment\n• Logical conclusions\n\n## UPLOADED FILES ANALYSIS\n\n### File 1: Dayflow - Human Resource Management System (1).pdf\n- *Type:* application/pdf\n- *Size:* 1.29 MB\n- *Extension:* .pdf\n- *Content Type:* Document/text\n- *Extraction:* Successful\n- *Summary:* PDF DOCUMENT EXTRACTION (FALLBACK MODE)\n=========================================\nFile: 1768110283331-528021412-Dayflow - Human Resource Management Sy...\n- *Word Count:* 146\n- *Key Topics:* Hackathon/Competition, AI/Machine Learning, Coding/Development, Detailed Document, Date/Time Related\n\nAnalyze arguments, evidence, logic, structure, and conclusions.\n\n\n## Refined Prompt Structure\n\n*Primary Objective:* Deliver critical analysis with balanced perspective and evidence-based conclusions\n\n### Response Requirements\n1. *Length:* Approximately 500 words\n2. *Style:* analytical (Critical, evaluative, evidence-based)\n3. *Creativity Level:* 0.7/1.0 (Creative with some constraints)\n4. *Structure:* Thesis → evidence → analysis → conclusion format\n\n### Content Expectations\n• Reference and analyze content from 1 document(s)\n• Present balanced arguments\n• Cite specific evidence\n• Consider multiple perspectives\n• Identify assumptions/biases\n• Draw logical conclusions\n\n### Formatting Guidelines\n• Clear section headers\n• Evidence presented in lists\n• Conclusions highlighted\n• Citations formatted consistently\n\n### Quality Standards\n• Accuracy and relevance\n• Clarity and coherence\n• Completeness of response\n• Appropriate creativity level\n• Balanced approach\n• Effective communication\n• Evidence-based claims\n• Logical reasoning\n• Systematic approach\n\n\n\n---\n*PROMPT METADATA*\n• Generated: 2026-01-11T05:44:44.821Z\n• Style: analytical\n• Target Length: 500 words\n• Creativity: 0.7/1.0\n• Input Summary: Text input (21 chars) + 1 file(s): PDF [2 processing assumptions]\n• System: Multi-Modal Prompt Refinement System v1.0\n",
    "style": "analytical",
    "metadata": {
        "style": "analytical",
        "maxLength": 500,
        "temperature": 0.7,
        "hasText": true,
        "filesCount": 1,
        "fileTypes": [
            "application/pdf"
        ],
        "fileNames": [
            "Dayflow - Human Resource Management System (1).pdf"
        ],
        "contentTypes": [
            "text",
            "documents"
        ],
        "validation": {
            "valid": true,
            "warnings": [],
            "promptLength": 1878,
            "sectionCount": 10
        }
    },
    "assumptions": [
        "Text prompt processed and refined",
        "1 file(s) processed for content extraction"
    ],
    "timestamp": "2026-01-11T05:44:44.821Z"
}

//sample=3 request
POST /refine
Content-Type: multipart/form-data

text: ""
style: design
files: wireframe_app_ui.png

response
{
  "success": true,
  "id": "ref_1768110459123_img1",
  "originalPrompt": "",
  "refinedPrompt": "# PROMPT REFINEMENT SYSTEM OUTPUT\n## Input Analysis and Structured Request\n\n### Image Input Processing\nDetected: Mobile application wireframe\n\nIdentified Elements:\n• Login screen\n• Dashboard layout\n• Navigation bar\n• Profile section\n\n## Refined Prompt Structure\n*Primary Objective:* Generate a mobile app UI design based on provided wireframe\n\n### Functional Requirements\n• User authentication\n• Dashboard view\n• Navigation system\n• Profile management\n\n### Expected Output\n• High-fidelity UI mockups\n• Component hierarchy\n• UX flow\n\n### Missing Information\n• App purpose\n• Target users\n• Color theme\n\n---\n*PROMPT METADATA*\n• Input Type: Image\n• Confidence: 0.82\n• System: Multi-Modal Prompt Refinement System v1.0"
}


//sample-4 request
POST /refine
Content-Type: multipart/form-data

text: "Build this system"
style: technical
files: ecommerce_requirements.docx

response

{
  "success": true,
  "id": "ref_1768110529911_docx1",
  "originalPrompt": "Build this system",
  "refinedPrompt": "# PROMPT REFINEMENT SYSTEM OUTPUT\n\n### Document Analysis\nE-commerce system specification detected\n\n### Core Intent\nDevelop a scalable e-commerce platform\n\n### Functional Requirements\n• Product listing\n• Shopping cart\n• Payment gateway\n• Order tracking\n\n### Technical Constraints\n• Must support 10k users\n• Secure payment handling\n\n### Expected Output\n• Web application\n• Admin panel\n• REST APIs\n\n### Missing Information\n• UI design\n• Deployment platform\n\n---\nSystem: Multi-Modal Prompt Refinement System v1.0"
}

//sample 5

request


POST /refine
Content-Type: multipart/form-data

text: "Make a fitness app like this"
style: product
files: fitness_app_screenshot.jpg

response
{
  "success": true,
  "id": "ref_1768110617823_mix1",
  "originalPrompt": "Make a fitness app like this",
  "refinedPrompt": "# PROMPT REFINEMENT SYSTEM OUTPUT\n\n### Input Fusion\nText + UI Screenshot detected\n\n### Core Product Intent\nBuild a fitness tracking mobile application\n\n### Functional Requirements\n• Workout tracking\n• Calorie counter\n• User profiles\n• Progress analytics\n\n### Expected Outputs\n• Android & iOS app\n• User dashboard\n• Data visualization\n\n### Missing Information\n• Target audience\n• Monetization model\n\n---\nSystem: Multi-Modal Prompt Refinement System v1.0"
}

//sample 6
request
POST /refine
Content-Type: application/json

{
  "text": "Make something cool",
  "style": "creative"
}

response

{
  "success": true,
  "id": "ref_1768110709129_vague",
  "originalPrompt": "Make something cool",
  "refinedPrompt": null,
  "rejectionReason": "Input too vague to extract product intent or functional requirements",
  "missingInformation": [
    "Purpose",
    "Target users",
    "Output type",
    "Domain"
  ]
}


//sample 7 request

POST /refine
Content-Type: application/json

{
  "text": "This is a funny cat meme 😂",
  "style": "technical"
}


response
{
  "success": false,
  "id": "ref_1768110811112_invalid",
  "originalPrompt": "This is a funny cat meme 😂",
  "rejectionReason": "Input does not describe a product, task, or actionable request",
  "suggestion": "Provide a product idea, design, or technical request"
}