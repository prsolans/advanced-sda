/**
 * Assembles the complete AI prompt by calling all modular helper functions.
 * @param {Object} docData An object containing all data for a single document.
 * @return {string} The final, complete prompt to be sent to the AI.
 */
function createPrompt(docData) {
    // Destructure all needed properties from the docData object
    const {
        agreementType, industry, subindustry, geography, language, specialInstructions,
        firstParty, counterparty, contractNumber,
        parentContractNumber, parentContractDate, parentType
    } = docData;

    Logger.log(`Inside createPrompt - agreementType=${agreementType}, firstParty=${firstParty}, parentType=${parentType}, parentContractNum=${parentContractNumber}, contractNumber=${contractNumber}, counterparty=${counterparty}`);

    let parentReference = "";
    if (docData.parentContractNumber && docData.parentType && docData.parentContractDate) {
        parentReference = `This document is governed by the parent ${docData.parentType}, dated ${docData.parentContractDate}, with Contract Number ${docData.parentContractNumber}. Ensure the terms of this document are consistent with the parent agreement.`;
    }

    // --- Conditionally create a display for the doc's own contract number ---
    let contractNumberDisplay = "";
    if (contractNumber) {
        contractNumberDisplay = `Contract Number: ${contractNumber}`;
    }

    // --- Call all the modular helper functions ---
    const setup = getPromptSetup(agreementType, industry, geography);
    const objective = getPromptObjective(industry, firstParty, language);
    const instructions = getPromptInstructions(industry, firstParty);
    const generalRequirements = getPromptGeneralRequirements(firstParty, industry, counterparty, subindustry, geography);
    const outputFormat = getPromptOutputFormat(firstParty, industry, counterparty);
    const specificRequirements = getPromptSpecifics(agreementType, firstParty, industry, counterparty);

    // --- Assemble the final prompt ---
    const documentSpecificRequirements = `Document-Specific Requirements:
${specificRequirements}
For each document type, ensure that all sections are written as complete paragraphs, with no bullet points or numbered lists. Each section should flow naturally, fully explaining the legal concepts and providing clarity to the terms. Each document should reflect ${firstParty} business and legal requirements as outlined. 
`;

    const prompt = `
${parentReference}
${contractNumberDisplay}

Inputs:
Agreement Type: [${agreementType}]
Industry: [${industry}]
Geography: [${geography}]
Language: [${language}]
Special Instructions: [${specialInstructions}]

${setup}
${objective}
${instructions}
${generalRequirements}
${outputFormat}

${documentSpecificRequirements}

Instructions:

1. Research agreements for the input Industry and Geography
2. Review the Special Instructions. 
3. Use this information to generate an agreement that provides a realistic representation of this type of agreement. DO NOT include any explanatory text before or after the agreement. 
`;

    console.log("Doc Specific Reqs: " + documentSpecificRequirements);
    return prompt;
}

function getPromptSetup(agreementType, industry, geography) {
    const setup = `What it means to be a Sample Document Assistant
This Sample Document Assistant is an expert in creating tailored legal documents containing realistic sample data and language for the ${industry} industry. The assistant specialized in generating agreements for the ${industry} industry in ${geography}, and will research as necessary to create realistic sample agreements for demonstrations. The goal of these demonstrations is to ensure the audience that Docusign understands their business, and a realistic document including realistic language can help achieve that goal.

Output
Generate a .docx file that serves as a sample agreement for the specified type of legal agreement. This agreement will be tailored for a ${agreementType} for a ${industry} business in ${geography}, will be written in the language provided in the input, and include sample information for fictitious agreements. `;
    return setup;
}

function getPromptInstructions(industry, firstParty) {
    return `Instructions for Using the Variables:
${industry} Variable:
The ${industry} variable represents the type of business or sector in which ${firstParty} operates. When using the script, ${industry} should be replaced with the appropriate business type relevant to the context of the contract.

[Country] Variable:
 The [country] variable should be replaced with only one country name where ${firstParty} is based or where the agreement is being applied. This will ensure that the document’s content, including regulations, currency, and date format, aligns with the legal requirements of the country.
 For example:
If the company is based in France, replace [country] with "France".
If the agreement is being generated for a UK-based contract, replace [country] with "United Kingdom".
For any other countries, replace [country] accordingly.
Fictitious Company Address:
 The Fictitious Company Address will be automatically generated based on the [country] variable. For example:
For France, the address might be "123 Rue de la Technologie, Paris, 75001".
For United Kingdom, the address might be "45 High Street, London, EC1A 1BB".
 The generated company address will ensure a credible and localized appearance for the fictitious company.
Execution Date:
 The Execution Date will be automatically generated within the current year, in the format of dd/mm/yyyy. The date should range from 01/01/yyyy to 31/12/yyyy (e.g., 15/11/2024).
Jurisdiction City:
 The Jurisdiction City for all documents will be the capital of the country specified in the [country] variable. For example:
France: Paris
United Kingdom: London
Germany: Berlin
United States: Washington, D.C.
  `;
}

