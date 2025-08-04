// Fixed 08_agenticService.js - Removes problematic method calls

class DocumentAgent {
  constructor() {
    this.customerProfiles = this.loadCustomerProfiles();
    this.conversationContext = new Map();
    this.validationSteps = ['industry', 'subindustry', 'documentTypes', 'firstParty', 'quantity'];
  }

  loadCustomerProfiles() {
    try {
      const stored = PropertiesService.getScriptProperties().getProperty('CUSTOMER_PROFILES');
      if (stored) {
        const profiles = JSON.parse(stored);
        return new Map(Object.entries(profiles));
      }
    } catch (e) {
      Logger.log('No existing customer profiles found');
    }
    return new Map();
  }

  saveCustomerProfiles() {
    try {
      const profilesObj = Object.fromEntries(this.customerProfiles);
      PropertiesService.getScriptProperties().setProperty('CUSTOMER_PROFILES', JSON.stringify(profilesObj));
    } catch (e) {
      Logger.log('Error saving customer profiles: ' + e.message);
    }
  }

  async processRequest(userId, message) {
    try {
      const context = this.getConversationContext(userId);
      
      // Check if we're in a validation flow
      if (context.validationStep) {
        return await this.handleValidationResponse(userId, message, context);
      }
      
      // Parse initial intent
      const intent = await this.parseIntent(message);
      Logger.log(`Processing request - Intent: ${intent.type}, User: ${userId}`);
      
      switch (intent.type) {
        case 'CREATE_DOCUMENTS':
          return await this.startValidationProcess(userId, intent);
        case 'INQUIRE_CUSTOMER':
          return await this.handleCustomerInquiry(userId, intent, context);
        case 'MODIFY_REQUEST':
          return await this.handleRequestModification(userId, intent, context);
        default:
          return this.generateHelpResponse();
      }
    } catch (error) {
      Logger.log(`Error in processRequest: ${error.message}`);
      return {
        success: false,
        message: `I encountered an error: ${error.message}. Please try again or start a new request.`
      };
    }
  }

  // Start the step-by-step validation process
  async startValidationProcess(userId, intent) {
    const params = intent.parameters;
    
    // Initialize validation context
    const validationData = {
      customer: params.customer,
      inferredIndustry: params.industry || (params.customer ? this.inferIndustryFromName(params.customer) : null),
      inferredQuantity: params.quantity || (params.createSets ? 5 : 1),
      inferredFirstParty: 'Fontara', // Default
      requestedDocTypes: params.documentTypes || [],
      validationStep: 'industry',
      stepIndex: 0,
      confirmedData: {}
    };

    this.updateConversationContext(userId, validationData);
    
    if (!params.customer) {
      return {
        success: false,
        needsClarification: true,
        message: "I need to know which customer or client this is for to get started.",
        questions: ["Which customer or client should I create documents for?"]
      };
    }

    return this.executeValidationStep(userId, validationData);
  }

  // Handle responses during validation flow
  async handleValidationResponse(userId, message, context) {
    try {
      const currentStep = context.validationStep;
      
      // Parse the response for the current validation step
      const response = await this.parseValidationResponse(message, currentStep, context);
      
      if (response.confirmed) {
        // Store the confirmed data
        context.confirmedData[currentStep] = response.value;
        
        // Move to next step
        context.stepIndex++;
        if (context.stepIndex < this.validationSteps.length) {
          context.validationStep = this.validationSteps[context.stepIndex];
          this.updateConversationContext(userId, context);
          return this.executeValidationStep(userId, context);
        } else {
          // All validations complete - generate documents
          return await this.generateValidatedDocuments(userId, context);
        }
      } else {
        // User wants to change something - handle the modification
        if (response.newValue) {
          context[response.field] = response.newValue;
        }
        this.updateConversationContext(userId, context);
        return this.executeValidationStep(userId, context);
      }
    } catch (error) {
      Logger.log(`Error in handleValidationResponse: ${error.message}`);
      return {
        success: false,
        message: "I had trouble understanding your response. Could you please clarify?"
      };
    }
  }

