// 07_main.js (Refactored)
function submitSampleRequest(e) {
  if (!e || !e.source) {
    Logger.log("Function called without a valid event trigger.");
    return;
  }
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const spreadsheet = e.source;
  const sheet = spreadsheet.getActiveSheet();
  const activeRange = spreadsheet.getActiveRange();
  const firstRow = activeRange.getRow();

  if (sheet.getName() !== "Requests" || firstRow <= 1) return;

  const COLUMN_MAP = {
    EMAIL: 2,
    QUANTITY: 3,
    SPECIAL_INSTRUCTIONS: 4,
    DOC_TYPES: 5,
    LANGUAGE: 6,
    FIRST_PARTY: 7,
    GEOGRAPHY: 8,
    INDUSTRY: 9,
    CREATE_SETS: 10,
    STATUS: 11
  };
  const statusRange = sheet.getRange(firstRow, COLUMN_MAP.STATUS);

  try {
    statusRange.setValue("Processing...");

    const properties = PropertiesService.getScriptProperties();
    const rootFolderId = properties.getProperty("ROOT_FOLDER_ID");
    if (!rootFolderId) throw new Error("ROOT_FOLDER_ID is not set in Script Properties.");

    const requestData = {
      email: sheet.getRange(firstRow, COLUMN_MAP.EMAIL).getValue(),
      quantity: parseInt(sheet.getRange(firstRow, COLUMN_MAP.QUANTITY).getValue(), 10),
      specialInstructions: sheet.getRange(firstRow, COLUMN_MAP.SPECIAL_INSTRUCTIONS).getValue(),
      docTypeString: sheet.getRange(firstRow, COLUMN_MAP.DOC_TYPES).getValue(),
      language: sheet.getRange(firstRow, COLUMN_MAP.LANGUAGE).getValue(),
      geography: sheet.getRange(firstRow, COLUMN_MAP.GEOGRAPHY).getValue() || "NAMER",
      firstParty: (sheet.getRange(firstRow, COLUMN_MAP.FIRST_PARTY).getValue() || "").toString().trim() || "Fontara",
      industry: sheet.getRange(firstRow, COLUMN_MAP.INDUSTRY).getValue() || pick(INDUSTRIES),
      createSets: sheet.getRange(firstRow, COLUMN_MAP.CREATE_SETS).getValue() === true,
    };

    if (!requestData.email || !requestData.quantity || requestData.quantity <= 0) {
      throw new Error("Invalid or missing Email or Quantity.");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const folderName = `${requestData.email}_${timestamp}`;
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const subfolder = rootFolder.createFolder(folderName);

    let successMessage = "";

    if (requestData.createSets === true) {
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
      const docCount = requestData.quantity;
      for (let i = 0; i < docCount; i++) {
        const docData = generateRandomDocumentRow(requestData);
        processAndCreateFile(docData, subfolder);
      }
      successMessage = `Success! ${docCount} individual documents created.`;
    }

    statusRange.setValue(successMessage);
    sendSlackNotification(requestData.email, successMessage, requestData.language, subfolder.getUrl());
    Logger.log("Slack notification sent with folder link.");

  } catch (error) {
    Logger.log(`Error processing request in row ${firstRow}: ${error.message}`);
    statusRange.setValue(`Error: ${error.message}`);
  }
}