function getPromptObjective(industry, firstParty, language) {

    const objective = `Objective:
To generate Word documents with contractual information in ${language}. These documents should reflect the specific context of ${firstParty}, a company based in [Country], operating in the ${industry} sector. Each document must be comprehensive, realistic, compliant with professional legal practices, and adapted to the company’s activities in ${industry}. Where applicable, the documents must include relevant local regulations specific to the ${industry} and [country], such as BaFin in Germany or GDPR in the EU. Additionally, all monetary values in the documents must use the currency consistent with the country where the agreement applies (e.g., euros for France, pounds for the UK, etc.). Any numbers should be written out in words, followed by the numerical form in parentheses, wherever possible (e.g., "thirty (30) days").Dates should be formatted according to the [country]’s standard date format (e.g., dd/mm/yyyy for France, mm/dd/yyyy for the United States, etc.).

  `;
    return objective;
}

// Add these new helper functions to 03_promptBuilder.js:

function getSubindustrySpecificGuidance(subindustry) {
    const guidanceMap = {
        "Wealth Management": "Focus on fiduciary responsibilities, fee transparency, and regulatory compliance with SEC and state investment advisor requirements. Include provisions for investment policy statements and performance reporting.",
        "SaaS": "Emphasize data security, service level agreements, API governance, and GDPR compliance. Include provisions for data processing, user access controls, and system availability guarantees.",
        "Healthcare IT": "Prioritize HIPAA compliance, patient data protection, and interoperability standards. Include provisions for electronic health records, audit trails, and emergency access procedures.",
        "Automotive": "Focus on quality standards (IATF 16949), supply chain security, and automotive safety regulations. Include provisions for just-in-time delivery, tooling requirements, and recall procedures.",
        "Solar": "Emphasize system performance guarantees, utility interconnection standards, and renewable energy compliance. Include provisions for net metering, permitting, and environmental impact.",
        "Banking": "Focus on federal banking regulations, FDIC compliance, and anti-money laundering requirements. Include provisions for deposit insurance, regulatory reporting, and customer due diligence.",
        "Insurance": "Emphasize state insurance regulations, solvency requirements, and claims handling standards. Include provisions for policy administration, actuarial compliance, and regulatory filing.",
        "Digital Health": "Focus on FDA software as medical device regulations, clinical validation, and patient safety. Include provisions for data integrity, clinical workflows, and regulatory submissions.",
        "Telehealth": "Emphasize state licensing requirements, patient consent, and emergency protocols. Include provisions for cross-state practice, technology standards, and clinical documentation.",
        "Pharmaceuticals": "Focus on FDA Good Manufacturing Practices, clinical trial regulations, and drug safety reporting. Include provisions for batch documentation, pharmacovigilance, and regulatory compliance.",
        "Gaming": "Emphasize age verification, content ratings, and platform compliance. Include provisions for virtual goods, payment processing, and user-generated content moderation.",
        "E-commerce": "Focus on consumer protection, payment security, and marketplace regulations. Include provisions for product liability, shipping terms, and customer data protection.",
        "Fintech": "Emphasize financial services regulations, payment processing compliance, and consumer protection. Include provisions for KYC requirements, fraud prevention, and regulatory reporting.",
        "Aerospace": "Focus on AS9100 quality standards, NADCAP certification, and export control regulations. Include provisions for configuration management, material traceability, and safety compliance.",
        "Oil & Gas": "Emphasize environmental regulations, safety standards, and joint operating procedures. Include provisions for cost sharing, operational control, and environmental compliance.",
        "Wind": "Focus on environmental impact assessments, grid interconnection, and turbine certification. Include provisions for wind resource assessments, power purchase agreements, and decommissioning.",
        "Real Estate - Office": "Emphasize lease administration, tenant improvements, and building management. Include provisions for common area maintenance, parking allocation, and sustainability requirements.",
        "Real Estate - Construction": "Focus on building codes, safety regulations, and contractor licensing. Include provisions for performance bonds, lien waivers, and change order procedures."
    };

    return guidanceMap[subindustry] || `Ensure compliance with industry-standard practices and regulations specific to ${subindustry} operations.`;
}