  // Execute a specific validation step
  executeValidationStep(userId, context) {
    try {
      const step = context.validationStep;
      
      switch (step) {
        case 'industry':
          return this.validateIndustry(context);
        case 'subindustry':
          return this.validateSubindustry(context);
        case 'documentTypes':
          return this.validateDocumentTypes(context);
        case 'firstParty':
          return this.validateFirstParty(context);
        case 'quantity':
          return this.validateQuantity(context);
        default:
          return this.generateHelpResponse();
      }
    } catch (error) {
      Logger.log(`Error in executeValidationStep: ${error.message}`);
      return {
        success: false,
        message: "I encountered an error in the validation process. Let's start over."
      };
    }
  }

  // Step 1: Validate Industry
  validateIndustry(context) {
    const inferredIndustry = context.inferredIndustry || 'Technology';
    const availableIndustries = Object.keys(SUBINDUSTRIES);
    
    return {
      success: false,
      needsClarification: true,
      validationStep: 'industry',
      message: `I've analyzed "${context.customer}" and believe they're in the **${inferredIndustry}** industry.`,
      questions: [
        `Is ${inferredIndustry} correct?`,
        `If not, please choose from: ${availableIndustries.join(', ')}`
      ],
      suggestions: {
        confirmed: inferredIndustry,
        alternatives: availableIndustries.filter(i => i !== inferredIndustry)
      }
    };
  }

  // Step 2: Validate Subindustry
  validateSubindustry(context) {
    const industry = context.confirmedData.industry;
    const availableSubindustries = SUBINDUSTRIES[industry] || [];
    const inferredSubindustry = this.inferSubindustryFromName(context.customer, industry);
    
    if (availableSubindustries.includes('All')) {
      // Skip subindustry validation for industries that use 'All'
      context.confirmedData.subindustry = 'All';
      context.stepIndex++;
      context.validationStep = this.validationSteps[context.stepIndex];
      return this.executeValidationStep({}, context);
    }

    return {
      success: false,
      needsClarification: true,
      validationStep: 'subindustry',
      message: `Great! For ${industry} companies, I need to know the specific subindustry.`,
      questions: [
        `Based on "${context.customer}", I think they're in **${inferredSubindustry}**. Is this correct?`,
        `Available options: ${availableSubindustries.join(', ')}`
      ],
      suggestions: {
        confirmed: inferredSubindustry,
        alternatives: availableSubindustries.filter(s => s !== inferredSubindustry)
      }
    };
  }

  // Step 3: Validate Document Types
  validateDocumentTypes(context) {
    const industry = context.confirmedData.industry;
    const subindustry = context.confirmedData.subindustry;
    
    // Get available document types for this industry/subindustry combination
    const availableDocTypes = this.getDocumentTypesForIndustrySubindustry(industry, subindustry);
    const suggestedDocTypes = this.getSuggestedDocumentTypes(industry, subindustry, context.inferredQuantity);
    
    return {
      success: false,
      needsClarification: true,
      validationStep: 'documentTypes',
      message: `Perfect! For ${industry} > ${subindustry}, here are the recommended document types:`,
      questions: [
        `I suggest: **${suggestedDocTypes.join(', ')}**`,
        "Would you like to use these, or choose different ones?",
        `Available options: ${availableDocTypes.slice(0, 8).join(', ')}${availableDocTypes.length > 8 ? `, and ${availableDocTypes.length - 8} more...` : ''}`
      ],
      suggestions: {
        recommended: suggestedDocTypes,
        available: availableDocTypes
      }
    };
  }

  // Step 4: Validate First Party
  validateFirstParty(context) {
    const inferredFirstParty = context.inferredFirstParty || 'Fontara';
    
    return {
      success: false,
      needsClarification: true,
      validationStep: 'firstParty',
      message: `I'll set up these documents with **${inferredFirstParty}** as the first party (your company).`,
      questions: [
        `Is "${inferredFirstParty}" correct?`,
        "If not, please provide the correct company name."
      ],
      suggestions: {
        confirmed: inferredFirstParty
      }
    };
  }

  // Step 5: Validate Quantity
  validateQuantity(context) {
    const docTypes = context.confirmedData.documentTypes;
    const inferredQuantity = context.inferredQuantity;
    const isDocumentSet = inferredQuantity >= 5 || docTypes.length >= 5;
    
    let message = `I'll create ${docTypes.length} document type(s) with ${inferredQuantity} total documents.`;
    
    if (isDocumentSet) {
      message += "\nThis looks like a complete document set - I'll create linked documents (MSA → SOWs → Change Orders).";
    }

    return {
      success: false,
      needsClarification: true,
      validationStep: 'quantity',
      message: message,
      questions: [
        `Quantity: ${inferredQuantity} documents`,
        `Document types: ${docTypes.join(', ')}`,
        "Is this correct? Say 'yes' to proceed or specify changes."
      ],
      suggestions: {
        quantity: inferredQuantity,
        documentTypes: docTypes,
        isSet: isDocumentSet
      }
    };
  }

