// 01_constants.js

const COUNTERPARTIES = [
  "Discrete Quantum Mechanics", "Keranos Digital Media", "Stellar Logical", "DataVault Dynamics", "Vitality Horizons Medical", "Pine Care", "Nesis Biotech", "Precisys Health Analytics", "Pathway Placers", "ScoutVision Recruiting", "Marc Kline Ultra Learning", "Insight Baybridge", "EduTech Solutions", "LearnSphere Global", "MarketPulse Dynamics", "Momentum Driver", "Dynamics Talent Strategies", "FutureSkills Solutions", "ClimbTech Financial", "Virtual Asset Collective", "SmartFactory Systems", "Innovate Global Manufacturing", "Hidden Continent Environmental", "Helix Learning"
];

const REGIONS = ["NAMER", "EMEA", "APAC", "LATAM"];
const TERM_OPTIONS = [1, 2, 3];
const DAYS_NOTICE = [30, 60, 90];
const ASSIGN_OPTS = ["Yes", "No, or consent req’d", "Yes, with conditions"];
const PAYMENT_TERMS = ["30 days", "45 days", "60 days"];

// Complete DOC_TYPE_LIBRARY for Docusign Solution Engineering Demo
// Every subindustry now has at least 3 industry-specific + 1 general + cross-industry documents

