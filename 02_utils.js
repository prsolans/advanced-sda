// 02_utils.js (Updated)

function extractDocTypes(docTypeString) {
  const individualDocTypes = [];
  if (!docTypeString) return individualDocTypes;
  const categoryRegex = /\(([^)]+)\)/g;
  let match;
  while ((match = categoryRegex.exec(docTypeString)) !== null) {
    const docsInCategory = match[1].split(",").map(type => type.trim());
    individualDocTypes.push(...docsInCategory);
  }
  return individualDocTypes;
}

function generateContractNumber(agreementType = "") {
  const meta = getDocMetaByName(agreementType);
  const shortPrefix = meta?.key || "CN";
  const randomPart = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `${shortPrefix}-${randomPart}`;
}

function linkParentContracts(docData, parents) {
  const type = docData.agreementType;
  if (type.includes("SOW") && parents.MSA) {
    docData.parentContractNumber = parents.MSA.contractNumber;
    docData.parentContractDate = Utilities.formatDate(parents.MSA.effectiveDate, Session.getScriptTimeZone(), "MM/dd/yyyy");
    docData.parentType = "MSA";
  }
  if (type.includes("Change Order") && parents.SOW) {
    docData.parentContractNumber = parents.SOW.contractNumber;
    docData.parentContractDate = Utilities.formatDate(parents.SOW.effectiveDate, Session.getScriptTimeZone(), "MM/dd/yyyy");
    docData.parentType = "SOW";
  }
  return docData;
}

// ========================================
// ENHANCED HIERARCHICAL PARENT LINKING
// ========================================

/**
 * Enhanced parent linking system for hierarchical document sets
 * @param {Object} docData - Document data with hierarchy metadata
 * @param {Object} documentTree - Complete document tree (optional, for full hierarchy access)
 * @returns {Object} - Updated document data with parent references
 */
function linkHierarchicalParents(docData, documentTree = null) {
  if (!docData.hierarchy || !docData.hierarchy.parentId) {
    return docData; // No parent to link
  }
  
  // Get parent document
  let parent;
  if (documentTree && documentTree.documents) {
    parent = documentTree.documents.get(docData.hierarchy.parentId);
  } else {
    // Fallback: parent should be passed in some other way
    // For now, return unchanged if no tree provided
    return docData;
  }
  
  if (!parent) {
    Logger.log(`Warning: Parent document ${docData.hierarchy.parentId} not found for ${docData.contractNumber}`);
    return docData;
  }
  
  // Set immediate parent reference (maintains backward compatibility)
  docData.parentContractNumber = parent.contractNumber;
  docData.parentContractDate = Utilities.formatDate(parent.effectiveDate, Session.getScriptTimeZone(), "MM/dd/yyyy");
  docData.parentType = parent.agreementType;
  
  // Enhanced: Add full ancestor chain for complex relationships
  if (docData.hierarchy.ancestorPath && docData.hierarchy.ancestorPath.length > 0) {
    docData.ancestorChain = docData.hierarchy.ancestorPath.map(ancestorId => {
      const ancestor = documentTree.documents.get(ancestorId);
      return ancestor ? {
        contractNumber: ancestor.contractNumber,
        agreementType: ancestor.agreementType,
        effectiveDate: Utilities.formatDate(ancestor.effectiveDate, Session.getScriptTimeZone(), "MM/dd/yyyy"),
        relationshipType: ancestor.hierarchy.relationshipType
      } : null;
    }).filter(ancestor => ancestor !== null);
  }
  
  // Add relationship context for AI prompts
  docData.hierarchicalContext = {
    level: docData.hierarchy.level,
    relationshipType: docData.hierarchy.relationshipType,
    hasChildren: docData.hierarchy.children && docData.hierarchy.children.length > 0,
    childCount: docData.hierarchy.children ? docData.hierarchy.children.length : 0,
    setId: docData.setId,
    template: docData.template
  };
  
  return docData;
}

/**
 * Link all documents in a hierarchical document tree
 * @param {Object} documentTree - Complete document tree
 * @returns {Object} - Updated document tree with all parent references linked
 */
