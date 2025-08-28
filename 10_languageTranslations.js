// 10_languageTranslations.js
// Language translations for post-processing elements (headers, signatures, preambles)

/**
 * Get translations for post-processing elements
 * @param {string} language - Target language (English, Spanish, French, German, Portuguese (PT), Portuguese (BR), Japanese)
 * @returns {Object} Translation object with all required phrases
 */
function getLanguageTranslations(language) {
  const translations = {
    'English': {
      contractNo: 'Contract No',
      whereas: 'WHEREAS',
      nowTherefore: 'NOW, THEREFORE',
      inWitnessWhereof: 'IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.',
      signatures: 'SIGNATURES',
      by: 'By',
      title: 'Title',
      signature: 'Signature',
      date: 'Date',
      thisAgreement: 'THIS AGREEMENT',
      isEnteredInto: 'is entered into as of',
      effectiveDate: 'Effective Date',
      byAndBetween: 'by and between',
      inConsideration: 'in consideration of the mutual covenants contained herein, the parties agree as follows'
    },
    'Spanish': {
      contractNo: 'Contrato No',
      whereas: 'CONSIDERANDO QUE',
      nowTherefore: 'POR LO TANTO',
      inWitnessWhereof: 'EN FE DE LO CUAL, las partes han ejecutado este Acuerdo en la fecha mencionada anteriormente.',
      signatures: 'FIRMAS',
      by: 'Por',
      title: 'Título',
      signature: 'Firma',
      date: 'Fecha',
      thisAgreement: 'ESTE ACUERDO',
      agreement: 'Acuerdo',
      isEnteredInto: 'se celebra el',
      effectiveDate: 'Fecha de Entrada en Vigor',
      byAndBetween: 'entre',
      inConsideration: 'en consideración a los compromisos mutuos contenidos en el presente, las partes acuerdan lo siguiente',
      company: 'Compañía',
      counterparty: 'Contraparte',
      corporation: 'Corporación',
      llc: 'Sociedad de Responsabilidad Limitada',
      organizedUnderLaws: 'organizada bajo las leyes de',
      asOf: 'a partir del'
    },
    'French': {
      contractNo: 'Contrat No',
      whereas: 'CONSIDÉRANT QUE',
      nowTherefore: 'PAR CONSÉQUENT',
      inWitnessWhereof: 'EN FOI DE QUOI, les parties ont exécuté cet Accord à la date mentionnée ci-dessus.',
      signatures: 'SIGNATURES',
      by: 'Par',
      title: 'Titre',
      signature: 'Signature',
      date: 'Date',
      thisAgreement: 'CET ACCORD',
      isEnteredInto: 'est conclu le',
      effectiveDate: 'Date d\'Entrée en Vigueur',
      byAndBetween: 'entre',
      inConsideration: 'en considération des engagements mutuels contenus dans les présentes, les parties conviennent de ce qui suit'
    },
    'German': {
      contractNo: 'Vertrag Nr',
      whereas: 'WOHINGEGEN',
      nowTherefore: 'DAHER',
      inWitnessWhereof: 'ZUM ZEUGNIS DESSEN haben die Parteien diese Vereinbarung zum oben genannten Datum unterzeichnet.',
      signatures: 'UNTERSCHRIFTEN',
      by: 'Von',
      title: 'Titel',
      signature: 'Unterschrift',
      date: 'Datum',
      thisAgreement: 'DIESE VEREINBARUNG',
      isEnteredInto: 'wird abgeschlossen am',
      effectiveDate: 'Wirksamkeitsdatum',
      byAndBetween: 'zwischen',
      inConsideration: 'in Anbetracht der hierin enthaltenen gegenseitigen Verpflichtungen vereinbaren die Parteien Folgendes'
    },
    'Portuguese (PT)': {
      contractNo: 'Contrato No',
      whereas: 'CONSIDERANDO QUE',
      nowTherefore: 'PORTANTO',
      inWitnessWhereof: 'EM TESTEMUNHO DO QUAL, as partes executaram este Acordo na data acima mencionada.',
      signatures: 'ASSINATURAS',
      by: 'Por',
      title: 'Título',
      signature: 'Assinatura',
      date: 'Data',
      thisAgreement: 'ESTE ACORDO',
      isEnteredInto: 'é celebrado em',
      effectiveDate: 'Data de Entrada em Vigor',
      byAndBetween: 'entre',
      inConsideration: 'em consideração aos compromissos mútuos aqui contidos, as partes concordam com o seguinte'
    },
    'Portuguese (BR)': {
      contractNo: 'Contrato Nº',
      whereas: 'CONSIDERANDO QUE',
      nowTherefore: 'PORTANTO',
      inWitnessWhereof: 'EM TESTEMUNHO DO QUE, as partes assinaram este Contrato na data acima mencionada.',
      signatures: 'ASSINATURAS',
      by: 'Por',
      title: 'Cargo',
      signature: 'Assinatura',
      date: 'Data',
      thisAgreement: 'ESTE CONTRATO',
      isEnteredInto: 'é celebrado em',
      effectiveDate: 'Data de Vigência',
      byAndBetween: 'entre',
      inConsideration: 'em consideração às obrigações mútuas aqui contidas, as partes concordam com o seguinte'
    },
    'Japanese': {
      contractNo: '契約番号',
      whereas: '鑑みて',
      nowTherefore: 'よって',
      inWitnessWhereof: 'これを証するため、当事者は上記の日付でこの契約を締結した。',
      signatures: '署名',
      by: '署名者',
      title: '役職',
      signature: '署名',
      date: '日付',
      thisAgreement: 'この契約',
      isEnteredInto: 'は以下の日付で締結される',
      effectiveDate: '発効日',
      byAndBetween: '間で',
      inConsideration: 'ここに含まれる相互の約束を考慮して、当事者は以下に同意する'
    }
  };

  // Return English as fallback if language not found
  return translations[language] || translations['English'];
}

/**
 * Normalize language string to handle variations
 * @param {string} language - Language string from form/data
 * @returns {string} Normalized language key
 */
function normalizeLanguage(language) {
  if (!language || language === 'English') return 'English';
  
  const languageMap = {
    'Spanish': 'Spanish',
    'French': 'French', 
    'German': 'German',
    'Portuguese (PT)': 'Portuguese (PT)',
    'Portuguese (BR)': 'Portuguese (BR)',
    'Japanese': 'Japanese',
    // Handle variations
    'ES': 'Spanish',
    'FR': 'French',
    'DE': 'German', 
    'PT': 'Portuguese (PT)',
    'BR': 'Portuguese (BR)',
    'JA': 'Japanese'
  };
  
  return languageMap[language] || 'English';
}