  // Parse validation responses
  async parseValidationResponse(message, currentStep, context) {
    const lowerMessage = message.toLowerCase().trim();
    
    // Handle confirmations
    if (['yes', 'correct', 'that\'s right', 'confirmed', 'proceed', 'looks good'].some(phrase => lowerMessage.includes(phrase))) {
      return { 
        confirmed: true, 
        value: this.getDefaultValueForStep(currentStep, context) 
      };
    }

    // Handle specific responses based on step
    switch (currentStep) {
      case 'industry':
        return this.parseIndustryResponse(message, context);
      case 'subindustry':
        return this.parseSubindustryResponse(message, context);
      case 'documentTypes':
        return this.parseDocumentTypesResponse(message, context);
      case 'firstParty':
        return this.parseFirstPartyResponse(message, context);
      case 'quantity':
        return this.parseQuantityResponse(message, context);
      default:
        return { confirmed: false };
    }
  }

  parseIndustryResponse(message, context) {
    const availableIndustries = Object.keys(SUBINDUSTRIES);
    const foundIndustry = availableIndustries.find(industry => 
      message.toLowerCase().includes(industry.toLowerCase())
    );
    
    if (foundIndustry) {
      return { confirmed: true, value: foundIndustry };
    }
    
    return { confirmed: true, value: context.inferredIndustry }; // Default to inferred
  }

  parseSubindustryResponse(message, context) {
    const industry = context.confirmedData.industry;
    const availableSubindustries = SUBINDUSTRIES[industry] || [];
    const foundSubindustry = availableSubindustries.find(sub => 
      message.toLowerCase().includes(sub.toLowerCase())
    );
    
    if (foundSubindustry) {
      return { confirmed: true, value: foundSubindustry };
    }
    
    return { confirmed: true, value: this.inferSubindustryFromName(context.customer, industry) };
  }

  parseDocumentTypesResponse(message, context) {
    const industry = context.confirmedData.industry;
    const subindustry = context.confirmedData.subindustry;
    
    // Check if they want the suggested ones
    if (message.toLowerCase().includes('use these') || message.toLowerCase().includes('suggested')) {
      const suggested = this.getSuggestedDocumentTypes(industry, subindustry, context.inferredQuantity);
      return { confirmed: true, value: suggested };
    }
    
    // Try to parse specific document types from their response
    const availableDocTypes = this.getDocumentTypesForIndustrySubindustry(industry, subindustry);
    const requestedTypes = [];
    
    for (const docType of availableDocTypes) {
      const simpleName = docType.toLowerCase();
      if (message.toLowerCase().includes('nda') && docType.includes('NDA')) {
        requestedTypes.push(docType);
      } else if (message.toLowerCase().includes('msa') && docType.includes('MSA')) {
        requestedTypes.push(docType);
      } else if (message.toLowerCase().includes('sow') && docType.includes('SOW')) {
        requestedTypes.push(docType);
      } else if (simpleName.includes(message.toLowerCase()) || message.toLowerCase().includes(simpleName)) {
        requestedTypes.push(docType);
      }
    }
    
    if (requestedTypes.length > 0) {
      return { confirmed: true, value: requestedTypes };
    }
    
    // Default to suggested
    const suggested = this.getSuggestedDocumentTypes(industry, subindustry, context.inferredQuantity);
    return { confirmed: true, value: suggested };
  }

  parseFirstPartyResponse(message, context) {
    // If they mention a different company name
    const words = message.split(' ');
    const potentialCompany = words.find(word => word.length > 2 && word[0].toUpperCase() === word[0]);
    
    if (potentialCompany && !['Yes', 'No', 'Correct', 'Wrong'].includes(potentialCompany)) {
      return { confirmed: true, value: potentialCompany };
    }
    
    return { confirmed: true, value: context.inferredFirstParty };
  }

