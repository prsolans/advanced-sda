// 05_fileHandler.js


// Fixed version of createFileInDriveV3 that ensures proper naming including third party
function createFileInDriveV3(html, agreementType, language, contractNumber, counterparty) {
  const languageAbbreviations = {
    Spanish: "[ES]",
    French: "[FR]",
    German: "[DE]",
    "Portuguese (PT)": "[PT]",
    "Portuguese (BR)": "[BR]",
    Japanese: "[JA]",
    English: "", // No prefix for English
  };

  // Get language prefix - default to empty string if not found or if English
  const langPrefix = (language && language !== 'English') ? (languageAbbreviations[language] || "") : "";

  // Use the provided contract number, or generate a new one if it doesn't exist
  const finalContractNumber = contractNumber || generateContractNumber(agreementType);

  // Build filename components - ENSURE agreementType is included
  const fileNameParts = [];

  // Only add language prefix if it exists
  if (langPrefix && langPrefix.length > 0) {
    fileNameParts.push(langPrefix);
  }

  // Add the agreement type - this is critical!
  if (agreementType && agreementType.length > 0) {
    fileNameParts.push(agreementType);
  } else {
    Logger.log("WARNING: No agreement type provided for file naming!");
    fileNameParts.push("Document"); // Fallback if no type
  }

  // Add the contract number
  if (finalContractNumber) {
    fileNameParts.push(finalContractNumber);
  }

  // Add the counterparty (third party) name 
  if (counterparty && counterparty.length > 0) {
    fileNameParts.push(counterparty);
  }

  // Join with " - " separator
  const fileName = fileNameParts.filter(part => part && part.length > 0).join(" - ");

  // Sanitize HTML content
  html = sanitizeHtml(html);

  // Create blob and file
  const blob = Utilities.newBlob(html, MimeType.HTML, `${fileName}.html`);
  const file = DriveApp.createFile(blob);

  // Convert to Google Doc
  const docFile = Drive.Files.copy(
    {
      title: fileName,
      mimeType: MimeType.GOOGLE_DOCS,
    },
    file.getId()
  );

  file.setTrashed(true);

  return docFile.id;
}

// Also ensure processAndCreateFile is passing the data correctly
function processAndCreateFile(docData, subfolder) {
  if (!docData) {
    Logger.log("processAndCreateFile skipped because docData was null.");
    return;
  }

  // Destructure all needed properties from the data object
  const {
    agreementType,
    language,
    firstParty,
    counterparty,
    contractNumber
  } = docData;

  // Ensure we have an agreement type
  if (!agreementType) {
    Logger.log("ERROR: No agreementType in docData!");
    throw new Error("Missing agreementType in document data");
  }

  // Generate a number if one isn't already set
  const finalContractNumber = contractNumber || generateContractNumber(agreementType);
  docData.contractNumber = finalContractNumber;

  // ===== NEW PROMPT ENGINE SELECTION =====
  // Re-enable JSON engine for all languages with enhanced language support
  const USE_JSON_ENGINE = PropertiesService.getScriptProperties()
    .getProperty('USE_JSON_ENGINE') === 'true';
    
  Logger.log(`Language: "${language}", USE_JSON_ENGINE: ${USE_JSON_ENGINE}`);

  let prompt;
  let role;

  if (USE_JSON_ENGINE) {
    try {
      prompt = promptEngineV2.createPromptJSON(docData);
      role = 'Generate legal documents from structured JSON specifications.';
    } catch (error) {
      Logger.log(`PromptEngineV2 error, falling back to legacy: ${error.message}`);
      prompt = createPrompt(docData);
      role = 'This GPT is designated to generate realistic sample agreements for use during AI demonstrations. It is tailored to create agreements with specific legal language and conditions that can be analyzed to return structured information.';
    }
  } else {
    prompt = createPrompt(docData);
    role = 'This GPT is designated to generate realistic sample agreements for use during AI demonstrations. It is tailored to create agreements with specific legal language and conditions that can be analyzed to return structured information.';
  }
  // ===== END NEW SECTION =====

  try {
    const responseFromOpenAI = PreSalesOpenAI.executePrompt4o(role, prompt);

    // POST-PRODUCTION: Enhance paragraph spacing and formatting
    const enhancedHTML = enhanceDocumentFormatting(responseFromOpenAI, docData);

    // Create file with enhanced HTML formatting

    const newFileId = createFileInDriveV3(
      enhancedHTML,
      agreementType,
      language || 'English',
      finalContractNumber,
      counterparty
    );

    const newFile = DriveApp.getFileById(newFileId);
    newFile.moveTo(subfolder);
    newFile.setDescription(`Template for ${firstParty} and ${counterparty}`);

  } catch (error) {
    Logger.log(`Failed to create document for ${agreementType} with ${counterparty}. Original Error: ${error.message}`);
    throw new Error(`Failed for ${agreementType}. Details: ${error.message}`);
  }
}

