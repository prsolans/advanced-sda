// PromptEngineV2.js - JSON-based prompt generation engine

/**
 * PromptEngineV2 - Optimized JSON-based prompt generation
 * Reduces prompt generation time from ~100ms to ~10ms
 * Supports 1000+ document types with minimal memory overhead
 */
class PromptEngineV2 {
  constructor() {
    this.version = "2.0";
    this.cache = new Map();
    this.initialized = false;
    this.init();
    
    // Initialize enhanced cache manager for performance (if available)
    try {
      if (typeof DocumentCache !== 'undefined') {
        DocumentCache.init();
      }
    } catch (error) {
      Logger.log('Cache manager not available, continuing with basic caching');
    }
  }

  init() {
    if (this.initialized) return;
    
    // Pre-cache static data with address examples
    this.geographyMap = {
      'NAMER': { 
        currency: 'USD', 
        dateFormat: 'MM/DD/YYYY',
        currencySymbol: '$',
        example: 'fifty thousand dollars ($50,000 USD)',
        sampleAddress: '123 Business Park Drive, Suite 450, Austin, TX 78701, United States',
        country: 'United States'
      },
      'EMEA': { 
        currency: 'EUR', 
        dateFormat: 'DD/MM/YYYY',
        currencySymbol: '€',
        example: 'fifty thousand euros (€50,000 EUR)',
        sampleAddress: '45 Tech Square, Floor 3, London EC2A 4DP, United Kingdom',
        country: 'United Kingdom'
      },
      'APAC': { 
        currency: 'varies', 
        dateFormat: 'DD/MM/YYYY',
        currencySymbol: '¥/$',
        example: 'appropriate local currency',
        sampleAddress: '88 Marina Bay Financial Centre, Tower 2, Singapore 018981',
        country: 'Singapore'
      },
      'LATAM': { 
        currency: 'USD', 
        dateFormat: 'DD/MM/YYYY',
        currencySymbol: '$',
        example: 'fifty thousand dollars ($50,000 USD)',
        sampleAddress: 'Avenida Paulista, 1000, 15º andar, São Paulo, SP 01310-100, Brazil',
        country: 'Brazil'
      }
    };

    // Cache essential content rules only (formatting handled in post-processing)
    this.cachedRules = {
      contentRules: 'Use real addresses/dates/amounts | Professional legal language | Complete paragraphs only | Start with agreement content directly | Follow specified language requirements strictly',

      placeholderReplacements: {
        '[Effective Date]': 'ACTUAL_DATE',
        '[Address]': 'FULL_REALISTIC_ADDRESS', 
        '[Amount]': 'SPECIFIC_CURRENCY_AMOUNT'
      }
    };

    // Cache agreement-type-specific section templates
    this.sectionCache = {
      // Generic fallback
      default: 'Preamble|Recitals|Definitions|Core Terms|Obligations|Term|Miscellaneous|Signatures',
      
      // Agreement-type-specific section orders
      sectionTemplates: {
        'NDA': 'Preamble|Recitals|Definitions|Confidential Information|Use Restrictions|Return of Information|Exceptions|Term|Remedies|Miscellaneous|Signatures',
        
        'MSA': 'Preamble|Recitals|Definitions|Services|Statement of Work Process|Payment Terms|Intellectual Property|Confidentiality|Warranties|Indemnification|Limitation of Liability|Term and Termination|General Provisions|Signatures',
        
        'Software License': 'Preamble|Recitals|Definitions|Grant of License|Use Restrictions|Intellectual Property Rights|Support and Maintenance|Payment Terms|Warranties|Limitation of Liability|Term and Termination|General Provisions|Signatures',
        
        'Consulting': 'Preamble|Recitals|Definitions|Services|Deliverables|Compensation|Expenses|Intellectual Property|Confidentiality|Independent Contractor|Term and Termination|General Provisions|Signatures',
        
        'Employment': 'Preamble|Position and Duties|Compensation|Benefits|Confidentiality|Non-Competition|Intellectual Property|Term and Termination|Post-Employment Obligations|General Provisions|Signatures',
        
        'SaaS': 'Preamble|Recitals|Definitions|Services|User Accounts|Data Privacy|Service Levels|Payment Terms|Intellectual Property|Warranties|Limitation of Liability|Term and Termination|General Provisions|Signatures',
        
        'API Terms': 'Preamble|Recitals|Definitions|API Access|Usage Limits|Developer Requirements|Data Handling|Intellectual Property|Warranties|Limitation of Liability|Term and Termination|General Provisions|Signatures',
        
        'Cloud Services': 'Preamble|Recitals|Definitions|Services|Data Security|Compliance|Service Levels|Payment Terms|Data Processing|Intellectual Property|Warranties|Limitation of Liability|Term and Termination|General Provisions|Signatures',
        
        'Data Processing': 'Preamble|Recitals|Definitions|Processing Instructions|Categories of Data|Data Subject Rights|Security Measures|International Transfers|Sub-Processing|Data Breach|Term and Termination|General Provisions|Signatures',
        
        'Supply Agreement': 'Preamble|Recitals|Definitions|Supply Obligations|Specifications|Quality Standards|Delivery|Pricing and Payment|Intellectual Property|Warranties|Remedies|Term and Termination|General Provisions|Signatures',
        
        'Distribution Agreement': 'Preamble|Recitals|Definitions|Appointment|Territory|Distribution Obligations|Marketing Requirements|Pricing|Intellectual Property|Warranties|Term and Termination|Post-Termination|General Provisions|Signatures',
        
        'Investment Advisory': 'Preamble|Recitals|Definitions|Advisory Services|Investment Authority|Fees|Custody|Reporting|Fiduciary Duties|Compliance|Term and Termination|General Provisions|Signatures',
        
        'Clinical Trial': 'Preamble|Recitals|Definitions|Study Conduct|Principal Investigator Obligations|Regulatory Compliance|Data Management|Safety Reporting|Intellectual Property|Indemnification|Term and Termination|General Provisions|Signatures'
      },
      
      addressExamples: {
        'NAMER': [
          '456 Corporate Center, Dallas, TX 75201',  // Company A (fixed)
          '789 Innovation Way, Seattle, WA 98101',   // Company B options
          '1250 Broadway, New York, NY 10001',
          '2100 Park Avenue, San Jose, CA 95110', 
          '675 Technology Drive, Atlanta, GA 30309',
          '3400 Business Plaza, Chicago, IL 60606'
        ],
        'EMEA': [
          '12 Finsbury Square, London EC2A 1AS',    // Company A (fixed)
          '67 Boulevard Saint-Germain, 75005 Paris', // Company B options
          '45 Unter den Linden, 10117 Berlin',
          '88 Via del Corso, 00186 Rome',
          '23 Damrak Street, 1012 Amsterdam',
          '156 Gran Via, 28013 Madrid'
        ],
        'APAC': [
          'Level 15, 1 Raffles Place, Singapore 048616', // Company A (fixed)
          'Shibuya Sky, Tokyo 150-0002',                 // Company B options
          '88F International Commerce Centre, Hong Kong',
          'Level 45, Governor Phillip Tower, Sydney 2000',
          '38th Floor, Two IFC, Central, Hong Kong',
          'Marina Bay Financial Centre, Singapore 018989'
        ],
        'LATAM': [
          'Torre Empresarial, Mexico City 11000',        // Company A (fixed)
          'Av. Faria Lima 1306, São Paulo 01451-001',   // Company B options
          'Av. Santa Fe 1640, Buenos Aires C1060ABN',
          'Torre Colpatria, Bogotá 110111',
          'World Trade Center, Santiago 7500000',
          'Av. Ricardo Lyon 222, Las Condes, Santiago'
        ]
      },

      signatureBlocks: {
          'NAMER': [
            { name: 'Michael J. Thompson', title: 'Chief Executive Officer' }, // Company A (fixed)
            { name: 'Sarah K. Martinez', title: 'President & COO' },           // Company B options
            { name: 'David R. Johnson', title: 'Chief Technology Officer' },
            { name: 'Jennifer L. Wilson', title: 'Chief Financial Officer' },
            { name: 'Robert A. Davis', title: 'Senior Vice President' },
            { name: 'Lisa M. Anderson', title: 'Executive Vice President' }
          ],
          'EMEA': [
            { name: 'James R. Clarke', title: 'Managing Director' },           // Company A (fixed)
            { name: 'Sophie M. Laurent', title: 'Chief Executive Officer' },   // Company B options  
            { name: 'Oliver J. Schmidt', title: 'General Manager' },
            { name: 'Isabella C. Rossi', title: 'Director of Operations' },
            { name: 'Henrik P. Nielsen', title: 'Chief Technology Officer' },
            { name: 'Emma K. Williams', title: 'Commercial Director' }
          ],
          'APAC': [
            { name: 'Hiroshi Tanaka', title: 'President & CEO' },             // Company A (fixed)
            { name: 'Wei Lin Chen', title: 'Managing Director' },             // Company B options
            { name: 'Priya S. Sharma', title: 'Chief Operating Officer' },
            { name: 'Kenji Nakamura', title: 'Executive Director' },
            { name: 'Mei Ling Wong', title: 'General Manager' },
            { name: 'Raj K. Patel', title: 'Chief Financial Officer' }
          ],
          'LATAM': [
            { name: 'Carlos E. Rodriguez', title: 'Director Ejecutivo' },      // Company A (fixed)
            { name: 'Maria F. Silva', title: 'Gerente General' },             // Company B options
            { name: 'José L. Mendez', title: 'Director de Operaciones' },
            { name: 'Ana C. Gutierrez', title: 'Directora Comercial' },
            { name: 'Diego M. Vargas', title: 'Vicepresidente' },
            { name: 'Lucia R. Torres', title: 'Directora Financiera' }
          ]
        }
    };

    // Industry regulation map
    this.regulationMap = {
      'Healthcare': {
        base: ['HIPAA', 'FDA', 'CMS'],
        'Digital Health': ['FDA SaMD', 'Clinical Validation'],
        'Telehealth': ['State Licensing', 'DEA', 'Ryan Haight Act'],
        'Medical Devices': ['FDA 510(k)', 'ISO 13485', 'MDR']
      },
      'Financial Services': {
        base: ['SEC', 'FINRA', 'SOX'],
        'Banking': ['FDIC', 'OCC', 'Basel III'],
        'Fintech': ['PSD2', 'AML/KYC', 'CFPB'],
        'Insurance': ['NAIC', 'State DOI', 'Solvency II']
      },
      'Technology': {
        base: ['GDPR', 'SOC2'], // CCPA removed from base - geography-specific
        'SaaS': ['Data Residency'],
        'E-commerce': ['PCI DSS', 'FTC Act'],
        'Gaming': ['COPPA', 'ESRB', 'Platform Policies']
      },
      'Manufacturing': {
        base: ['ISO 9001', 'Product Safety'],
        'Automotive': ['IATF 16949', 'FMVSS'],
        'Aerospace': ['AS9100', 'ITAR', 'DFARS']
      },
      'Energy': {
        base: ['NERC', 'FERC', 'EPA'],
        'Solar': ['ITC', 'Net Metering', 'UL 1741'],
        'Wind': ['FAA', 'BOEM', 'PTC']
      }
    };

    // Mark as initialized
    this.initialized = true;
    
    // Log successful initialization for debugging
    Logger.log(`PromptEngineV2 initialized successfully. Cache stats: ${Object.keys(this.geographyMap || {}).length} geographies, ${Object.keys(this.sectionCache?.addressExamples || {}).length} address sets`);
  }