  parseQuantityResponse(message, context) {
    // Look for numbers in the message
    const numberMatch = message.match(/\b(\d+)\b/);
    if (numberMatch) {
      const quantity = parseInt(numberMatch[1]);
      return { 
        confirmed: true, 
        value: {
          quantity: quantity,
          documentTypes: context.confirmedData.documentTypes,
          createSets: quantity >= 5
        }
      };
    }
    
    return { 
      confirmed: true, 
      value: {
        quantity: context.inferredQuantity,
        documentTypes: context.confirmedData.documentTypes,
        createSets: context.inferredQuantity >= 5
      }
    };
  }

  getDefaultValueForStep(step, context) {
    switch (step) {
      case 'industry':
        return context.inferredIndustry;
      case 'subindustry':
        return this.inferSubindustryFromName(context.customer, context.confirmedData.industry);
      case 'documentTypes':
        return this.getSuggestedDocumentTypes(
          context.confirmedData.industry, 
          context.confirmedData.subindustry, 
          context.inferredQuantity
        );
      case 'firstParty':
        return context.inferredFirstParty;
      case 'quantity':
        return {
          quantity: context.inferredQuantity,
          documentTypes: context.confirmedData.documentTypes,
          createSets: context.inferredQuantity >= 5
        };
      default:
        return null;
    }
  }

  // Get document types for specific industry/subindustry combination
  getDocumentTypesForIndustrySubindustry(industry, subindustry) {
    const availableTypes = [];
    
    // Get all document types for this industry
    for (const [docType, meta] of Object.entries(DOC_TYPE_LIBRARY)) {
      if (meta.industries.includes('All') || meta.industries.includes(industry)) {
        if (meta.subindustries.includes('All') || meta.subindustries.includes(subindustry)) {
          availableTypes.push(docType);
        }
      }
    }
    
    return availableTypes;
  }

  // Get suggested document types based on industry, subindustry, and quantity
  getSuggestedDocumentTypes(industry, subindustry, quantity) {
    const availableTypes = this.getDocumentTypesForIndustrySubindustry(industry, subindustry);
    
    if (quantity >= 5) {
      // Return document set
      return this.getDocumentSetForIndustry(industry, availableTypes);
    } else {
      // Return most common documents
      return this.getCommonDocumentsForIndustrySubindustry(industry, subindustry, quantity, availableTypes);
    }
  }

  getDocumentSetForIndustry(industry, availableTypes) {
    const setTypes = [
      availableTypes.find(t => t.includes("NDA")) || "Non-Disclosure Agreement (NDA)",
      availableTypes.find(t => t.includes("MSA")) || "Master Service Agreement (MSA)",
      availableTypes.find(t => t.includes("SOW")) || "Statement Of Work (SOW)",
      availableTypes.find(t => t.includes("SOW")) || "Statement Of Work (SOW)",
      availableTypes.find(t => t.includes("Change Order")) || "Change Order"
    ];
    
    return setTypes.filter(type => availableTypes.includes(type));
  }

  getCommonDocumentsForIndustrySubindustry(industry, subindustry, quantity, availableTypes) {
    // Industry-specific priority order
    const industryPriorities = {
      'Technology': ['Non-Disclosure Agreement (NDA)', 'Software License Agreement', 'Master Service Agreement (MSA)', 'Data Processing Agreement (DPA)'],
      'Healthcare': ['Non-Disclosure Agreement (NDA)', 'Business Associate Agreement (BAA)', 'Master Service Agreement (MSA)', 'Clinical Trial Agreement'],
      'Financial Services': ['Non-Disclosure Agreement (NDA)', 'Master Service Agreement (MSA)', 'Investment Advisory Agreement', 'Payment Processing Agreement'],
      'Manufacturing': ['Non-Disclosure Agreement (NDA)', 'Supply Agreement', 'Master Service Agreement (MSA)', 'Manufacturing Services Agreement'],
      'Energy': ['Non-Disclosure Agreement (NDA)', 'Master Service Agreement (MSA)', 'Power Purchase Agreement (PPA)', 'Energy Services Agreement']
    };
    
    const priorities = industryPriorities[industry] || industryPriorities['Technology'];
    const suggestions = [];
    
    for (const docType of priorities) {
      if (availableTypes.includes(docType) && suggestions.length < quantity) {
        suggestions.push(docType);
      }
    }
    
    // Fill remaining slots with other available types
    for (const docType of availableTypes) {
      if (!suggestions.includes(docType) && suggestions.length < quantity) {
        suggestions.push(docType);
      }
    }
    
    return suggestions.slice(0, quantity);
  }

