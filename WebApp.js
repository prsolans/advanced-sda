// WebApp.js - Complete file

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Document Generation Request Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
        
        // Add any special fields for SOWs
        if (agreementType.includes("SOW")) {
          const today = new Date();
          const totalValue = Math.floor(Math.random() * 450000) + 50000;
          const depositAmount = Math.floor(Math.random() * 20000) + 5000;
          const oneTimeAmount = Math.floor(Math.random() * 40000) + 10000;
          const depositDue = new Date(today.getTime() + Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
          const oneTimeDue = new Date(today.getTime() + Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
          
          docData.specialInstructions += `, Total Contract Value: $${totalValue.toLocaleString()} USD`;
          docData.specialInstructions += `, Deposit Amount: $${depositAmount.toLocaleString()} USD, Deposit Due: ${Utilities.formatDate(depositDue, Session.getScriptTimeZone(), "MM/dd/yyyy")}`;
          docData.specialInstructions += `, One-Time Payment: $${oneTimeAmount.toLocaleString()} USD, Due: ${Utilities.formatDate(oneTimeDue, Session.getScriptTimeZone(), "MM/dd/yyyy")}`;
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
    sendSlackNotification(requestData.email, successMessage, requestData.language, subfolder.getUrl());
    Logger.log("Slack notification sent with folder link.");

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