function linkAllHierarchicalParents(documentTree) {
  // Process documents level by level to ensure parents are processed first
  const maxLevel = Math.max(...documentTree.hierarchy.keys());
  
  for (let level = 0; level <= maxLevel; level++) {
    const documentsAtLevel = getDocumentsByLevel(documentTree, level);
    
    documentsAtLevel.forEach(docData => {
      linkHierarchicalParents(docData, documentTree);
      // Update the document in the tree
      documentTree.documents.set(docData.contractNumber, docData);
    });
  }
  
  return documentTree;
}

/**
 * Get relationship description for prompt context
 * @param {string} childType - Child document type
 * @param {string} parentType - Parent document type  
 * @param {string} relationshipType - Relationship type from template
 * @returns {string} - Human-readable relationship description
 */
function getEnhancedParentRelationship(childType, parentType, relationshipType) {
  // Use relationship type from template if available
  const relationshipMap = {
    'governs': `This ${childType} is governed by the ${parentType}`,
    'implements': `This ${childType} implements terms defined in the ${parentType}`,
    'modifies': `This ${childType} modifies or amends the ${parentType}`,
    'schedules': `This ${childType} provides specific schedule details for the ${parentType}`,
    'defines': `This ${childType} defines specific terms referenced in the ${parentType}`,
    'confirms': `This ${childType} confirms specific transactions under the ${parentType}`,
    'transfers': `This ${childType} transfers obligations from the ${parentType}`,
    'secures': `This ${childType} provides security for obligations in the ${parentType}`,
    'ensures': `This ${childType} ensures compliance with requirements in the ${parentType}`,
    'provides': `This ${childType} provides services detailed in the ${parentType}`
  };
  
  if (relationshipType && relationshipMap[relationshipType]) {
    return relationshipMap[relationshipType];
  }
  
  // Fallback to original logic for backward compatibility
  if (childType.includes('SOW') && parentType.includes('MSA')) {
    return 'This Statement of Work is governed by the Master Service Agreement';
  }
  if (childType.includes('Change Order')) {
    return 'This Change Order modifies the Statement of Work';
  }
  if (childType.includes('Amendment')) {
    return 'This Amendment modifies the parent agreement';
  }
  
  return `This ${childType} is related to the parent ${parentType}`;
}

// Helper function for backward compatibility
function getDocumentsByLevel(documentTree, level) {
  if (!documentTree || !documentTree.hierarchy) return [];
  
  const contractNumbers = documentTree.hierarchy.get(level) || [];
  return contractNumbers.map(contractNumber => documentTree.documents.get(contractNumber)).filter(doc => doc);
}

function getDocMetaByName(name) {
  return DOC_TYPE_LIBRARY[name] || null;
}

function isNoTermDocType(name) {
  const meta = getDocMetaByName(name);
  return meta?.noTerm === true;
}

function getDocTypesForIndustry(industry) {
  return Object.keys(DOC_TYPE_LIBRARY).filter(
    key => DOC_TYPE_LIBRARY[key].industries.includes("All") ||
           DOC_TYPE_LIBRARY[key].industries.includes(industry)
  );
}

function getDocTypesForSubindustry(subindustry) {
  // Use enhanced cache manager for O(1) lookup instead of O(n) filtering
  if (typeof DocumentCache !== 'undefined' && DocumentCache.initialized) {
    return DocumentCache.getDocTypesForSubindustry(subindustry);
  }
  
  // Fallback to original logic if cache not available
  return Object.keys(DOC_TYPE_LIBRARY).filter(key => {
    const doc = DOC_TYPE_LIBRARY[key];
    return (doc.subindustries.includes("All") || doc.subindustries.includes(subindustry)) &&
           !doc.category.includes("HR-Cross-Industry"); // EXCLUDE HR DOCS
  });
}

function getIndustryFromSubindustry(subindustry) {
  for (const [industry, subindustries] of Object.entries(SUBINDUSTRIES)) {
    if (subindustries.includes(subindustry)) {
      return industry;
    }
  }
  return "Technology"; // Default fallback
}

function parseSubindustrySelection(selection) {
  if (selection && selection.includes(' - ')) {
    const [industry, subindustry] = selection.split(' - ');
    return { 
      industry: industry.trim(), 
      subindustry: subindustry.trim() 
    };
  }
  // Fallback for any legacy entries
  return { 
    industry: "Technology", 
    subindustry: selection || "SaaS" 
  };
}