// POST-PRODUCTION: Convert JSON response to formatted HTML document
function enhanceDocumentFormatting(responseContent, docData) {
  // Try to parse as JSON first (works for all languages now)
  try {
    Logger.log(`Attempting JSON parsing of response (${responseContent.length} chars) for language: ${docData.language || 'English'}`);
    
    // Clean response - remove any markdown formatting if present
    let cleanContent = responseContent.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Check if content looks like JSON before parsing
    if (cleanContent.startsWith('{') && cleanContent.endsWith('}')) {
      // Parse JSON and convert to HTML
      const jsonData = JSON.parse(cleanContent);
      Logger.log(`Successfully parsed JSON document structure for ${docData.language || 'English'}`);
      return convertJsonToHtml(jsonData, docData);
    } else {
      Logger.log(`Response doesn't look like JSON structure, using HTML processing`);
    }
    
  } catch (jsonError) {
    Logger.log(`JSON parsing failed: ${jsonError.message}`);
    Logger.log(`Falling back to HTML processing for response: ${responseContent.substring(0, 200)}...`);
  }
  
  // Fallback to legacy HTML processing
  return enhanceHtmlFormatting(responseContent, docData);
}

// Legacy HTML enhancement (fallback)
function enhanceHtmlFormatting(html, docData) {
  // Safety check - if HTML is too short, something went wrong
  if (!html || html.trim().length < 100) {
    Logger.log("ERROR: Input HTML too short - returning fallback document");
    return `<!DOCTYPE html><html><head><title>Document Error</title></head><body><h1>Document Generation Error</h1><p>The document content was not generated properly. Please try again.</p></body></html>`;
  }
  
  // Remove any existing style tags to avoid conflicts
  html = html.replace(/<style[^>]*>.*?<\/style>/gis, '');
  
  // Add comprehensive paragraph spacing CSS that works with Google Docs
  const enhancedCSS = `
<style>
@page {
  margin: 1in;
}
body {
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.15;
  margin: 1in;
  padding: 0;
}
p {
  margin: 0 0 6pt 0;
  text-align: justify;
  text-indent: 0;
}
strong {
  font-weight: bold;
}
h1 {
  font-size: 16pt;
  font-weight: bold;
  text-align: center;
  margin: 0 0 4pt 0;
  text-transform: uppercase;
  letter-spacing: 1pt;
}
h2 {
  font-size: 12pt;
  font-weight: normal;
  text-align: center;
  margin: 0 0 8pt 0;
  color: #666;
}
.section-header, .section-title {
  font-weight: bold;
  font-size: 12pt;
  margin: 12pt 0 6pt 0;
  text-transform: uppercase;
}
.signature-block {
  margin-top: 18pt;
  page-break-inside: avoid;
}
.signature-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12pt;
}
.signature-table td {
  width: 50%;
  vertical-align: top;
  padding: 6pt;
  border: none;
}
.signer-name {
  font-weight: bold;
  margin-bottom: 6pt;
}
.signer-title {
  margin-bottom: 24pt;
  font-style: italic;
}
.signature-line {
  border-bottom: 1pt solid black;
  height: 24pt;
  margin-bottom: 6pt;
}
.signature-date {
  font-size: 11pt;
}
</style>`;

  // Insert enhanced CSS at the beginning of the HTML
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + enhancedCSS);
  } else if (html.includes('<html>')) {
    html = html.replace('<html>', '<html><head>' + enhancedCSS + '</head>');
  } else {
    // Add full HTML structure if missing
    html = '<!DOCTYPE html><html><head>' + enhancedCSS + '</head><body>' + html + '</body></html>';
  }
  
  // Standardize section headers - make them consistently bold and formatted
  html = html.replace(/<p>\s*<strong>\s*([0-9]+\.?\s*[A-Z][^<]*?)\s*<\/strong>\s*<\/p>/gi, 
    '<p class="section-header">$1</p>');
  html = html.replace(/<strong>\s*([0-9]+\.?\s*[A-Z][^<]*?)\s*<\/strong>/gi, 
    '<p class="section-header">$1</p>');
  
  // Also catch section headers without numbers
  html = html.replace(/<p>\s*<strong>\s*([A-Z][A-Z\s]+)\s*<\/strong>\s*<\/p>/gi, 
    '<p class="section-header">$1</p>');
  
  // Ensure proper paragraph structure - wrap loose text in <p> tags
  html = html.replace(/(<\/p>|<\/h[1-6]>|<\/div>)\s*([^<\s][^<]*?)(?=<[ph])/g, '$1<p>$2</p>');
  
  // Fix any sections that might be missing proper paragraph wrapping
  html = html.replace(/(<strong>[^<]*<\/strong>)([^<]+?)(?=<strong|$)/g, '<p>$1</p><p>$2</p>');
  
  // Log original content length for debugging
  const originalLength = html.length;
  Logger.log(`Processing document: original length ${originalLength} chars`);
  Logger.log(`First 200 chars of content: ${html.substring(0, 200)}`);
  
  // TEMPORARILY DISABLE header removal to debug content generation
  // html = html.replace(/^<h1[^>]*>[^<]*<\/h1>\s*/i, '');
  // html = html.replace(/^<p[^>]*>\s*<strong>\s*contract\s*(number|no\.?)[^<]*<\/strong>\s*<\/p>\s*/i, '');
  // html = html.replace(/^<p[^>]*>\s*contract\s*(number|no\.?)[^<]*<\/p>\s*/i, '');
  
  // Create and prepend standardized document header
  const documentHeaderHTML = createDocumentHeader(docData);
  html = documentHeaderHTML + html;
  
  // Remove any existing signature content that OpenAI may have generated (multi-language)
  const signaturePatterns = [
    /<p[^>]*>\s*<strong>\s*(SIGNATURES?|FIRMAS|ASSINATURAS|UNTERSCHRIFTEN|署名)\s*<\/strong>\s*<\/p>.*$/gis,
    /(IN WITNESS WHEREOF|EN FE DE LO CUAL|EN FOI DE QUOI|ZUM ZEUGNIS DESSEN|これを証するため).*$/gis,
    /signature.*$/gis
  ];
  
  signaturePatterns.forEach(pattern => {
    html = html.replace(pattern, '');
  });
  
  // Create professional signature block with 2-column table
  const effectiveDate = docData.effectiveDate || 
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const signatureBlockHTML = createSignatureBlock(docData, effectiveDate);
  
  // Always append our signature block at the end
  html += signatureBlockHTML;
  
  // Clean up any double paragraph tags
  html = html.replace(/<p>\s*<p>/g, '<p>');
  html = html.replace(/<\/p>\s*<\/p>/g, '</p>');
  
  // Log only if there's an issue
  if (html.length < 500) {
    Logger.log(`WARNING: Short document generated (${html.length} chars) - possible processing error`);
  }
  
  return html;
}