function getRegulatoryContext(subindustry, geography) {
    const regulatoryMap = {
        "Wealth Management": "SEC regulations, FINRA compliance, state investment advisor regulations, and fiduciary standards",
        "SaaS": "GDPR for data protection, SOC 2 compliance, data residency requirements, and cloud security standards",
        "Healthcare IT": "HIPAA Security and Privacy Rules, FDA software as medical device regulations, and HL7 interoperability standards",
        "Automotive": "IATF 16949 quality standards, automotive safety regulations, environmental compliance, and supply chain security",
        "Solar": "utility interconnection standards, renewable energy certificates, net metering regulations, and environmental impact assessments",
        "Banking": "federal banking regulations, FDIC requirements, anti-money laundering (AML) compliance, and Basel III standards",
        "Insurance": "state insurance regulations, solvency requirements, NAIC standards, and claims handling regulations",
        "Digital Health": "FDA software as medical device regulations, HIPAA compliance, clinical validation requirements, and patient safety standards",
        "Telehealth": "state medical licensing requirements, DEA regulations for controlled substances, patient consent standards, and cross-state practice regulations",
        "Pharmaceuticals": "FDA Good Manufacturing Practices (GMP), clinical trial regulations, pharmacovigilance requirements, and drug safety reporting",
        "Gaming": "ESRB content ratings, platform store policies, age verification requirements, and gambling regulations where applicable",
        "E-commerce": "consumer protection laws, PCI DSS for payment security, FTC advertising guidelines, and international trade regulations",
        "Fintech": "financial services regulations, payment processing compliance, consumer protection laws, and anti-money laundering requirements",
        "Aerospace": "AS9100 quality standards, NADCAP certification requirements, ITAR export control regulations, and aviation safety standards",
        "Oil & Gas": "environmental protection regulations, occupational safety standards, joint operating agreement provisions, and hydrocarbon accounting standards",
        "Wind": "environmental impact assessment requirements, grid interconnection standards, turbine certification requirements, and renewable energy compliance",
        "Real Estate - Office": "commercial leasing regulations, ADA compliance requirements, building safety codes, and environmental disclosure requirements",
        "Real Estate - Construction": "building codes and safety regulations, contractor licensing requirements, environmental compliance, and worker safety standards"
    };

    const baseRegulatory = regulatoryMap[subindustry] || `industry-specific regulations for ${subindustry}`;

    // Add geography-specific regulations
    const geographyAdditions = {
        "EMEA": " Additionally, ensure compliance with GDPR, EU directives, and local country regulations.",
        "APAC": " Additionally, ensure compliance with local data protection laws, business registration requirements, and country-specific regulations.",
        "LATAM": " Additionally, ensure compliance with local commercial codes, data protection requirements, and country-specific business regulations.",
        "NAMER": " Additionally, ensure compliance with applicable federal, state, and provincial regulations."
    };

    return baseRegulatory + (geographyAdditions[geography] || geographyAdditions["NAMER"]);
}

function getCurrencyAndDateFormat(geography) {
    const formatMap = {
        "NAMER": {
            currency: "USD",
            dateFormat: "mm/dd/yyyy",
            example: "fifty thousand dollars ($50,000 USD)",
            dateExample: "12/31/2024"
        },
        "EMEA": {
            currency: "EUR",
            dateFormat: "dd/mm/yyyy",
            example: "forty-five thousand euros (€45,000 EUR)",
            dateExample: "31/12/2024"
        },
        "APAC": {
            currency: "varies by country",
            dateFormat: "dd/mm/yyyy",
            example: "appropriate local currency (e.g., ¥5,000,000 JPY, $50,000 SGD)",
            dateExample: "31/12/2024"
        },
        "LATAM": {
            currency: "USD or local currency",
            dateFormat: "dd/mm/yyyy",
            example: "fifty thousand dollars ($50,000 USD) or appropriate local currency",
            dateExample: "31/12/2024"
        }
    };

    return formatMap[geography] || formatMap["NAMER"];
}

