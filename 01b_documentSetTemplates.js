// 01b_documentSetTemplates.js
// Document Set Templates for Hierarchical Document Generation
// Defines industry-specific parent-child relationship patterns

const DOCUMENT_SET_TEMPLATES = {
  // ========================================
  // STANDARD/CROSS-INDUSTRY TEMPLATES
  // ========================================
  "Standard MSA Flow": {
    industry: "All",
    subindustries: ["All"],
    description: "Traditional Master Service Agreement workflow",
    structure: {
      "Master Service Agreement (MSA)": {
        level: 0,
        maxChildren: -1, // unlimited
        allowedChildren: ["Statement of Work (SOW)"],
        relationshipType: "governs",
        required: true
      },
      "Statement of Work (SOW)": {
        level: 1,
        maxChildren: -1,
        allowedChildren: ["Change Order", "Amendment"],
        relationshipType: "implements",
        required: true
      },
      "Change Order": {
        level: 2,
        maxChildren: 2,
        allowedChildren: ["Amendment"],
        relationshipType: "modifies",
        required: false
      },
      "Amendment": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "amends",
        required: false
      }
    },
    defaultQuantities: {
      "Master Service Agreement (MSA)": 1,
      "Statement of Work (SOW)": 2,
      "Change Order": 1,
      "Amendment": 1
    }
  },

  "NDA Protected Flow": {
    industry: "All",
    subindustries: ["All"],
    description: "NDA-governed business relationship",
    structure: {
      "Non-Disclosure Agreement (NDA)": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Master Service Agreement (MSA)", "Consulting Agreement"],
        relationshipType: "protects",
        required: true
      },
      "Master Service Agreement (MSA)": {
        level: 1,
        maxChildren: -1,
        allowedChildren: ["Statement of Work (SOW)"],
        relationshipType: "governs",
        required: true
      },
      "Statement of Work (SOW)": {
        level: 2,
        maxChildren: -1,
        allowedChildren: ["Change Order"],
        relationshipType: "implements",
        required: true
      },
      "Change Order": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "modifies",
        required: false
      }
    },
    defaultQuantities: {
      "Non-Disclosure Agreement (NDA)": 1,
      "Master Service Agreement (MSA)": 1,
      "Statement of Work (SOW)": 2,
      "Change Order": 1
    }
  },

  // ========================================
  // TECHNOLOGY INDUSTRY TEMPLATES
  // ========================================
  "SaaS Enterprise Stack": {
    industry: "Technology",
    subindustries: ["SaaS", "Enterprise Software", "Cloud Infrastructure"],
    description: "Enterprise SaaS subscription model",
    structure: {
      "Master Subscription Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Service Schedule", "Data Processing Agreement (DPA)"],
        relationshipType: "governs",
        required: true
      },
      "Service Schedule": {
        level: 1,
        maxChildren: 3,
        allowedChildren: ["API Terms of Service", "Support & Maintenance Agreement"],
        relationshipType: "schedules",
        required: true
      },
      "Data Processing Agreement (DPA)": {
        level: 1,
        maxChildren: 2,
        allowedChildren: ["Security Exhibit", "Privacy Notice"],
        relationshipType: "governs",
        required: true
      },
      "API Terms of Service": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Rate Limiting Schedule"],
        relationshipType: "defines",
        required: false
      },
      "Support & Maintenance Agreement": {
        level: 2,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "provides",
        required: false
      },
      "Rate Limiting Schedule": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "limits",
        required: false
      }
    },
    defaultQuantities: {
      "Master Subscription Agreement": 1,
      "Service Schedule": 1,
      "Data Processing Agreement (DPA)": 1,
      "API Terms of Service": 1,
      "Support & Maintenance Agreement": 1
    }
  },

  "Cloud Infrastructure Model": {
    industry: "Technology",
    subindustries: ["Cloud Infrastructure", "Data Analytics"],
    description: "Infrastructure-as-a-Service relationships",
    structure: {
      "Cloud Services Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Infrastructure Schedule", "Data Warehouse Agreement"],
        relationshipType: "governs",
        required: true
      },
      "Infrastructure Schedule": {
        level: 1,
        maxChildren: 3,
        allowedChildren: ["Service Level Agreement", "Disaster Recovery Plan"],
        relationshipType: "schedules",
        required: true
      },
      "Data Warehouse Agreement": {
        level: 1,
        maxChildren: 2,
        allowedChildren: ["Data Analytics Platform Agreement", "Backup Procedures"],
        relationshipType: "governs",
        required: false
      },
      "Service Level Agreement": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Performance Credits"],
        relationshipType: "guarantees",
        required: true
      },
      "Disaster Recovery Plan": {
        level: 2,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "ensures",
        required: true
      }
    },
    defaultQuantities: {
      "Cloud Services Agreement": 1,
      "Infrastructure Schedule": 1,
      "Service Level Agreement": 1,
      "Disaster Recovery Plan": 1
    }
  },

  // ========================================
  // HEALTHCARE INDUSTRY TEMPLATES
  // ========================================
  "Healthcare Network Model": {
    industry: "Healthcare",
    subindustries: ["Healthcare IT", "Digital Health", "Telehealth"],
    description: "Hospital network affiliation structure",
    structure: {
      "Master Affiliation Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Facility Service Agreement"],
        relationshipType: "governs",
        required: true
      },
      "Facility Service Agreement": {
        level: 1,
        maxChildren: -1,
        allowedChildren: ["Provider Agreement", "Compensation Schedule"],
        relationshipType: "implements",
        required: true
      },
      "Provider Agreement": {
        level: 2,
        maxChildren: 2,
        allowedChildren: ["Credentialing Exhibit", "Malpractice Coverage"],
        relationshipType: "defines",
        required: true
      },
      "Compensation Schedule": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Payment Terms"],
        relationshipType: "schedules",
        required: true
      },
      "Credentialing Exhibit": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "documents",
        required: false
      },
      "Malpractice Coverage": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "ensures",
        required: true
      }
    },
    defaultQuantities: {
      "Master Affiliation Agreement": 1,
      "Facility Service Agreement": 1,
      "Provider Agreement": 1,
      "Compensation Schedule": 1,
      "Malpractice Coverage": 1
    }
  },

  "Clinical Research Model": {
    industry: "Healthcare",
    subindustries: ["Pharmaceuticals", "Biotechnology", "Medical Devices"],
    description: "Clinical trial and research agreements",
    structure: {
      "Master Research Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Clinical Trial Agreement", "Research Collaboration Agreement"],
        relationshipType: "governs",
        required: true
      },
      "Clinical Trial Agreement": {
        level: 1,
        maxChildren: -1,
        allowedChildren: ["Protocol Amendment", "Site Agreement"],
        relationshipType: "implements",
        required: true
      },
      "Research Collaboration Agreement": {
        level: 1,
        maxChildren: 3,
        allowedChildren: ["IP Assignment", "Publication Rights"],
        relationshipType: "defines",
        required: false
      },
      "Protocol Amendment": {
        level: 2,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "modifies",
        required: false
      },
      "Site Agreement": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Principal Investigator Agreement"],
        relationshipType: "authorizes",
        required: true
      },
      "Principal Investigator Agreement": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "assigns",
        required: true
      }
    },
    defaultQuantities: {
      "Master Research Agreement": 1,
      "Clinical Trial Agreement": 1,
      "Site Agreement": 1,
      "Principal Investigator Agreement": 1
    }
  },

  // ========================================
  // FINANCIAL SERVICES TEMPLATES
  // ========================================
  "Investment Management Model": {
    industry: "Financial Services",
    subindustries: ["Wealth Management", "Asset Management", "Investment Banking"],
    description: "Investment advisory relationship structure",
    structure: {
      "Investment Advisory Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Portfolio Management Agreement", "Fee-Based Advisory Agreement"],
        relationshipType: "governs",
        required: true
      },
      "Portfolio Management Agreement": {
        level: 1,
        maxChildren: 3,
        allowedChildren: ["Investment Policy Statement", "Risk Parameters"],
        relationshipType: "implements",
        required: true
      },
      "Fee-Based Advisory Agreement": {
        level: 1,
        maxChildren: 2,
        allowedChildren: ["Fee Schedule", "Performance Metrics"],
        relationshipType: "defines",
        required: true
      },
      "Investment Policy Statement": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Asset Allocation Model"],
        relationshipType: "guides",
        required: true
      },
      "Risk Parameters": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Stop Loss Orders"],
        relationshipType: "limits",
        required: true
      },
      "Fee Schedule": {
        level: 2,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "schedules",
        required: true
      }
    },
    defaultQuantities: {
      "Investment Advisory Agreement": 1,
      "Portfolio Management Agreement": 1,
      "Investment Policy Statement": 1,
      "Fee Schedule": 1
    }
  },

  "Banking Services Model": {
    industry: "Financial Services",
    subindustries: ["Banking", "Credit Unions", "Alternative Lending"],
    description: "Comprehensive banking relationship",
    structure: {
      "Master Banking Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Deposit Account Agreement", "Credit Facility Agreement"],
        relationshipType: "governs",
        required: true
      },
      "Deposit Account Agreement": {
        level: 1,
        maxChildren: 2,
        allowedChildren: ["Account Terms", "Fee Schedule"],
        relationshipType: "establishes",
        required: true
      },
      "Credit Facility Agreement": {
        level: 1,
        maxChildren: 3,
        allowedChildren: ["Security Agreement", "Guaranty Agreement"],
        relationshipType: "provides",
        required: false
      },
      "Security Agreement": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["UCC Filing"],
        relationshipType: "secures",
        required: true
      },
      "Guaranty Agreement": {
        level: 2,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "guarantees",
        required: false
      },
      "UCC Filing": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "perfects",
        required: true
      }
    },
    defaultQuantities: {
      "Master Banking Agreement": 1,
      "Deposit Account Agreement": 1,
      "Credit Facility Agreement": 1,
      "Security Agreement": 1
    }
  },

  "Trading Platform Model": {
    industry: "Financial Services",
    subindustries: ["Fintech", "Payment Processors", "Investment Banking"],
    description: "Financial trading and transaction processing",
    structure: {
      "Master Trading Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Product Schedule"],
        relationshipType: "governs",
        required: true
      },
      "Product Schedule": {
        level: 1,
        maxChildren: -1,
        allowedChildren: ["Transaction Confirmation"],
        relationshipType: "schedules",
        required: true
      },
      "Transaction Confirmation": {
        level: 2,
        maxChildren: 2,
        allowedChildren: ["Novation", "Settlement Instructions"],
        relationshipType: "confirms",
        required: true
      },
      "Novation": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "transfers",
        required: false
      },
      "Settlement Instructions": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "directs",
        required: true
      }
    },
    defaultQuantities: {
      "Master Trading Agreement": 1,
      "Product Schedule": 2,
      "Transaction Confirmation": 2,
      "Settlement Instructions": 1
    }
  },

  // ========================================
  // MANUFACTURING INDUSTRY TEMPLATES
  // ========================================
  "Supply Chain Model": {
    industry: "Manufacturing",
    subindustries: ["Automotive", "Aerospace", "Industrial Equipment"],
    description: "Complex manufacturing supply chain",
    structure: {
      "Master Supply Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Quality Assurance Agreement", "Manufacturing Services Agreement"],
        relationshipType: "governs",
        required: true
      },
      "Quality Assurance Agreement": {
        level: 1,
        maxChildren: 3,
        allowedChildren: ["Testing Procedures", "Certification Requirements"],
        relationshipType: "ensures",
        required: true
      },
      "Manufacturing Services Agreement": {
        level: 1,
        maxChildren: 2,
        allowedChildren: ["Production Schedule", "Delivery Terms"],
        relationshipType: "provides",
        required: true
      },
      "Testing Procedures": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Inspection Protocol"],
        relationshipType: "defines",
        required: true
      },
      "Certification Requirements": {
        level: 2,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "mandates",
        required: true
      },
      "Production Schedule": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Capacity Allocation"],
        relationshipType: "schedules",
        required: true
      }
    },
    defaultQuantities: {
      "Master Supply Agreement": 1,
      "Quality Assurance Agreement": 1,
      "Manufacturing Services Agreement": 1,
      "Testing Procedures": 1,
      "Production Schedule": 1
    }
  },

  // ========================================
  // ENERGY SECTOR TEMPLATES  
  // ========================================
  "Renewable Energy Model": {
    industry: "Energy",
    subindustries: ["Solar", "Wind", "Renewable Energy"],
    description: "Renewable energy project development",
    structure: {
      "Master Development Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Power Purchase Agreement (PPA)", "Construction Agreement"],
        relationshipType: "governs",
        required: true
      },
      "Power Purchase Agreement (PPA)": {
        level: 1,
        maxChildren: 2,
        allowedChildren: ["Utility Interconnection Agreement", "Environmental Attributes"],
        relationshipType: "contracts",
        required: true
      },
      "Construction Agreement": {
        level: 1,
        maxChildren: 3,
        allowedChildren: ["Equipment Supply", "Installation Services"],
        relationshipType: "provides",
        required: true
      },
      "Utility Interconnection Agreement": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Grid Compliance Certificate"],
        relationshipType: "connects",
        required: true
      },
      "Environmental Attributes": {
        level: 2,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "transfers",
        required: true
      },
      "Equipment Supply": {
        level: 2,
        maxChildren: 1,
        allowedChildren: ["Warranty Terms"],
        relationshipType: "provides",
        required: true
      }
    },
    defaultQuantities: {
      "Master Development Agreement": 1,
      "Power Purchase Agreement (PPA)": 1,
      "Construction Agreement": 1,
      "Utility Interconnection Agreement": 1
    }
  },

  // ========================================
  // REAL ESTATE TEMPLATES
  // ========================================
  "Commercial Real Estate Model": {
    industry: "Real Estate",
    subindustries: ["Commercial", "Office", "Mixed-Use"],
    description: "Commercial property development and management",
    structure: {
      "Master Development Agreement": {
        level: 0,
        maxChildren: -1,
        allowedChildren: ["Construction Agreement", "Property Management Agreement"],
        relationshipType: "governs",
        required: true
      },
      "Construction Agreement": {
        level: 1,
        maxChildren: 3,
        allowedChildren: ["General Contractor Agreement", "Design-Build Agreement"],
        relationshipType: "provides",
        required: true
      },
      "Property Management Agreement": {
        level: 1,
        maxChildren: 2,
        allowedChildren: ["Commercial Lease Agreement", "Tenant Services"],
        relationshipType: "manages",
        required: true
      },
      "General Contractor Agreement": {
        level: 2,
        maxChildren: 2,
        allowedChildren: ["Subcontractor Agreement", "Performance Bond"],
        relationshipType: "constructs",
        required: true
      },
      "Commercial Lease Agreement": {
        level: 2,
        maxChildren: 2,
        allowedChildren: ["Tenant Improvement Agreement", "Lease Amendment"],
        relationshipType: "leases",
        required: true
      },
      "Performance Bond": {
        level: 3,
        maxChildren: 0,
        allowedChildren: [],
        relationshipType: "secures",
        required: true
      }
    },
    defaultQuantities: {
      "Master Development Agreement": 1,
      "Construction Agreement": 1,
      "Property Management Agreement": 1,
      "Commercial Lease Agreement": 1
    }
  }
};

// Template selection utilities
function getAvailableTemplates(industry, subindustry) {
  return Object.entries(DOCUMENT_SET_TEMPLATES)
    .filter(([name, template]) => {
      if (template.subindustries && template.subindustries.includes(subindustry)) return true;
      if (template.industry === industry) return true;
      if (template.industry === "All") return true;
      return false;
    })
    .map(([name, template]) => ({ name, ...template }));
}

function selectBestTemplate(industry, subindustry) {
  const available = getAvailableTemplates(industry, subindustry);
  
  // Priority: subindustry-specific > industry-specific > default
  const subindustrySpecific = available.find(t => 
    t.subindustries && t.subindustries.includes(subindustry) && t.industry !== "All"
  );
  if (subindustrySpecific) return subindustrySpecific.name;
  
  const industrySpecific = available.find(t => t.industry === industry);
  if (industrySpecific) return industrySpecific.name;
  
  return "Standard MSA Flow"; // Default fallback
}

function generateSetId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  return `SET-${timestamp}-${randomPart}`.toUpperCase();
}