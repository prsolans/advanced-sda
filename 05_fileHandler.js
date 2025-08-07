// 05_fileHandler.js


// Fixed version of createFileInDriveV3 that ensures proper naming
function createFileInDriveV3(html, agreementType, language, contractNumber) {
    // Debug logging
    Logger.log(`createFileInDriveV3 called with:`);
    Logger.log(`  agreementType: "${agreementType}"`);
    Logger.log(`  language: "${language}"`);
    Logger.log(`  contractNumber: "${contractNumber}"`);
    
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
    
    // Join with " - " separator
    const fileName = fileNameParts.filter(part => part && part.length > 0).join(" - ");
    
    Logger.log(`Final filename will be: "${fileName}"`);

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

    Logger.log("Google Docs File ID: " + docFile.id);
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
    
    // Log what we're working with
    Logger.log(`processAndCreateFile - Processing document:`);
    Logger.log(`  agreementType: "${agreementType}"`);
    Logger.log(`  language: "${language}"`);
    Logger.log(`  contractNumber: "${contractNumber}"`);
    
    // Ensure we have an agreement type
    if (!agreementType) {
        Logger.log("ERROR: No agreementType in docData!");
        throw new Error("Missing agreementType in document data");
    }

    // Generate a number if one isn't already set
    const finalContractNumber = contractNumber || generateContractNumber(agreementType);
    docData.contractNumber = finalContractNumber; 

    Logger.log("docData going into prompt:\n" + JSON.stringify(docData, null, 2));

    const role = 'This GPT is designated to generate realistic sample agreements for use during AI demonstrations. It is tailored to create agreements with specific legal language and conditions that can be analyzed to return structured information.';
    const prompt = createPrompt(docData);

    try {
        const responseFromOpenAI = PreSalesOpenAI.executePrompt4o(role, prompt);

        // Pass all parameters explicitly and verify they exist
        Logger.log(`Calling createFileInDriveV3 with:`);
        Logger.log(`  agreementType: "${agreementType}"`);
        Logger.log(`  language: "${language || 'English'}"`);
        Logger.log(`  contractNumber: "${finalContractNumber}"`);
        
        const newFileId = createFileInDriveV3(
            responseFromOpenAI, 
            agreementType, 
            language || 'English', 
            finalContractNumber
        );

        const newFile = DriveApp.getFileById(newFileId);
        newFile.moveTo(subfolder);
        newFile.setDescription(`Template for ${firstParty} and ${counterparty}`);

    } catch (error) {
        Logger.log(`Failed to create document for ${agreementType} with ${counterparty}. Original Error: ${error.message}`);
        throw new Error(`Failed for ${agreementType}. Details: ${error.message}`);
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

// Create reference cover doc with refined formatting
function createSubindustryReferenceDoc(requestData, subfolder) {
  try {
    const { industry, subindustry, firstParty } = requestData;
    
    // Get all document types for this industry/subindustry
    const docTypes = [];
    for (const [docType, meta] of Object.entries(DOC_TYPE_LIBRARY)) {
      const industryMatch = meta.industries.includes(industry) || meta.industries.includes('All');
      const subindustryMatch = !subindustry || 
                              meta.subindustries.includes(subindustry) || 
                              meta.subindustries.includes('All');
      
      if (industryMatch && subindustryMatch) {
        docTypes.push({ name: docType, meta: meta });
      }
    }
    
    // Sort by category for better organization
    docTypes.sort((a, b) => {
      if (a.meta.category !== b.meta.category) {
        return a.meta.category.localeCompare(b.meta.category);
      }
      return a.name.localeCompare(b.name);
    });
    
    // Separate general and specific document types
    const generalDocs = docTypes.filter(d => 
      d.meta.category === 'General' || d.meta.category === 'HR-Cross-Industry' || d.meta.category === 'Real Estate-Specific'
    );
    const specificDocs = docTypes.filter(d => 
      d.meta.category === `${industry}-Specific`
    );
    
    // Build the HTML content
    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 1000px; 
      margin: 0 auto; 
      padding: 20px;
      background-color: #f9f9f9;
    }
    
    /* Typography */
    h1 { 
      font-size: 2.5rem; 
      color: #1a1a1a; 
      margin: 0 0 10px 0;
      border-bottom: 4px solid #ffc820;
      padding-bottom: 15px;
    }
    h2 { 
      font-size: 2rem; 
      color: #2c3e50; 
      margin: 40px 0 20px 0;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
    }
    h3 { 
      font-size: 1.5rem; 
      color: #34495e; 
      margin: 30px 0 15px 0;
      background-color: #f0f0f0;
      padding: 10px 15px;
      border-left: 4px solid #3498db;
    }
    h4 { 
      font-size: 1.25rem; 
      color: #555;
      margin: 20px 0 10px 0;
    }
    
    /* Header section */
    .header-section {
      background-color: #fff;
      padding: 0px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    
    .header-section p {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #555;
    }
    
    .metadata {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    
    .metadata p {
      margin: 5px 0;
      font-size: 0.95rem;
    }
    
    /* Document lists */
    .doc-list-section {
      background-color: #fff;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    
    .doc-list {
      list-style: none;
      padding: 0;
      margin: 15px 0;
    }
    
    .doc-list li {
      padding: 8px 15px;
      margin: 5px 0;
      background-color: #f8f9fa;
      border-left: 3px solid #3498db;
      border-radius: 3px;
      font-size: 0.95rem;
    }
    
    .doc-count {
      color: #666;
      font-style: italic;
      margin-left: 10px;
    }
    
    /* Tables */
    table {
      width: 950px;
      border-collapse: collapse;
      margin: 20px auto;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      table-layout: fixed;
    }
    
    th {
      background-color: #34495e;
      color: white;
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      font-size: 0.95rem;
    }
    
    th:first-child {
      width: 200px;
    }
    
    th:last-child {
      width: 750px;
    }
    
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: top;
    }
    
    td:first-child {
      width: 200px;
    }
    
    td:last-child {
      width: 750px;
    }
    
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    
    tr:hover {
      background-color: #f0f0f0;
    }
    
    .obligation-name {
      font-weight: 600;
      color: #2c3e50;
      white-space: nowrap;
    }
    
    .examples-cell {
      padding-left: 20px;
    }
    
    .example {
      margin: 8px 0;
      padding: 8px 12px;
      background-color: #f9f9f9;
      border-left: 2px solid #ddd;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #555;
      font-style: italic;
    }
    
    .example-number {
      font-weight: bold;
      color: #3498db;
      margin-right: 5px;
    }
    
    /* Document type section */
    .doc-type-section {
      background-color: #fff;
      padding: 25px;
      margin: 30px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .doc-meta {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .no-obligations {
      padding: 20px;
      text-align: center;
      color: #999;
      font-style: italic;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    
    /* Footer */
    .footer {
      margin-top: 60px;
      padding: 30px;
      background-color: #2c3e50;
      color: #ecf0f1;
      text-align: center;
      border-radius: 8px;
      font-size: 0.9rem;
    }
    
    .footer p {
      margin: 5px 0;
    }
    
    /* Docusign branding */
    .docusign-yellow {
      color: #ffc820;
    }
    
    @media print {
      body {
        background-color: white;
      }
      .header-section, .doc-list-section, .doc-type-section {
        box-shadow: none;
        border: 1px solid #ddd;
      }
    }
  </style>
</head>
<body>
  <h1>Document Type Reference Guide</h1>
  
  <div class="header-section">
    <h2>About This Reference Guide</h2>
    <p>The documents created for <strong>${firstParty}</strong> are specifically designed to include language and structured data that can be extracted using <strong class="docusign-yellow">Docusign Iris</strong>, our advanced AI-powered agreement analysis platform.</p>
    <p>Each document type contains industry-specific terms, obligations, and clauses that demonstrate how Docusign Iris can identify, extract, and analyze key contract data points, helping you manage agreements more efficiently and reduce risk.</p>
    
    <div class="metadata">
      <p><strong>Generated for:</strong> ${firstParty}</p>
      <p><strong>Industry:</strong> ${industry}</p>
      <p><strong>Subindustry:</strong> ${subindustry || 'All Subindustries'}</p>
      <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Document Types Available:</strong> ${docTypes.length}</p>
    </div>
  </div>
  
  <div class="doc-list-section">
    <h2>Document Types</h2>
    <p><em>Note: Document generation is randomized. The more documents you request, the greater variety you'll see in your generated set.</em></p>
    
    <h3>General Document Types <span class="doc-count">(${generalDocs.length} available)</span></h3>
    <ul class="doc-list">
`;

    // Add general documents
    generalDocs.forEach(doc => {
      html += `      <li>${doc.name}</li>\n`;
    });

    html += `    </ul>
    
    <h3>${industry}-Specific Document Types <span class="doc-count">(${specificDocs.length} available)</span></h3>
    <ul class="doc-list">
`;

    // Add specific documents
    specificDocs.forEach(doc => {
      html += `      <li>${doc.name}</li>\n`;
    });

    html += `    </ul>
  </div>
  
  <h2>Document Obligation Types</h2>
`;

    // Process industry-specific documents first
    let currentCategory = '';
    
    // Start with industry-specific docs
    const orderedDocs = [...specificDocs, ...generalDocs];
    
    orderedDocs.forEach(({ name, meta }) => {
      // Add category header if it changed
      if (meta.category !== currentCategory) {
        currentCategory = meta.category;
        html += `  <h3 style="margin-top: 50px;">${currentCategory} Documents</h3>\n`;
      }
      
      html += `  <div class="doc-type-section">`;
      html += `    <h3>${name}</h3>`;
      
      html += `    <div class="doc-meta">`;
      html += `      <strong>Contract Prefix:</strong> ${meta.key} | `;
      html += `      <strong>Description:</strong> ${meta.description}`;
      if (meta.noTerm) {
        html += ` | <strong>Type:</strong> One-time document (no term)`;
      }
      html += `    </div>`;
      
      // Add obligations table
      if (meta.obligations && meta.obligations.length > 0) {
        html += `    <h4>Obligations & Terms (${meta.obligations.length} defined)</h4>`;
        html += `    <table>`;
        html += `      <thead>`;
        html += `        <tr>`;
        html += `          <th>Obligation Type</th>`;
        html += `          <th>Example Language</th>`;
        html += `        </tr>`;
        html += `      </thead>`;
        html += `      <tbody>`;
        
        meta.obligations.forEach(oblKey => {
          const oblText = OBL_TEXT[oblKey];
          if (oblText) {
            html += `        <tr>`;
            html += `          <td class="obligation-name">${oblKey}</td>`;
            html += `          <td class="examples-cell">`;
            
            // Generate examples
            const examples = generateObligationExamples(oblKey, firstParty);
            examples.forEach((example, idx) => {
              html += `            <div class="example"><span class="example-number">${idx + 1}.</span> ${example}</div>`;
            });
            
            html += `          </td>`;
            html += `        </tr>`;
          }
        });
        
        html += `      </tbody>`;
        html += `    </table>`;
      } else {
        html += `    <div class="no-obligations">No specific obligations defined for this document type</div>`;
      }
      
      html += `  </div>`;
    });
    
    html += `
  <div class="footer">
    <p><strong>Docusign Iris Reference Guide</strong></p>
    <p>This document demonstrates the types of agreements and contract language that can be analyzed by Docusign Iris.</p>
    <p>© ${new Date().getFullYear()} Docusign, Inc. All rights reserved.</p>
  </div>
</body>
</html>`;

    // Create the file
    const fileName = `Reference Guide - ${industry} - ${subindustry || 'All'}`;
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
    
    // Move to the same folder as the generated documents
    const newFile = DriveApp.getFileById(docFile.id);
    newFile.moveTo(subfolder);
    newFile.setDescription(`Reference guide for ${industry} - ${subindustry || 'All'} document types`);
    
    Logger.log(`Created reference document: ${fileName}`);
    return docFile.id;
    
  } catch (error) {
    Logger.log(`Error creating reference document: ${error.message}`);
    // Don't throw - this is supplementary, shouldn't stop main process
  }
}

// Systematic approach to generate examples for ALL obligations
function generateObligationExamples(obligationType, companyName) {
  // First, check if we have specific examples
  const specificExamples = getSpecificExamples(obligationType, companyName);
  if (specificExamples) return specificExamples;
  
  // Otherwise, generate based on patterns and keywords
  return generatePatternBasedExamples(obligationType, companyName);
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