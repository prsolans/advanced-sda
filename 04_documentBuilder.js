// 04_documentBuilder.js (Refactored)

/**
 * Check if a document type is an HR document that should use person names as counterparties
 * @param {string} agreementType - Document type to check
 * @returns {boolean} - True if HR document type
 */
function isHRDocumentType(agreementType) {
    const meta = getDocMetaByName(agreementType);
    if (meta && meta.category === "HR-Cross-Industry") {
        return true;
    }
    if (meta && meta.industries && meta.industries.includes("HR")) {
        return true;
    }
    return false;
}

function buildAgreementDetails(agreementType, contractNumber) {
    const today = new Date();
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const fmt = date => Utilities.formatDate(date, Session.getScriptTimeZone(), "MM/dd/yyyy");

    const isNoTerm = isNoTermDocType(agreementType);
    let effectiveDate, termYears, termEndDate, renewalNoticePeriod, renewalNoticeDate, actionRequiredBy;

    if (isNoTerm) {
        const daysAgo = pick([30, 60, 90, 180, 365]);
        effectiveDate = addDays(today, -daysAgo);
    } else {
        const daysUntilExpiry = Math.floor(Math.random() * 180) + 1;
        termEndDate = addDays(today, daysUntilExpiry);
        termYears = pick(TERM_OPTIONS);
        effectiveDate = new Date(termEndDate);
        effectiveDate.setFullYear(effectiveDate.getFullYear() - termYears);
        renewalNoticePeriod = pick(DAYS_NOTICE);
        renewalNoticeDate = addDays(termEndDate, -renewalNoticePeriod);
        actionRequiredBy = addDays(today, Math.floor(Math.random() * 180));
    }

    const parts = [`Effective Date: ${fmt(effectiveDate)}`];

    if (contractNumber) {
        parts.unshift(`Contract Number: ${contractNumber}`);
    }

    if (!isNoTerm) {
        parts.push(
            `Initial Term: ${termYears} year(s)`,
            `Expiration Date: ${fmt(termEndDate)}`,
            `Renewal Notice Period: ${renewalNoticePeriod} days`,
            `Renewal Notice Date: ${fmt(renewalNoticeDate)}`,
            `Action Required By: ${fmt(actionRequiredBy)}`,
            `Assignment (General): ${pick(ASSIGN_OPTS)}`,
            `Assignment (Change of Control): ${pick(ASSIGN_OPTS)}`,
            `Assignment (Termination Rights): ${pick(["Yes", "No"])}`,
            `Payment Terms: ${pick(PAYMENT_TERMS)}`,
            `Termination for Cause Notice: ${pick(DAYS_NOTICE)} days`,
            `Termination for Convenience Notice: ${pick(DAYS_NOTICE)} days`
        );
    }

    return { effectiveDate: effectiveDate, parts: parts };
}

function generateSetDocumentRow(requestData, agreementType, counterparty) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const shuffle = arr => arr.sort(() => Math.random() - 0.5);
    const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const fmt = date => Utilities.formatDate(date, Session.getScriptTimeZone(), "MM/dd/yyyy");

    // For HR documents, use individual person names instead of shared set counterparty
    const actualCounterparty = isHRDocumentType(agreementType) ? 
        generateRandomPersonName() : 
        counterparty;

    const contractNumber = generateContractNumber(agreementType);
    const detailsObject = buildAgreementDetails(agreementType, contractNumber);
    const parts = detailsObject.parts;

    // Check if this document type should include financial values
    if (shouldIncludeFinancialValuesLegacy(agreementType)) {
        const financialValues = generateFinancialValuesLegacy(agreementType, requestData.industry, requestData.geography);
        parts.push(
            `Total Contract Value: ${financialValues.contractValue}`,
            `Deposit Amount: ${financialValues.depositAmount}, Deposit Due: ${financialValues.depositDue}`,
            `Payment Amount: ${financialValues.oneTimeAmount}, Due: ${financialValues.firstPaymentDue}`,
            `Monthly Amount: ${financialValues.monthlyAmount}`
        );
    }

    const meta = getDocMetaByName(agreementType);
    const possible = meta?.obligations || [];
    const selected = shuffle(possible).slice(0, pick([1, 2, 3]));
    selected.forEach(key => {
        if (OBL_TEXT[key]) parts.push(OBL_TEXT[key]);
    });

    return {
        email: requestData.email,
        language: requestData.language,
        firstParty: requestData.firstParty,
        counterparty: actualCounterparty,
        agreementType,
        industry: requestData.industry || "Technology",
        subindustry: requestData.subindustry || "SaaS",
        geography: requestData.geography || "NAMER",
        specialInstructions: parts.join(", "),
        effectiveDate: detailsObject.effectiveDate,
        contractNumber,
        // Enhanced: Add hierarchy metadata structure
        hierarchy: {
            level: null,
            parentId: null,
            rootId: null,
            ancestorPath: [],
            children: [],
            relationshipType: null
        },
        setId: null,
        template: null
    };
}

