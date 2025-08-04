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

    if (agreementType.includes("SOW")) {
        const today = new Date();
        const totalValue = Math.floor(Math.random() * 450000) + 50000;
        const depositAmount = Math.floor(Math.random() * 20000) + 5000;
        const oneTimeAmount = Math.floor(Math.random() * 40000) + 10000;
        const depositDue = addDays(today, Math.floor(Math.random() * 180));
        const oneTimeDue = addDays(today, Math.floor(Math.random() * 180));
        parts.push(
            `Total Contract Value: $${totalValue.toLocaleString()} USD`,
            `Deposit Amount: $${depositAmount.toLocaleString()} USD, Deposit Due: ${fmt(depositDue)}`,
            `One-Time Payment: $${oneTimeAmount.toLocaleString()} USD, Due: ${fmt(oneTimeDue)}`
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

    if (agreementType.includes("SOW")) {
        const today = new Date();
        const totalValue = Math.floor(Math.random() * 450000) + 50000;
        const depositAmount = Math.floor(Math.random() * 20000) + 5000;
        const oneTimeAmount = Math.floor(Math.random() * 40000) + 10000;
        const depositDue = addDays(today, Math.floor(Math.random() * 180));
        const oneTimeDue = addDays(today, Math.floor(Math.random() * 180));
        parts.push(
            `Total Contract Value: $${totalValue.toLocaleString()} USD`,
            `Deposit Amount: $${depositAmount.toLocaleString()} USD, Deposit Due: ${fmt(depositDue)}`,
            `One-Time Payment: $${oneTimeAmount.toLocaleString()} USD, Due: ${fmt(oneTimeDue)}`
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