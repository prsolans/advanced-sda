# Sample Document Assistant

A Google Apps Script-based document generation system that creates realistic legal agreements for sales demonstrations, featuring industry-specific customization and AI-powered content generation.

## Overview

The Sample Document Assistant is designed to help sales teams generate realistic, industry-tailored legal documents for demonstrations. It creates professional agreements with appropriate legal language, industry-specific terms, and realistic sample data that can be used to showcase document management and AI extraction capabilities.

## Features

### Core Capabilities
- **Industry-Specific Documents**: Generate documents tailored to 7 major industries with 60+ subindustries
- **Multi-Language Support**: Create documents in English, Spanish, French, German, Portuguese, and Japanese
- **Document Sets**: Generate related document sets (NDA → MSA → SOW → Change Order) with proper parent-child relationships
- **AI-Powered Generation**: Uses OpenAI GPT-4 to create realistic, comprehensive legal agreements
- **Google Drive Integration**: Creates Google Doc files from OpenAI HTML outputs and stores content in request-specific folders in Google Drive
- **Web Interface**: User-friendly form for document requests
- **Automated Notifications**: Slack integration for completion notifications

### Document Types

The system supports 100+ document types across industries including:

#### General Documents (All Industries)
- Non-Disclosure Agreement (NDA)
- Master Service Agreement (MSA)
- Consulting Agreement
- Statement of Work (SOW)
- Change Order

#### Industry-Specific Documents
- **Technology**: Software License, API Terms, Cloud Services, Data Processing Agreement
- **Healthcare**: Business Associate Agreement, Clinical Trial Agreement, Telehealth Services
- **Financial Services**: Loan Agreement, Investment Advisory, Payment Processing
- **Manufacturing**: Supply Agreement, Distribution Agreement, Quality Assurance
- **Energy**: Power Purchase Agreement, Solar Installation, Wind Farm Development
- **Real Estate**: Commercial Lease, Property Management, Construction Agreement
- **HR**: Offer Letter, Employee Separation, Stock Option Agreement

## Architecture

### Key Components

1. **Constants Library** (`01_constants.js`)
   - Comprehensive document type definitions with metadata
   - Industry/subindustry mappings
   - Legal obligation templates

2. **Prompt Builder** (`03_promptBuilder.js`)
   - Dynamic prompt generation based on document type
   - Industry-specific guidance injection
   - Regulatory compliance context

3. **Document Builder** (`04_documentBuilder.js`)
   - Randomized but realistic document details
   - Parent-child document linking
   - Custom field generation for healthcare documents

4. **Web Interface** (`index.html`)
   - Responsive form with dynamic subindustry selection
   - Real-time progress tracking
   - Error handling and notifications

## Usage

### Via Web Interface
1. Access the deployed web app URL
2. Fill out the form:
   - Email address for notifications
   - Company name (First Party)
   - Geography (NAMER, EMEA, APAC, LATAM)
   - Industry and Subindustry
   - Number of documents to generate

3. Submit and wait for Slack notification

## Document Generation Process

1. **Request Processing**
   - Validates input parameters
   - Creates timestamped folder in Google Drive
   - Generates reference guide document

2. **Document Creation**
   - Builds document-specific prompt with industry context
   - Calls OpenAI API for content generation
   - Sanitizes and formats HTML response
   - Converts to Google Docs format

3. **Post-Processing**
   - Moves documents to request folder
   - Updates status in spreadsheet
   - Sends Slack notification with folder link