function getSubindustryExamples(subindustry) {
    if (!subindustry) {
        return "business services and solutions";
    }

    const examples = {
        "Wealth Management": "investment advisory services, portfolio management, financial planning, and asset allocation",
        "SaaS": "cloud software platforms, API services, data processing solutions, and subscription software",
        "Healthcare IT": "electronic health records, telehealth platforms, medical device software, and patient portal systems",
        "Automotive": "automotive components, manufacturing services, supply chain management, and quality assurance",
        "Solar": "solar panel installation, renewable energy systems, utility interconnection, and energy storage",
        "Banking": "deposit services, lending products, payment processing, and wealth management",
        "Insurance": "policy underwriting, claims processing, risk assessment, and actuarial services",
        "Digital Health": "health monitoring apps, clinical decision support, patient engagement platforms, and wellness solutions",
        "Telehealth": "remote patient monitoring, virtual consultations, digital therapeutics, and telemedicine platforms",
        "Pharmaceuticals": "drug development, clinical trials, manufacturing, and regulatory compliance",
        "Gaming": "game development, publishing, platform services, and monetization systems",
        "E-commerce": "online marketplace services, payment processing, fulfillment, and customer experience",
        "Fintech": "digital payments, lending platforms, investment services, and financial technology solutions",
        "Aerospace": "aircraft components, defense systems, satellite technology, and aerospace manufacturing",
        "Oil & Gas": "exploration services, production operations, refining, and energy distribution",
        "Wind": "wind turbine installation, energy generation, grid integration, and maintenance services",
        "Real Estate - Office": "office leasing, property management, tenant services, and facility management",
        "Real Estate - Construction": "construction services, project management, design-build, and development"
    };

    return examples[subindustry] || `${subindustry.toLowerCase()} services and solutions`;
}

function getPromptGeneralRequirements(firstParty, industry, counterparty, subindustry, geography = "NAMER") {
    Logger.log(`getPromptGeneralRequirements called with: firstParty=${firstParty}, industry=${industry}, counterparty=${counterparty}, subindustry=${subindustry}, geography=${geography}`);

    const subindustryGuidance = getSubindustrySpecificGuidance(subindustry);
    const regulatoryContext = getRegulatoryContext(subindustry, geography);
    const currencyFormat = getCurrencyAndDateFormat(geography);
    const businessExamples = getSubindustryExamples(subindustry);

    return `General Requirements:
### Document Header
Every generated document must begin with a header containing two lines, before any body text:

1. The full document type (e.g., "Investment Advisory Agreement").
2. The contract number assigned to this document (e.g., "IAA-49213").

Example:

Investment Advisory Agreement  
IAA-49213

This header must be styled appropriately so that the document type is in bold and that both are centered (e.g., using <center> and <b> in HTML output) and appear at the very top of the document.

### Agreement Structure for ${subindustry} Context
The generated agreement must follow professional standards typical of ${subindustry} businesses and incorporate industry-specific practices. Adhere to the following architectural guidelines:

1.  **Preamble and Recitals**: Begin with a preamble identifying the parties (${firstParty}, ${counterparty}) and the Effective Date. Follow this with "Whereas" clauses (Recitals) that explain the business context and the purpose of the agreement, specifically referencing ${businessExamples}.

2.  **Definitions Section**: Immediately after the Recitals, include a numbered "Definitions" section. All key terms that are used in multiple sections of the agreement must be defined here, with particular attention to ${subindustry}-specific terminology.

3.  **Logical Section Flow**: The body of the agreement should follow this conventional order:
    * Core Business Terms (e.g., Scope of Services, Payment, Deliverables) tailored to ${subindustry} operations.
    * Term and Termination provisions with ${subindustry}-appropriate notice periods and conditions.
    * Representations and Warranties specific to ${subindustry} industry standards.
    * Covenants and Ongoing Obligations (e.g., Confidentiality, Regulatory Compliance).
    * Risk Allocation (e.g., Indemnification, Limitation of Liability) appropriate for ${subindustry} risk profiles.
    * Miscellaneous / Boilerplate Provisions.
    * Signatures and Exhibits.

4.  **Boilerplate Section**: Group all standard legal clauses (e.g., Governing Law, Notices, Assignment, Force Majeure, Entire Agreement, Severability) into a final section titled "Miscellaneous" or "General Provisions".

5.  **Signatures**: Conclude with a proper signature block for the authorized representatives of both ${firstParty} and ${counterparty}, including lines for name, title, and date.

### ${subindustry} Industry Guidance
${subindustryGuidance}

### Content and Style Requirements
Level of Detail:
 All content must be extensively detailed and realistic, reflecting actual ${subindustry} business practices. Each section must include several lines of paragraphs written in formal legal language. No bullet points or numbered lists are allowed in the content. Information should be presented in long paragraphs, fully explaining all terms and concepts.

Contextualization: Every section must thoroughly explain the terms and clauses, illustrated with real-world examples or ${subindustry}-specific use cases where applicable.

Key Terms: All terms should be finalized, avoiding placeholders or incomplete information, with particular attention to ${subindustry} industry standards.

Industry-Specific Adaptation: Each agreement should reference practices, regulations, and compliance requirements specific to ${subindustry} within the ${industry} sector, making the documents contextually relevant to ${firstParty}'s ${subindustry} operations.

Local Regulations: ${regulatoryContext}

Currency and Date Formatting: All monetary values must use ${currencyFormat.currency} with amounts written as ${currencyFormat.example}. Dates must be formatted as ${currencyFormat.dateFormat} (e.g., ${currencyFormat.dateExample}).

Writing Style:
The language must be professional, formal, and employ appropriate legal terminology specific to ${subindustry} transactions. Use conditional and subordinate clauses to ensure all provisions are comprehensive, protective, and unambiguous. Include binding language affirming the agreement applies to both parties and their successors, with particular attention to ${subindustry} industry customs and practices.
`;
}