function generateRandomDocumentRow(requestData) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const shuffle = arr => arr.sort(() => Math.random() - 0.5);
    const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const fmt = date => Utilities.formatDate(date, Session.getScriptTimeZone(), "MM/dd/yyyy");

    // CUSTOM: Check for document type override first
    // Handles CLIENT_AGREEMENT and PROVIDER_AGREEMENT special instructions
    const customConfig = parseCustomInstructions(requestData.specialInstructions);
    if (customConfig.documentType) {
        // Override the document type selection
        const firstParty = requestData.firstParty;
        const agreementType = customConfig.documentType; // Use override type
        
        // Use person name for HR documents, company name for others
        const counterparty = isHRDocumentType(agreementType) ? 
            generateRandomPersonName() : 
            pick(COUNTERPARTIES);
            
        const contractNumber = generateContractNumber(agreementType);
        const detailsObject = buildAgreementDetails(agreementType, contractNumber);

        return {
            email: requestData.email,
            language: requestData.language,
            firstParty,
            counterparty,
            agreementType,
            industry: "Healthcare", // Force to healthcare for custom types
            subindustry: "Custom",
            geography: requestData.geography || "NAMER",
            specialInstructions: requestData.specialInstructions,
            effectiveDate: detailsObject.effectiveDate,
            contractNumber
        };
    }

    const firstParty = requestData.firstParty;
    
    // Check for document type override in special instructions
    const docTypeOverride = parseDocumentTypeOverride(requestData.specialInstructions);
    let agreementType;
    if (docTypeOverride) {
        agreementType = docTypeOverride;
    } else {
        const validTypes = getDocTypesForSubindustry(requestData.subindustry);
        if (validTypes.length === 0) {
            Logger.log("No valid document types found for subindustry: " + requestData.subindustry);
            return null;
        }
        agreementType = pick(validTypes);
    }
    
    // Use person name for HR documents, company name for others
    const counterparty = isHRDocumentType(agreementType) ? 
        generateRandomPersonName() : 
        pick(COUNTERPARTIES);
    const contractNumber = generateContractNumber(agreementType);
    const detailsObject = buildAgreementDetails(agreementType, contractNumber);
    const parts = detailsObject.parts;

    // Check if this document type should include financial values
    if (shouldIncludeFinancialValuesLegacy(agreementType)) {
        const financialValues = generateFinancialValuesLegacy(agreementType, requestData.industry, requestData.geography);
        parts.push(
            `Total Contract Value: ${financialValues.contractValue}`,
            `Deposit Amount: ${financialValues.depositAmount}, Deposit Due: ${financialValues.depositDue}`,
            `Payment Amount: ${financialValues.oneTimeAmount}, Due: ${financialValues.firstPaymentDue}`,
            `Monthly Amount: ${financialValues.monthlyAmount}`
        );
    }

    const meta = getDocMetaByName(agreementType);
    const possible = meta?.obligations || [];
    const selected = shuffle(possible).slice(0, pick([1, 2, 3]));
    selected.forEach(key => {
        if (OBL_TEXT[key]) parts.push(OBL_TEXT[key]);
    });

    return {
        email: requestData.email,
        language: requestData.language,
        firstParty,
        counterparty,
        agreementType,
        industry: requestData.industry || "Technology",
        subindustry: requestData.subindustry || "SaaS",
        geography: requestData.geography || "NAMER",
        specialInstructions: parts.join(", "),
        effectiveDate: detailsObject.effectiveDate,
        contractNumber
    };
}
// ========================================
// CUSTOM DOCUMENT TYPES - Healthcare
// ========================================
// Functions for generating custom healthcare documents
// with specific field requirements for extraction tools
// Added for CHG client/provider agreement generation

