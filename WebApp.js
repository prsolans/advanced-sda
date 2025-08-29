// WebApp.js - Complete file

function doGet(e) {
  try {
    Logger.log('doGet called with parameters: ' + JSON.stringify(e.parameter));
    
    // Serve the single-page application
    Logger.log('Serving single-page application');
    return HtmlService.createHtmlOutputFromFile('spa')
      .setTitle('Advanced Sample Document Assistant (ASDA)')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log('Error in doGet: ' + error.message);
    return HtmlService.createHtmlOutput('<h1>Error: ' + error.message + '</h1>');
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = processFormSubmission(data);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: result.message,
        rowNumber: result.rowNumber
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processFormSubmission(formData) {
  // Get the spreadsheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName('Requests');

  if (!sheet) {
    throw new Error('Requests sheet not found');
  }

  // Prepare the row data based on your column structure
  const rowData = [
    new Date(), // Timestamp (Column A)
    formData.email, // Email (Column B)
    formData.quantity, // Quantity (Column C)
    '', // Special Instructions (Column D) - empty for now
    formData.docTypes || '', // Doc Types (Column E) - we'll handle this below
    formData.language || 'English', // Language (Column F)
    formData.firstParty || 'Fontara', // First Party (Column G)
    formData.geography, // Geography (Column H)
    formData.industry, // Industry (Column I)
    formData.subindustry || '', // Subindustry (Column J)
    false, // Create Sets (Column K) - default to false for now
    'Pending' // Status (Column L)
  ];

  // If subindustry is provided, we need to determine appropriate doc types
  if (formData.subindustry && formData.subindustry !== 'All') {
    // Get relevant doc types for the industry/subindustry combination
    const relevantDocTypes = getDocTypesForSubindustry(formData.industry, formData.subindustry);
    rowData[4] = relevantDocTypes; // Set Doc Types column
  } else {
    // Use general doc types for the industry
    const generalDocTypes = getGeneralDocTypesForIndustry(formData.industry);
    rowData[4] = generalDocTypes;
  }

  // Append the row
  const newRow = sheet.appendRow(rowData);
  const rowNumber = sheet.getLastRow();

  // Process the row directly
  try {
    processRowDirectly(sheet, rowNumber, formData);
    return {
      message: 'Documents are being generated. You will receive an email notification when complete.',
      rowNumber: rowNumber
    };
  } catch (error) {
    // Update status to error
    sheet.getRange(rowNumber, 12).setValue('Error: ' + error.toString()); // Column L is 12
    throw error;
  }
}

function processRowDirectly(sheet, rowNumber, formData) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  try {
    const statusRange = sheet.getRange(rowNumber, 12); // Column L
    statusRange.setValue("Processing...");

    const properties = PropertiesService.getScriptProperties();
    const rootFolderId = properties.getProperty("ROOT_FOLDER_ID");
    if (!rootFolderId) throw new Error("ROOT_FOLDER_ID is not set in Script Properties.");

    // Build requestData from the sheet
    const requestData = {
      email: sheet.getRange(rowNumber, 2).getValue(),
      quantity: parseInt(sheet.getRange(rowNumber, 3).getValue(), 10),
      specialInstructions: sheet.getRange(rowNumber, 4).getValue(),
      docTypeString: sheet.getRange(rowNumber, 5).getValue(),
      language: sheet.getRange(rowNumber, 6).getValue(),
      geography: sheet.getRange(rowNumber, 8).getValue() || "NAMER",
      firstParty: (sheet.getRange(rowNumber, 7).getValue() || "").toString().trim() || "Fontara",
      industry: sheet.getRange(rowNumber, 9).getValue(),
      subindustry: sheet.getRange(rowNumber, 10).getValue(),
      createSets: sheet.getRange(rowNumber, 11).getValue() === true,
    };

    if (!requestData.email || !requestData.quantity || requestData.quantity <= 0) {
      throw new Error("Invalid or missing Email or Quantity.");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const folderName = `${requestData.email}_${requestData.industry}_${requestData.subindustry || 'General'}_${timestamp}`;
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const subfolder = rootFolder.createFolder(folderName);

    let successMessage = "";
    let userGuideUrl = null;

    // Generate user guide URL with industry and subindustry filters
    try {
      userGuideUrl = generateUserGuideUrl(requestData.industry, requestData.subindustry);
      Logger.log("Generated user guide URL: " + userGuideUrl);
    } catch (refError) {
      Logger.log("Could not generate user guide URL: " + refError.message);
    }

    if (requestData.createSets === true) {
      // Document sets logic
      const numSets = Math.floor(requestData.quantity / 5);
      const docCount = numSets * 5;
      if (numSets < 1) throw new Error("Quantity must be 5 or more to create sets.");

      const allSetTypes = getDocTypesForIndustry(requestData.industry);
      const DOCUMENT_SET_TYPES = [
        allSetTypes.find(t => t.includes("NDA")) || "Non-Disclosure Agreement (NDA)",
        allSetTypes.find(t => t.includes("MSA")) || "Master Service Agreement (MSA)",
        allSetTypes.find(t => t.includes("SOW")) || "Statement Of Work (SOW)",
        allSetTypes.find(t => t.includes("SOW")) || "Statement Of Work (SOW)",
        allSetTypes.find(t => t.includes("Change Order")) || "Change Order"
      ];

      let parents = {};
      const setCounterparty = pick(COUNTERPARTIES);

      for (const docType of DOCUMENT_SET_TYPES) {
        const docData = generateSetDocumentRow(requestData, docType, setCounterparty);
        if (docType.includes("MSA")) parents.MSA = docData;
        if (docType.includes("SOW")) parents.SOW = docData;
        linkParentContracts(docData, parents);
        Logger.log("Doc Data: " + JSON.stringify(docData, null, 2));
        processAndCreateFile(docData, subfolder);
      }

      successMessage = `Success! ${docCount} documents (${numSets} sets) created.`;

    } else {
      // Individual documents
      const docCount = requestData.quantity;

      // Get valid document types for this industry/subindustry
      const validDocTypes = [];
      for (const [docType, meta] of Object.entries(DOC_TYPE_LIBRARY)) {
        const industryMatch = meta.industries.includes(requestData.industry) || meta.industries.includes('All');
        const subindustryMatch = !requestData.subindustry ||
          meta.subindustries.includes(requestData.subindustry) ||
          meta.subindustries.includes('All');

        if (industryMatch && subindustryMatch) {
          validDocTypes.push(docType);
        }
      }

      Logger.log(`Found ${validDocTypes.length} valid doc types for ${requestData.industry}/${requestData.subindustry}`);

      if (validDocTypes.length === 0) {
        throw new Error(`No document types found for ${requestData.industry}/${requestData.subindustry}`);
      }

      // Generate documents
      for (let i = 0; i < docCount; i++) {
        const counterparty = pick(COUNTERPARTIES);
        const agreementType = pick(validDocTypes);

        Logger.log(`Creating document ${i + 1}: ${agreementType}`);

        // Create document data directly
        const contractNumber = generateContractNumber(agreementType);
        const detailsObject = buildAgreementDetails(agreementType, contractNumber);

        // THIS IS WHERE docData IS CREATED
        const docData = {
          email: requestData.email,
          language: requestData.language || 'English', // Ensure language is set
          firstParty: requestData.firstParty,
          counterparty: counterparty,
          agreementType: agreementType, // Critical - must be set!
          industry: requestData.industry,
          subindustry: requestData.subindustry,
          geography: requestData.geography,
          specialInstructions: detailsObject.parts.join(", "),
          effectiveDate: detailsObject.effectiveDate,
          contractNumber: contractNumber
        };

        // Add financial terms for applicable document types
        if (shouldIncludeFinancialValuesWebApp(agreementType)) {
          const financialValues = generateFinancialValuesWebApp(agreementType, formData.industry, formData.geography);
          
          docData.specialInstructions += `, Total Contract Value: ${financialValues.contractValue}`;
          docData.specialInstructions += `, Deposit Amount: ${financialValues.depositAmount}, Deposit Due: ${financialValues.depositDue}`;
          docData.specialInstructions += `, Payment Amount: ${financialValues.oneTimeAmount}, Due: ${financialValues.firstPaymentDue}`;
          docData.specialInstructions += `, Monthly Amount: ${financialValues.monthlyAmount}`;
        }

        // Add obligations
        const meta = getDocMetaByName(agreementType);
        if (meta && meta.obligations) {
          const shuffle = arr => arr.sort(() => Math.random() - 0.5);
          const selected = shuffle([...meta.obligations]).slice(0, pick([1, 2, 3]));
          selected.forEach(key => {
            if (OBL_TEXT[key]) {
              docData.specialInstructions += ", " + OBL_TEXT[key];
            }
          });
        }

        Logger.log(`Processing document with data: ${JSON.stringify(docData)}`);
        processAndCreateFile(docData, subfolder);
      }

      successMessage = `Success! ${docCount} individual documents created.`;
    }

    statusRange.setValue(successMessage);
    
    // Send email notification to requester
    sendDocumentReadyEmail(requestData, successMessage, subfolder.getUrl(), userGuideUrl);
    
    // Send Slack notification with user guide link
    sendSlackNotificationWithReferences(
      requestData.email, 
      successMessage, 
      requestData.language, 
      subfolder.getUrl(),
      null, // No contract set reference
      userGuideUrl
    );
    Logger.log("Email and Slack notifications sent with folder link.");

  } catch (error) {
    Logger.log(`Error processing request in row ${rowNumber}: ${error.message}`);
    sheet.getRange(rowNumber, 12).setValue(`Error: ${error.message}`);
    throw error;
  }
}

function getDocTypesForSubindustry(industry, subindustry) {
  const relevantTypes = [];

  // Iterate through DOC_TYPE_LIBRARY to find matches
  for (const [docType, meta] of Object.entries(DOC_TYPE_LIBRARY)) {
    const industryMatch = meta.industries.includes(industry) || meta.industries.includes('All');
    const subindustryMatch = meta.subindustries.includes(subindustry) || meta.subindustries.includes('All');

    if (industryMatch && subindustryMatch) {
      relevantTypes.push(docType);
    }
  }

  Logger.log(`Found ${relevantTypes.length} doc types for ${industry}/${subindustry}: ${relevantTypes.join(', ')}`);

  // Format as groups for the spreadsheet display
  if (relevantTypes.length > 0) {
    const general = relevantTypes.filter(t => DOC_TYPE_LIBRARY[t].category === 'General' || DOC_TYPE_LIBRARY[t].category === 'HR-Cross-Industry');
    const specific = relevantTypes.filter(t => !general.includes(t));

    let formattedString = '';
    if (general.length > 0) {
      formattedString += `General (${general.join(', ')})`;
    }
    if (specific.length > 0) {
      if (formattedString) formattedString += ', ';
      formattedString += `${industry}-Specific (${specific.join(', ')})`;
    }

    return formattedString;
  }

  return `General (Non-Disclosure Agreement (NDA), Master Service Agreement (MSA))`;
}

function getGeneralDocTypesForIndustry(industry) {
  const generalTypes = [];

  for (const [docType, meta] of Object.entries(DOC_TYPE_LIBRARY)) {
    if ((meta.industries.includes(industry) || meta.industries.includes('All')) &&
      (meta.category === 'General' || meta.category === 'HR-Cross-Industry')) {
      generalTypes.push(docType);
    }
  }

  return generalTypes.length > 0 ?
    `General (${generalTypes.join(', ')})` :
    `General (Non-Disclosure Agreement (NDA), Master Service Agreement (MSA))`;
}

// Add this function to get the current user's email
function getCurrentUserEmail() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (e) {
    Logger.log('Could not get user email: ' + e.toString());
    return '';
  }
}

// Helper functions for financial value generation in WebApp
function shouldIncludeFinancialValuesWebApp(agreementType) {
  const financialDocTypes = [
    'SOW', 'Statement of Work',
    // MSA removed - payment terms only, no specific values
    'Consulting Agreement',
    'Service Agreement', 
    'Supply Agreement',
    'Investment Advisory',
    'Cloud Services',
    'Software License',
    'API Terms',
    'SaaS Agreement',
    'Clinical Trial'
  ];

  return financialDocTypes.some(docType => 
    agreementType.toLowerCase().includes(docType.toLowerCase())
  );
}

function generateFinancialValuesWebApp(agreementType, industry, geography) {
  // Geography map for WebApp
  const geographyMap = {
    'NAMER': { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY' },
    'EMEA': { currency: 'EUR', currencySymbol: '€', dateFormat: 'DD/MM/YYYY' },
    'APAC': { currency: 'varies', currencySymbol: '¥/$', dateFormat: 'DD/MM/YYYY' },
    'LATAM': { currency: 'USD', currencySymbol: '$', dateFormat: 'DD/MM/YYYY' }
  };
  
  const geo = geographyMap[geography] || geographyMap['NAMER'];
  
  // Industry-based value ranges
  const industryRanges = {
    'Healthcare': { min: 100000, max: 2000000, depositRate: 0.15 },
    'Financial Services': { min: 250000, max: 5000000, depositRate: 0.20 },
    'Technology': { min: 75000, max: 1500000, depositRate: 0.10 },
    'Energy': { min: 500000, max: 10000000, depositRate: 0.25 },
    'Manufacturing': { min: 200000, max: 3000000, depositRate: 0.20 },
    'Real Estate': { min: 1000000, max: 50000000, depositRate: 0.10 },
    'default': { min: 50000, max: 500000, depositRate: 0.15 }
  };

  // Document type multipliers
  const docTypeMultipliers = {
    'MSA': 1.5,
    'Investment Advisory': 3.0,
    'Supply Agreement': 2.0,
    'Cloud Services': 1.2,
    'Consulting': 0.8,
    'License': 0.7,
    'SOW': 1.0
  };

  // Get base ranges
  const range = industryRanges[industry] || industryRanges['default'];
  
  // Find document type multiplier
  let multiplier = 1.0;
  for (const [docKey, mult] of Object.entries(docTypeMultipliers)) {
    if (agreementType.includes(docKey)) {
      multiplier = mult;
      break;
    }
  }

  // Calculate adjusted ranges
  const adjustedMin = Math.floor(range.min * multiplier);
  const adjustedMax = Math.floor(range.max * multiplier);
  
  // Generate main contract value
  const contractValue = Math.floor(Math.random() * (adjustedMax - adjustedMin)) + adjustedMin;
  
  // Generate related amounts
  const depositAmount = Math.floor(contractValue * range.depositRate);
  const oneTimeAmount = Math.floor(contractValue * (0.05 + Math.random() * 0.15));
  const monthlyAmount = Math.floor(contractValue * (0.02 + Math.random() * 0.08));
  
  // Generate dates
  const today = new Date();
  const depositDue = new Date(today.getTime() + Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
  const firstPaymentDue = new Date(today.getTime() + Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);

  // Format amounts with proper currency
  const formatAmount = (amount) => {
    const formatted = amount.toLocaleString();
    if (geo.currency === 'EUR') {
      return `€${formatted} EUR`;
    } else if (geo.currency === 'USD') {
      return `$${formatted} USD`;
    } else {
      return `${geo.currencySymbol}${formatted}`;
    }
  };

  // Format dates for geography
  const formatDate = (date) => {
    if (geo.dateFormat === 'DD/MM/YYYY') {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } else {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
  };

  return {
    contractValue: formatAmount(contractValue),
    depositAmount: formatAmount(depositAmount), 
    oneTimeAmount: formatAmount(oneTimeAmount),
    monthlyAmount: formatAmount(monthlyAmount),
    depositDue: formatDate(depositDue),
    firstPaymentDue: formatDate(firstPaymentDue)
  };
}

// Test function to verify the web app is working
function testWebApp() {
  const testData = {
    email: 'test@example.com',
    firstParty: 'Test Company',
    geography: 'NAMER',
    industry: 'Technology',
    subindustry: 'SaaS',
    quantity: 5
  };

  const result = processFormSubmission(testData);
  Logger.log(result);
}

// ===== DOCUMENT READY EMAIL NOTIFICATIONS =====

/**
 * Send email notification to document requester when documents are ready
 */
function sendDocumentReadyEmail(requestData, successMessage, folderUrl, userGuideUrl = null) {
  try {
    if (!requestData.email) {
      Logger.log('No email provided for document ready notification');
      return 'skipped';
    }

    const subject = 'Your Advanced Sample Document Assistant (ASDA) Documents Are Ready! 📄';
    
    // Extract count and document type from success message for more personalized content
    const docCount = requestData.quantity || 1;
    const industry = requestData.industry || 'business';
    const subindustry = requestData.subindustry || '';
    const language = requestData.language || 'English';
    const firstParty = requestData.firstParty || 'your company';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 Your Documents Are Ready!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Professional legal documents generated by Advanced Sample Document Assistant (ASDA)</p>
        </div>
        
        <div style="background: white; border: 1px solid #e1e8ed; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 25px;">
            <h2 style="color: #28a745; margin: 0 0 10px 0; font-size: 18px;">✅ Generation Complete</h2>
            <p style="color: #2c3e50; margin: 0; font-size: 16px; font-weight: 500;">${successMessage}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">📋 Your Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #2c3e50; width: 140px;">Documents:</td>
                <td style="padding: 8px 0; color: #34495e;">${docCount} professional legal ${industry}${subindustry ? ` (${subindustry})` : ''} documents</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #2c3e50;">Language:</td>
                <td style="padding: 8px 0; color: #34495e;">${language}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #2c3e50;">Company:</td>
                <td style="padding: 8px 0; color: #34495e;">${firstParty}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #2c3e50;">Generated:</td>
                <td style="padding: 8px 0; color: #34495e;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${folderUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); margin-bottom: 15px;">
              📁 Access Your Documents
            </a>
            ${userGuideUrl ? `
            <div style="margin-top: 15px;">
              <a href="${userGuideUrl}" style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);">
                📖 Document Types & Obligations Guide
              </a>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 25px 0;">
            <h4 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 16px;">💡 What's Included</h4>
            <ul style="color: #34495e; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 18px;">
              <li>Professional legal documents ready for review</li>
              <li>Industry-specific terminology and clauses</li>
              <li>Realistic sample data and business terms</li>
              <li>Proper legal formatting and structure</li>
              ${language !== 'English' ? '<li>Content fully translated to your chosen language</li>' : ''}
            </ul>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
            <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important Note</h4>
            <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
              These documents contain sample data and should be reviewed by legal counsel before use in actual business situations. They are intended for demonstration and template purposes.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0 10px 0;">
            <p style="color: #34495e; font-size: 14px; line-height: 1.6; margin: 0;">
              Need different documents or have feedback? 
              <a href="#" style="color: #667eea; text-decoration: none;">Let us know!</a>
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e8ed; text-align: center; color: #7f8c8d; font-size: 12px;">
            <p style="margin: 0;">Generated by Advanced Sample Document Assistant (ASDA) - Professional Document Generation</p>
            <p style="margin: 5px 0 0 0;">Powered by AI technology from DocuSign</p>
          </div>
        </div>
      </div>
    `;
    
    const textBody = `
🎉 Your Advanced Sample Document Assistant (ASDA) Documents Are Ready!

${successMessage}

📋 Your Request Details:
- Documents: ${docCount} professional legal ${industry}${subindustry ? ` (${subindustry})` : ''} documents  
- Language: ${language}
- Company: ${firstParty}
- Generated: ${new Date().toLocaleString()}

📁 Access your documents: ${folderUrl}
${userGuideUrl ? `📖 Document Types & Obligations Guide: ${userGuideUrl}` : ''}

💡 What's Included:
- Professional legal documents ready for review
- Industry-specific terminology and clauses  
- Realistic sample data and business terms
- Proper legal formatting and structure
${language !== 'English' ? '- Content fully translated to your chosen language' : ''}

⚠️ Important Note:
These documents contain sample data and should be reviewed by legal counsel before use in actual business situations. They are intended for demonstration and template purposes.

---
Generated by Advanced Sample Document Assistant (ASDA) - Professional Document Generation
Powered by AI technology from DocuSign
    `;
    
    MailApp.sendEmail({
      to: requestData.email,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody
    });
    
    Logger.log(`Document ready email sent to ${requestData.email}`);
    return 'success';
    
  } catch (error) {
    Logger.log(`Error sending document ready email: ${error.message}`);
    return 'failed';
  }
}

// ===== FEEDBACK SYSTEM =====

/**
 * Get current user information for feedback form pre-population
 */
function getUserInfo() {
  try {
    const user = Session.getActiveUser();
    return {
      name: user.getName() || '',
      email: user.getEmail() || ''
    };
  } catch (error) {
    Logger.log(`Error getting user info: ${error.message}`);
    return { name: '', email: '' };
  }
}

/**
 * Handle feedback form submissions
 */
function submitFeedback(feedbackData) {
  try {
    Logger.log(`Processing feedback submission: ${JSON.stringify(feedbackData)}`);
    
    // Store in Google Sheet
    const sheetResult = storeFeedbackInSheet(feedbackData);
    
    // Send email notification to Paul
    const emailResult = sendFeedbackEmail(feedbackData);
    
    // Send confirmation email to submitter
    const confirmationResult = sendFeedbackConfirmationEmail(feedbackData);
    
    // Send Slack notification
    let slackResult = 'skipped';
    try {
      Logger.log('Attempting to send Slack notification for feedback...');
      sendFeedbackSlackNotification(feedbackData);
      slackResult = 'success';
      Logger.log('Slack notification for feedback sent successfully');
    } catch (slackError) {
      Logger.log(`Slack notification failed: ${slackError.message}`);
      Logger.log(`Slack error stack: ${slackError.stack}`);
      slackResult = 'failed';
      // Continue processing even if Slack fails
    }
    
    Logger.log(`Feedback processed - Sheet: ${sheetResult}, Email: ${emailResult}, Confirmation: ${confirmationResult}, Slack: ${slackResult}`);
    
    return {
      success: true,
      message: 'Feedback submitted successfully!'
    };
    
  } catch (error) {
    Logger.log(`Error processing feedback: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Store feedback in Google Sheet
 */
function storeFeedbackInSheet(feedbackData) {
  try {
    // Get the same spreadsheet used for main form submissions
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get or create feedback tab
    let feedbackSheet = spreadsheet.getSheetByName('Feedback');
    if (!feedbackSheet) {
      feedbackSheet = spreadsheet.insertSheet('Feedback');
      
      // Add headers
      const headers = [
        'Timestamp',
        'Name', 
        'Email',
        'Job Title',
        'Location',
        'Feedback',
        'User Agent',
        'IP Address'
      ];
      feedbackSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Format headers
      const headerRange = feedbackSheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
      feedbackSheet.setFrozenRows(1);
    }
    
    // Prepare row data
    const rowData = [
      new Date(),
      feedbackData.name || '',
      feedbackData.email || '',
      feedbackData.jobTitle || '',
      feedbackData.location || '',
      feedbackData.feedback || '',
      Session.getTemporaryActiveUserKey() || 'N/A',
      'N/A' // IP address not available in Apps Script
    ];
    
    // Add the data
    feedbackSheet.appendRow(rowData);
    
    // Auto-resize columns
    feedbackSheet.autoResizeColumns(1, rowData.length);
    
    return 'success';
    
  } catch (error) {
    Logger.log(`Error storing feedback in sheet: ${error.message}`);
    throw error;
  }
}

/**
 * Send feedback email notification
 */
function sendFeedbackEmail(feedbackData) {
  try {
    const recipient = 'paul.solans@docusign.com';
    const subject = `Advanced Sample Document Assistant (ASDA) Feedback - ${feedbackData.name || 'Anonymous'}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">New Advanced Sample Document Assistant (ASDA) Feedback</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Received: ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background: white; border: 1px solid #e1e8ed; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c3e50; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #34495e;">${feedbackData.name || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Email:</td>
              <td style="padding: 8px 0; color: #34495e;">${feedbackData.email || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Job Title:</td>
              <td style="padding: 8px 0; color: #34495e;">${feedbackData.jobTitle || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #2c3e50;">Location:</td>
              <td style="padding: 8px 0; color: #34495e;">${feedbackData.location || 'Not provided'}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 10px;">Feedback:</h3>
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; line-height: 1.6;">
              ${feedbackData.feedback ? feedbackData.feedback.replace(/\n/g, '<br>') : 'No feedback provided'}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e8ed; text-align: center; color: #7f8c8d; font-size: 14px;">
            <p>This feedback was submitted through the Advanced Sample Document Assistant (ASDA) webapp feedback form.</p>
          </div>
        </div>
      </div>
    `;
    
    // Plain text version
    const textBody = `
Advanced Sample Document Assistant (ASDA) Feedback Submission

Name: ${feedbackData.name || 'Not provided'}
Email: ${feedbackData.email || 'Not provided'}  
Job Title: ${feedbackData.jobTitle || 'Not provided'}
Location: ${feedbackData.location || 'Not provided'}

Feedback:
${feedbackData.feedback || 'No feedback provided'}

Submitted: ${new Date().toLocaleString()}
    `;
    
    MailApp.sendEmail({
      to: recipient,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody
    });
    
    Logger.log(`Feedback email sent to ${recipient}`);
    return 'success';
    
  } catch (error) {
    Logger.log(`Error sending feedback email: ${error.message}`);
    throw error;
  }
}

/**
 * Send confirmation email to feedback submitter
 */
function sendFeedbackConfirmationEmail(feedbackData) {
  try {
    if (!feedbackData.email) {
      Logger.log('No email provided for feedback confirmation');
      return 'skipped';
    }

    const subject = 'Thank you for your Advanced Sample Document Assistant (ASDA) feedback!';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Thank You for Your Feedback!</h2>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">We've received your feedback about Advanced Sample Document Assistant (ASDA)</p>
        </div>
        
        <div style="background: white; border: 1px solid #e1e8ed; border-top: none; padding: 25px; border-radius: 0 0 8px 8px;">
          <p style="color: #2c3e50; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hi ${feedbackData.name ? feedbackData.name.split(' ')[0] : 'there'},
          </p>
          
          <p style="color: #34495e; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            Thank you for taking the time to share your thoughts about Advanced Sample Document Assistant (ASDA)! Your feedback is incredibly valuable 
            and helps us improve the document generation experience for everyone.
          </p>
          
          <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0;">
            <p style="color: #2c3e50; margin: 0; font-weight: 600; font-size: 14px;">Your feedback:</p>
            <p style="color: #34495e; margin: 10px 0 0 0; font-size: 14px; line-height: 1.5;">
              "${feedbackData.feedback ? feedbackData.feedback.substring(0, 200) + (feedbackData.feedback.length > 200 ? '...' : '') : 'Thank you for your input!'}"
            </p>
          </div>
          
          <p style="color: #34495e; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
            We review all feedback carefully and use it to prioritize improvements and new features. 
            If your feedback requires a direct response, someone from our team will get back to you soon.
          </p>
          
          <p style="color: #34495e; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
            Keep using Advanced Sample Document Assistant (ASDA) to generate professional legal documents, and don't hesitate to reach out 
            with any additional thoughts or suggestions!
          </p>
          
          <div style="text-align: center; margin: 25px 0;">
            <p style="color: #667eea; font-weight: 600; font-size: 16px; margin: 0;">
              Thank you for helping us improve! 🚀
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e8ed; text-align: center; color: #7f8c8d; font-size: 12px;">
            <p style="margin: 0;">This is an automated confirmation from Advanced Sample Document Assistant (ASDA).</p>
            <p style="margin: 5px 0 0 0;">Submitted on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;
    
    const textBody = `
Thank You for Your Advanced Sample Document Assistant (ASDA) Feedback!

Hi ${feedbackData.name ? feedbackData.name.split(' ')[0] : 'there'},

Thank you for taking the time to share your thoughts about Advanced Sample Document Assistant (ASDA)! Your feedback is incredibly valuable and helps us improve the document generation experience for everyone.

Your feedback: "${feedbackData.feedback || 'Thank you for your input!'}"

We review all feedback carefully and use it to prioritize improvements and new features. If your feedback requires a direct response, someone from our team will get back to you soon.

Keep using Advanced Sample Document Assistant (ASDA) to generate professional legal documents, and don't hesitate to reach out with any additional thoughts or suggestions!

Thank you for helping us improve!

---
This is an automated confirmation from Advanced Sample Document Assistant (ASDA).
Submitted on ${new Date().toLocaleString()}
    `;
    
    MailApp.sendEmail({
      to: feedbackData.email,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody
    });
    
    Logger.log(`Feedback confirmation email sent to ${feedbackData.email}`);
    return 'success';
    
  } catch (error) {
    Logger.log(`Error sending feedback confirmation email: ${error.message}`);
    return 'failed';
  }
}

/**
 * Map industry names to their category names in DOC_TYPE_LIBRARY
 * This handles inconsistencies between form submission names and library categories
 */
function mapIndustryToCategory(industry) {
  const industryMapping = {
    'Financial Services': 'Financial'  // Maps "Financial Services" to "Financial-Specific"
  };
  
  return industryMapping[industry] || industry;
}

/**
 * Get document library data for user guide
 * Returns filtered document data based on industry/subindustry
 */
function getDocumentLibraryData(industry = null, subindustry = null) {
  try {
    if (!industry) {
      // Return all industry-specific documents
      const filtered = {};
      Object.entries(DOC_TYPE_LIBRARY).forEach(([docName, docData]) => {
        if (docData.category && docData.category.includes('-Specific')) {
          filtered[docName] = docData;
        }
      });
      return filtered;
    }
    
    // Map industry name to category name
    const categoryIndustry = mapIndustryToCategory(industry);
    
    // Filter by industry and optionally subindustry
    const filtered = {};
    Object.entries(DOC_TYPE_LIBRARY).forEach(([docName, docData]) => {
      if (docData.category === `${categoryIndustry}-Specific`) {
        // Check subindustry filter
        if (!subindustry || 
            docData.subindustries.includes(subindustry) || 
            docData.subindustries.includes('All')) {
          filtered[docName] = docData;
        }
      }
    });
    
    Logger.log(`Filtered document library: ${Object.keys(filtered).length} documents for ${industry}${subindustry ? '/' + subindustry : ''} (mapped to ${categoryIndustry})`);
    return filtered;
    
  } catch (error) {
    Logger.log(`Error getting document library data: ${error.message}`);
    return {};
  }
}

/**
 * Get obligation library data for user guide
 * Returns obligation examples organized by obligation type
 */
function getObligationLibraryData() {
  try {
    // Generate obligation examples for all known obligation types
    const obligationExamples = {};
    const sampleCompany = "Company"; // Generic company name for examples
    
    // Get all unique obligation types from document library
    const obligationTypes = new Set();
    Object.values(DOC_TYPE_LIBRARY).forEach(doc => {
      if (doc.obligations && Array.isArray(doc.obligations)) {
        doc.obligations.forEach(obligation => {
          obligationTypes.add(obligation);
        });
      }
    });
    
    // Generate examples for each obligation type
    obligationTypes.forEach(obligationType => {
      const examples = generateObligationExamples(obligationType, sampleCompany);
      if (examples && examples.length > 0) {
        obligationExamples[obligationType] = examples;
      }
    });
    
    return obligationExamples;
    
  } catch (error) {
    Logger.log(`Error getting obligation library data: ${error.message}`);
    return {};
  }
}

/**
 * Generate URL for user guide with hash-based navigation
 * @param {string} industry - Optional industry filter (now ignored due to SPA navigation)
 * @param {string} subindustry - Optional subindustry filter (now ignored due to SPA navigation)
 * @returns {string} - Complete URL to user guide using hash navigation
 */
function generateUserGuideUrl(industry = null, subindustry = null) {
  try {
    // Get the web app URL
    const webAppUrl = ScriptApp.getService().getUrl();
    
    // Use hash-based navigation for single-page application
    const url = webAppUrl + '#guide';
    
    Logger.log(`Generated user guide URL with hash navigation: ${url}`);
    return url;
    
  } catch (error) {
    Logger.log(`Error generating user guide URL: ${error.message}`);
    return ScriptApp.getService().getUrl() + '#guide';
  }
}