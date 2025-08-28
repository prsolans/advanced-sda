# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script-based document generation system for creating realistic legal agreements for sales demonstrations. The system generates industry-specific documents with AI-powered content and integrates with Google Drive, Docs, and Slack.

## Development Commands

This is a Google Apps Script project - no traditional build commands. Development workflow:
- Edit `.js` files directly in the Google Apps Script IDE or locally
- Deploy via Google Apps Script console
- Test using the web app interface or spreadsheet triggers

## Architecture

### Core Module Structure

The codebase follows a modular architecture with numbered files indicating execution order:

1. **01_constants.js** - Document type definitions and industry mappings
   - Contains `DOC_TYPE_LIBRARY` with 100+ document types across 7 industries
   - Industry/subindustry hierarchies and legal obligation templates
   - Regional settings and business terms constants

2. **02_utils.js** - Utility functions and helpers
   - Random data generators and date formatting
   - Contract number generation and validation

3. **03_promptBuilder.js** - AI prompt construction system
   - Modular prompt assembly with industry-specific context
   - Custom instruction parsing and integration
   - Parent-child document relationship handling

4. **04_documentBuilder.js** - Document metadata generation
   - Contract terms and dates calculation
   - Agreement details randomization with realistic constraints
   - Healthcare-specific custom fields

5. **05_fileHandler.js** - Google Drive integration
   - HTML to Google Docs conversion
   - File naming conventions with language prefixes
   - Folder organization and permissions

6. **06_slackNotifier.js** - Notification system
   - Slack webhook integration
   - Multi-language notification support
   - Reference document linking

7. **07_main.js** - Primary execution controller
   - Spreadsheet trigger handling
   - Request processing orchestration
   - Error handling and status updates

### Key Patterns

- **Industry-Driven Logic**: Document types are filtered by industry/subindustry
- **Parent-Child Relationships**: Documents can reference parent agreements (NDA → MSA → SOW)
- **Multi-language Support**: 6 languages with proper file naming conventions
- **Google Services Integration**: Heavy use of Drive, Docs, and Spreadsheets APIs

### Data Flow

1. Web form submission (`WebApp.js`) → Google Sheets
2. Spreadsheet trigger activates `submitSampleRequest()` in `07_main.js`
3. Document details built using `04_documentBuilder.js`
4. AI prompts assembled via `03_promptBuilder.js`
5. OpenAI API called for content generation
6. HTML converted to Google Docs via `05_fileHandler.js`
7. Slack notification sent via `06_slackNotifier.js`

## Configuration

### Required Script Properties
- `ROOT_FOLDER_ID`: Google Drive folder for document storage
- `SLACK_WEBHOOK_URL`: Slack notification endpoint
- OpenAI API credentials (handled by external library)

### External Dependencies
- **PreSalesOpenAI Library**: Custom Google Apps Script library for OpenAI API integration
- **Google Advanced Services**: Drive API v2, Docs API v1
- **OAuth Scopes**: Spreadsheets, Documents, Drive, External Requests

## File Naming Conventions

Generated documents follow the pattern:
`[LanguageCode] DocumentType - ContractNumber.docx`

Language codes:
- Spanish: [ES]
- French: [FR] 
- German: [DE]
- Portuguese (PT): [PT]
- Portuguese (BR): [BR]
- Japanese: [JA]
- English: (no prefix)

## Document Type System

Documents are categorized by:
- **General**: Available across all industries (NDA, MSA, Consulting)
- **Industry-Specific**: Technology, Healthcare, Financial Services, Manufacturing, Energy, Real Estate, HR
- **Controlled Types**: Used for parent-child relationships and prompt generation

Each document type includes:
- Industry/subindustry restrictions
- Legal obligations templates
- Term/no-term classification
- Parent document compatibility

## Testing

No automated test framework. Manual testing via:
1. Web form interface for end-to-end testing
2. Google Sheets trigger testing
3. Individual function testing in Apps Script IDE