  // Infer subindustry from customer name
  inferSubindustryFromName(customerName, industry) {
    const subindustryKeywords = {
      'Technology': {
        'SaaS': ['saas', 'software', 'platform', 'cloud'],
        'Fintech': ['fintech', 'payment', 'finance', 'bank'],
        'Gaming': ['game', 'gaming', 'entertainment'],
        'Mobile Apps': ['mobile', 'app', 'ios', 'android']
      },
      'Healthcare': {
        'Pharmaceuticals': ['pharma', 'drug', 'medicine'],
        'Medical Devices': ['device', 'equipment', 'instrument'],
        'Digital Health': ['digital', 'health', 'wellness'],
        'Telehealth': ['telehealth', 'telemedicine', 'remote']
      },
      'Manufacturing': {
        'Automotive': ['auto', 'car', 'motor', 'ford', 'gm'],
        'Aerospace': ['aerospace', 'aviation', 'aircraft'],
        'Consumer Goods': ['consumer', 'retail', 'product'],
        'Electronics': ['electronic', 'component', 'semiconductor']
      },
      'Financial Services': {
        'Banking': ['bank', 'credit', 'loan'],
        'Insurance': ['insurance', 'coverage', 'policy'],
        'Investment Banking': ['investment', 'capital', 'securities'],
        'Wealth Management': ['wealth', 'asset', 'portfolio']
      },
      'Energy': {
        'Solar': ['solar', 'photovoltaic', 'pv'],
        'Wind': ['wind', 'turbine', 'renewable'],
        'Oil & Gas': ['oil', 'gas', 'petroleum', 'energy'],
        'Utilities': ['utility', 'electric', 'power', 'grid']
      }
    };
    
    const lowerName = customerName.toLowerCase();
    const industryKeywords = subindustryKeywords[industry] || {};
    
    for (const [subindustry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return subindustry;
      }
    }
    
    // Return first available subindustry as default
    const availableSubindustries = SUBINDUSTRIES[industry] || ['All'];
    return availableSubindustries[0];
  }

  // Generate documents after all validations are complete
  async generateValidatedDocuments(userId, context) {
    try {
      const confirmedData = context.confirmedData;
      const quantityData = confirmedData.quantity;
      
      const params = {
        email: 'agent@fontara.com',
        quantity: quantityData.quantity,
        specialInstructions: '',
        docTypeString: quantityData.documentTypes.join(', '),
        language: 'English',
        geography: 'NAMER',
        firstParty: confirmedData.firstParty,
        industry: confirmedData.industry,
        createSets: quantityData.createSets,
        counterparty: context.customer
      };

      const result = await this.generateDocumentsWithExistingSystem(params);
      
      // Clear conversation context
      this.conversationContext.delete(userId);
      
      return {
        success: true,
        message: this.formatValidatedSuccessResponse(result, confirmedData),
        documents: result.documents,
        folderId: result.folderId,
        folderUrl: result.folderUrl
      };
    } catch (error) {
      Logger.log('Document generation error: ' + error.message);
      return {
        success: false,
        message: `Sorry, I encountered an error creating the documents: ${error.message}. Please try again.`
      };
    }
  }

  formatValidatedSuccessResponse(result, confirmedData) {
    const docCount = result.documents.length;
    
    let message = `🎉 **Documents Created Successfully!**\n\n`;
    message += `✅ **Customer**: ${result.customer}\n`;
    message += `✅ **Industry**: ${confirmedData.industry} > ${confirmedData.subindustry}\n`;
    message += `✅ **First Party**: ${confirmedData.firstParty}\n`;
    message += `✅ **Documents**: ${docCount} created\n\n`;
    
    message += `📁 **Access your documents**: ${result.folderUrl}\n\n`;
    
    const docList = result.documents
      .filter(d => d.status === 'created')
      .map(d => `• ${d.type} (${d.contractNumber})`)
      .join('\n');
    
    if (docList) {
      message += `**Documents created:**\n${docList}`;
    }
    
    return message;
  }