// ========================================
// CUSTOM UTILITY FUNCTIONS - Healthcare
// ========================================

/**
 * CUSTOM: Generate random physician name with proper formatting
 * @returns {string} - Formatted physician name (Dr. FirstName LastName)
 * 
 * Generates realistic physician names for healthcare document generation
 * Added: [DATE] for Provider Agreement and future healthcare document types
 */
function generateRandomPhysicianName() {
  const firstNames = [
    // Male names - diverse origins
    "Michael", "David", "James", "Daniel", "Andrew", "Matthew", "Kevin", "Ryan",
    "Carlos", "Jose", "Luis", "Diego", "Miguel", "Antonio", "Francisco", "Rafael",
    "Ahmed", "Omar", "Hassan", "Ali", "Mohammad", "Ibrahim", "Yusuf", "Khalil",
    "Raj", "Arjun", "Vikram", "Amit", "Ravi", "Sunil", "Anand", "Deepak",
    "Wei", "Ming", "Lei", "Jun", "Hao", "Yang", "Chen", "Liu",
    "Hiroshi", "Takeshi", "Kenji", "Yuki", "Akira", "Satoshi", "Taro", "Kenzo",
    "Emmanuel", "Kwame", "Kofi", "Yaw", "Adu", "Nana", "Kojo", "Fiifi",
    "Olumide", "Chukwuma", "Emeka", "Ikechukwu", "Chinedu", "Obinna", "Kelechi", "Chibueze",
    "Ivan", "Dmitri", "Alexei", "Sergei", "Nikolai", "Pavel", "Mikhail", "Andrei",
    
    // Female names - diverse origins
    "Sarah", "Jennifer", "Lisa", "Maria", "Jessica", "Amanda", "Nicole", "Emily",
    "Carmen", "Sofia", "Isabella", "Gabriela", "Valeria", "Esperanza", "Catalina", "Alejandra",
    "Fatima", "Aisha", "Zara", "Sara", "Layla", "Amina", "Nour", "Yasmin",
    "Priya", "Kavya", "Meera", "Anita", "Sita", "Radha", "Neha", "Pooja",
    "Li", "Mei", "Xin", "Ling", "Yan", "Hui", "Jing", "Fang",
    "Yuki", "Sakura", "Akiko", "Michiko", "Naomi", "Reiko", "Emiko", "Sayuri",
    "Ama", "Akosua", "Efua", "Adjoa", "Abena", "Akua", "Afia", "Esi",
    "Adunni", "Folake", "Bukola", "Funmi", "Kemi", "Tomi", "Bisi", "Nike",
    "Anya", "Katya", "Olga", "Irina", "Svetlana", "Natasha", "Elena", "Marina"
  ];
  
  const lastNames = [
    // European surnames
    "Anderson", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson",
    "Moore", "Taylor", "Jackson", "White", "Harris", "Martin", "Thompson", "Lee",
    "Clark", "Lewis", "Robinson", "Walker", "Hall", "Allen", "Young", "King",
    "Wright", "Scott", "Torres", "Campbell", "Parker", "Evans", "Edwards", "Collins",
    
    // Hispanic/Latino surnames
    "Garcia", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez",
    "Ramirez", "Cruz", "Flores", "Gomez", "Morales", "Ortiz", "Rivera", "Ramos",
    "Castillo", "Jimenez", "Vargas", "Herrera", "Medina", "Castro", "Ruiz", "Alvarez",
    
    // Middle Eastern/Arabic surnames
    "Al-Rashid", "Al-Mahmoud", "Al-Hassan", "Al-Ahmad", "Al-Zahra", "Mahmood", "Hassan",
    "Ahmad", "Ali", "Khan", "Shah", "Malik", "Qureshi", "Sheikh", "Hussain",
    "Rashid", "Farid", "Nasser", "Khalil", "Mansour", "Saleh", "Omar", "Youssef",
    
    // South Asian surnames
    "Patel", "Shah", "Gupta", "Sharma", "Singh", "Kumar", "Reddy", "Rao",
    "Iyer", "Nair", "Menon", "Agarwal", "Banerjee", "Chakraborty", "Mukherjee", "Das",
    "Verma", "Sinha", "Jain", "Agrawal", "Tiwari", "Mishra", "Pandey", "Yadav",
    
    // East Asian surnames
    "Chen", "Wang", "Li", "Zhang", "Liu", "Yang", "Huang", "Zhao",
    "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Guo",
    "Lin", "He", "Gao", "Luo", "Zheng", "Liang", "Xie", "Tang",
    "Tanaka", "Suzuki", "Takahashi", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi",
    "Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon",
    
    // African surnames
    "Okafor", "Okoro", "Okwu", "Eze", "Nwankwo", "Ugwu", "Chukwu", "Okonkwo",
    "Mensah", "Asante", "Boateng", "Opoku", "Owusu", "Agyei", "Adjei", "Appiah",
    "Mwangi", "Kimani", "Wanjiku", "Kariuki", "Njoroge", "Kamau", "Wambui", "Githui",
    "Mandela", "Mbeki", "Zuma", "Ramaphosa", "Sisulu", "Tambo", "Biko", "Machel",
    
    // Eastern European surnames
    "Petrov", "Ivanov", "Volkov", "Sokolov", "Lebedev", "Kozlov", "Novikov", "Morozov",
    "Popov", "Orlov", "Makarov", "Zaitsev", "Smirnov", "Kuznetsov", "Fedorov", "Mikhailov",
    
    // Additional diverse surnames
    "Okonkwo", "Adebayo", "Olumide", "Chukwuma", "Ngozi", "Emeka", "Chioma", "Kemi",
    "Baptiste", "Pierre", "Jean", "Luc", "Marie", "Antoine", "Francois", "Michel"
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `Dr. ${firstName} ${lastName}`;
}
/**
 * CUSTOM: Generate random medical license number
 * @param {string} state - Optional state abbreviation (default: random)
 * @returns {string} - Formatted license number
 */
function generateMedicalLicenseNumber(state = null) {
  const states = ["UT", "CA", "TX", "FL", "NY", "IL", "PA", "OH", "GA", "NC"];
  const selectedState = state || states[Math.floor(Math.random() * states.length)];
  const licenseNumber = Math.floor(Math.random() * 90000) + 10000; // 5-digit number
  
  return `${selectedState}-${licenseNumber}`;
}

/**
 * CUSTOM: Generate random JDE system number
 * @returns {string} - Formatted JDE number (JDE-YYYY-####)
 */
function generateJDENumber() {
  const currentYear = new Date().getFullYear();
  const randomNumber = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
  
  return `JDE-${currentYear}-${randomNumber}`;
}

/**
 * CUSTOM: Generate random person name for HR documents
 * @returns {string} - Formatted person name (FirstName LastName)
 * 
 * Generates realistic person names for HR document counterparties
 * Based on generateRandomPhysicianName but without "Dr." prefix
 * Added for HR document counterparty requirements
 */
function generateRandomPersonName() {
  const firstNames = [
    // Male names - diverse origins
    "Michael", "David", "James", "Daniel", "Andrew", "Matthew", "Kevin", "Ryan",
    "Carlos", "Jose", "Luis", "Diego", "Miguel", "Antonio", "Francisco", "Rafael",
    "Ahmed", "Omar", "Hassan", "Ali", "Mohammad", "Ibrahim", "Yusuf", "Khalil",
    "Raj", "Arjun", "Vikram", "Amit", "Ravi", "Sunil", "Anand", "Deepak",
    "Wei", "Ming", "Lei", "Jun", "Hao", "Yang", "Chen", "Liu",
    "Hiroshi", "Takeshi", "Kenji", "Yuki", "Akira", "Satoshi", "Taro", "Kenzo",
    "Emmanuel", "Kwame", "Kofi", "Yaw", "Adu", "Nana", "Kojo", "Fiifi",
    "Olumide", "Chukwuma", "Emeka", "Ikechukwu", "Chinedu", "Obinna", "Kelechi", "Chibueze",
    "Ivan", "Dmitri", "Alexei", "Sergei", "Nikolai", "Pavel", "Mikhail", "Andrei",
    
    // Female names - diverse origins
    "Sarah", "Jennifer", "Lisa", "Maria", "Jessica", "Amanda", "Nicole", "Emily",
    "Carmen", "Sofia", "Isabella", "Gabriela", "Valeria", "Esperanza", "Catalina", "Alejandra",
    "Fatima", "Aisha", "Zara", "Sara", "Layla", "Amina", "Nour", "Yasmin",
    "Priya", "Kavya", "Meera", "Anita", "Sita", "Radha", "Neha", "Pooja",
    "Li", "Mei", "Xin", "Ling", "Yan", "Hui", "Jing", "Fang",
    "Yuki", "Sakura", "Akiko", "Michiko", "Naomi", "Reiko", "Emiko", "Sayuri",
    "Ama", "Akosua", "Efua", "Adjoa", "Abena", "Akua", "Afia", "Esi",
    "Adunni", "Folake", "Bukola", "Funmi", "Kemi", "Tomi", "Bisi", "Nike",
    "Anya", "Katya", "Olga", "Irina", "Svetlana", "Natasha", "Elena", "Marina"
  ];
  
  const lastNames = [
    // European surnames
    "Anderson", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson",
    "Moore", "Taylor", "Jackson", "White", "Harris", "Martin", "Thompson", "Lee",
    "Clark", "Lewis", "Robinson", "Walker", "Hall", "Allen", "Young", "King",
    "Wright", "Scott", "Torres", "Campbell", "Parker", "Evans", "Edwards", "Collins",
    
    // Hispanic/Latino surnames
    "Garcia", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Perez", "Sanchez",
    "Ramirez", "Cruz", "Flores", "Gomez", "Morales", "Ortiz", "Rivera", "Ramos",
    "Castillo", "Jimenez", "Vargas", "Herrera", "Medina", "Castro", "Ruiz", "Alvarez",
    
    // Middle Eastern/Arabic surnames
    "Al-Rashid", "Al-Mahmoud", "Al-Hassan", "Al-Ahmad", "Al-Zahra", "Mahmood", "Hassan",
    "Ahmad", "Ali", "Khan", "Shah", "Malik", "Qureshi", "Sheikh", "Hussain",
    "Rashid", "Farid", "Nasser", "Khalil", "Mansour", "Saleh", "Omar", "Youssef",
    
    // South Asian surnames
    "Patel", "Shah", "Gupta", "Sharma", "Singh", "Kumar", "Reddy", "Rao",
    "Iyer", "Nair", "Menon", "Agarwal", "Banerjee", "Chakraborty", "Mukherjee", "Das",
    "Verma", "Sinha", "Jain", "Agrawal", "Tiwari", "Mishra", "Pandey", "Yadav",
    
    // East Asian surnames
    "Chen", "Wang", "Li", "Zhang", "Liu", "Yang", "Huang", "Zhao",
    "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Guo",
    "Lin", "He", "Gao", "Luo", "Zheng", "Liang", "Xie", "Tang",
    "Tanaka", "Suzuki", "Takahashi", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi",
    "Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Cho", "Yoon",
    
    // African surnames
    "Okafor", "Okoro", "Okwu", "Eze", "Nwankwo", "Ugwu", "Chukwu", "Okonkwo",
    "Mensah", "Asante", "Boateng", "Opoku", "Owusu", "Agyei", "Adjei", "Appiah",
    "Mwangi", "Kimani", "Wanjiku", "Kariuki", "Njoroge", "Kamau", "Wambui", "Githui",
    "Mandela", "Mbeki", "Zuma", "Ramaphosa", "Sisulu", "Tambo", "Biko", "Machel",
    
    // Eastern European surnames
    "Petrov", "Ivanov", "Volkov", "Sokolov", "Lebedev", "Kozlov", "Novikov", "Morozov",
    "Popov", "Orlov", "Makarov", "Zaitsev", "Smirnov", "Kuznetsov", "Fedorov", "Mikhailov",
    
    // Additional diverse surnames
    "Okonkwo", "Adebayo", "Olumide", "Chukwuma", "Ngozi", "Emeka", "Chioma", "Kemi",
    "Baptiste", "Pierre", "Jean", "Luc", "Marie", "Antoine", "Francois", "Michel"
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
}