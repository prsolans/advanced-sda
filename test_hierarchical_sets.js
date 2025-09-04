// test_hierarchical_sets.js
// Test script for hierarchical document set generation
// Run this in Google Apps Script console to test functionality

function testHierarchicalSets() {
  console.log("=== Testing Hierarchical Document Set Generation ===");
  
  // Test data
  const requestData = {
    email: "test@example.com",
    language: "English",
    firstParty: "TestCorp",
    industry: "Technology",
    subindustry: "SaaS",
    geography: "NAMER",
    quantity: 5
  };
  
  try {
    // Test 1: Template Selection
    console.log("\n1. Testing Template Selection:");
    const templateName = selectDocumentSetTemplate(requestData.industry, requestData.subindustry);
    console.log(`Selected template: ${templateName}`);
    
    // Test 2: Template Validation
    console.log("\n2. Testing Template Validation:");
    const template = DOCUMENT_SET_TEMPLATES[templateName];
    if (template) {
      console.log(`Template found: ${template.description}`);
      console.log(`Structure keys: ${Object.keys(template.structure).join(', ')}`);
    } else {
      console.error(`Template not found: ${templateName}`);
      return;
    }
    
    // Test 3: Document Set Generation
    console.log("\n3. Testing Document Set Generation:");
    const documentTree = generateHierarchicalDocumentSet(requestData, templateName);
    console.log(`Generated set ID: ${documentTree.setId}`);
    console.log(`Total documents: ${documentTree.documents.size}`);
    console.log(`Hierarchy levels: ${Array.from(documentTree.hierarchy.keys()).join(', ')}`);
    
    // Test 4: Parent Linking
    console.log("\n4. Testing Parent Linking:");
    linkAllHierarchicalParents(documentTree);
    
    // Test 5: Document Structure Validation
    console.log("\n5. Testing Document Structure:");
    const allDocs = flattenDocumentTree(documentTree);
    
    allDocs.forEach((doc, index) => {
      console.log(`\nDocument ${index + 1}:`);
      console.log(`  Type: ${doc.agreementType}`);
      console.log(`  Contract Number: ${doc.contractNumber}`);
      console.log(`  Level: ${doc.hierarchy.level}`);
      console.log(`  Parent ID: ${doc.hierarchy.parentId || 'None'}`);
      console.log(`  Children: ${doc.hierarchy.children.length}`);
      console.log(`  Relationship: ${doc.hierarchy.relationshipType}`);
      
      if (doc.parentContractNumber) {
        console.log(`  Parent Contract: ${doc.parentContractNumber}`);
        console.log(`  Parent Type: ${doc.parentType}`);
      }
      
      if (doc.ancestorChain && doc.ancestorChain.length > 0) {
        console.log(`  Ancestor Chain: ${doc.ancestorChain.map(a => a.contractNumber).join(' -> ')}`);
      }
    });
    
    // Test 6: Level-by-Level Analysis
    console.log("\n6. Testing Level Analysis:");
    const maxLevel = Math.max(...documentTree.hierarchy.keys());
    for (let level = 0; level <= maxLevel; level++) {
      const docsAtLevel = getDocumentsByLevel(documentTree, level);
      console.log(`Level ${level}: ${docsAtLevel.length} documents`);
      docsAtLevel.forEach(doc => {
        console.log(`  - ${doc.agreementType} (${doc.contractNumber})`);
      });
    }
    
    console.log("\n=== All Tests Completed Successfully! ===");
    return documentTree;
    
  } catch (error) {
    console.error("Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    return null;
  }
}

function testMultipleTemplates() {
  console.log("=== Testing Multiple Templates ===");
  
  const testCases = [
    { industry: "Technology", subindustry: "SaaS" },
    { industry: "Healthcare", subindustry: "Healthcare IT" },
    { industry: "Financial Services", subindustry: "Banking" },
    { industry: "Manufacturing", subindustry: "Automotive" },
    { industry: "Energy", subindustry: "Solar" },
    { industry: "Real Estate", subindustry: "Commercial" }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\nTest Case ${index + 1}: ${testCase.industry} - ${testCase.subindustry}`);
    
    const templateName = selectDocumentSetTemplate(testCase.industry, testCase.subindustry);
    console.log(`Selected template: ${templateName}`);
    
    const template = DOCUMENT_SET_TEMPLATES[templateName];
    if (template) {
      console.log(`Description: ${template.description}`);
      console.log(`Root documents: ${Object.keys(template.structure).filter(key => template.structure[key].level === 0).join(', ')}`);
    }
  });
}

function testTemplateStructureValidation() {
  console.log("=== Testing Template Structure Validation ===");
  
  Object.entries(DOCUMENT_SET_TEMPLATES).forEach(([templateName, template]) => {
    console.log(`\nValidating template: ${templateName}`);
    
    // Check for required fields
    const requiredFields = ['industry', 'description', 'structure'];
    const missingFields = requiredFields.filter(field => !template[field]);
    if (missingFields.length > 0) {
      console.error(`  Missing fields: ${missingFields.join(', ')}`);
    }
    
    // Check structure consistency
    const structure = template.structure;
    let hasRoot = false;
    const levels = new Set();
    const documentTypes = Object.keys(structure);
    
    documentTypes.forEach(docType => {
      const def = structure[docType];
      
      // Check for required structure fields
      if (typeof def.level !== 'number') {
        console.error(`  ${docType}: Missing or invalid level`);
      } else {
        levels.add(def.level);
        if (def.level === 0) hasRoot = true;
      }
      
      if (!def.relationshipType) {
        console.error(`  ${docType}: Missing relationshipType`);
      }
      
      // Check parent-child consistency
      if (def.allowedChildren) {
        def.allowedChildren.forEach(childType => {
          if (!documentTypes.includes(childType)) {
            console.error(`  ${docType}: References unknown child type '${childType}'`);
          } else {
            const childDef = structure[childType];
            if (childDef.level <= def.level) {
              console.error(`  ${docType}: Child '${childType}' has invalid level (${childDef.level} should be > ${def.level})`);
            }
          }
        });
      }
    });
    
    if (!hasRoot) {
      console.error(`  Template has no root documents (level 0)`);
    }
    
    // Check level continuity
    const sortedLevels = Array.from(levels).sort((a, b) => a - b);
    for (let i = 1; i < sortedLevels.length; i++) {
      if (sortedLevels[i] !== sortedLevels[i-1] + 1) {
        console.warn(`  Level gap detected: ${sortedLevels[i-1]} -> ${sortedLevels[i]}`);
      }
    }
    
    console.log(`  ✓ Validation complete (${documentTypes.length} document types, ${levels.size} levels)`);
  });
}

// Helper function to run all tests
function runAllTests() {
  console.log("Starting comprehensive hierarchical document set tests...\n");
  
  // Run template validation first
  testTemplateStructureValidation();
  
  // Test template selection
  testMultipleTemplates();
  
  // Test actual document generation
  const result = testHierarchicalSets();
  
  console.log("\n=== All Test Suites Completed ===");
  return result;
}

function testHRDocumentCounterparties() {
  console.log("=== Testing HR Document Counterparties ===");
  
  const testData = {
    email: "test@example.com",
    language: "English",
    firstParty: "TestCorp",
    industry: "HR",
    subindustry: "All",
    geography: "NAMER",
    specialInstructions: ""
  };
  
  // Test HR document types
  const hrDocTypes = [
    "Employee Onboarding Agreement",
    "Employee Separation Agreement", 
    "Non-Disclosure Agreement (HR)",
    "Stock Option Agreement",
    "Non-Compete Agreement"
  ];
  
  // Test regular document types for comparison
  const regularDocTypes = [
    "Non-Disclosure Agreement",
    "Master Service Agreement",
    "Consulting Agreement"
  ];
  
  console.log("\n1. Testing HR Document Types (should use person names):");
  hrDocTypes.forEach(docType => {
    try {
      const docData = generateCustomDocumentRow(testData, docType);
      const isPersonName = !docData.counterparty.includes("Corp") && 
                          !docData.counterparty.includes("LLC") && 
                          !docData.counterparty.includes("Inc") &&
                          !docData.counterparty.includes("Systems") &&
                          !docData.counterparty.includes("Solutions") &&
                          docData.counterparty.split(" ").length <= 3; // Person names are typically 2-3 words
      console.log(`  ${docType}: ${docData.counterparty} (${isPersonName ? 'PERSON' : 'COMPANY'})`);
    } catch (error) {
      console.log(`  ${docType}: ERROR - ${error.message}`);
    }
  });
  
  console.log("\n2. Testing Regular Document Types (should use company names):");
  regularDocTypes.forEach(docType => {
    try {
      const docData = generateCustomDocumentRow(testData, docType);
      const isCompanyName = docData.counterparty.includes("Corp") || 
                           docData.counterparty.includes("LLC") || 
                           docData.counterparty.includes("Inc") ||
                           docData.counterparty.includes("Systems") ||
                           docData.counterparty.includes("Solutions") ||
                           docData.counterparty.split(" ").length > 3;
      console.log(`  ${docType}: ${docData.counterparty} (${isCompanyName ? 'COMPANY' : 'PERSON'})`);
    } catch (error) {
      console.log(`  ${docType}: ERROR - ${error.message}`);
    }
  });
  
  console.log("\n3. Testing isHRDocumentType function:");
  const allTestTypes = [...hrDocTypes, ...regularDocTypes];
  allTestTypes.forEach(docType => {
    const isHR = isHRDocumentType(docType);
    console.log(`  ${docType}: ${isHR ? 'HR Document' : 'Regular Document'}`);
  });
  
  console.log("\n=== HR Document Counterparty Tests Complete ===");
}

function validateHRDocumentCounterparties() {
  console.log("=== Validating HR Document Counterparties ===");
  
  const hrDocTypes = [
    "Offer Letter",
    "Employee Separation Agreement", 
    "Stock Option Agreement",
    "Non-Compete Agreement"
  ];
  
  const testData = {
    email: "test@example.com",
    language: "English",
    firstParty: "TestCorp",
    industry: "HR",
    subindustry: "All",
    geography: "NAMER",
    specialInstructions: ""
  };
  
  console.log(`\nTesting ${hrDocTypes.length} HR document types for person names:`);
  
  hrDocTypes.forEach((docType, index) => {
    console.log(`\n${index + 1}. Testing "${docType}":`);
    
    // Test isHRDocumentType detection
    const isHR = isHRDocumentType(docType);
    console.log(`   - isHRDocumentType: ${isHR} ${isHR ? '✓' : '✗'}`);
    
    // Test document metadata
    const meta = getDocMetaByName(docType);
    if (meta) {
      console.log(`   - subindustries: ${JSON.stringify(meta.subindustries)}`);
      console.log(`   - category: ${meta.category}`);
    } else {
      console.log(`   - ERROR: No metadata found for "${docType}"`);
      return;
    }
    
    // Generate 3 test documents to verify consistent person names
    console.log(`   - Generated counterparties:`);
    for (let i = 0; i < 3; i++) {
      try {
        const docData = generateCustomDocumentRow(testData, docType);
        
        // Check if it looks like a person name
        const hasCompanyWords = docData.counterparty.includes("Corp") || 
                               docData.counterparty.includes("LLC") || 
                               docData.counterparty.includes("Inc") ||
                               docData.counterparty.includes("Systems") ||
                               docData.counterparty.includes("Solutions") ||
                               docData.counterparty.includes("Dynamics") ||
                               docData.counterparty.includes("Tech") ||
                               docData.counterparty.includes("Digital") ||
                               docData.counterparty.includes("Global") ||
                               docData.counterparty.includes("Analytics");
        
        const wordCount = docData.counterparty.split(" ").length;
        const isPersonName = !hasCompanyWords && wordCount <= 3;
        
        const status = isPersonName ? '✓ PERSON' : '✗ COMPANY';
        console.log(`     ${i + 1}. "${docData.counterparty}" (${status})`);
        
      } catch (error) {
        console.log(`     ${i + 1}. ERROR: ${error.message}`);
      }
    }
  });
  
  console.log(`\n=== HR Document Validation Complete ===`);
  
  // Also test random document generation for HR subindustry
  console.log(`\n=== Testing Random Document Generation for HR ===`);
  
  const randomTestData = {
    ...testData,
    industry: "HR",
    subindustry: "All"
  };
  
  console.log(`\nGenerating 5 random documents from HR/All subindustry:`);
  for (let i = 0; i < 5; i++) {
    try {
      const docData = generateRandomDocumentRow(randomTestData);
      if (docData) {
        const hasCompanyWords = docData.counterparty.includes("Corp") || 
                               docData.counterparty.includes("LLC") || 
                               docData.counterparty.includes("Inc") ||
                               docData.counterparty.includes("Systems") ||
                               docData.counterparty.includes("Solutions");
        
        const isPersonName = !hasCompanyWords && docData.counterparty.split(" ").length <= 3;
        const status = isPersonName ? '✓ PERSON' : '✗ COMPANY';
        console.log(`  ${i + 1}. ${docData.agreementType}: "${docData.counterparty}" (${status})`);
      } else {
        console.log(`  ${i + 1}. ERROR: No document generated`);
      }
    } catch (error) {
      console.log(`  ${i + 1}. ERROR: ${error.message}`);
    }
  }
}

// Export for external testing
if (typeof module !== 'undefined') {
  module.exports = {
    testHierarchicalSets,
    testMultipleTemplates,
    testTemplateStructureValidation,
    testHRDocumentCounterparties,
    validateHRDocumentCounterparties,
    runAllTests
  };
}