  // Generate documents using existing system
  async generateDocumentsWithExistingSystem(params) {
    Logger.log('Generating documents with params: ' + JSON.stringify(params, null, 2));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const folderName = `${params.counterparty}_${timestamp}`;
    
    const properties = PropertiesService.getScriptProperties();
    const rootFolderId = properties.getProperty("ROOT_FOLDER_ID");
    if (!rootFolderId) {
      throw new Error("ROOT_FOLDER_ID is not set in Script Properties.");
    }
    
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const subfolder = rootFolder.createFolder(folderName);

    const documents = [];
    let parents = {};

    try {
      if (params.createSets) {
        const docTypes = params.docTypeString.split(',').map(s => s.trim());

        for (const docType of docTypes) {
          const docData = generateSetDocumentRow(params, docType, params.counterparty);
          
          if (docType.includes("MSA")) parents.MSA = docData;
          if (docType.includes("SOW")) parents.SOW = docData;
          
          linkParentContracts(docData, parents);
          processAndCreateFile(docData, subfolder);
          
          documents.push({
            type: docType,
            contractNumber: docData.contractNumber,
            status: 'created'
          });
        }
      } else {
        const docTypes = params.docTypeString.split(',').map(s => s.trim()).filter(s => s);
        
        for (let i = 0; i < params.quantity; i++) {
          for (const docType of docTypes) {
            const docData = generateRandomDocumentRow({
              ...params,
              docTypeString: `(${docType})`
            });
            
            if (docData) {
              processAndCreateFile(docData, subfolder);
              
              documents.push({
                type: docType,
                contractNumber: docData.contractNumber,
                status: 'created'
              });
            }
          }
        }
      }

      const docCount = documents.length;
      const successMessage = `Success! ${docCount} documents created for ${params.counterparty}`;
      sendSlackNotification(params.email, successMessage, params.language, subfolder.getUrl());

      return {
        folderId: subfolder.getId(),
        folderUrl: subfolder.getUrl(),
        documents: documents,
        customer: params.counterparty,
        createdAt: new Date()
      };

    } catch (error) {
      try {
        subfolder.setTrashed(true);
      } catch (cleanupError) {
        Logger.log('Error cleaning up folder: ' + cleanupError.message);
      }
      throw error;
    }
  }

  async parseIntent(message) {
    try {
      const prompt = `
      Analyze this user message for document generation and extract the intent and parameters:
      "${message}"
      
      Possible intents:
      - CREATE_DOCUMENTS: User wants to generate documents
      - INQUIRE_CUSTOMER: User asking about customer details  
      - MODIFY_REQUEST: User wants to change a previous request
      
      Extract these parameters if mentioned:
      - customer: customer/client name mentioned
      - documentTypes: specific types mentioned (NDA, MSA, SOW, etc.)
      - quantity: number of documents (look for numbers)
      - industry: business sector mentioned
      - createSets: true if they mention "complete set", "document set", or quantity >= 5
      
      Return ONLY valid JSON:
      {
        "type": "intent_type",
        "parameters": {
          "customer": "extracted_customer_name",
          "documentTypes": ["list", "of", "types"],
          "quantity": number,
          "industry": "extracted_industry",
          "createSets": boolean
        }
      }
      `;

      const role = 'You are an expert at parsing document generation requests. Always return valid JSON.';
      const response = await PreSalesOpenAI.executePrompt4o(role, prompt);
      
      const cleanResponse = response.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (e) {
      Logger.log('Error parsing intent: ' + e.message);
      return {
        type: 'CREATE_DOCUMENTS',
        parameters: {}
      };
    }
  }

  inferIndustryFromName(customerName) {
    const industryKeywords = {
      'Manufacturing': ['manufacturing', 'automotive', 'ford', 'gm', 'toyota', 'factory', 'production', 'industrial', 'motor', 'auto'],
      'Healthcare': ['health', 'medical', 'pharma', 'bio', 'care', 'hospital', 'clinic', 'therapeutics'],
      'Financial Services': ['bank', 'finance', 'capital', 'invest', 'insurance', 'credit', 'financial', 'fintech'],
      'Technology': ['tech', 'software', 'app', 'data', 'digital', 'cloud', 'ai', 'cyber', 'saas', 'platform'],
      'Energy': ['energy', 'solar', 'wind', 'power', 'oil', 'gas', 'electric', 'renewable', 'utility']
    };

    const lowerName = customerName.toLowerCase();
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return industry;
      }
    }
    