/**
 * CUSTOM: Detects if special instructions contain custom document type override
 * @param {string} specialInstructions - Raw special instructions from spreadsheet
 * @returns {string|null} - Document type name or null if no override detected
 * 
 * Checks for: CLIENT_AGREEMENT, PROVIDER_AGREEMENT keywords
 * Added: [DATE] for CHG healthcare document extraction requirements
 */

function parseDocumentTypeOverride(specialInstructions) {
    if (!specialInstructions) return null;

    // Check for document type commands
    if (specialInstructions.includes("DOC_TYPE: Client Agreement") ||
        specialInstructions.includes("CLIENT_AGREEMENT")) {
        return "Client Agreement";
    }

    if (specialInstructions.includes("DOC_TYPE: Provider Agreement") ||
        specialInstructions.includes("PROVIDER_AGREEMENT")) {
        return "Physician Professional Services Agreement";
    }

    return null;
}
/**
 * CUSTOM: Generate custom healthcare documents with extraction-ready fields
 * @param {Object} requestData - Request data from spreadsheet
 * @param {string} documentType - Custom document type (Client Agreement, Provider Agreement)
 * @returns {Object} - Document data object for prompt generation
 * 
 * Creates documents with specific field requirements for AI extraction tools
 * Added: [DATE] for CHG healthcare document extraction requirements
 */
function generateCustomDocumentRow(requestData, documentType) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    
    // Use person name for HR documents, company name for others
    const counterparty = isHRDocumentType(documentType) ? 
        generateRandomPersonName() : 
        pick(COUNTERPARTIES);
    const contractNumber = generateContractNumber(documentType);

    return {
        email: requestData.email,
        language: requestData.language,
        firstParty: requestData.firstParty,
        counterparty,
        agreementType: documentType,  // Override with custom type
        industry: "Healthcare",       // Force to healthcare
        subindustry: "Custom",        // Mark as custom
        geography: requestData.geography || "NAMER",
        specialInstructions: requestData.specialInstructions, // Pass through for prompt building
        effectiveDate: new Date(),
        contractNumber,
        // Enhanced: Add hierarchy metadata structure
        hierarchy: {
            level: null,
            parentId: null,
            rootId: null,
            ancestorPath: [],
            children: [],
            relationshipType: null
        },
        setId: null,
        template: null
    };
}

// ========================================
// HIERARCHICAL DOCUMENT SET GENERATION
// ========================================

/**
 * Generate a complete hierarchical document set based on a template
 * @param {Object} requestData - Request data from spreadsheet
 * @param {string} templateName - Name of the template to use
 * @returns {Object} - Document tree with all generated documents
 */
