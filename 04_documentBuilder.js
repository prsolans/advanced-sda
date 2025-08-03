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

    const firstParty = requestData.firstParty;
    const counterparty = pick(COUNTERPARTIES);

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
        geography: requestData.geography || "NAMER",
        specialInstructions: parts.join(", "),
        effectiveDate: detailsObject.effectiveDate,
        contractNumber
    };
}
