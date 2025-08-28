// 09_cacheManager.js
// Advanced caching system for document generation performance optimization
// Reduces lookup times from O(n) to O(1) for frequently accessed data

class DocumentCacheManager {
  constructor() {
    this.initialized = false;
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      buildTime: 0
    };
  }

  init() {
    if (this.initialized) return;
    
    const startTime = Date.now();
    Logger.log('Building comprehensive document generation cache...');
    
    // Build all cache indexes
    this.buildDocTypeIndexes();
    this.buildSubindustryGuidanceCache();
    this.buildRegulatoryContextCache();
    this.buildFinancialRangesCache();
    this.buildObligationTextCache();
    
    this.cacheStats.buildTime = Date.now() - startTime;
    this.initialized = true;
    
    Logger.log(`Cache built in ${this.cacheStats.buildTime}ms. Cached ${this.cache.size} data structures.`);
  }

  /**
   * HIGH IMPACT: Cache DOC_TYPE_LIBRARY lookups
   * Converts O(n) searches to O(1) lookups
   */
  buildDocTypeIndexes() {
    // Index by subindustry for fast filtering
    const bySubindustry = new Map();
    const byName = new Map();
    const byKey = new Map();
    
    for (const [name, docType] of Object.entries(DOC_TYPE_LIBRARY)) {
      // Index by name
      byName.set(name, docType);
      byKey.set(docType.key, docType);
      
      // Index by subindustry
      docType.subindustries.forEach(subindustry => {
        if (!bySubindustry.has(subindustry)) {
          bySubindustry.set(subindustry, []);
        }
        bySubindustry.get(subindustry).push(name);
      });
    }
    
    this.cache.set('docTypes.bySubindustry', bySubindustry);
    this.cache.set('docTypes.byName', byName);
    this.cache.set('docTypes.byKey', byKey);
    
    Logger.log(`Cached ${byName.size} doc types across ${bySubindustry.size} subindustries`);
  }

  /**
   * HIGH IMPACT: Cache subindustry guidance text
   * Eliminates repeated object creation and lookups
   */
  buildSubindustryGuidanceCache() {
    const guidanceMap = {
      "Wealth Management": "Focus on fiduciary responsibilities, fee transparency, and regulatory compliance with SEC and state investment advisor requirements. Include provisions for investment policy statements and performance reporting.",
      "SaaS": "Emphasize data security, service level agreements, API governance, and GDPR compliance. Include provisions for data processing, user access controls, and system availability guarantees.",
      "E-commerce": "Focus on payment processing, consumer protection, data privacy, and international commerce regulations. Include provisions for product liability, shipping terms, and customer service standards.",
      "Manufacturing": "Emphasize supply chain management, quality control, environmental compliance, and workplace safety. Include provisions for material sourcing, production standards, and regulatory certifications.",
      "Consulting": "Focus on professional liability, intellectual property rights, deliverable specifications, and client confidentiality. Include provisions for project management, change orders, and knowledge transfer.",
      "Digital Marketing": "Emphasize brand protection, advertising compliance, data collection practices, and performance metrics. Include provisions for campaign management, creative rights, and ROI measurement.",
      "Pharmaceuticals": "Focus on FDA compliance, clinical trial management, drug safety reporting, and intellectual property protection. Include provisions for regulatory submissions, adverse event reporting, and patent strategies.",
      "Medical Device": "Emphasize FDA 510(k) compliance, quality system regulations, post-market surveillance, and product liability. Include provisions for design controls, risk management, and clinical evaluations.",
      "Biotechnology": "Focus on intellectual property protection, research collaboration, regulatory pathways, and technology transfer. Include provisions for licensing agreements, milestone payments, and patent prosecution.",
      "Clinical Research": "Emphasize GCP compliance, patient safety, data integrity, and regulatory reporting. Include provisions for study protocols, adverse event management, and regulatory inspections.",
      "Investment Banking": "Focus on SEC compliance, fiduciary duties, conflict of interest management, and market regulation adherence. Include provisions for deal execution, client confidentiality, and regulatory reporting.",
      "Asset Management": "Emphasize investment advisor regulations, performance reporting, fee disclosure, and risk management. Include provisions for portfolio management, client communications, and regulatory examinations.",
      "Insurance": "Focus on state insurance regulations, solvency requirements, claims management, and consumer protection. Include provisions for underwriting standards, policy administration, and regulatory compliance.",
      "Fintech": "Emphasize financial regulations, data security, consumer protection, and payment system compliance. Include provisions for API security, transaction monitoring, and regulatory technology.",
      "Renewable Energy": "Focus on environmental regulations, grid interconnection standards, power purchase agreements, and sustainability reporting. Include provisions for project development, regulatory approvals, and environmental impact.",
      "Oil & Gas": "Emphasize environmental compliance, safety regulations, joint venture structures, and resource extraction rights. Include provisions for drilling operations, environmental monitoring, and regulatory permits.",
      "Mining": "Focus on environmental impact assessments, safety regulations, land use rights, and community engagement. Include provisions for extraction operations, restoration requirements, and regulatory compliance.",
      "Utilities": "Emphasize regulatory oversight, rate structures, service reliability, and environmental compliance. Include provisions for infrastructure maintenance, customer service standards, and regulatory reporting.",
      "Automotive": "Focus on safety regulations, environmental standards, supplier relationships, and product liability. Include provisions for design specifications, testing protocols, and recall procedures.",
      "Aerospace": "Emphasize aviation safety, FAA compliance, export controls, and quality certifications. Include provisions for design standards, testing requirements, and regulatory approvals.",
      "Construction": "Focus on building codes, safety regulations, contractor licensing, and project management. Include provisions for quality standards, safety protocols, and regulatory inspections.",
      "Food & Beverage": "Emphasize FDA compliance, food safety, labeling requirements, and supply chain traceability. Include provisions for quality control, allergen management, and regulatory reporting.",
      "Real Estate Development": "Focus on zoning regulations, environmental assessments, construction permits, and financing structures. Include provisions for project management, regulatory approvals, and market analysis.",
      "Property Management": "Emphasize tenant relations, property maintenance, regulatory compliance, and financial management. Include provisions for lease administration, maintenance standards, and tenant services.",
      "Commercial Real Estate": "Focus on lease negotiations, property valuation, market analysis, and investment structures. Include provisions for due diligence, property management, and tenant relations.",
      "Residential Real Estate": "Emphasize consumer protection, fair housing compliance, disclosure requirements, and transaction management. Include provisions for property inspections, title matters, and closing procedures."
    };
    
    this.cache.set('guidance.subindustry', guidanceMap);
    Logger.log(`Cached ${Object.keys(guidanceMap).length} subindustry guidance entries`);
  }

  /**
   * MEDIUM IMPACT: Cache regulatory context combinations
   * Pre-computes geography × subindustry regulatory data
   */
  buildRegulatoryContextCache() {
    const regulatoryCache = new Map();
    const geographies = ['NAMER', 'EMEA', 'APAC', 'LATAM'];
    const subindustries = Object.keys(this.cache.get('guidance.subindustry') || {});
    
    geographies.forEach(geography => {
      subindustries.forEach(subindustry => {
        const key = `${geography}:${subindustry}`;
        regulatoryCache.set(key, this.generateRegulatoryContext(subindustry, geography));
      });
    });
    
    this.cache.set('regulatory.contexts', regulatoryCache);
    Logger.log(`Cached ${regulatoryCache.size} regulatory context combinations`);
  }

  /**
   * MEDIUM IMPACT: Cache financial value ranges
   * Pre-computes industry × geography financial parameters
   */
  buildFinancialRangesCache() {
    const industries = ['Healthcare', 'Financial Services', 'Technology', 'Energy', 'Manufacturing', 'Real Estate'];
    const geographies = ['NAMER', 'EMEA', 'APAC', 'LATAM'];
    const rangesCache = new Map();
    
    industries.forEach(industry => {
      geographies.forEach(geography => {
        const key = `${industry}:${geography}`;
        rangesCache.set(key, this.generateFinancialRanges(industry, geography));
      });
    });
    
    this.cache.set('financial.ranges', rangesCache);
    Logger.log(`Cached ${rangesCache.size} financial range combinations`);
  }

  /**
   * LOW IMPACT: Cache obligation text lookups
   * Provides O(1) obligation text resolution
   */
  buildObligationTextCache() {
    // Index OBL_TEXT for faster lookups
    const obligationIndex = new Map();
    
    if (typeof OBL_TEXT !== 'undefined') {
      for (const [key, text] of Object.entries(OBL_TEXT)) {
        obligationIndex.set(key, text);
      }
    }
    
    this.cache.set('obligations.text', obligationIndex);
    Logger.log(`Cached ${obligationIndex.size} obligation text entries`);
  }

  // Fast lookup methods with automatic cache hits/misses tracking
  getDocTypesForSubindustry(subindustry) {
    const cacheKey = 'docTypes.bySubindustry';
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.has(subindustry)) {
      this.cacheStats.hits++;
      return cached.get(subindustry);
    }
    
    this.cacheStats.misses++;
    return [];
  }

  getDocTypeByName(name) {
    const cacheKey = 'docTypes.byName';
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.has(name)) {
      this.cacheStats.hits++;
      return cached.get(name);
    }
    
    this.cacheStats.misses++;
    return null;
  }

  getSubindustryGuidance(subindustry) {
    const cached = this.cache.get('guidance.subindustry');
    
    if (cached && cached[subindustry]) {
      this.cacheStats.hits++;
      return cached[subindustry];
    }
    
    this.cacheStats.misses++;
    return `Standard professional practices for ${subindustry} with industry-appropriate terminology and regulatory compliance.`;
  }

  getRegulatoryContext(subindustry, geography) {
    const key = `${geography}:${subindustry}`;
    const cached = this.cache.get('regulatory.contexts');
    
    if (cached && cached.has(key)) {
      this.cacheStats.hits++;
      return cached.get(key);
    }
    
    this.cacheStats.misses++;
    return `Standard regulatory framework for ${subindustry} in ${geography}`;
  }

  getFinancialRanges(industry, geography) {
    const key = `${industry}:${geography}`;
    const cached = this.cache.get('financial.ranges');
    
    if (cached && cached.has(key)) {
      this.cacheStats.hits++;
      return cached.get(key);
    }
    
    this.cacheStats.misses++;
    // Fallback to basic calculation
    return this.generateFinancialRanges(industry, geography);
  }

  // Helper methods for cache building
  generateRegulatoryContext(subindustry, geography) {
    const contexts = {
      'NAMER': 'US federal and state regulations',
      'EMEA': 'EU regulations and GDPR compliance',
      'APAC': 'Regional regulatory frameworks',
      'LATAM': 'Local jurisdiction requirements'
    };
    
    return `${contexts[geography] || 'Applicable regulatory framework'} for ${subindustry}`;
  }

  generateFinancialRanges(industry, geography) {
    const baseRanges = {
      'Healthcare': { min: 100000, max: 2000000, depositRate: 0.15 },
      'Financial Services': { min: 250000, max: 5000000, depositRate: 0.20 },
      'Technology': { min: 75000, max: 1500000, depositRate: 0.10 },
      'Energy': { min: 500000, max: 10000000, depositRate: 0.25 },
      'Manufacturing': { min: 200000, max: 3000000, depositRate: 0.20 },
      'Real Estate': { min: 1000000, max: 50000000, depositRate: 0.10 }
    };

    const geoMultipliers = {
      'NAMER': 1.0,
      'EMEA': 0.85,
      'APAC': 0.7,
      'LATAM': 0.6
    };

    const base = baseRanges[industry] || baseRanges['Technology'];
    const multiplier = geoMultipliers[geography] || 1.0;

    return {
      min: Math.floor(base.min * multiplier),
      max: Math.floor(base.max * multiplier),
      depositRate: base.depositRate,
      currency: geography === 'EMEA' ? 'EUR' : 'USD'
    };
  }

  // Performance monitoring
  getCacheStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100;
    return {
      ...this.cacheStats,
      hitRate: hitRate.toFixed(2) + '%',
      totalRequests: this.cacheStats.hits + this.cacheStats.misses,
      cacheSize: this.cache.size
    };
  }

  clearCache() {
    this.cache.clear();
    this.initialized = false;
    this.cacheStats = { hits: 0, misses: 0, buildTime: 0 };
  }
}

// Global cache instance - Create singleton that's always available
var DocumentCache;
(function() {
  DocumentCache = new DocumentCacheManager();
})();