function getPromptSpecifics(agreementType, firstParty, industry, counterparty) {
    const meta = getDocMetaByName(agreementType);

    if (!meta) {
        // Ultimate fallback for any edge cases
        return `Document Type: ${agreementType}
    
This document should follow standard legal formatting with appropriate sections for parties, terms, conditions, and signatures. Ensure professional language and comprehensive coverage of typical business relationship terms.`;
    }

    // PURE DYNAMIC MAGIC
    let specificRequirements = `Document Type: ${agreementType}\n`;
    specificRequirements += `Description: ${meta.description}\n`;
    specificRequirements += `Industry Category: ${meta.category}\n`;
    specificRequirements += `Control Type: ${meta.controlledType}\n\n`;

    specificRequirements += `Essential Legal Requirements:\n`;
    meta.obligations.forEach(obligation => {
        if (OBL_TEXT[obligation]) {
            specificRequirements += `• ${OBL_TEXT[obligation]}\n`;
        } else {
            // Smart fallback with industry context
            specificRequirements += `• ${obligation}: Incorporate comprehensive ${obligation.toLowerCase()} provisions appropriate for ${industry} businesses, ensuring compliance with industry standards and best practices.\n`;
        }
    });

    specificRequirements += `\nDocument Structure Requirements:\n`;
    specificRequirements += `This ${agreementType} must reflect the specific needs of ${firstParty}'s ${industry} operations and include comprehensive terms that address the unique risks, opportunities, and regulatory requirements of ${meta.category.replace('-Specific', '')} businesses. `;

    if (meta.noTerm) {
        specificRequirements += `This document type typically does not require a specific term length and should focus on ongoing obligations and immediate deliverables. `;
    } else {
        specificRequirements += `Include appropriate term provisions, renewal options, and termination procedures suitable for ${industry} business relationships. `;
    }

    specificRequirements += `Ensure all sections are written as complete, flowing paragraphs with no bullet points or numbered lists in the content. Each section should provide detailed explanations that demonstrate deep understanding of ${industry} business practices and legal requirements.\n`;

    return specificRequirements;
}

