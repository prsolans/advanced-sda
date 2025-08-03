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
  return Object.keys(DOC_TYPE_LIBRARY).filter(
    key => DOC_TYPE_LIBRARY[key].subindustries.includes("All") ||
           DOC_TYPE_LIBRARY[key].subindustries.includes(subindustry)
  );
}

function getIndustryFromSubindustry(subindustry) {
  for (const [industry, subindustries] of Object.entries(SUBINDUSTRIES)) {
    if (subindustries.includes(subindustry)) {
      return industry;
    }
  }
  return "Technology"; // Default fallback
}