const DOC_TYPE_LIBRARY = {
  // === GENERAL DOCUMENTS (Available across all industries) ===
  "Non-Disclosure Agreement (NDA)": {
    key: "NDA",
    description: "Protects confidential information exchanged between parties.",
    controlledType: "NDA",
    industries: ["All"],
    subindustries: ["All"],
    obligations: ["Confidentiality", "Data Breach"],
    noTerm: true,
    category: "General"
  },
  "Master Service Agreement (MSA)": {
    key: "MSA",
    description: "Outlines overarching terms for service delivery.",
    controlledType: "MSA",
    industries: ["All"],
    subindustries: ["All"],
    obligations: ["Compliance", "Indemnification", "Insurance", "Limitation of Liability", "Escalation"],
    noTerm: false,
    category: "General"
  },
  "Consulting Agreement": {
    key: "CONS",
    description: "Defines scope and terms for engaging consultants.",
    controlledType: "Consulting",
    industries: ["All"],
    subindustries: ["All"],
    obligations: ["Deliverables", "Indemnification", "Insurance", "Limitation of Liability"],
    noTerm: false,
    category: "General"
  },

  // === TECHNOLOGY INDUSTRY ===
  "Software License Agreement": {
    key: "SLA",
    description: "Grants rights to use proprietary software with usage restrictions.",
    controlledType: "Software License",
    industries: ["Technology"],
    subindustries: ["SaaS", "Enterprise Software", "Mobile Apps", "Gaming"],
    obligations: ["Compliance", "Limitation of Liability", "IP Protection", "Data Privacy"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "API Terms of Service": {
    key: "API_TOS",
    description: "Governs third-party access to APIs and developer platforms.",
    controlledType: "API Terms",
    industries: ["Technology"],
    subindustries: ["SaaS", "Cloud Infrastructure", "Fintech", "E-commerce"],
    obligations: ["Rate Limiting", "Data Privacy", "Service Levels", "IP Protection"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Cloud Services Agreement": {
    key: "CSA",
    description: "Defines terms for cloud infrastructure and platform services.",
    controlledType: "Cloud Services",
    industries: ["Technology"],
    subindustries: ["Cloud Infrastructure", "SaaS", "Data Analytics"],
    obligations: ["Service Levels", "Data Security", "DORA", "Compliance", "Data Residency"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Data Processing Agreement (DPA)": {
    key: "DPA",
    description: "GDPR-compliant terms for processing personal data.",
    controlledType: "Data Processing",
    industries: ["Technology"],
    subindustries: ["SaaS", "Marketing Tech", "HR Tech", "Fintech"],
    obligations: ["Data Privacy", "GDPR Compliance", "Data Breach", "Data Transfer"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Enterprise License Agreement": {
    key: "ELA",
    description: "Comprehensive licensing for enterprise software deployments.",
    controlledType: "Enterprise License",
    industries: ["Technology"],
    subindustries: ["Enterprise Software", "SaaS"],
    obligations: ["Usage Compliance", "Audit Rights", "Support Terms", "Scalability"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Support & Maintenance Agreement": {
    key: "SMA",
    description: "Ongoing technical support and software maintenance services.",
    controlledType: "Support Maintenance",
    industries: ["Technology"],
    subindustries: ["Enterprise Software", "SaaS", "Mobile Apps"],
    obligations: ["Response Times", "Bug Fixes", "Updates", "Technical Support"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Game Publishing Agreement": {
    key: "GPA",
    description: "Terms for publishing and distributing gaming content.",
    controlledType: "Game Publishing",
    industries: ["Technology"],
    subindustries: ["Gaming", "Mobile Apps"],
    obligations: ["Revenue Sharing", "Marketing Support", "Platform Compliance", "Content Rights"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "In-App Purchase Terms": {
    key: "IAP",
    description: "Governs virtual goods and subscription purchases within apps.",
    controlledType: "In-App Purchase",
    industries: ["Technology"],
    subindustries: ["Gaming", "Mobile Apps"],
    obligations: ["Payment Processing", "Refund Policy", "Age Verification", "Platform Fees"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Marketplace Agreement": {
    key: "MKT",
    description: "Terms for third-party sellers on e-commerce platforms.",
    controlledType: "Marketplace",
    industries: ["Technology"],
    subindustries: ["E-commerce"],
    obligations: ["Seller Verification", "Product Compliance", "Fee Structure", "Dispute Resolution"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Drop-Ship Agreement": {
    key: "DROP",
    description: "Direct fulfillment arrangements between suppliers and customers.",
    controlledType: "Drop-Ship",
    industries: ["Technology"],
    subindustries: ["E-commerce"],
    obligations: ["Inventory Management", "Shipping Terms", "Quality Control", "Returns Processing"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Marketing Automation Agreement": {
    key: "MAA",
    description: "Terms for automated marketing and customer engagement platforms.",
    controlledType: "Marketing Automation",
    industries: ["Technology"],
    subindustries: ["Marketing Tech"],
    obligations: ["Data Processing", "Campaign Compliance", "Deliverability", "CAN-SPAM Compliance"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Lead Generation Agreement": {
    key: "LGA",
    description: "Terms for generating and sharing qualified sales leads.",
    controlledType: "Lead Generation",
    industries: ["Technology"],
    subindustries: ["Marketing Tech"],
    obligations: ["Lead Quality", "Data Accuracy", "TCPA Compliance", "Attribution"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "HRIS Integration Agreement": {
    key: "HRIS",
    description: "Integration terms for human resources information systems.",
    controlledType: "HRIS Integration",
    industries: ["Technology"],
    subindustries: ["HR Tech"],
    obligations: ["Data Synchronization", "Security Standards", "API Limits", "Employee Privacy"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Payroll Processing Agreement": {
    key: "PAYROLL",
    description: "Terms for automated payroll calculation and distribution services.",
    controlledType: "Payroll Processing",
    industries: ["Technology"],
    subindustries: ["HR Tech"],
    obligations: ["Accuracy Guarantees", "Tax Compliance", "Direct Deposit", "Audit Trail"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Data Analytics Platform Agreement": {
    key: "DAPA",
    description: "Terms for business intelligence and analytics platforms.",
    controlledType: "Data Analytics Platform",
    industries: ["Technology"],
    subindustries: ["Data Analytics"],
    obligations: ["Data Processing", "Query Performance", "Visualization Rights", "Export Capabilities"],
    noTerm: false,
    category: "Technology-Specific"
  },
  "Data Warehouse Agreement": {
    key: "DWA",
    description: "Terms for data storage and management services.",
    controlledType: "Data Warehouse",
    industries: ["Technology"],
    subindustries: ["Data Analytics", "Cloud Infrastructure"],
    obligations: ["Storage Limits", "Backup Procedures", "Data Retention", "Performance SLAs"],
    noTerm: false,
    category: "Technology-Specific"
  },

  // === HEALTHCARE INDUSTRY ===
  "Business Associate Agreement (BAA)": {
    key: "BAA",
    description: "HIPAA-compliant agreement for handling protected health information.",
    controlledType: "Business Associate",
    industries: ["Healthcare"],
    subindustries: ["Digital Health", "Medical Devices", "Telehealth", "Healthcare IT"],
    obligations: ["HIPAA Compliance", "Data Security", "Breach Notification", "Audit Rights"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Clinical Trial Agreement": {
    key: "CTA",
    description: "Governs research studies involving human subjects.",
    controlledType: "Clinical Trial",
    industries: ["Healthcare"],
    subindustries: ["Pharmaceuticals", "Medical Devices", "Biotechnology"],
    obligations: ["Regulatory Compliance", "Subject Safety", "Data Integrity", "Publication Rights"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Medical Device Supply Agreement": {
    key: "MDSA",
    description: "Terms for manufacturing and supplying medical devices.",
    controlledType: "Medical Device Supply",
    industries: ["Healthcare"],
    subindustries: ["Medical Devices", "Diagnostics", "Surgical Equipment"],
    obligations: ["FDA Compliance", "Quality Standards", "Product Liability", "Recall Procedures"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Telehealth Service Agreement": {
    key: "TSA",
    description: "Defines terms for remote healthcare delivery platforms.",
    controlledType: "Telehealth Services",
    industries: ["Healthcare"],
    subindustries: ["Telehealth", "Digital Health", "Healthcare IT"],
    obligations: ["HIPAA Compliance", "State Licensing", "Service Levels", "Emergency Protocols"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Patient Portal Agreement": {
    key: "PPA_HEALTH",
    description: "Terms for patient access to electronic health records.",
    controlledType: "Patient Portal",
    industries: ["Healthcare"],
    subindustries: ["Digital Health", "Healthcare IT"],
    obligations: ["Access Controls", "Data Security", "User Authentication", "Audit Logging"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Health Data Agreement": {
    key: "HDA",
    description: "Governs collection and use of health and wellness data.",
    controlledType: "Health Data",
    industries: ["Healthcare"],
    subindustries: ["Digital Health", "Medical Devices"],
    obligations: ["Consent Management", "Data Minimization", "Purpose Limitation", "User Rights"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Drug Supply Agreement": {
    key: "DSA",
    description: "Terms for pharmaceutical manufacturing and distribution.",
    controlledType: "Drug Supply",
    industries: ["Healthcare"],
    subindustries: ["Pharmaceuticals", "Biotechnology"],
    obligations: ["GMP Compliance", "Supply Chain Security", "Batch Documentation", "Shelf Life Management"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Research Collaboration Agreement": {
    key: "RCA",
    description: "Joint research and development partnerships in life sciences.",
    controlledType: "Research Collaboration",
    industries: ["Healthcare"],
    subindustries: ["Pharmaceuticals", "Biotechnology"],
    obligations: ["IP Ownership", "Cost Sharing", "Publication Rights", "Regulatory Responsibilities"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Diagnostic Services Agreement": {
    key: "DIAG",
    description: "Terms for laboratory testing and diagnostic services.",
    controlledType: "Diagnostic Services",
    industries: ["Healthcare"],
    subindustries: ["Diagnostics", "Medical Devices"],
    obligations: ["Accuracy Standards", "Turnaround Times", "Chain of Custody", "Result Reporting"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Medical Equipment Lease": {
    key: "MEL",
    description: "Leasing arrangements for medical equipment and devices.",
    controlledType: "Medical Equipment Lease",
    industries: ["Healthcare"],
    subindustries: ["Medical Devices", "Surgical Equipment"],
    obligations: ["Maintenance Responsibilities", "Calibration Requirements", "Insurance Coverage", "End-of-Lease Terms"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "EMR Integration Agreement": {
    key: "EMR",
    description: "Electronic medical record system integration terms.",
    controlledType: "EMR Integration",
    industries: ["Healthcare"],
    subindustries: ["Healthcare IT", "Digital Health"],
    obligations: ["HL7 Compliance", "Data Mapping", "Interoperability", "Downtime Procedures"],
    noTerm: false,
    category: "Healthcare-Specific"
  },

  // === FINANCIAL SERVICES ===
  "Loan Agreement": {
    key: "LOAN",
    description: "Terms and conditions for lending arrangements.",
    controlledType: "Loan Agreement",
    industries: ["Financial Services"],
    subindustries: ["Banking", "Credit Unions", "Alternative Lending"],
    obligations: ["Regulatory Compliance", "Interest Calculation", "Default Procedures", "Collateral Terms"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Investment Advisory Agreement": {
    key: "IAA",
    description: "Defines relationship between advisor and client for investment services.",
    controlledType: "Investment Advisory",
    industries: ["Financial Services"],
    subindustries: ["Wealth Management", "Investment Banking", "Asset Management"],
    obligations: ["Fiduciary Duty", "Fee Disclosure", "Regulatory Compliance", "Performance Reporting"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Payment Processing Agreement": {
    key: "PPA_FIN",
    description: "Terms for processing electronic payments and transactions.",
    controlledType: "Payment Processing",
    industries: ["Financial Services"],
    subindustries: ["Fintech", "Payment Processors", "E-commerce"],
    obligations: ["PCI Compliance", "Fraud Prevention", "Settlement Terms", "Chargeback Procedures"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Insurance Policy Contract": {
    key: "IPC",
    description: "Defines coverage terms and conditions for insurance products.",
    controlledType: "Insurance Policy",
    industries: ["Financial Services"],
    subindustries: ["Insurance", "Insurtech", "Risk Management"],
    obligations: ["Coverage Terms", "Claims Process", "Premium Calculation", "Regulatory Compliance"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Credit Facility Agreement": {
    key: "CFA",
    description: "Revolving credit and line of credit arrangements.",
    controlledType: "Credit Facility",
    industries: ["Financial Services"],
    subindustries: ["Banking", "Credit Unions"],
    obligations: ["Credit Limits", "Interest Rates", "Covenants", "Security Requirements"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Deposit Account Agreement": {
    key: "DAA",
    description: "Terms for checking, savings, and deposit accounts.",
    controlledType: "Deposit Account",
    industries: ["Financial Services"],
    subindustries: ["Banking", "Credit Unions"],
    obligations: ["FDIC Coverage", "Fee Schedule", "Account Access", "Regulatory Disclosures"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Alternative Lending Agreement": {
    key: "ALA",
    description: "Non-traditional lending arrangements and terms.",
    controlledType: "Alternative Lending",
    industries: ["Financial Services"],
    subindustries: ["Alternative Lending", "Fintech"],
    obligations: ["Truth in Lending", "Risk Assessment", "Collection Procedures", "State Compliance"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Portfolio Management Agreement": {
    key: "PMAA",
    description: "Discretionary investment management services.",
    controlledType: "Portfolio Management",
    industries: ["Financial Services"],
    subindustries: ["Wealth Management", "Asset Management"],
    obligations: ["Investment Guidelines", "Risk Parameters", "Performance Benchmarks", "Reporting Requirements"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Fee-Based Advisory Agreement": {
    key: "FBAA",
    description: "Fee-only financial planning and advisory services.",
    controlledType: "Fee-Based Advisory",
    industries: ["Financial Services"],
    subindustries: ["Wealth Management"],
    obligations: ["Fee Transparency", "Conflict Disclosure", "Suitability Standards", "Best Interest Standard"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "ERISA Fiduciary Agreement": {
    key: "EFA",
    description: "Retirement plan fiduciary services and responsibilities.",
    controlledType: "ERISA Fiduciary",
    industries: ["Financial Services"],
    subindustries: ["Wealth Management", "Asset Management"],
    obligations: ["Prudent Person Standard", "Plan Documentation", "Participant Rights", "DOL Compliance"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Underwriting Agreement": {
    key: "UWA",
    description: "Securities underwriting and public offering services.",
    controlledType: "Underwriting",
    industries: ["Financial Services"],
    subindustries: ["Investment Banking"],
    obligations: ["Due Diligence", "Pricing Terms", "Market Making", "Regulatory Filing"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "M&A Advisory Agreement": {
    key: "MAA_FIN",
    description: "Merger and acquisition advisory services.",
    controlledType: "M&A Advisory",
    industries: ["Financial Services"],
    subindustries: ["Investment Banking"],
    obligations: ["Success Fees", "Confidentiality", "Fairness Opinions", "Regulatory Approvals"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Merchant Agreement": {
    key: "MERCH",
    description: "Terms for accepting credit and debit card payments.",
    controlledType: "Merchant Agreement",
    industries: ["Financial Services"],
    subindustries: ["Payment Processors", "Fintech"],
    obligations: ["Processing Rates", "Equipment Provision", "Compliance Requirements", "Termination Rights"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Digital Wallet Agreement": {
    key: "DWA_FIN",
    description: "Terms for digital payment and wallet services.",
    controlledType: "Digital Wallet",
    industries: ["Financial Services"],
    subindustries: ["Fintech", "Payment Processors"],
    obligations: ["KYC Requirements", "Transaction Limits", "Security Protocols", "Fraud Liability"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Reinsurance Agreement": {
    key: "REINS",
    description: "Risk transfer arrangements between insurance companies.",
    controlledType: "Reinsurance",
    industries: ["Financial Services"],
    subindustries: ["Insurance"],
    obligations: ["Risk Sharing", "Claims Handling", "Premium Calculation", "Catastrophe Coverage"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Agent/Broker Agreement": {
    key: "ABA",
    description: "Terms for insurance sales representatives and brokers.",
    controlledType: "Agent Broker",
    industries: ["Financial Services"],
    subindustries: ["Insurance", "Insurtech"],
    obligations: ["Commission Structure", "Territory Rights", "Training Requirements", "E&O Coverage"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Insurtech Platform Agreement": {
    key: "IPA",
    description: "Digital insurance platform and technology services.",
    controlledType: "Insurtech Platform",
    industries: ["Financial Services"],
    subindustries: ["Insurtech"],
    obligations: ["API Access", "Data Integration", "Regulatory Compliance", "White-Label Terms"],
    noTerm: false,
    category: "Financial-Specific"
  },
  "Risk Assessment Agreement": {
    key: "RAA",
    description: "Professional risk evaluation and management services.",
    controlledType: "Risk Assessment",
    industries: ["Financial Services"],
    subindustries: ["Risk Management", "Insurance"],
    obligations: ["Assessment Standards", "Reporting Requirements", "Liability Limitations", "Professional Standards"],
    noTerm: false,
    category: "Financial-Specific"
  },

  // === MANUFACTURING ===
  "Supply Agreement": {
    key: "SUPPLY",
    description: "Terms for ongoing supply of materials or components.",
    controlledType: "Supply Agreement",
    industries: ["Manufacturing"],
    subindustries: ["Automotive", "Aerospace", "Consumer Goods", "Industrial Equipment"],
    obligations: ["Quality Standards", "Delivery Schedules", "Price Adjustments", "Force Majeure"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Manufacturing Services Agreement": {
    key: "MFG",
    description: "Contract manufacturing and production services terms.",
    controlledType: "Manufacturing Services",
    industries: ["Manufacturing"],
    subindustries: ["Contract Manufacturing", "Private Label", "Electronics"],
    obligations: ["Quality Control", "Production Schedules", "IP Protection", "Capacity Allocation"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Distribution Agreement": {
    key: "DIST",
    description: "Authorizes distribution of products in specific territories.",
    controlledType: "Distribution",
    industries: ["Manufacturing"],
    subindustries: ["Consumer Goods", "Industrial Products", "Automotive"],
    obligations: ["Sales Targets", "Territory Rights", "Marketing Support", "Inventory Management"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Quality Assurance Agreement": {
    key: "QAA",
    description: "Standards and procedures for maintaining product quality.",
    controlledType: "Quality Assurance",
    industries: ["Manufacturing"],
    subindustries: ["Automotive", "Aerospace", "Medical Devices", "Food & Beverage"],
    obligations: ["ISO Compliance", "Testing Procedures", "Audit Rights", "Corrective Actions"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Automotive Supplier Agreement": {
    key: "ASA",
    description: "Specialized terms for automotive industry suppliers.",
    controlledType: "Automotive Supplier",
    industries: ["Manufacturing"],
    subindustries: ["Automotive"],
    obligations: ["IATF 16949", "JIT Delivery", "Tooling Requirements", "Recall Participation"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Tier 1 Supplier Agreement": {
    key: "T1SA",
    description: "Direct supplier relationships with OEMs.",
    controlledType: "Tier 1 Supplier",
    industries: ["Manufacturing"],
    subindustries: ["Automotive"],
    obligations: ["Design Collaboration", "Cost Reduction", "Warranty Support", "Product Lifecycle"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Aerospace Certification Agreement": {
    key: "ACA",
    description: "Compliance with aerospace industry standards and certifications.",
    controlledType: "Aerospace Certification",
    industries: ["Manufacturing"],
    subindustries: ["Aerospace"],
    obligations: ["AS9100 Compliance", "NADCAP Certification", "Material Traceability", "Configuration Control"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Defense Contractor Agreement": {
    key: "DCA",
    description: "Government defense contracting terms and requirements.",
    controlledType: "Defense Contractor",
    industries: ["Manufacturing"],
    subindustries: ["Aerospace"],
    obligations: ["Security Clearance", "DFARS Compliance", "Cost Accounting", "Export Control"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Retail Supplier Agreement": {
    key: "RSA",
    description: "Terms for supplying consumer goods to retail chains.",
    controlledType: "Retail Supplier",
    industries: ["Manufacturing"],
    subindustries: ["Consumer Goods"],
    obligations: ["EDI Requirements", "Planogram Compliance", "Category Management", "Promotional Support"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Private Label Manufacturing": {
    key: "PLM",
    description: "Manufacturing products under retailer's brand name.",
    controlledType: "Private Label Manufacturing",
    industries: ["Manufacturing"],
    subindustries: ["Private Label", "Consumer Goods"],
    obligations: ["Brand Standards", "Packaging Requirements", "Exclusivity Terms", "Quality Certifications"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "OEM Agreement": {
    key: "OEM",
    description: "Original equipment manufacturer partnership terms.",
    controlledType: "OEM Agreement",
    industries: ["Manufacturing"],
    subindustries: ["Industrial Equipment", "Electronics"],
    obligations: ["Design Specifications", "Volume Commitments", "Technology Transfer", "Support Terms"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Tolling Agreement": {
    key: "TOLL",
    description: "Processing raw materials owned by another party.",
    controlledType: "Tolling Agreement",
    industries: ["Manufacturing"],
    subindustries: ["Contract Manufacturing", "Electronics"],
    obligations: ["Processing Fees", "Material Handling", "Yield Guarantees", "Batch Records"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Electronics Assembly Agreement": {
    key: "EAA",
    description: "Printed circuit board assembly and electronics manufacturing.",
    controlledType: "Electronics Assembly",
    industries: ["Manufacturing"],
    subindustries: ["Electronics"],
    obligations: ["IPC Standards", "Component Sourcing", "Testing Protocols", "RoHS Compliance"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Industrial Distribution Agreement": {
    key: "IDA",
    description: "Distribution of industrial machinery and equipment.",
    controlledType: "Industrial Distribution",
    industries: ["Manufacturing"],
    subindustries: ["Industrial Products", "Industrial Equipment"],
    obligations: ["Technical Support", "Parts Availability", "Training Programs", "Service Networks"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Food Safety Agreement": {
    key: "FSA",
    description: "Food manufacturing safety and compliance standards.",
    controlledType: "Food Safety",
    industries: ["Manufacturing"],
    subindustries: ["Food & Beverage"],
    obligations: ["HACCP Compliance", "FDA Registration", "Allergen Control", "Recall Procedures"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },
  "Co-Packing Agreement": {
    key: "COPA",
    description: "Contract packaging services for food and beverage products.",
    controlledType: "Co-Packing",
    industries: ["Manufacturing"],
    subindustries: ["Food & Beverage"],
    obligations: ["Recipe Protection", "Nutritional Labeling", "Shelf Life Testing", "Batch Coding"],
    noTerm: false,
    category: "Manufacturing-Specific"
  },

  // === ENERGY SECTOR ===
  "Power Purchase Agreement (PPA)": {
    key: "PPA_ENERGY",
    description: "Long-term contract for the sale of electricity from renewable sources.",
    controlledType: "Power Purchase",
    industries: ["Energy"],
    subindustries: ["Renewable Energy", "Solar", "Wind", "Utilities"],
    obligations: ["Energy Delivery", "Price Escalation", "Environmental Attributes", "Grid Compliance"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Joint Operating Agreement (JOA)": {
    key: "JOA",
    description: "Governs joint oil and gas exploration and production activities.",
    controlledType: "Joint Operating",
    industries: ["Energy"],
    subindustries: ["Oil & Gas", "Exploration", "Production"],
    obligations: ["Cost Sharing", "Environmental Compliance", "Operational Control", "Revenue Distribution"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Energy Services Agreement": {
    key: "ESA",
    description: "Terms for energy efficiency and management services.",
    controlledType: "Energy Services",
    industries: ["Energy"],
    subindustries: ["Energy Management", "Smart Grid", "Energy Storage"],
    obligations: ["Performance Guarantees", "Measurement & Verification", "Shared Savings", "Equipment Maintenance"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Solar Installation Agreement": {
    key: "SIA",
    description: "Residential and commercial solar panel installation terms.",
    controlledType: "Solar Installation",
    industries: ["Energy"],
    subindustries: ["Solar", "Renewable Energy"],
    obligations: ["System Performance", "Warranty Terms", "Permitting", "Net Metering"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Solar Lease Agreement": {
    key: "SLA_ENERGY",
    description: "Equipment leasing for solar energy systems.",
    controlledType: "Solar Lease",
    industries: ["Energy"],
    subindustries: ["Solar"],
    obligations: ["Monthly Payments", "System Maintenance", "Performance Monitoring", "End-of-Term Options"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Wind Farm Development Agreement": {
    key: "WFDA",
    description: "Development and construction of wind energy projects.",
    controlledType: "Wind Farm Development",
    industries: ["Energy"],
    subindustries: ["Wind", "Renewable Energy"],
    obligations: ["Site Assessment", "Environmental Impact", "Turbine Procurement", "Grid Connection"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Wind Turbine Supply Agreement": {
    key: "WTSA",
    description: "Manufacturing and delivery of wind turbine equipment.",
    controlledType: "Wind Turbine Supply",
    industries: ["Energy"],
    subindustries: ["Wind"],
    obligations: ["Performance Specifications", "Delivery Schedule", "Installation Support", "Warranty Coverage"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Utility Interconnection Agreement": {
    key: "UIA",
    description: "Grid connection terms for power generation facilities.",
    controlledType: "Utility Interconnection",
    industries: ["Energy"],
    subindustries: ["Utilities", "Renewable Energy"],
    obligations: ["Grid Standards", "Metering Requirements", "Reliability Standards", "Emergency Procedures"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Wholesale Power Agreement": {
    key: "WPA",
    description: "Bulk electricity sales between utilities and power producers.",
    controlledType: "Wholesale Power",
    industries: ["Energy"],
    subindustries: ["Utilities"],
    obligations: ["Capacity Payments", "Energy Pricing", "Transmission Rights", "Scheduling Procedures"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Drilling Services Agreement": {
    key: "DRILL",
    description: "Oil and gas drilling contractor services and terms.",
    controlledType: "Drilling Services",
    industries: ["Energy"],
    subindustries: ["Oil & Gas", "Exploration"],
    obligations: ["Drilling Program", "Safety Standards", "Environmental Compliance", "Equipment Specifications"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Seismic Survey Agreement": {
    key: "SEIS",
    description: "Geophysical exploration and seismic data acquisition.",
    controlledType: "Seismic Survey",
    industries: ["Energy"],
    subindustries: ["Exploration", "Oil & Gas"],
    obligations: ["Data Ownership", "Environmental Protection", "Land Access", "Survey Specifications"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Production Sharing Agreement": {
    key: "PSA_ENERGY",
    description: "Revenue sharing for oil and gas production operations.",
    controlledType: "Production Sharing",
    industries: ["Energy"],
    subindustries: ["Production", "Oil & Gas"],
    obligations: ["Cost Recovery", "Profit Sharing", "Government Take", "Local Content"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Refining Services Agreement": {
    key: "REFINE",
    description: "Crude oil refining and processing services.",
    controlledType: "Refining Services",
    industries: ["Energy"],
    subindustries: ["Production"],
    obligations: ["Processing Fees", "Product Specifications", "Yield Guarantees", "Environmental Standards"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Smart Grid Integration Agreement": {
    key: "SGIA",
    description: "Advanced grid technology implementation and management.",
    controlledType: "Smart Grid Integration",
    industries: ["Energy"],
    subindustries: ["Smart Grid", "Energy Management"],
    obligations: ["Cybersecurity Standards", "Data Management", "Interoperability", "Performance Metrics"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Demand Response Agreement": {
    key: "DRA",
    description: "Grid balancing through demand-side management programs.",
    controlledType: "Demand Response",
    industries: ["Energy"],
    subindustries: ["Energy Management", "Smart Grid"],
    obligations: ["Response Requirements", "Baseline Calculations", "Penalty Provisions", "Payment Terms"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Battery Storage Agreement": {
    key: "BSA",
    description: "Energy storage system installation and operation terms.",
    controlledType: "Battery Storage",
    industries: ["Energy"],
    subindustries: ["Energy Storage", "Renewable Energy"],
    obligations: ["Capacity Guarantees", "Cycling Requirements", "Efficiency Standards", "Safety Protocols"],
    noTerm: false,
    category: "Energy-Specific"
  },
  "Grid-Scale Storage Agreement": {
    key: "GSSA",
    description: "Large-scale energy storage for grid stabilization services.",
    controlledType: "Grid-Scale Storage",
    industries: ["Energy"],
    subindustries: ["Energy Storage", "Utilities"],
    obligations: ["Ancillary Services", "Frequency Regulation", "Peak Shaving", "Round-Trip Efficiency"],
    noTerm: false,
    category: "Energy-Specific"
  },

  // === HR DOCUMENTS (Cross-Industry) ===
  "Offer Letter": {
    key: "OFFER",
    description: "Outlines terms of employment for a candidate.",
    controlledType: "Offer Letter",
    industries: ["HR"],
    subindustries: ["All"],
    obligations: ["Confidentiality", "Non-Solicitation", "At-Will Employment"],
    noTerm: true,
    category: "HR-Cross-Industry"
  },
  "Employee Separation Agreement": {
    key: "SEP",
    description: "Formalizes the terms of ending employment.",
    controlledType: "Employee Separation",
    industries: ["HR"],
    subindustries: ["All"],
    obligations: ["Confidentiality", "Non-Disparagement", "Release of Claims"],
    noTerm: true,
    category: "HR-Cross-Industry"
  },
  "Stock Option Agreement": {
    key: "STOCK",
    description: "Grants employee rights to purchase company stock.",
    controlledType: "Stock Options",
    industries: ["HR"],
    subindustries: ["Startups", "Technology", "Growth Companies"],
    obligations: ["Vesting Schedule", "Exercise Terms", "Tax Implications", "Clawback Provisions"],
    noTerm: false,
    category: "HR-Cross-Industry"
  },
  "Non-Compete Agreement": {
    key: "NONCOMP",
    description: "Restricts employee's ability to compete post-employment.",
    controlledType: "Non-Compete",
    industries: ["HR"],
    subindustries: ["Sales", "Technology", "Executive"],
    obligations: ["Geographic Restrictions", "Time Limitations", "Scope Definition", "Consideration"],
    noTerm: true,
    category: "HR-Cross-Industry"
  },

  // === REAL ESTATE DOCUMENTS (Cross-Industry) ===
  "Commercial Lease Agreement": {
    key: "LEASE",
    description: "Terms for leasing commercial real estate property.",
    controlledType: "Commercial Lease",
    industries: ["Real Estate"],
    subindustries: ["Office", "Retail", "Industrial", "Warehouse"],
    obligations: ["Rent Escalation", "Maintenance Responsibilities", "Use Restrictions", "Assignment Rights"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Purchase and Sale Agreement": {
    key: "PSA",
    description: "Terms for buying and selling real estate property.",
    controlledType: "Purchase Sale",
    industries: ["Real Estate"],
    subindustries: ["Commercial", "Residential", "Investment", "Development"],
    obligations: ["Due Diligence", "Financing Contingencies", "Title Requirements", "Closing Conditions"],
    noTerm: true,
    category: "Real Estate-Specific"
  },
  "Property Management Agreement": {
    key: "PMA",
    description: "Authorizes third-party management of real estate assets.",
    controlledType: "Property Management",
    industries: ["Real Estate"],
    subindustries: ["Commercial", "Residential", "Mixed-Use", "REITs"],
    obligations: ["Management Fees", "Leasing Authority", "Maintenance Standards", "Financial Reporting"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Construction Agreement": {
    key: "CONST",
    description: "Terms for construction and development projects.",
    controlledType: "Construction",
    industries: ["Real Estate"],
    subindustries: ["Development", "Construction", "Infrastructure"],
    obligations: ["Performance Bonds", "Completion Timeline", "Change Orders", "Lien Waivers"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Office Space License Agreement": {
    key: "OSLA",
    description: "Flexible workspace and co-working space arrangements.",
    controlledType: "Office Space License",
    industries: ["Real Estate"],
    subindustries: ["Office"],
    obligations: ["Usage Rights", "Common Area Access", "Service Provisions", "Termination Rights"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Tenant Improvement Agreement": {
    key: "TIA",
    description: "Build-out and customization of leased commercial space.",
    controlledType: "Tenant Improvement",
    industries: ["Real Estate"],
    subindustries: ["Office", "Retail"],
    obligations: ["Improvement Allowance", "Design Approval", "Construction Standards", "Permit Responsibilities"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Retail Lease Agreement": {
    key: "RLA",
    description: "Specialized terms for retail and shopping center leases.",
    controlledType: "Retail Lease",
    industries: ["Real Estate"],
    subindustries: ["Retail"],
    obligations: ["Percentage Rent", "Operating Hours", "Exclusive Use", "CAM Charges"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Shopping Center Management": {
    key: "SCM",
    description: "Management of retail shopping centers and malls.",
    controlledType: "Shopping Center Management",
    industries: ["Real Estate"],
    subindustries: ["Retail"],
    obligations: ["Tenant Mix", "Marketing Fund", "Common Area Maintenance", "Security Services"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Industrial Lease Agreement": {
    key: "ILA",
    description: "Manufacturing and industrial facility lease terms.",
    controlledType: "Industrial Lease",
    industries: ["Real Estate"],
    subindustries: ["Industrial"],
    obligations: ["Environmental Compliance", "Utility Requirements", "Loading Dock Access", "Zoning Compliance"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Cold Storage Agreement": {
    key: "CSA_RE",
    description: "Refrigerated warehouse and cold storage facility terms.",
    controlledType: "Cold Storage",
    industries: ["Real Estate"],
    subindustries: ["Industrial", "Warehouse"],
    obligations: ["Temperature Control", "Food Safety", "Inventory Management", "Insurance Requirements"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Warehouse Distribution Agreement": {
    key: "WDA",
    description: "Distribution center and fulfillment warehouse operations.",
    controlledType: "Warehouse Distribution",
    industries: ["Real Estate"],
    subindustries: ["Warehouse"],
    obligations: ["Throughput Requirements", "Storage Capacity", "Labor Provisions", "Technology Integration"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Logistics Center Agreement": {
    key: "LCA",
    description: "Multi-modal transportation and logistics facility terms.",
    controlledType: "Logistics Center",
    industries: ["Real Estate"],
    subindustries: ["Warehouse", "Industrial"],
    obligations: ["Transportation Access", "Cross-Docking", "Inventory Systems", "Security Protocols"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Residential Property Management": {
    key: "RPM",
    description: "Single-family and multi-family residential property management.",
    controlledType: "Residential Property Management",
    industries: ["Real Estate"],
    subindustries: ["Residential"],
    obligations: ["Tenant Screening", "Rent Collection", "Maintenance Response", "Fair Housing Compliance"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Apartment Management Agreement": {
    key: "AMA",
    description: "Multi-family apartment complex management services.",
    controlledType: "Apartment Management",
    industries: ["Real Estate"],
    subindustries: ["Residential"],
    obligations: ["Occupancy Targets", "Lease Administration", "Capital Improvements", "Tenant Relations"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Investment Property Agreement": {
    key: "IPA_RE",
    description: "Acquisition and management of income-producing properties.",
    controlledType: "Investment Property",
    industries: ["Real Estate"],
    subindustries: ["Investment"],
    obligations: ["Cash Flow Projections", "Asset Management", "Disposition Strategy", "Tax Considerations"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Real Estate Syndication Agreement": {
    key: "RESA",
    description: "Partnership structures for real estate investment groups.",
    controlledType: "Real Estate Syndication",
    industries: ["Real Estate"],
    subindustries: ["Investment"],
    obligations: ["Capital Contributions", "Profit Distributions", "Management Responsibilities", "Exit Strategies"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Land Development Agreement": {
    key: "LDA",
    description: "Raw land development and subdivision projects.",
    controlledType: "Land Development",
    industries: ["Real Estate"],
    subindustries: ["Development"],
    obligations: ["Zoning Approvals", "Infrastructure Development", "Environmental Compliance", "Phasing Plans"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Design-Build Agreement": {
    key: "DBA",
    description: "Integrated design and construction services.",
    controlledType: "Design-Build",
    industries: ["Real Estate"],
    subindustries: ["Development", "Construction"],
    obligations: ["Design Responsibility", "Construction Management", "Single Point Accountability", "Cost Guarantees"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Mixed-Use Development Agreement": {
    key: "MUDA",
    description: "Combined residential, commercial, and retail development projects.",
    controlledType: "Mixed-Use Development",
    industries: ["Real Estate"],
    subindustries: ["Mixed-Use", "Development"],
    obligations: ["Zoning Compliance", "Parking Requirements", "Utility Coordination", "Phased Construction"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "REIT Management Agreement": {
    key: "RMA",
    description: "Real Estate Investment Trust asset management services.",
    controlledType: "REIT Management",
    industries: ["Real Estate"],
    subindustries: ["REITs"],
    obligations: ["Fiduciary Duties", "Performance Fees", "Acquisition Criteria", "Distribution Policies"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "General Contractor Agreement": {
    key: "GCA",
    description: "Primary construction contractor services and responsibilities.",
    controlledType: "General Contractor",
    industries: ["Real Estate"],
    subindustries: ["Construction"],
    obligations: ["Project Management", "Subcontractor Coordination", "Safety Compliance", "Quality Control"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  "Infrastructure Development Agreement": {
    key: "INFRA",
    description: "Public infrastructure and utility development projects.",
    controlledType: "Infrastructure Development",
    industries: ["Real Estate"],
    subindustries: ["Infrastructure", "Construction"],
    obligations: ["Public Procurement", "Environmental Impact", "Regulatory Approvals", "Community Benefits"],
    noTerm: false,
    category: "Real Estate-Specific"
  },
  // ========================================
  // CUSTOM DOCUMENT TYPES - Healthcare  
  // ========================================

  /**
   * CUSTOM: Healthcare-specific document types for extraction
   * Added for CHG client/provider agreement generation
   */
  "Client Agreement": {
    key: "CA",
    description: "Healthcare client service agreement with extraction-ready fields",
    controlledType: "Client Agreement",
    industries: ["Healthcare"],
    subindustries: ["Custom"],
    obligations: ["Service Levels", "Insurance", "Payment Terms", "Governing Law"],
    noTerm: false,
    category: "Healthcare-Specific"
  },
  "Provider Agreement": {
    key: "PA",
    description: "Healthcare provider services agreement with vendor integration",
    controlledType: "Provider Agreement",
    industries: ["Healthcare"],
    subindustries: ["Custom"],
    obligations: ["Professional Standards", "Insurance", "Vendor Management", "JDE Integration"],
    noTerm: false,
    category: "Healthcare-Specific"
  }
};

// Enhanced industry and subindustry mapping
const INDUSTRIES = ["Technology", "Healthcare", "Financial Services", "Manufacturing", "Energy", "HR", "Real Estate"];

const SUBINDUSTRIES = {
  "Technology": ["SaaS", "Enterprise Software", "Mobile Apps", "Gaming", "Cloud Infrastructure", "Fintech", "E-commerce", "Marketing Tech", "HR Tech", "Data Analytics"],
  "Healthcare": ["Digital Health", "Medical Devices", "Telehealth", "Healthcare IT", "Pharmaceuticals", "Biotechnology", "Diagnostics", "Surgical Equipment"],
  "Financial Services": ["Banking", "Credit Unions", "Alternative Lending", "Wealth Management", "Investment Banking", "Asset Management", "Fintech", "Payment Processors", "Insurance", "Insurtech", "Risk Management"],
  "Manufacturing": ["Automotive", "Aerospace", "Consumer Goods", "Industrial Equipment", "Contract Manufacturing", "Private Label", "Electronics", "Industrial Products", "Food & Beverage"],
  "Energy": ["Renewable Energy", "Solar", "Wind", "Utilities", "Oil & Gas", "Exploration", "Production", "Energy Management", "Smart Grid", "Energy Storage"],
  "HR": ["All"],
  "Real Estate": ["Office", "Retail", "Industrial", "Warehouse", "Commercial", "Residential", "Investment", "Development", "Mixed-Use", "REITs", "Construction", "Infrastructure"]
};

// Enhanced obligations library with all new obligations
const OBL_TEXT = {
  // Existing obligations
  Compliance: "Compliance: Both parties shall comply with all applicable laws, regulations and internal policies, including anti-corruption, export controls and data privacy rules.",
  Confidentiality: "Confidentiality: All Confidential Information must be protected with at least the same degree of care as the party uses for its own, and not less than reasonable care.",
  "Data Breach": "Data Breach: Each party will notify the other within 48 hours of any security incident affecting personal data and cooperate on remediation efforts.",
  Deliverables: "Deliverables: All deliverables must meet the acceptance criteria defined in the SOW and be delivered in both draft and final formats.",
  Escalation: "Escalation: Unresolved issues will escalate to executive sponsors within 5 business days, following the path: Project Manager → VP → CEO.",
  Indemnification: "Indemnification: Each party will indemnify the other against third-party claims for breach, negligence or IP infringement, subject to notice and defense requirements.",
  Insurance: "Insurance: Contractor shall maintain general liability ($1M per occurrence), professional liability ($2M aggregate) and workers' comp coverage as required by law.",
  "Limitation of Liability": "Limitation of Liability: Neither party's aggregate liability will exceed the total fees paid under this agreement, except for willful misconduct or gross negligence.",
  "Service Levels": "Service Levels: Provider guarantees 99.9% uptime and will credit fees for any monthly downtime exceeding SLA targets.",

  // Technology-specific obligations
  "IP Protection": "IP Protection: All intellectual property rights remain with the original owner, with limited usage rights granted only as specified herein.",
  "Data Privacy": "Data Privacy: Personal data will be processed in accordance with GDPR, CCPA and other applicable privacy regulations.",
  "Rate Limiting": "Rate Limiting: API usage is subject to rate limits and fair use policies to ensure system stability and performance.",
  "Usage Compliance": "Usage Compliance: Software must be used in accordance with license terms and usage metrics will be monitored and reported.",
  "Audit Rights": "Audit Rights: Licensor reserves the right to audit software usage and compliance with license terms upon reasonable notice.",
  "Support Terms": "Support Terms: Technical support will be provided during business hours with defined response times based on issue severity.",
  "Scalability": "Scalability: System must support agreed-upon user loads and transaction volumes with automatic scaling capabilities.",
  "Response Times": "Response Times: Support requests will be acknowledged within specified timeframes based on priority classification.",
  "Bug Fixes": "Bug Fixes: Critical bugs will be addressed within 24 hours, with patches provided according to severity classification.",
  "Updates": "Updates: Software updates and patches will be provided regularly with advance notice and backward compatibility.",
  "Technical Support": "Technical Support: Comprehensive technical assistance including documentation, training, and troubleshooting services.",
  "Revenue Sharing": "Revenue Sharing: Publisher will retain specified percentage of net revenues after platform fees and applicable taxes.",
  "Marketing Support": "Marketing Support: Publisher will provide promotional materials, advertising, and marketing campaign support.",
  "Platform Compliance": "Platform Compliance: All content must comply with platform policies, app store guidelines, and content standards.",
  "Content Rights": "Content Rights: Clear definition of intellectual property ownership and usage rights for all game content and assets.",
  "Payment Processing": "Payment Processing: Secure handling of financial transactions with PCI compliance and fraud protection measures.",
  "Refund Policy": "Refund Policy: Clear terms for customer refunds, chargebacks, and dispute resolution procedures.",
  "Age Verification": "Age Verification: Appropriate controls to verify user age for age-restricted content and purchases.",
  "Platform Fees": "Platform Fees: Applicable fees charged by distribution platforms and payment processors will be clearly disclosed.",

  // Healthcare-specific obligations
  "HIPAA Compliance": "HIPAA Compliance: All handling of PHI must comply with HIPAA Security and Privacy Rules, including administrative, physical and technical safeguards.",
  "FDA Compliance": "FDA Compliance: All activities must comply with FDA regulations for medical devices, including QSR requirements and adverse event reporting.",
  "Regulatory Compliance": "Regulatory Compliance: Parties must maintain all required licenses and comply with industry-specific regulations.",
  "Subject Safety": "Subject Safety: Patient safety is paramount with adverse event reporting and safety monitoring throughout clinical trials.",
  "Data Integrity": "Data Integrity: Clinical data must be attributable, legible, contemporaneous, original, and accurate (ALCOA principles).",
  "Publication Rights": "Publication Rights: Clear terms governing publication of research results and intellectual property ownership.",
  "Product Liability": "Product Liability: Manufacturer assumes liability for product defects with appropriate insurance coverage and recall procedures.",
  "Recall Procedures": "Recall Procedures: Detailed procedures for product recalls including notification, retrieval, and corrective actions.",
  "Breach Notification": "Breach Notification: Immediate notification procedures for data breaches affecting protected health information.",
  "Access Controls": "Access Controls: Multi-factor authentication and role-based access controls for system security.",
  "User Authentication": "User Authentication: Strong authentication mechanisms to verify user identity and maintain audit trails.",
  "Audit Logging": "Audit Logging: Comprehensive logging of all system access and data modifications for compliance and security.",
  "Consent Management": "Consent Management: Patient consent tracking and management with opt-out capabilities and consent withdrawal.",
  "Data Minimization": "Data Minimization: Collection and processing of only necessary personal data for specified purposes.",
  "Purpose Limitation": "Purpose Limitation: Personal data used only for stated purposes with additional consent required for new uses.",
  "User Rights": "User Rights: Support for individual rights including access, rectification, erasure, and data portability.",

  // Financial-specific obligations
  "PCI Compliance": "PCI Compliance: Payment card data must be handled in accordance with PCI DSS standards and undergo regular security assessments.",
  "Fiduciary Duty": "Fiduciary Duty: Investment advisor must act in client's best interest with loyalty, care, and good faith.",
  "Fee Disclosure": "Fee Disclosure: All fees, expenses, and compensation must be clearly disclosed to clients in advance.",
  "Performance Reporting": "Performance Reporting: Regular reporting of investment performance against benchmarks and client objectives.",
  "Fraud Prevention": "Fraud Prevention: Advanced fraud detection and prevention measures to protect against unauthorized transactions.",
  "Settlement Terms": "Settlement Terms: Clear procedures for transaction settlement, timing, and dispute resolution.",
  "Chargeback Procedures": "Chargeback Procedures: Processes for handling payment disputes and chargeback management.",
  "Coverage Terms": "Coverage Terms: Detailed definition of insurance coverage, exclusions, and claim procedures.",
  "Claims Process": "Claims Process: Streamlined claims handling with defined timelines and documentation requirements.",
  "Premium Calculation": "Premium Calculation: Transparent methodology for calculating insurance premiums and rate adjustments.",
  "Interest Calculation": "Interest Calculation: Clear formulas for calculating interest, fees, and payment schedules.",
  "Default Procedures": "Default Procedures: Detailed procedures for handling payment defaults and collection activities.",
  "Collateral Terms": "Collateral Terms: Requirements for loan collateral, valuation, and release procedures.",

  // Manufacturing-specific obligations
  "Quality Standards": "Quality Standards: All products must meet specified quality criteria and industry standards, subject to inspection and testing.",
  "Delivery Schedules": "Delivery Schedules: Firm delivery commitments with penalties for delays and expediting procedures for rush orders.",
  "Price Adjustments": "Price Adjustments: Transparent mechanisms for price changes based on raw material costs, labor, and market conditions.",
  "Force Majeure": "Force Majeure: Protection against unforeseeable events that prevent contract performance including natural disasters and supply disruptions.",
  "Quality Control": "Quality Control: Comprehensive quality management systems including inspection, testing, and documentation procedures.",
  "Production Schedules": "Production Schedules: Detailed manufacturing schedules with capacity allocation and priority handling procedures.",
  "Capacity Allocation": "Capacity Allocation: Fair allocation of manufacturing capacity during high-demand periods with priority systems.",
  "Sales Targets": "Sales Targets: Minimum sales volume commitments with performance incentives and territory protection.",
  "Territory Rights": "Territory Rights: Exclusive or non-exclusive rights to distribute products in specified geographic territories.",
  "Inventory Management": "Inventory Management: Optimal inventory levels with just-in-time delivery and demand forecasting.",
  "ISO Compliance": "ISO Compliance: Adherence to relevant ISO standards for quality management and industry-specific requirements.",
  "Testing Procedures": "Testing Procedures: Comprehensive testing protocols including incoming inspection, in-process, and final testing.",
  "Corrective Actions": "Corrective Actions: Systematic approach to identifying, investigating, and correcting quality issues.",

  // Energy-specific obligations
  "Energy Delivery": "Energy Delivery: Seller shall deliver contracted energy quantities according to the delivery schedule, with penalties for shortfalls.",
  "Price Escalation": "Price Escalation: Transparent pricing mechanisms with inflation adjustments and market-based pricing updates.",
  "Environmental Attributes": "Environmental Attributes: Transfer of renewable energy certificates and environmental credits associated with clean energy generation.",
  "Grid Compliance": "Grid Compliance: Adherence to grid codes, reliability standards, and interconnection requirements.",
  "Cost Sharing": "Cost Sharing: Equitable sharing of exploration, development, and operational costs among joint venture partners.",
  "Environmental Compliance": "Environmental Compliance: All activities must comply with environmental regulations and sustainability requirements.",
  "Operational Control": "Operational Control: Clear designation of operational authority and decision-making responsibilities.",
  "Revenue Distribution": "Revenue Distribution: Fair allocation of revenues based on ownership percentages and participation levels.",
  "Performance Guarantees": "Performance Guarantees: Measurable performance commitments with penalties for underperformance.",
  "Measurement & Verification": "Measurement & Verification: Independent verification of energy savings and performance metrics.",
  "Shared Savings": "Shared Savings: Equitable sharing of energy cost savings between provider and customer.",
  "Equipment Maintenance": "Equipment Maintenance: Regular maintenance schedules to ensure optimal equipment performance and longevity.",

  // Real Estate-specific obligations
  "Rent Escalation": "Rent Escalation: Annual rent increases based on CPI adjustments or fixed percentage increases as specified.",
  "Maintenance Responsibilities": "Maintenance Responsibilities: Clear allocation of maintenance duties between landlord and tenant for different building systems.",
  "Use Restrictions": "Use Restrictions: Permitted uses of the property with restrictions on activities that may damage property or violate zoning.",
  "Assignment Rights": "Assignment Rights: Tenant's ability to assign lease or sublet space with landlord consent requirements.",
  "Due Diligence": "Due Diligence: Buyer has specified time period to complete inspections, environmental assessments and title review.",
  "Financing Contingencies": "Financing Contingencies: Purchase contingent upon buyer obtaining satisfactory financing within specified timeframe.",
  "Title Requirements": "Title Requirements: Clear title delivery with standard title insurance and resolution of any title defects.",
  "Closing Conditions": "Closing Conditions: All conditions that must be satisfied prior to closing including inspections and approvals.",
  "Management Fees": "Management Fees: Compensation structure for property management services including base fees and performance incentives.",
  "Leasing Authority": "Leasing Authority: Property manager's authority to execute leases and make leasing decisions within specified parameters.",
  "Financial Reporting": "Financial Reporting: Regular financial reports including income statements, rent rolls, and capital expenditure tracking.",
  "Performance Bonds": "Performance Bonds: Surety bonds to guarantee completion of construction work according to contract specifications.",
  "Completion Timeline": "Completion Timeline: Firm construction schedules with milestone payments and penalty clauses for delays.",
  "Change Orders": "Change Orders: Procedures for handling changes to construction scope with cost and schedule impact analysis.",
  "Lien Waivers": "Lien Waivers: Required lien waivers from contractors and suppliers to protect property from construction liens.",

  // HR-specific obligations
  "At-Will Employment": "At-Will Employment: Employment may be terminated by either party at any time, with or without cause or notice.",
  "Non-Solicitation": "Non-Solicitation: For 12 months post-termination, neither party will solicit or hire the other's employees or contractors.",
  "Non-Disparagement": "Non-Disparagement: Both parties agree not to make adverse or negative public statements about the other following separation.",
  "Release of Claims": "Release of Claims: Employee releases all claims against employer in exchange for separation benefits.",
  "Vesting Schedule": "Vesting Schedule: Options vest over 48 months with a 12-month cliff, subject to continued employment.",
  "Exercise Terms": "Exercise Terms: Stock options may be exercised within specified timeframe following vesting with payment methods defined.",
  "Tax Implications": "Tax Implications: Employee acknowledges tax consequences of stock option grants and exercises.",
  "Clawback Provisions": "Clawback Provisions: Company may reclaim incentive compensation in cases of misconduct or financial restatement.",
  "Geographic Restrictions": "Geographic Restrictions: Non-compete applies within specified geographic area around company locations.",
  "Time Limitations": "Time Limitations: Restrictive covenants limited to reasonable time period following employment termination.",
  "Scope Definition": "Scope Definition: Clear definition of restricted activities and competing businesses.",
  "Consideration": "Consideration: Adequate consideration provided for restrictive covenants including signing bonus or continued employment."
};