function getPromptOutputFormat(firstParty, counterparty, subindustry, geography) {
    const currencyFormat = getCurrencyAndDateFormat(geography);

    return `Output Format & Professional Standards

The output must be formatted as valid, professional-grade HTML that mirrors the quality of documents produced by top-tier law firms specializing in ${subindustry} transactions. Use semantic markup with Arial font, size 11, and sophisticated document structure.

### Document Header (Critical)
Every document must begin with a professionally styled header:

<div style="text-align: center; margin-bottom: 30px; page-break-inside: avoid;">
<h1 style="font-family: Arial; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">[DOCUMENT TYPE]</h1>
<h2 style="font-family: Arial; font-size: 12px; font-weight: normal; margin-bottom: 20px; color: #666;">[CONTRACT NUMBER]</h2>
</div>

Example:
<div style="text-align: center; margin-bottom: 30px;">
<h1 style="font-family: Arial; font-size: 16px; font-weight: bold; margin-bottom: 10px;">INVESTMENT ADVISORY AGREEMENT</h1>
<h2 style="font-family: Arial; font-size: 12px; font-weight: normal; color: #666;">IAA-49213</h2>
</div>

### Professional Document Architecture
Structure the agreement using sophisticated legal document conventions:

**Preamble Section:**
- Begin with "THIS [DOCUMENT TYPE] ("Agreement") is entered into as of [DATE] ("Effective Date")"
- Include full legal entity names with states of incorporation/formation
- Use formal recitals beginning with "WHEREAS," clauses that establish business context

**Definitions Section:**
- Number as "1. DEFINITIONS" in all caps, bold
- Define ALL capitalized terms used throughout the document
- Use hanging indents for definition subsections
- Include ${subindustry}-specific terminology with precise legal definitions

**Substantive Sections:**
- Use hierarchical numbering (1., 2., 3., then 1.1, 1.2, etc.)
- Section headers in ALL CAPS and bold: "2. SCOPE OF SERVICES"
- Each section should contain 3-5 comprehensive paragraphs
- Use sophisticated legal language with proper conditional clauses

**Closing Provisions:**
- Include execution language: "IN WITNESS WHEREOF, the parties have executed this Agreement..."
- Professional signature blocks with proper titles and dates
- Space for corporate seals if applicable

### Advanced Formatting Standards

**Typography & Spacing:**
- 1.15 line spacing for readability
- 12pt spacing between paragraphs
- 18pt spacing between major sections
- Consistent margins throughout

**Legal Language Requirements:**
- Use formal legal terminology appropriate for ${subindustry} transactions
- Include "shall," "may," "will" with proper legal distinctions
- Employ sophisticated sentence structure with subordinate clauses
- Reference relevant ${subindustry} industry standards and regulations

**Cross-References & Integration:**
- Use internal cross-references ("as defined in Section 1")
- Include proper defined term capitalization throughout
- Ensure consistency in party references (${firstParty} as "Company," ${counterparty} as "Client")

**Financial & Date Formatting:**
- All monetary amounts in ${currencyFormat.currency}: ${currencyFormat.example}
- Dates in ${currencyFormat.dateFormat} format (e.g., ${currencyFormat.dateExample})
- Use both written and numerical forms for critical amounts
- Include appropriate currency symbols and decimal precision

### Content Quality Standards

**Paragraph Structure:**
- Each paragraph should be 4-8 sentences of substantive legal content
- No bullet points or lists within paragraph text
- Use transitional phrases to connect concepts smoothly
- Include specific performance standards and measurable obligations

**Industry Expertise:**
- Demonstrate deep understanding of ${subindustry} business practices
- Reference relevant regulatory frameworks and compliance requirements
- Include industry-standard terms and conditions
- Address typical risk allocation patterns for ${subindustry} transactions

**Legal Sophistication:**
- Include appropriate limitation of liability provisions
- Address intellectual property considerations relevant to ${subindustry}
- Include force majeure and other standard risk mitigation clauses
- Ensure enforceability through proper legal structure

### Final Quality Check
The completed document should read as if drafted by experienced ${subindustry} attorneys, with sophisticated legal language, comprehensive coverage of business terms, and professional formatting that would be appropriate for execution by Fortune 500 companies in ${subindustry} transactions.

Ensure the HTML is pristine and converts seamlessly to Google Docs/Word with all formatting preserved, creating a document that prospects will immediately recognize as professional-grade legal work.`;
}

function getObligationsText(agreementType) {
    const meta = getDocMetaByName(agreementType);
    if (!meta || !meta.obligations) return "";

    let obligationsText = "\n\nSpecific Legal Obligations to Include:\n";
    meta.obligations.forEach(obligation => {
        if (OBL_TEXT[obligation]) {
            obligationsText += `• ${OBL_TEXT[obligation]}\n`;
        }
    });
    return obligationsText;
}