function generateHierarchicalDocumentSet(requestData, templateName) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    
    const template = DOCUMENT_SET_TEMPLATES[templateName];
    if (!template) {
        throw new Error(`Template not found: ${templateName}`);
    }
    
    const setId = generateSetId();
    const setCounterparty = pick(COUNTERPARTIES);
    
    const documentTree = {
        setId,
        templateName,
        industry: requestData.industry,
        subindustry: requestData.subindustry,
        counterparty: setCounterparty,
        documents: new Map(), // contractNumber -> docData
        hierarchy: new Map(), // level -> [contractNumbers]
        rootDocuments: []
    };
    
    // Find root documents (level 0)
    const rootTypes = Object.keys(template.structure).filter(
        docType => template.structure[docType].level === 0
    );
    
    Logger.log(`DEBUG: Template structure keys: ${Object.keys(template.structure).join(', ')}`);
    Logger.log(`DEBUG: Root document types (level 0): ${rootTypes.join(', ')}`);
    
    // Generate each root document and its children
    for (const rootType of rootTypes) {
        Logger.log(`DEBUG: Generating root document: ${rootType}`);
        const rootDoc = buildDocumentBranch(
            documentTree, 
            template, 
            rootType, 
            null, // no parent
            0,    // level 0
            requestData
        );
        documentTree.rootDocuments.push(rootDoc.contractNumber);
        Logger.log(`DEBUG: Generated root document: ${rootDoc.agreementType} (${rootDoc.contractNumber})`);
    }
    
    return documentTree;
}

/**
 * Recursively build a document branch in the hierarchy
 * @param {Object} tree - The document tree being built
 * @param {Object} template - Template structure
 * @param {string} docType - Document type to create
 * @param {string} parentId - Parent contract number (null for root)
 * @param {number} level - Hierarchy level
 * @param {Object} requestData - Request data
 * @returns {Object} - Generated document data
 */
function buildDocumentBranch(tree, template, docType, parentId, level, requestData) {
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    
    Logger.log(`DEBUG: buildDocumentBranch called with docType: "${docType}", level: ${level}, parentId: ${parentId}`);
    
    // Generate base document data
    const docData = generateSetDocumentRow(requestData, docType, tree.counterparty);
    
    Logger.log(`DEBUG: generateSetDocumentRow returned agreementType: "${docData.agreementType}"`);
    
    // Get template definition for this document type
    const templateDef = template.structure[docType];
    
    if (!templateDef) {
        Logger.log(`ERROR: No template definition found for docType: "${docType}"`);
        Logger.log(`Available document types in template: ${Object.keys(template.structure).join(', ')}`);
        throw new Error(`Template definition not found for document type: ${docType}`);
    }
    
    // Set hierarchy metadata
    docData.hierarchy = {
        level,
        parentId,
        rootId: parentId ? tree.documents.get(parentId).hierarchy.rootId : docData.contractNumber,
        ancestorPath: parentId ? 
            [...tree.documents.get(parentId).hierarchy.ancestorPath, parentId] : 
            [],
        children: [],
        relationshipType: templateDef.relationshipType
    };
    
    // Set document tree metadata
    docData.setId = tree.setId;
    docData.template = tree.templateName;
    
    // Store document in tree
    tree.documents.set(docData.contractNumber, docData);
    
    // Add to hierarchy level tracking
    if (!tree.hierarchy.has(level)) {
        tree.hierarchy.set(level, []);
    }
    tree.hierarchy.get(level).push(docData.contractNumber);
    
    // Update parent's children array
    if (parentId && tree.documents.has(parentId)) {
        tree.documents.get(parentId).hierarchy.children.push(docData.contractNumber);
    }
    
    // Generate children recursively
    const childTypes = templateDef.allowedChildren || [];
    if (childTypes.length > 0) {
        const maxChildren = templateDef.maxChildren;
        
        // Determine number of children to generate
        let numChildren;
        if (maxChildren === 0) {
            numChildren = 0; // No children allowed
        } else if (maxChildren === -1) {
            // Unlimited: use template default or random 1-2
            const defaultQuantities = template.defaultQuantities || {};
            numChildren = Math.min(childTypes.length, 
                Object.keys(defaultQuantities).length > 0 ? 1 : Math.floor(Math.random() * 2) + 1
            );
        } else {
            // Limited: random up to max
            numChildren = Math.min(maxChildren, Math.floor(Math.random() * maxChildren) + 1);
        }
        
        // Generate children
        const selectedChildTypes = [];
        for (let i = 0; i < numChildren && childTypes.length > 0; i++) {
            // For templates with default quantities, use those preferentially
            const childType = template.defaultQuantities && 
                Object.keys(template.defaultQuantities).some(key => childTypes.includes(key)) ?
                childTypes.find(type => template.defaultQuantities[type] && !selectedChildTypes.includes(type)) ||
                pick(childTypes.filter(type => !selectedChildTypes.includes(type))) :
                pick(childTypes.filter(type => !selectedChildTypes.includes(type)));
            
            if (childType) {
                selectedChildTypes.push(childType);
                buildDocumentBranch(
                    tree, 
                    template, 
                    childType, 
                    docData.contractNumber, 
                    level + 1, 
                    requestData
                );
            }
        }
    }
    
    return docData;
}