  /**
   * Main entry point - replaces createPrompt()
   */
  createPromptJSON(docData) {
    const startTime = Date.now();
    
    try {
      // Build the core specification
      const spec = {
        meta: {
          version: this.version,
          format: "structured-json",
          timestamp: new Date().toISOString()
        },
        document: this.buildDocumentSection(docData),
        context: this.buildContextSection(docData),
        requirements: this.buildRequirementsSection(docData),
        style: this.buildStyleSection(docData),
        output: this.buildOutputSection(docData)
      };

      // Format as optimized prompt
      const prompt = this.formatAsPrompt(spec, docData);
      
      const elapsed = Date.now() - startTime;
      Logger.log(`PromptEngineV2: Generated ${docData.agreementType} prompt in ${elapsed}ms (${prompt.length} chars)`);
      
      return prompt;
      
    } catch (error) {
      Logger.log(`PromptEngineV2 Error: ${error.message}`);
      Logger.log(`Error stack: ${error.stack}`);
      // Fallback to legacy system
      if (typeof createPrompt !== 'undefined') {
        Logger.log(`Falling back to legacy createPrompt system`);
        return createPrompt(docData);
      } else {
        Logger.log(`Legacy createPrompt not available, returning error prompt`);
        return `Error: Unable to generate prompt - ${error.message}`;
      }
    }
  }