function getSubindustrySpecificGuidance(subindustry) {
    const guidanceMap = {
        "Wealth Management": "Focus on fiduciary responsibilities, fee transparency, and regulatory compliance with SEC and state investment advisor requirements. Include provisions for investment policy statements and performance reporting.",
        "SaaS": "Emphasize data security, service level agreements, API governance, and GDPR compliance. Include provisions for data processing, user access controls, and system availability guarantees.",
        "Healthcare IT": "Prioritize HIPAA compliance, patient data protection, and interoperability standards. Include provisions for electronic health records, audit trails, and emergency access procedures.",
        "Automotive": "Focus on quality standards (IATF 16949), supply chain security, and automotive safety regulations. Include provisions for just-in-time delivery, tooling requirements, and recall procedures.",
        "Solar": "Emphasize system performance guarantees, utility interconnection standards, and renewable energy compliance. Include provisions for net metering, permitting, and environmental impact.",
        "Banking": "Focus on federal banking regulations, FDIC compliance, and anti-money laundering requirements. Include provisions for deposit insurance, regulatory reporting, and customer due diligence.",
        "Insurance": "Emphasize state insurance regulations, solvency requirements, and claims handling standards. Include provisions for policy administration, actuarial compliance, and regulatory filing.",
        "Digital Health": "Focus on FDA software as medical device regulations, clinical validation, and patient safety. Include provisions for data integrity, clinical workflows, and regulatory submissions.",
        "Telehealth": "Emphasize state licensing requirements, patient consent, and emergency protocols. Include provisions for cross-state practice, technology standards, and clinical documentation.",
        "Pharmaceuticals": "Focus on FDA Good Manufacturing Practices, clinical trial regulations, and drug safety reporting. Include provisions for batch documentation, pharmacovigilance, and regulatory compliance.",
        "Gaming": "Emphasize age verification, content ratings, and platform compliance. Include provisions for virtual goods, payment processing, and user-generated content moderation.",
        "E-commerce": "Focus on consumer protection, payment security, and marketplace regulations. Include provisions for product liability, shipping terms, and customer data protection.",
        "Fintech": "Emphasize financial services regulations, payment processing compliance, and consumer protection. Include provisions for KYC requirements, fraud prevention, and regulatory reporting.",
        "Aerospace": "Focus on AS9100 quality standards, NADCAP certification, and export control regulations. Include provisions for configuration management, material traceability, and safety compliance.",
        "Oil & Gas": "Emphasize environmental regulations, safety standards, and joint operating procedures. Include provisions for cost sharing, operational control, and environmental compliance.",
        "Wind": "Focus on environmental impact assessments, grid interconnection, and turbine certification. Include provisions for wind resource assessments, power purchase agreements, and decommissioning.",
        "Real Estate - Office": "Emphasize lease administration, tenant improvements, and building management. Include provisions for common area maintenance, parking allocation, and sustainability requirements.",
        "Real Estate - Construction": "Focus on building codes, safety regulations, and contractor licensing. Include provisions for performance bonds, lien waivers, and change order procedures."
    };

    return guidanceMap[subindustry] || `Ensure compliance with industry-standard practices and regulations specific to ${subindustry} operations.`;
}