/**
 * Get all documents in a set as a flat array
 * @param {Object} documentTree - The document tree
 * @returns {Array} - Array of all document data objects
 */
function flattenDocumentTree(documentTree) {
    return Array.from(documentTree.documents.values());
}

/**
 * Get documents by hierarchy level
 * @param {Object} documentTree - The document tree
 * @param {number} level - Hierarchy level to retrieve
 * @returns {Array} - Array of document data objects at the specified level
 */
function getDocumentsByLevel(documentTree, level) {
    const contractNumbers = documentTree.hierarchy.get(level) || [];
    return contractNumbers.map(contractNumber => documentTree.documents.get(contractNumber));
}

/**
 * Select the best template for given industry and subindustry
 * @param {string} industry - Industry name
 * @param {string} subindustry - Subindustry name
 * @returns {string} - Template name
 */
function selectDocumentSetTemplate(industry, subindustry) {
    // Get available templates for this industry/subindustry combination
    const available = Object.entries(DOCUMENT_SET_TEMPLATES)
        .filter(([name, template]) => {
            if (template.subindustries && template.subindustries.includes(subindustry)) return true;
            if (template.industry === industry) return true;
            if (template.industry === "All") return true;
            return false;
        })
        .map(([name, template]) => ({ name, ...template }));
    
    // Priority: subindustry-specific > industry-specific > default
    const subindustrySpecific = available.find(t => 
        t.subindustries && t.subindustries.includes(subindustry) && t.industry !== "All"
    );
    if (subindustrySpecific) return subindustrySpecific.name;
    
    const industrySpecific = available.find(t => t.industry === industry);
    if (industrySpecific) return industrySpecific.name;
    
    return "Standard MSA Flow"; // Default fallback
}

// Helper functions for enhanced financial value generation in legacy system
function shouldIncludeFinancialValuesLegacy(agreementType) {
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

function generateFinancialValuesLegacy(agreementType, industry, geography) {
  // Geography map for legacy system
  const geographyMap = {
    'NAMER': { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/dd/yyyy' },
    'EMEA': { currency: 'EUR', currencySymbol: '€', dateFormat: 'dd/MM/yyyy' },
    'APAC': { currency: 'varies', currencySymbol: '¥/$', dateFormat: 'dd/MM/yyyy' },
    'LATAM': { currency: 'USD', currencySymbol: '$', dateFormat: 'dd/MM/yyyy' }
  };
  
  const geo = geographyMap[geography || 'NAMER'] || geographyMap['NAMER'];
  
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
  const range = industryRanges[industry || 'default'] || industryRanges['default'];
  
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

  // Format dates using legacy system function
  const fmt = date => Utilities.formatDate(date, Session.getScriptTimeZone(), geo.dateFormat);

  return {
    contractValue: formatAmount(contractValue),
    depositAmount: formatAmount(depositAmount), 
    oneTimeAmount: formatAmount(oneTimeAmount),
    monthlyAmount: formatAmount(monthlyAmount),
    depositDue: fmt(depositDue),
    firstPaymentDue: fmt(firstPaymentDue)
  };
}