    return 'Technology';
  }

  // Handle customer inquiry
  async handleCustomerInquiry(userId, intent, context) {
    const customerName = intent.parameters.customer;
    if (customerName) {
      const profile = this.getOrCreateCustomerProfile(customerName);
      return {
        success: true,
        message: `Here's what I know about ${profile.name}:\n• Industry: ${profile.industry}\n• Geography: ${profile.geography}\n• Language: ${profile.preferredLanguage}`
      };
    }
    
    return {
      success: false,
      message: "I need a customer name to look up their information."
    };
  }

  // Handle request modification
  async handleRequestModification(userId, intent, context) {
    return {
      success: true,
      message: "I can help you modify your request. Please tell me what you'd like to change, or start a new request."
    };
  }

  // Get or create customer profile
  getOrCreateCustomerProfile(customerName) {
    if (!customerName) return null;
    
    const normalizedName = customerName.toLowerCase().trim();
    let profile = this.customerProfiles.get(normalizedName);
    
    if (!profile) {
      profile = this.createCustomerProfile(customerName);
      this.customerProfiles.set(normalizedName, profile);
      this.saveCustomerProfiles();
    }
    
    return profile;
  }

  // Create customer profile
  createCustomerProfile(customerName) {
    return {
      name: customerName,
      industry: this.inferIndustryFromName(customerName),
      geography: 'NAMER',
      preferredLanguage: 'English',
      commonDocTypes: ['Non-Disclosure Agreement (NDA)', 'Master Service Agreement (MSA)'],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  // Context management
  getConversationContext(userId) {
    return this.conversationContext.get(userId) || {};
  }

  updateConversationContext(userId, updates) {
    const current = this.getConversationContext(userId);
    this.conversationContext.set(userId, { ...current, ...updates });
  }

  // Generate help response
  generateHelpResponse() {
    return {
      success: true,
      message: `I'll help you create legal documents with a step-by-step validation process! 

Just tell me which customer you need documents for, and I'll guide you through:
1. ✅ Industry verification  
2. ✅ Subindustry confirmation
3. ✅ Document type selection
4. ✅ First party validation
5. ✅ Quantity confirmation

**Examples to try:**
• "Create documents for Ford Motor Company"
• "I need documents for Mercy Hospital"  
• "Generate documents for TechCorp Inc"

I'll make sure everything is perfect before creating your documents!`
    };
  }
}

// Global instance
const documentAgent = new DocumentAgent();

// Main function
function processAgenticRequest(userId, message) {
  try {
    return documentAgent.processRequest(userId, message);
  } catch (error) {
    Logger.log(`Error in agentic request: ${error.message}`);
    return {
      success: false,
      error: error.message,
      message: "I encountered an error processing your request. Please try again."
    };
  }
}

// Admin functions
function getCustomerProfiles() {
  return Array.from(documentAgent.customerProfiles.entries());
}

function updateCustomerProfile(customerName, profileData) {
  const normalizedName = customerName.toLowerCase().trim();
  const existing = documentAgent.customerProfiles.get(normalizedName) || {};
  
  documentAgent.customerProfiles.set(normalizedName, {
    ...existing,
    ...profileData,
    lastUpdated: new Date().toISOString()
  });
  
  documentAgent.saveCustomerProfiles();
}

function clearConversationContext(userId) {
  if (userId) {
    documentAgent.conversationContext.delete(userId);
  } else {
    documentAgent.conversationContext.clear();
  }
}

// Debug functions for testing the validation flow
function testValidationFlow() {
  const testUserId = 'test-validation-user';
  
  console.log("=== Testing Validation Flow ===");
  
  // Step 1: Initial request
  const step1 = processAgenticRequest(testUserId, 'Create documents for Ford Motor Company');
  console.log("Step 1 - Initial Request:", JSON.stringify(step1, null, 2));
  
  return "Validation flow test completed - check logs for details";
}

function getAvailableDocTypesForIndustry(industry, subindustry) {
  return documentAgent.getDocumentTypesForIndustrySubindustry(industry, subindustry);
}

function getSuggestedDocsForIndustry(industry, subindustry, quantity) {
  return documentAgent.getSuggestedDocumentTypes(industry, subindustry, quantity);
}