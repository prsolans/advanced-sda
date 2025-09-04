// 07_main.js (Updated to handle subindustry reference document)
function submitSampleRequest(e) {
    if (!e || !e.source) {
        Logger.log("ERROR: Function called without a valid event trigger.");
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
        SUBINDUSTRY: 10,
        CREATE_SETS: 11,
        STATUS: 12
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
            subindustry: sheet.getRange(firstRow, COLUMN_MAP.SUBINDUSTRY) ?
                sheet.getRange(firstRow, COLUMN_MAP.SUBINDUSTRY).getValue() : null,
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
        let userGuideUrl = null;

        // Generate user guide URL with industry and subindustry filters
        try {
            userGuideUrl = generateUserGuideUrl(requestData.industry, requestData.subindustry);
            Logger.log(`Generated user guide URL: ${userGuideUrl}`);
        } catch (e) {
            Logger.log("Could not generate user guide URL: " + e.message);
        }

        if (requestData.createSets === true) {
            Logger.log(`DEBUG: Document sets requested. createSets = ${requestData.createSets}`);
            Logger.log(`DEBUG: Request data: ${JSON.stringify(requestData, null, 2)}`);
            
            // Enhanced: Support both legacy and hierarchical document sets
            const useHierarchicalSets = true; // Feature flag for gradual rollout
            Logger.log(`DEBUG: useHierarchicalSets = ${useHierarchicalSets}`);
            
            if (useHierarchicalSets) {
                // NEW: Hierarchical Document Set Generation
                Logger.log(`DEBUG: Starting hierarchical document set generation for ${requestData.industry} - ${requestData.subindustry}`);
                
                // Check if DOCUMENT_SET_TEMPLATES is available
                Logger.log(`DEBUG: DOCUMENT_SET_TEMPLATES available: ${typeof DOCUMENT_SET_TEMPLATES !== 'undefined'}`);
                if (typeof DOCUMENT_SET_TEMPLATES !== 'undefined') {
                    Logger.log(`DEBUG: Available templates: ${Object.keys(DOCUMENT_SET_TEMPLATES).join(', ')}`);
                } else {
                    Logger.log(`ERROR: DOCUMENT_SET_TEMPLATES is undefined!`);
                    throw new Error('DOCUMENT_SET_TEMPLATES constant not available');
                }
                
                try {
                    const templateName = selectDocumentSetTemplate(requestData.industry, requestData.subindustry);
                    Logger.log(`DEBUG: Selected template: ${templateName}`);
                    
                    const template = DOCUMENT_SET_TEMPLATES[templateName];
                    
                    if (!template) {
                        Logger.log(`ERROR: Template not found: ${templateName}`);
                        Logger.log(`DEBUG: Available templates: ${Object.keys(DOCUMENT_SET_TEMPLATES).join(', ')}`);
                        throw new Error(`No suitable template found for ${requestData.industry} - ${requestData.subindustry}`);
                    }
                    
                    Logger.log(`DEBUG: Template found: ${template.description}`);
                    
                    // Calculate number of sets and documents
                    const avgDocsPerSet = Object.keys(template.defaultQuantities || {}).length || 5;
                    const numSets = Math.max(1, Math.floor(requestData.quantity / avgDocsPerSet));
                    let totalDocCount = 0;
                    
                    Logger.log(`DEBUG: Will generate ${numSets} sets, estimated ${avgDocsPerSet} docs per set`);
                    
                    // Generate each hierarchical document set
                    for (let setIndex = 0; setIndex < numSets; setIndex++) {
                        Logger.log(`DEBUG: Generating hierarchical set ${setIndex + 1}/${numSets}`);
                        
                        // Generate the complete document tree
                        const documentTree = generateHierarchicalDocumentSet(requestData, templateName);
                        Logger.log(`DEBUG: Generated document tree with ${documentTree.documents.size} documents`);
                        
                        // Link all parent-child relationships
                        linkAllHierarchicalParents(documentTree);
                        Logger.log(`DEBUG: Linked all parent-child relationships`);
                        
                        // Process all documents in the tree
                        const allDocs = flattenDocumentTree(documentTree);
                        totalDocCount += allDocs.length;
                        
                        Logger.log(`DEBUG: Flattened tree to ${allDocs.length} documents in set ${documentTree.setId}`);
                        
                        // Log document types generated
                        const docTypes = allDocs.map(doc => doc.agreementType).join(', ');
                        Logger.log(`DEBUG: Document types in set: ${docTypes}`);
                        
                        // Create files for each document
                        for (const docData of allDocs) {
                            Logger.log(`DEBUG: Creating file for ${docData.agreementType} (${docData.contractNumber})`);
                            processAndCreateFile(docData, subfolder);
                        }
                    }
                    
                    successMessage = `Success! ${totalDocCount} documents (${numSets} hierarchical sets) created using template: ${templateName}.`;
                    Logger.log(`DEBUG: Hierarchical generation completed successfully`);
                    
                } catch (hierarchicalError) {
                    Logger.log(`ERROR in hierarchical generation: ${hierarchicalError.message}`);
                    Logger.log(`DEBUG: Falling back to legacy document set generation`);
                    
                    // Fall back to legacy system
                    const numSets = Math.floor(requestData.quantity / 5);
                    const docCount = numSets * 5;
                    if (numSets < 1) throw new Error("Quantity must be 5 or more to create sets.");

                    // Process each set separately to create reference documents for each
                    for (let setIndex = 0; setIndex < numSets; setIndex++) {
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
                        const setDocuments = []; // Store all documents in this set for reference doc

                        for (const docType of DOCUMENT_SET_TYPES) {
                            const docData = generateSetDocumentRow(requestData, docType, setCounterparty);

                            if (docType.includes("MSA")) parents.MSA = docData;
                            if (docType.includes("SOW")) parents.SOW = docData;

                            linkParentContracts(docData, parents);
                            setDocuments.push(docData); // Add to set documents array

                            processAndCreateFile(docData, subfolder);
                        }
                    }

                    successMessage = `Success! ${docCount} documents (${numSets} legacy sets) created (fallback from hierarchical error).`;
                }
                
            } else {
                // LEGACY: Original fixed 5-document sets (maintained for backward compatibility)
                const numSets = Math.floor(requestData.quantity / 5);
                const docCount = numSets * 5;
                if (numSets < 1) throw new Error("Quantity must be 5 or more to create sets.");

                // Process each set separately to create reference documents for each
                for (let setIndex = 0; setIndex < numSets; setIndex++) {
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
                    const setDocuments = []; // Store all documents in this set for reference doc

                    for (const docType of DOCUMENT_SET_TYPES) {
                        const docData = generateSetDocumentRow(requestData, docType, setCounterparty);

                        if (docType.includes("MSA")) parents.MSA = docData;
                        if (docType.includes("SOW")) parents.SOW = docData;

                        linkParentContracts(docData, parents);
                        setDocuments.push(docData); // Add to set documents array

                        processAndCreateFile(docData, subfolder);
                    }
                }

                successMessage = `Success! ${docCount} documents (${numSets} legacy sets) created.`;
            }

        } else {
            // For individual documents, user guide provides document type details
            const docCount = requestData.quantity;

            for (let i = 0; i < docCount; i++) {
                const docData = generateRandomDocumentRow(requestData);
                processAndCreateFile(docData, subfolder);
            }
            successMessage = `Success! ${docCount} individual documents created.`;
        }

        statusRange.setValue(successMessage);

        // Send Slack notification with user guide URL
        sendSlackNotificationWithReferences(
            requestData.email,
            successMessage,
            requestData.language,
            subfolder.getUrl(),
            null, // No longer using contract set reference
            userGuideUrl
        );

    } catch (error) {
        Logger.log(`ERROR: Processing request in row ${firstRow}: ${error.message}`);
        statusRange.setValue(`Error: ${error.message}`);
    }
}