  buildDocumentSection(docData) {
    const section = {
      type: docData.agreementType,
      contractNumber: docData.contractNumber,
      parties: {
        first: {
          name: docData.firstParty,
          role: this.determinePartyRole(docData.agreementType, 'first')
        },
        counter: {
          name: docData.counterparty,
          role: this.determinePartyRole(docData.agreementType, 'counter')
        }
      }
    };

    // Add parent relationships if they exist
    if (docData.parentContractNumber) {
      section.parent = {
        type: docData.parentType,
        number: docData.parentContractNumber,
        date: docData.parentContractDate,
        relationship: this.getParentRelationship(docData.agreementType, docData.parentType)
      };
    }

    // Add document-specific metadata
    const docMeta = DOC_TYPE_LIBRARY[docData.agreementType];
    if (docMeta) {
      section.metadata = {
        key: docMeta.key,
        category: docMeta.category,
        hasFixedTerm: !docMeta.noTerm,
        controlledType: docMeta.controlledType
      };
    }

    return section;
  }

  buildContextSection(docData) {
    const geo = this.geographyMap[docData.geography] || this.geographyMap['NAMER'];
    
    return {
      industry: {
        primary: docData.industry,
        sub: docData.subindustry || 'General',
        regulations: this.getRegulations(docData.industry, docData.subindustry, docData.geography),
        businessExamples: this.getBusinessExamples(docData.subindustry)
      },
      geography: {
        region: docData.geography,
        currency: geo.currency,
        currencySymbol: geo.currencySymbol,
        dateFormat: geo.dateFormat,
        exampleAmount: geo.example,
        legalSystem: this.getLegalSystem(docData.geography)
      },
      language: {
        primary: docData.language || 'English',
        legalSystem: this.getLegalSystem(docData.geography)
      }
    };
  }

