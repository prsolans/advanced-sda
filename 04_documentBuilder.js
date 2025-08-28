// 04_documentBuilder.js (Refactored)

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

    const contractNumber = generateContractNumber(agreementType);
    const detailsObject = buildAgreementDetails(agreementType, contractNumber);
    const parts = detailsObject.parts;

    // Check if this document type should include financial values
    if (shouldIncludeFinancialValuesLegacy(agreementType)) {
        const financialValues = generateFinancialValuesLegacy(agreementType, docData.industry, docData.geography);
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
        const counterparty = pick(COUNTERPARTIES);
        const agreementType = customConfig.documentType; // Use override type
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
    const counterparty = pick(COUNTERPARTIES);

    // Check for document type override in special instructions
    const docTypeOverride = parseDocumentTypeOverride(requestData.specialInstructions);
    if (docTypeOverride) {
        return generateCustomDocumentRow(requestData, docTypeOverride);
    }

    const validTypes = getDocTypesForSubindustry(requestData.subindustry);

    if (validTypes.length === 0) {
        Logger.log("No valid document types found for subindustry: " + requestData.subindustry);
        return null;
    }


    const agreementType = pick(validTypes);
    const contractNumber = generateContractNumber(agreementType);
    const detailsObject = buildAgreementDetails(agreementType, contractNumber);
    const parts = detailsObject.parts;

    // Check if this document type should include financial values
    if (shouldIncludeFinancialValuesLegacy(agreementType)) {
        const financialValues = generateFinancialValuesLegacy(agreementType, docData.industry, docData.geography);
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
    const counterparty = pick(COUNTERPARTIES);
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
        contractNumber
    };
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