function getRegulatoryContext(subindustry, geography) {
    const regulatoryMap = {
        "Wealth Management": "SEC regulations, FINRA compliance, state investment advisor regulations, and fiduciary standards",
        "SaaS": "GDPR for data protection, SOC 2 compliance, data residency requirements, and cloud security standards",
        "Healthcare IT": "HIPAA Security and Privacy Rules, FDA software as medical device regulations, and HL7 interoperability standards",
        "Automotive": "IATF 16949 quality standards, automotive safety regulations, environmental compliance, and supply chain security",
        "Solar": "utility interconnection standards, renewable energy certificates, net metering regulations, and environmental impact assessments",
        "Banking": "federal banking regulations, FDIC requirements, anti-money laundering (AML) compliance, and Basel III standards",
        "Insurance": "state insurance regulations, solvency requirements, NAIC standards, and claims handling regulations",
        "Digital Health": "FDA software as medical device regulations, HIPAA compliance, clinical validation requirements, and patient safety standards",
        "Telehealth": "state medical licensing requirements, DEA regulations for controlled substances, patient consent standards, and cross-state practice regulations",
        "Pharmaceuticals": "FDA Good Manufacturing Practices (GMP), clinical trial regulations, pharmacovigilance requirements, and drug safety reporting",
        "Gaming": "ESRB content ratings, platform store policies, age verification requirements, and gambling regulations where applicable",
        "E-commerce": "consumer protection laws, PCI DSS for payment security, FTC advertising guidelines, and international trade regulations",
        "Fintech": "financial services regulations, payment processing compliance, consumer protection laws, and anti-money laundering requirements",
        "Aerospace": "AS9100 quality standards, NADCAP certification requirements, ITAR export control regulations, and aviation safety standards",
        "Oil & Gas": "environmental protection regulations, occupational safety standards, joint operating agreement provisions, and hydrocarbon accounting standards",
        "Wind": "environmental impact assessment requirements, grid interconnection standards, turbine certification requirements, and renewable energy compliance",
        "Real Estate - Office": "commercial leasing regulations, ADA compliance requirements, building safety codes, and environmental disclosure requirements",
        "Real Estate - Construction": "building codes and safety regulations, contractor licensing requirements, environmental compliance, and worker safety standards"
    };

    const baseRegulatory = regulatoryMap[subindustry] || `industry-specific regulations for ${subindustry}`;

    // Add geography-specific regulations
    const geographyAdditions = {
        "EMEA": " Additionally, ensure compliance with GDPR, EU directives, and local country regulations.",
        "APAC": " Additionally, ensure compliance with local data protection laws, business registration requirements, and country-specific regulations.",
        "LATAM": " Additionally, ensure compliance with local commercial codes, data protection requirements, and country-specific business regulations.",
        "NAMER": " Additionally, ensure compliance with applicable federal, state, and provincial regulations."
    };

    return baseRegulatory + (geographyAdditions[geography] || geographyAdditions["NAMER"]);
}

function getCurrencyAndDateFormat(geography) {
    const formatMap = {
        "NAMER": {
            currency: "USD",
            dateFormat: "mm/dd/yyyy",
            example: "fifty thousand dollars ($50,000 USD)",
            dateExample: "12/31/2024"
        },
        "EMEA": {
            currency: "EUR",
            dateFormat: "dd/mm/yyyy",
            example: "forty-five thousand euros (€45,000 EUR)",
            dateExample: "31/12/2024"
        },
        "APAC": {
            currency: "varies by country",
            dateFormat: "dd/mm/yyyy",
            example: "appropriate local currency (e.g., ¥5,000,000 JPY, $50,000 SGD)",
            dateExample: "31/12/2024"
        },
        "LATAM": {
            currency: "USD or local currency",
            dateFormat: "dd/mm/yyyy",
            example: "fifty thousand dollars ($50,000 USD) or appropriate local currency",
            dateExample: "31/12/2024"
        }
    };

    return formatMap[geography] || formatMap["NAMER"];
}

function getSubindustryExamples(subindustry) {
    const examples = {
        "Wealth Management": "investment advisory services, portfolio management, financial planning, and asset allocation",
        "SaaS": "cloud software platforms, API services, data processing solutions, and subscription software",
        "Healthcare IT": "electronic health records, telehealth platforms, medical device software, and patient portal systems",
        "Automotive": "automotive components, manufacturing services, supply chain management, and quality assurance",
        "Solar": "solar panel installation, renewable energy systems, utility interconnection, and energy storage",
        "Banking": "deposit services, lending products, payment processing, and wealth management",
        "Insurance": "policy underwriting, claims processing, risk assessment, and actuarial services",
        "Digital Health": "health monitoring apps, clinical decision support, patient engagement platforms, and wellness solutions",
        "Telehealth": "remote patient monitoring, virtual consultations, digital therapeutics, and telemedicine platforms",
        "Pharmaceuticals": "drug development, clinical trials, manufacturing, and regulatory compliance",
        "Gaming": "game development, publishing, platform services, and monetization systems",
        "E-commerce": "online marketplace services, payment processing, fulfillment, and customer experience",
        "Fintech": "digital payments, lending platforms, investment services, and financial technology solutions",
        "Aerospace": "aircraft components, defense systems, satellite technology, and aerospace manufacturing",
        "Oil & Gas": "exploration services, production operations, refining, and energy distribution",
        "Wind": "wind turbine installation, energy generation, grid integration, and maintenance services",
        "Real Estate - Office": "office leasing, property management, tenant services, and facility management",
        "Real Estate - Construction": "construction services, project management, design-build, and development"
    };

    return examples[subindustry] || `${subindustry.toLowerCase()} services and solutions`;
}