  buildRequirementsSection(docData) {
    // Parse obligations from special instructions
    const obligations = this.extractObligations(docData.specialInstructions);
    
    // Parse any custom fields (for healthcare custom docs)
    const customConfig = typeof parseCustomInstructions !== 'undefined' ? 
      parseCustomInstructions(docData.specialInstructions) : { fields: [] };
    
    const section = {
      obligations: obligations.map(obl => ({
        type: obl.key,
        required: true,
        template: obl.text
      })),
      terms: this.extractTerms(docData.specialInstructions),
      customFields: customConfig.fields || [],
      specialProvisions: []
    };

    // Add document type specific requirements
    const docMeta = DOC_TYPE_LIBRARY[docData.agreementType];
    if (docMeta && docMeta.obligations) {
      section.standardObligations = docMeta.obligations;
    }

    // Handle SOW special requirements
    if (docData.agreementType.includes("SOW")) {
      section.specialProvisions.push({
        type: "financial",
        totalContractValue: this.extractValue(docData.specialInstructions, "Total Contract Value"),
        depositAmount: this.extractValue(docData.specialInstructions, "Deposit Amount"),
        paymentSchedule: "As specified in specialInstructions"
      });
    }

    return section;
  }

  buildStyleSection(docData) {
    // Random style selections for variety
    const fontSizes = [10, 11, 12];
    const fontFamilies = ['Arial', 'Times New Roman', 'Calibri'];
    
    return {
      document: {
        fontSize: fontSizes[Math.floor(Math.random() * fontSizes.length)],
        fontFamily: fontFamilies[Math.floor(Math.random() * fontFamilies.length)],
        lineHeight: 1.15,
        paragraphSpacing: 12
      },
      legal: {
        language: "formal",
        complexity: this.getComplexityLevel(docData.industry),
        terminology: "industry-standard",
        structure: "hierarchical-numbered"
      },
      length: {
        minimum: 8,
        target: 12,
        maximum: 20,
        unit: "pages"
      }
    };
  }

  buildOutputSection(docData) {
    const language = docData.language || 'English';
    return {
      format: "JSON",
      requirements: [
        "Valid JSON structure only",
        `ALL content must be in ${language} - section titles, legal terms, and body text`,
        `Use proper ${language} legal terminology and formatting conventions`,
        language !== 'English' ? `NEVER mix English with ${language} - translate ALL terms including "Agreement", "Company", "Corporation", "Effective Date"` : 'Use professional English legal terminology',
        "VERBOSE AND COMPREHENSIVE: Each section must contain 4-6 detailed paragraphs with extensive legal language and thorough coverage of all relevant terms",
        "DETAILED EXPLANATIONS: Include comprehensive explanations of rights, obligations, procedures, and consequences in each section", 
        "EXTENSIVE COVERAGE: Provide thorough treatment of all business terms, risk allocation, compliance requirements, and operational procedures",
        "Complete business terms in sections", 
        "Industry-appropriate terminology",
        "No placeholder text - use realistic data"
      ],
      sections: "Standard legal document structure with comprehensive coverage of all business terms"
    };
  }