// Create standardized document header with language support
function createDocumentHeader(docData) {
  const documentType = docData.agreementType || 'AGREEMENT';
  const contractNumber = docData.contractNumber || 'DRAFT';
  const language = normalizeLanguage(docData.language || 'English');
  const translations = getLanguageTranslations(language);
  
  return `
<h1>${documentType.toUpperCase()}</h1>
<h2>${translations.contractNo}: ${contractNumber}</h2>
`;
}

// Create professional 2-column signature block with language support
function createSignatureBlock(docData, effectiveDate) {
  const firstParty = docData.firstParty || 'Company A';
  const counterparty = docData.counterparty || 'Company B';
  const language = normalizeLanguage(docData.language || 'English');
  const translations = getLanguageTranslations(language);
  
  // First try to extract from existing document content (best source)
  let firstSignature = extractSignatureFromContent(docData, 'first');
  let counterSignature = extractSignatureFromContent(docData, 'counter');
  
  // If not found, try specialInstructions
  if (!firstSignature) {
    firstSignature = extractSignatureInfo(docData, 'first');
  }
  if (!counterSignature) {
    counterSignature = extractSignatureInfo(docData, 'counter');
  }
  
  // Finally fall back to geography-appropriate defaults using the same system as the prompt engine
  if (!firstSignature) {
    firstSignature = getDefaultSignatureForGeography(docData.geography, 'first');
  }
  if (!counterSignature) {
    counterSignature = getDefaultSignatureForGeography(docData.geography, 'counter');
  }

  return `
<div class="signature-block">
  <p class="section-header">${translations.signatures}</p>
  <p>${translations.inWitnessWhereof}</p>
  
  <table class="signature-table">
    <tr>
      <td>
        <div class="signer-name">${firstParty.toUpperCase()}</div>
        <div class="signer-title">${translations.by}: ${firstSignature.name}</div>
        <div class="signer-title">${translations.title}: ${firstSignature.title}</div>
        <div class="signature-line"></div>
        <div>${translations.signature}</div>
        <div class="signature-date">${translations.date}: ${effectiveDate}</div>
      </td>
      <td>
        <div class="signer-name">${counterparty.toUpperCase()}</div>
        <div class="signer-title">${translations.by}: ${counterSignature.name}</div>
        <div class="signer-title">${translations.title}: ${counterSignature.title}</div>
        <div class="signature-line"></div>
        <div>${translations.signature}</div>
        <div class="signature-date">${translations.date}: ${effectiveDate}</div>
      </td>
    </tr>
  </table>
</div>`;
}