  /**
   * Format the JSON spec into an optimized prompt for GPT-4
   */
  formatAsPrompt(spec, docData) {
    // Extract key elements for token-efficient formatting
    const keyData = {
      type: spec.document.type,
      parties: spec.document.parties,
      industry: spec.context.industry.primary,
      subindustry: spec.context.industry.sub,
      geography: spec.context.geography.region,
      currency: spec.context.geography.currency,
      language: spec.context.language.primary,
      obligations: spec.requirements.standardObligations || [],
      regulations: spec.context.industry.regulations || []
    };

    // Add parent relationship if exists
    if (spec.document.parent) {
      keyData.parent = spec.document.parent;
    }

    // Get subindustry-specific guidance
    const subindustryGuidance = this.getSubindustryGuidance(keyData.subindustry);
    
    // Extract concrete data from specialInstructions
    const dynamicData = this.extractDynamicData(docData.specialInstructions, keyData.geography);

    // Ensure initialization completed
    if (!this.initialized) {
      this.init();
    }
    
    // Get cached elements for maximum efficiency with safe fallbacks
    const geoData = this.geographyMap && this.geographyMap[keyData.geography] ? 
      this.geographyMap[keyData.geography] : 
      { currency: 'USD', country: 'United States', sampleAddress: '123 Main St, Anytown, USA' };
    
    const addressExamples = this.sectionCache && this.sectionCache.addressExamples && this.sectionCache.addressExamples[keyData.geography] ? 
      this.sectionCache.addressExamples[keyData.geography] : 
      ['123 Main St, Anytown, USA', '456 Business Ave, Commerce City, USA'];
    
    const signatureOptions = this.sectionCache?.signatureBlocks?.[keyData.geography] || 
      this.sectionCache?.signatureBlocks?.['NAMER'] || 
      [{ name: 'John Smith', title: 'Chief Executive Officer' }, { name: 'Jane Doe', title: 'President' }];
    
    // Address selection: Company A gets fixed first address, Company B gets random from remaining options
    const companyAAddress = addressExamples && addressExamples.length > 0 ? addressExamples[0] : '123 Main St, Anytown, USA';
    const companyBOptions = addressExamples && addressExamples.length > 1 ? addressExamples.slice(1) : ['456 Business Ave, Commerce City, USA'];
    const companyBAddress = companyBOptions.length > 0 ? companyBOptions[Math.floor(Math.random() * companyBOptions.length)] : '456 Business Ave, Commerce City, USA';
    
    // Signature selection: Company A gets fixed first signature, Company B gets random from remaining options
    const companyASignature = signatureOptions && signatureOptions.length > 0 ? signatureOptions[0] : { name: 'John Smith', title: 'Chief Executive Officer' };
    const companyBSigOptions = signatureOptions && signatureOptions.length > 1 ? signatureOptions.slice(1) : [{ name: 'Jane Doe', title: 'President' }];
    const companyBSignature = companyBSigOptions.length > 0 ? companyBSigOptions[Math.floor(Math.random() * companyBSigOptions.length)] : { name: 'Jane Doe', title: 'President' };
    
    // Get agreement-specific section template with fallback
    const sectionTemplate = this.getSectionTemplate ? this.getSectionTemplate(keyData.type) : 'Preamble|Recitals|Definitions|Core Terms|Obligations|Term|Miscellaneous|Signatures';
    
    // Generate financial values if appropriate for this document type
    let financialSection = '';
    if (this.shouldIncludeFinancialValues(keyData.type)) {
      const financialValues = this.generateFinancialValues(keyData.type, keyData.industry, keyData.geography);
      financialSection = `
FINANCIAL TERMS:
Contract Value: ${financialValues.contractValue}
Deposit: ${financialValues.depositAmount}, Due: ${financialValues.depositDue}
Payment: ${financialValues.oneTimeAmount}, Due: ${financialValues.firstPaymentDue}
Monthly: ${financialValues.monthlyAmount}`;
    }

    // Context-rich prompt using all built data - REQUEST JSON STRUCTURE
    const prompt = `Generate JSON document structure for: ${keyData.type}
${keyData.industry}/${keyData.subindustry}|${keyData.geography}|${keyData.language}
${keyData.parties.first.name}↔${keyData.parties.counter.name}
${keyData.parent ? `Parent:${keyData.parent.type}#${keyData.parent.number}\n` : ''}

OUTPUT: Valid JSON with this structure:
{
  "documentType": "${keyData.type}",
  "preamble": {
    "content": "complete preamble HTML in ${keyData.language} with proper party identification and effective date",
    "parties": [{"name": "string", "type": "Corporation|LLC|etc", "jurisdiction": "string"}],
    "effectiveDate": "readable date"
  },
  "recitals": ["array of whereas statements in ${keyData.language}"],
  "sections": [
    {
      "number": "1", 
      "title": "SECTION NAME in ${keyData.language}",
      "paragraphs": ["array of paragraph text in ${keyData.language}"]
    }
  ]
}

LANGUAGE REQUIREMENT: ${keyData.language !== 'English' ? `
CRITICAL: Generate 100% of content in ${keyData.language} only. This includes:
- Document preamble: "ESTE ACUERDO" not "THIS ACUERDO" 
- Legal terms: "Acuerdo" not "Agreement", "Fecha de Entrada en Vigor" not "Effective Date"
- Entity types: "Corporación" not "Corporation", "Sociedad" not "LLC"  
- Jurisdictions: Translate country names to ${keyData.language}
- All parenthetical terms must be in ${keyData.language}
- NO English words mixed with ${keyData.language} content
Use proper ${keyData.language} legal terminology throughout.` : 'Generate content in English with professional legal terminology.'}

CONTENT: VERBOSE AND DETAILED - Generate comprehensive 4-6 paragraph sections with extensive legal language | Professional legal language | Real data only | Complete business terms with thorough explanations | Detailed coverage of rights, obligations, procedures, and consequences${keyData.language !== 'English' ? ` | Example preamble format for ${keyData.language}: "ESTE ACUERDO DE [TIPO] (el "Acuerdo") se celebra a partir del [FECHA] (la "Fecha de Entrada en Vigor") entre: [EMPRESA], una Corporación organizada bajo las leyes de [PAÍS] (la "Compañía"); y [CONTRAPARTE], una Corporación organizada bajo las leyes de [PAÍS] (la "Contraparte");"` : ''}

CONTEXT:
Industry: ${subindustryGuidance}
Business: ${spec.context.industry.businessExamples || 'standard business operations'}
Regulations: ${spec.context.industry.regulations.join(', ')}
Legal System: ${spec.context.geography.legalSystem}
Currency: ${spec.context.geography.currencySymbol} (${spec.context.geography.exampleAmount})
Date Format: ${spec.context.geography.dateFormat}

ADDRESSES:
${keyData.parties.first.name}: ${companyAAddress}
${keyData.parties.counter.name}: ${companyBAddress}${financialSection}

EFFECTIVE: ${dynamicData.effectiveDate}
SECTIONS: ${sectionTemplate.replace('|Signatures', '')}
OBLIGATIONS: ${keyData.obligations.join(', ')}

BEGIN:`;

    return prompt;
  }

  // ============ Helper Methods ============

  extractObligations(specialInstructions) {
    const obligations = [];
    const instructionStr = (specialInstructions || '').toString();
    
    // Check each obligation in OBL_TEXT (import from constants)
    if (typeof OBL_TEXT !== 'undefined') {
      for (const [key, text] of Object.entries(OBL_TEXT)) {
        if (instructionStr.includes(key) || instructionStr.includes(text)) {
          obligations.push({ key, text });
        }
      }
    }
    
    return obligations;
  }

  extractTerms(specialInstructions) {
    const terms = {};
    const instructionStr = (specialInstructions || '').toString();
    const patterns = {
      effectiveDate: /Effective Date:\s*([^\,]+)/,
      termYears: /Initial Term:\s*(\d+)\s*year/,
      paymentTerms: /Payment Terms:\s*([^\,]+)/,
      renewalNotice: /Renewal Notice Period:\s*(\d+)\s*days/
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = instructionStr.match(pattern);
      if (match) {
        terms[key] = match[1].trim();
      }
    }
    
    return terms;
  }

  extractValue(instructions, fieldName) {
    const instructionStr = (instructions || '').toString();
    const pattern = new RegExp(`${fieldName}:\\s*\\$([\\d,]+)`);
    const match = instructionStr.match(pattern);
    return match ? match[1] : null;
  }

  // Generate geography and industry appropriate financial values
  generateFinancialValues(agreementType, industry, geography) {
    const geo = this.geographyMap[geography] || this.geographyMap['NAMER'];
    
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
    const oneTimeAmount = Math.floor(contractValue * (0.05 + Math.random() * 0.15)); // 5-20% of contract
    const monthlyAmount = Math.floor(contractValue * (0.02 + Math.random() * 0.08)); // 2-10% monthly
    
    // Generate dates in geography-appropriate format
    const today = new Date();
    const depositDue = new Date(today.getTime() + Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000); // 0-90 days
    const firstPaymentDue = new Date(today.getTime() + Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000); // 0-180 days

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

    return {
      contractValue: formatAmount(contractValue),
      depositAmount: formatAmount(depositAmount), 
      oneTimeAmount: formatAmount(oneTimeAmount),
      monthlyAmount: formatAmount(monthlyAmount),
      depositDue: this.formatDateForGeography(depositDue, geography),
      firstPaymentDue: this.formatDateForGeography(firstPaymentDue, geography),
      rawContractValue: contractValue
    };
  }

  // Determine which document types should include financial values
  shouldIncludeFinancialValues(agreementType) {
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

  determinePartyRole(agreementType, party) {
    const roles = {
      'first': {
        'Service Agreement': 'Service Provider',
        'Consulting Agreement': 'Consultant',
        'License Agreement': 'Licensor',
        'Supply Agreement': 'Supplier',
        'MSA': 'Company',
        'NDA': 'Disclosing Party'
      },
      'counter': {
        'Service Agreement': 'Client',
        'Consulting Agreement': 'Client',
        'License Agreement': 'Licensee',
        'Supply Agreement': 'Purchaser',
        'MSA': 'Client',
        'NDA': 'Receiving Party'
      }
    };
    
    // Check for matching pattern
    for (const [pattern, role] of Object.entries(roles[party] || {})) {
      if (agreementType.includes(pattern)) {
        return role;
      }
    }
    
    return party === 'first' ? 'Company' : 'Counterparty';
  }

  getParentRelationship(childType, parentType) {
    if (childType.includes('SOW') && parentType === 'MSA') {
      return 'Governed by Master Agreement';
    }
    if (childType.includes('Change Order')) {
      return 'Modifies Statement of Work';
    }
    return 'Related to parent agreement';
  }

  getRegulations(industry, subindustry, geography) {
    const regs = this.regulationMap[industry];
    if (!regs) return [];
    
    const applicable = [...(regs.base || [])];
    if (subindustry && regs[subindustry]) {
      applicable.push(...regs[subindustry]);
    }
    
    // Add geography-specific regulations
    if (geography === 'NAMER') {
      // Add NAMER-specific regulations
      if (industry === 'Technology') {
        applicable.push('CCPA'); // California Consumer Privacy Act
      }
      if (industry === 'Financial Services') {
        applicable.push('CFPB'); // Consumer Financial Protection Bureau
      }
      if (industry === 'Healthcare') {
        applicable.push('HITECH'); // Health Information Technology for Economic and Clinical Health Act
      }
    } else if (geography === 'EMEA') {
      // EMEA-specific regulations (GDPR already in base for most)
      if (industry === 'Technology') {
        applicable.push('DMA', 'DSA'); // Digital Markets Act, Digital Services Act
      }
      if (industry === 'Financial Services') {
        applicable.push('MiFID II', 'PSD2');
      }
    } else if (geography === 'APAC') {
      // APAC-specific regulations
      if (industry === 'Technology') {
        applicable.push('PDPA'); // Personal Data Protection Act (various APAC countries)
      }
      if (industry === 'Financial Services') {
        applicable.push('MAS'); // Monetary Authority of Singapore
      }
    } else if (geography === 'LATAM') {
      // LATAM-specific regulations
      if (industry === 'Technology') {
        applicable.push('LGPD'); // Lei Geral de Proteção de Dados (Brazil)
      }
      if (industry === 'Financial Services') {
        applicable.push('BACEN'); // Central Bank of Brazil
      }
    }
    
    return applicable;
  }

  getLegalSystem(geography) {
    const systems = {
      'NAMER': 'Common Law',
      'EMEA': 'Civil/Common Law Mixed',
      'APAC': 'Mixed Legal Systems',
      'LATAM': 'Civil Law'
    };
    return systems[geography] || 'Common Law';
  }

  getComplexityLevel(industry) {
    const complexity = {
      'Healthcare': 'high',
      'Financial Services': 'high',
      'Energy': 'high',
      'Technology': 'medium',
      'Manufacturing': 'medium',
      'Real Estate': 'medium',
      'HR': 'low'
    };
    return complexity[industry] || 'medium';
  }

  getSubindustryGuidance(subindustry) {
    // Use enhanced cache manager for O(1) lookup instead of O(n) object creation
    if (typeof DocumentCache !== 'undefined' && DocumentCache.initialized) {
      return DocumentCache.getSubindustryGuidance(subindustry);
    }
    
    // Fallback to basic guidance if cache not available
    const basicGuidance = {
      "Wealth Management": "Focus on fiduciary responsibilities, fee transparency, and regulatory compliance with SEC and state investment advisor requirements.",
      "SaaS": "Emphasize data security, service level agreements, API governance, and GDPR compliance.",
      "Healthcare IT": "Prioritize HIPAA compliance, patient data protection, and interoperability standards.",
      "Fintech": "Emphasize financial services regulations, payment processing compliance, and consumer protection."
    };
    
    return basicGuidance[subindustry] || `Standard professional practices for ${subindustry} with industry-appropriate terminology and regulatory compliance.`;
  }

  getBusinessExamples(subindustry) {
    const examplesMap = {
      "Wealth Management": "portfolio management services, investment advisory relationships, client asset custody",
      "SaaS": "cloud software licensing, API access, data processing services",
      "Healthcare IT": "electronic health record systems, medical device integration, patient data management",
      "Digital Health": "telemedicine platforms, health monitoring applications, clinical decision support systems",
      "Telehealth": "remote patient consultations, virtual care delivery, digital therapeutic interventions",
      "Automotive": "vehicle component manufacturing, supply chain logistics, quality control systems",
      "Solar": "photovoltaic system installation, renewable energy generation, grid interconnection services",
      "Wind": "wind turbine installation, renewable energy production, power purchase agreements",
      "Banking": "deposit services, lending operations, payment processing systems",
      "Insurance": "policy underwriting, claims processing, risk assessment services",
      "Gaming": "game development, player engagement systems, virtual goods transactions",
      "E-commerce": "online marketplace operations, digital payment processing, customer data management",
      "Fintech": "digital payment solutions, peer-to-peer lending, cryptocurrency services",
      "Aerospace": "aircraft component manufacturing, defense contracting, space technology development",
      "Oil & Gas": "hydrocarbon extraction, refining operations, energy distribution systems"
    };

    return examplesMap[subindustry] || `${subindustry} business operations and service delivery`;
  }

  // Method to show cache efficiency
  getCacheStats() {
    const totalAddresses = Object.values(this.sectionCache.addressExamples)
      .reduce((total, addresses) => total + addresses.length, 0);
    
    const totalSignatures = Object.values(this.sectionCache.signatureBlocks)
      .reduce((total, signatures) => total + signatures.length, 0);
    
    return {
      geographyEntries: Object.keys(this.geographyMap).length,
      cachedRulesSections: Object.keys(this.cachedRules).length,
      addressGeographies: Object.keys(this.sectionCache.addressExamples).length,
      totalAddresses: totalAddresses,
      addressesPerGeography: totalAddresses / Object.keys(this.sectionCache.addressExamples).length,
      signatureGeographies: Object.keys(this.sectionCache.signatureBlocks).length,
      totalSignatures: totalSignatures,
      signaturesPerGeography: totalSignatures / Object.keys(this.sectionCache.signatureBlocks).length,
      regulationEntries: Object.keys(this.regulationMap).length,
      totalCachedElements: Object.keys(this.geographyMap).length + 
                         Object.keys(this.cachedRules).length + 
                         Object.keys(this.sectionCache).length + 
                         Object.keys(this.regulationMap).length,
      addressVariety: `Company A: Fixed, Company B: ${Object.values(this.sectionCache.addressExamples)[0].length - 1} options`,
      signatureVariety: `Company A: Fixed, Company B: ${Object.values(this.sectionCache.signatureBlocks)[0].length - 1} options`
    };
  }

  extractDynamicData(specialInstructions, geography) {
    const instructionStr = (specialInstructions || '').toString();
    const today = new Date();
    
    // Format current date based on geography
    const dateFormat = this.geographyMap[geography]?.dateFormat || 'MM/DD/YYYY';
    const sampleDate = this.formatDateForGeography(today, geography);
    
    // Parse specific data from specialInstructions
    const effectiveDateMatch = instructionStr.match(/Effective Date:\s*([^\,]+)/);
    const effectiveDate = effectiveDateMatch ? effectiveDateMatch[1].trim() : sampleDate;
    
    // Build comprehensive instructions from specialInstructions
    let instructions = instructionStr;
    if (!instructions || instructions.length < 10) {
      // Generate basic fallback instructions
      instructions = `Effective Date: ${effectiveDate}, Standard business terms apply`;
    }
    
    return {
      effectiveDate,
      sampleDate,
      instructions,
      dateFormat
    };
  }

  formatDateForGeography(date, geography) {
    const formats = {
      'NAMER': (d) => `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`,
      'EMEA': (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`,
      'APAC': (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`,
      'LATAM': (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
    };
    
    return formats[geography] ? formats[geography](date) : formats['NAMER'](date);
  }

  getCountryFromGeography(geography) {
    const countryMap = {
      'NAMER': 'United States',
      'EMEA': 'United Kingdom', 
      'APAC': 'Singapore',
      'LATAM': 'Brazil'
    };
    return countryMap[geography] || 'United States';
  }

  // Get agreement-specific section template
  getSectionTemplate(agreementType) {
    // Extract key terms for matching
    const docKey = this.getDocumentKey(agreementType);
    
    // Direct match first
    if (this.sectionCache.sectionTemplates[docKey]) {
      return this.sectionCache.sectionTemplates[docKey];
    }
    
    // Pattern matching for complex agreement names
    const patterns = {
      'NDA': /non-disclosure|confidentiality|nda/i,
      'MSA': /master service|msa/i,
      'Software License': /software license|license agreement/i,
      'Consulting': /consulting|consultant/i,
      'Employment': /employment|offer letter|employee/i,
      'SaaS': /saas|software.*service/i,
      'API Terms': /api.*terms|api.*service/i,
      'Cloud Services': /cloud.*service|cloud.*agreement/i,
      'Data Processing': /data.*processing|dpa/i,
      'Supply Agreement': /supply|supplier/i,
      'Distribution Agreement': /distribution|distributor/i,
      'Investment Advisory': /investment.*advisory|wealth.*management/i,
      'Clinical Trial': /clinical.*trial|clinical.*research/i
    };
    
    for (const [templateKey, pattern] of Object.entries(patterns)) {
      if (pattern.test(agreementType)) {
        return this.sectionCache.sectionTemplates[templateKey];
      }
    }
    
    // Fallback to default
    return this.sectionCache.default;
  }

  // Extract document key from agreement type
  getDocumentKey(agreementType) {
    // Handle common abbreviations and full names
    const keyMappings = {
      'Non-Disclosure Agreement (NDA)': 'NDA',
      'Master Service Agreement (MSA)': 'MSA',
      'Software License Agreement': 'Software License',
      'Consulting Agreement': 'Consulting',
      'Employment Agreement': 'Employment',
      'Offer Letter': 'Employment',
      'SaaS Agreement': 'SaaS',
      'Cloud Services Agreement': 'Cloud Services',
      'Data Processing Agreement (DPA)': 'Data Processing',
      'API Terms of Service': 'API Terms',
      'Supply Agreement': 'Supply Agreement',
      'Distribution Agreement': 'Distribution Agreement',
      'Investment Advisory Agreement': 'Investment Advisory',
      'Clinical Trial Agreement': 'Clinical Trial'
    };
    
    return keyMappings[agreementType] || agreementType;
  }
}

// Create global instance
const promptEngineV2 = new PromptEngineV2();