// Extract signature info from existing document content (if OpenAI generated names)
function extractSignatureFromContent(docData, party) {
  // This would need access to the generated content, but we're in post-processing
  // For now, return null and rely on other methods
  return null;
}

// Helper function to extract signature information from docData
function extractSignatureInfo(docData, party) {
  // Try to extract from specialInstructions or other fields
  if (docData.specialInstructions) {
    const instructions = docData.specialInstructions.toString();
    
    // Look for signature patterns in special instructions
    const signatureMatch = instructions.match(new RegExp(`${party}.*?signature.*?name[:\\s]+(\\w+\\s+\\w+).*?title[:\\s]+(\\w+[^,\\n]*?)`, 'i'));
    if (signatureMatch) {
      return {
        name: signatureMatch[1].trim(),
        title: signatureMatch[2].trim()
      };
    }
  }
  
  // If no specific signature info found, return null to use defaults
  return null;
}

// Get geography-appropriate signature defaults (matching prompt engine system)
function getDefaultSignatureForGeography(geography, party) {
  // Mirror the signature system from 03a_promptEngineV2.js
  const signatureBlocks = {
    'NAMER': [
      { name: 'Michael J. Thompson', title: 'Chief Executive Officer' }, // Company A (fixed)
      { name: 'Sarah K. Martinez', title: 'President & COO' },           // Company B options
      { name: 'David R. Johnson', title: 'Chief Technology Officer' },
      { name: 'Jennifer L. Wilson', title: 'Chief Financial Officer' },
      { name: 'Robert A. Davis', title: 'Senior Vice President' },
      { name: 'Lisa M. Anderson', title: 'Executive Vice President' }
    ],
    'EMEA': [
      { name: 'James R. Clarke', title: 'Managing Director' },           // Company A (fixed)
      { name: 'Sophie M. Laurent', title: 'Chief Executive Officer' },   // Company B options  
      { name: 'Oliver J. Schmidt', title: 'General Manager' },
      { name: 'Isabella C. Rossi', title: 'Director of Operations' },
      { name: 'Henrik P. Nielsen', title: 'Chief Technology Officer' },
      { name: 'Emma K. Williams', title: 'Commercial Director' }
    ],
    'APAC': [
      { name: 'Hiroshi Tanaka', title: 'President & CEO' },             // Company A (fixed)
      { name: 'Wei Lin Chen', title: 'Managing Director' },             // Company B options
      { name: 'Priya S. Sharma', title: 'Chief Operating Officer' },
      { name: 'Kenji Nakamura', title: 'Executive Director' },
      { name: 'Mei Ling Wong', title: 'General Manager' },
      { name: 'Raj K. Patel', title: 'Chief Financial Officer' }
    ],
    'LATAM': [
      { name: 'Carlos E. Rodriguez', title: 'Director Ejecutivo' },      // Company A (fixed)
      { name: 'Maria F. Silva', title: 'Gerente General' },             // Company B options
      { name: 'José L. Mendez', title: 'Director de Operaciones' },
      { name: 'Ana C. Gutierrez', title: 'Directora Comercial' },
      { name: 'Diego M. Vargas', title: 'Vicepresidente' },
      { name: 'Lucia R. Torres', title: 'Directora Financiera' }
    ]
  };

  const geoSignatures = signatureBlocks[geography] || signatureBlocks['NAMER'];
  
  if (party === 'first') {
    // Company A gets fixed first signature
    return geoSignatures[0];
  } else {
    // Company B gets random from remaining options
    const companyBOptions = geoSignatures.slice(1);
    return companyBOptions[Math.floor(Math.random() * companyBOptions.length)];
  }
}

// Proper sanitization function
function sanitizeHtml(html) {
  // Strip out any leftover code block tags
  html = html.replace(/```html|```/g, "").trim();

  // Escape your special markers once, globally, instead of brute-forcing 100 loops
  html = html.replace(/<# </g, "&lt;# &lt;").replace(/> #>/g, "&gt; #&gt;");

  return html;
}


// Specific examples for high-priority obligations
function getSpecificExamples(obligationType, companyName) {
  const examples = {
    // General obligations
    "Compliance": [
      `${companyName} shall maintain all necessary licenses and permits required for the performance of Services under this Agreement.`,
      `Both parties agree to comply with all applicable federal, state, and local laws, including but not limited to FCPA and export control regulations.`,
      `Contractor shall ensure all personnel assigned to this project comply with ${companyName}'s code of conduct and security policies.`
    ],
    "Confidentiality": [
      `Recipient shall not disclose Confidential Information to any third party without the prior written consent of ${companyName}.`,
      `All Confidential Information shall be returned or destroyed within thirty (30) days of termination of this Agreement.`,
      `The obligations of confidentiality shall survive termination of this Agreement for a period of five (5) years.`
    ],
    "Data Breach": [
      `In the event of a security incident, Contractor shall notify ${companyName} within twenty-four (24) hours of discovery.`,
      `Both parties shall cooperate fully in investigating any data breach and shall share all relevant information and logs.`,
      `The breaching party shall bear all costs associated with breach notification, credit monitoring, and remediation efforts.`
    ],
    "Indemnification": [
      `Vendor shall indemnify and hold harmless ${companyName} from any claims arising from Vendor's negligence or willful misconduct.`,
      `Each party agrees to indemnify the other for any third-party claims arising from their breach of this Agreement.`,
      `Indemnification obligations shall include reasonable attorneys' fees and court costs incurred in defense of such claims.`
    ],
    "HIPAA Compliance": [
      `Business Associate shall implement administrative, physical, and technical safeguards as required by HIPAA Security Rule.`,
      `Any use or disclosure of PHI shall be limited to the minimum necessary to accomplish the intended purpose.`,
      `Business Associate shall report any security incident involving PHI to ${companyName} within 48 hours of discovery.`
    ],
    "PCI Compliance": [
      `Payment Processor shall maintain PCI DSS Level 1 certification throughout the term of this Agreement.`,
      `Annual attestation of compliance shall be provided to ${companyName} by January 31st of each year.`,
      `Any changes to PCI compliance status shall be reported to ${companyName} within 5 business days.`
    ]
  };

  return examples[obligationType] || null;
}

// Pattern-based example generator for complete coverage
function generatePatternBasedExamples(obligationType, companyName) {
  const obligation = obligationType.toLowerCase();

  // Categorize by keywords and patterns
  if (obligation.includes('compliance') || obligation.includes('regulatory')) {
    return generateComplianceExamples(obligationType, companyName);
  } else if (obligation.includes('payment') || obligation.includes('fee') || obligation.includes('cost')) {
    return generatePaymentExamples(obligationType, companyName);
  } else if (obligation.includes('data') || obligation.includes('information') || obligation.includes('privacy')) {
    return generateDataExamples(obligationType, companyName);
  } else if (obligation.includes('delivery') || obligation.includes('schedule') || obligation.includes('timeline')) {
    return generateScheduleExamples(obligationType, companyName);
  } else if (obligation.includes('quality') || obligation.includes('standard') || obligation.includes('performance')) {
    return generateQualityExamples(obligationType, companyName);
  } else if (obligation.includes('insurance') || obligation.includes('liability') || obligation.includes('indemnif')) {
    return generateRiskExamples(obligationType, companyName);
  } else if (obligation.includes('audit') || obligation.includes('report') || obligation.includes('logging')) {
    return generateAuditExamples(obligationType, companyName);
  } else if (obligation.includes('support') || obligation.includes('maintenance') || obligation.includes('service')) {
    return generateSupportExamples(obligationType, companyName);
  } else if (obligation.includes('termination') || obligation.includes('expir') || obligation.includes('end')) {
    return generateTerminationExamples(obligationType, companyName);
  } else if (obligation.includes('intellectual') || obligation.includes('ip') || obligation.includes('proprietary')) {
    return generateIPExamples(obligationType, companyName);
  } else if (obligation.includes('employment') || obligation.includes('employee') || obligation.includes('hr')) {
    return generateEmploymentExamples(obligationType, companyName);
  } else if (obligation.includes('territory') || obligation.includes('geographic') || obligation.includes('location')) {
    return generateTerritoryExamples(obligationType, companyName);
  } else {
    // Default pattern for uncategorized obligations
    return generateDefaultExamples(obligationType, companyName);
  }
}

// Specific pattern generators
function generateComplianceExamples(obligationType, companyName) {
  return [
    `All ${obligationType} requirements shall be met in accordance with applicable laws and industry standards.`,
    `${companyName} reserves the right to audit Vendor's ${obligationType} practices with thirty (30) days' notice.`,
    `Failure to maintain ${obligationType} shall constitute a material breach subject to immediate termination.`
  ];
}

function generatePaymentExamples(obligationType, companyName) {
  return [
    `All ${obligationType} shall be processed within thirty (30) days of receipt of valid invoice.`,
    `${companyName} shall not be responsible for any ${obligationType} not explicitly authorized in writing.`,
    `Disputed ${obligationType} shall be resolved through good faith negotiations within fifteen (15) business days.`
  ];
}

function generateDataExamples(obligationType, companyName) {
  return [
    `${obligationType} protocols shall comply with ${companyName}'s information security policies and applicable privacy laws.`,
    `All ${obligationType} practices shall be documented and subject to annual third-party assessment.`,
    `Vendor shall implement industry-standard safeguards for ${obligationType} including encryption at rest and in transit.`
  ];
}

function generateScheduleExamples(obligationType, companyName) {
  return [
    `${obligationType} commitments shall be met with a minimum 98% on-time performance measured quarterly.`,
    `Any changes to ${obligationType} must be approved by ${companyName} in writing at least five (5) business days in advance.`,
    `Force majeure events affecting ${obligationType} shall be communicated within twenty-four (24) hours of occurrence.`
  ];
}

function generateQualityExamples(obligationType, companyName) {
  return [
    `All deliverables shall meet the ${obligationType} requirements specified in Exhibit A and industry best practices.`,
    `${companyName} shall have the right to reject any work not meeting ${obligationType} within ten (10) days of delivery.`,
    `Continuous improvement programs for ${obligationType} shall be reviewed quarterly with documented action plans.`
  ];
}

function generateRiskExamples(obligationType, companyName) {
  return [
    `${obligationType} provisions shall be maintained throughout the term and for three (3) years thereafter.`,
    `Each party's ${obligationType} obligations shall be limited to direct damages not exceeding the annual contract value.`,
    `${obligationType} terms shall not apply to breaches of confidentiality, gross negligence, or willful misconduct.`
  ];
}

function generateAuditExamples(obligationType, companyName) {
  return [
    `Complete ${obligationType} records shall be maintained for a minimum of seven (7) years from creation date.`,
    `${companyName} shall have the right to conduct ${obligationType} reviews upon reasonable notice during business hours.`,
    `All ${obligationType} findings shall be addressed within thirty (30) days with a written remediation plan.`
  ];
}

function generateSupportExamples(obligationType, companyName) {
  return [
    `${obligationType} shall be provided during ${companyName}'s standard business hours with 24/7 availability for critical issues.`,
    `Response times for ${obligationType} requests shall not exceed four (4) hours for high-priority issues.`,
    `All ${obligationType} activities shall be logged in ${companyName}'s designated ticketing system with regular status updates.`
  ];
}

function generateTerminationExamples(obligationType, companyName) {
  return [
    `${obligationType} rights may be exercised by either party with ninety (90) days' written notice.`,
    `Upon ${obligationType}, all confidential information shall be returned and licenses shall immediately cease.`,
    `${obligationType} shall not relieve either party of obligations accrued prior to the effective date.`
  ];
}

function generateIPExamples(obligationType, companyName) {
  return [
    `All ${obligationType} created under this Agreement shall be the exclusive property of ${companyName}.`,
    `Pre-existing ${obligationType} shall remain with the originating party with a license granted for project use.`,
    `Any improvements to ${companyName}'s ${obligationType} shall be assigned to ${companyName} upon creation.`
  ];
}

function generateEmploymentExamples(obligationType, companyName) {
  return [
    `${obligationType} terms shall comply with all applicable employment laws and ${companyName}'s HR policies.`,
    `All ${obligationType} provisions shall be documented in writing and acknowledged by the affected employee.`,
    `${obligationType} obligations shall survive termination of employment as specified in the employee handbook.`
  ];
}

function generateTerritoryExamples(obligationType, companyName) {
  return [
    `${obligationType} restrictions shall apply to the defined market area as shown in Exhibit B.`,
    `Exclusive ${obligationType} rights are contingent upon meeting minimum performance standards annually.`,
    `Any expansion of ${obligationType} coverage requires prior written approval from ${companyName}.`
  ];
}

function generateDefaultExamples(obligationType, companyName) {
  // Smart default that incorporates the obligation name
  const action = extractActionWord(obligationType);
  return [
    `The parties shall ${action} all ${obligationType} requirements as detailed in this Agreement and applicable law.`,
    `${companyName} reserves the right to modify ${obligationType} terms with sixty (60) days' written notice to the other party.`,
    `Compliance with ${obligationType} shall be verified through quarterly reviews and annual third-party assessments.`
  ];
}

// Helper function to extract action words from obligation types
function extractActionWord(obligationType) {
  const obligation = obligationType.toLowerCase();

  if (obligation.includes('deliver')) return 'fulfill';
  if (obligation.includes('payment')) return 'process';
  if (obligation.includes('report')) return 'provide';
  if (obligation.includes('maintain')) return 'ensure';
  if (obligation.includes('protect')) return 'safeguard';
  if (obligation.includes('comply')) return 'adhere to';
  if (obligation.includes('monitor')) return 'track';
  if (obligation.includes('verify')) return 'validate';
  if (obligation.includes('manage')) return 'oversee';

  return 'implement'; // default action
}

// Additional specialized generators for specific obligation types
function generateSpecializedExamples(obligationType, companyName) {
  const specializedExamples = {
    "Deliverables": [
      `All Deliverables shall be provided in the format specified by ${companyName} and include source files where applicable.`,
      `Acceptance of Deliverables shall occur within ten (10) business days unless specific deficiencies are identified in writing.`,
      `Deliverables shall include all documentation, training materials, and knowledge transfer sessions as defined in the SOW.`
    ],
    "Escalation": [
      `Escalation procedures shall follow the path: Project Manager → Director → VP → C-Level with 24-hour response at each level.`,
      `Critical issues requiring Escalation shall be communicated to ${companyName}'s designated contact within two (2) hours of identification.`,
      `Escalation meetings shall be documented with action items, owners, and target resolution dates.`
    ],
    "Force Majeure": [
      `Force Majeure events include acts of God, war, terrorism, pandemic, or other circumstances beyond reasonable control.`,
      `The party affected by Force Majeure shall notify ${companyName} within forty-eight (48) hours and provide regular updates.`,
      `Force Majeure shall not excuse payment obligations for services already rendered or goods already delivered.`
    ],
    "Change Orders": [
      `All Change Orders must be approved in writing by authorized representatives of both parties before work commences.`,
      `Change Orders shall include impact analysis on timeline, budget, and resources with revised project plan.`,
      `Emergency Change Orders may proceed with verbal approval but require written confirmation within 24 hours.`
    ],
    "Breach Notification": [
      `Breach Notification shall be provided within the timeframes required by applicable law but no later than 72 hours.`,
      `Initial Breach Notification shall include nature of breach, data affected, and immediate mitigation steps taken.`,
      `${companyName} shall approve all Breach Notification communications to affected individuals or regulatory authorities.`
    ]
  };

  return specializedExamples[obligationType] || null;
}

// Master function that tries specialized, then pattern-based examples
function generateObligationExamples(obligationType, companyName) {
  // Try specialized examples first
  const specialized = generateSpecializedExamples(obligationType, companyName);
  if (specialized) return specialized;

  // Then try specific examples
  const specific = getSpecificExamples(obligationType, companyName);
  if (specific) return specific;

  // Finally use pattern-based generation
  return generatePatternBasedExamples(obligationType, companyName);
}