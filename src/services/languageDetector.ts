/**
 * Language Detector for Multilingual Voice Trust Firewall
 *
 * Supports robust identification of Indian languages:
 * - English (en)
 * - Hindi (hi)
 * - Telugu (te)
 * - Tamil (ta)
 * - Kannada (kn)
 * - Malayalam (ml)
 * - Marathi (mr)
 * - Bengali (bn)
 *
 * Handles both native Unicode scripts and transliterated / code-mixed utterances.
 */

import { LanguageCode } from '../types';

export interface LanguageDetectionResult {
  languageCode: LanguageCode;
  languageName: string;
  nativeName: string;
  confidence: number;
  isCodeMixed: boolean;
  scriptDetected: string;
}

export const LANGUAGE_REGISTRY: Record<
  LanguageCode,
  { name: string; nativeName: string; script: string; isAsrSupported: boolean; asrModel: string }
> = {
  en: {
    name: 'English',
    nativeName: 'English (Indian)',
    script: 'Latin',
    isAsrSupported: true,
    asrModel: 'Conformer-CTC Indic-En v2.4 (Active)',
  },
  hi: {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    isAsrSupported: true,
    asrModel: 'AI4Bharat IndicWav2Vec-Hindi (Active)',
  },
  te: {
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    isAsrSupported: true,
    asrModel: 'AI4Bharat IndicWav2Vec-Telugu (Active)',
  },
  ta: {
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    isAsrSupported: true,
    asrModel: 'AI4Bharat IndicWav2Vec-Tamil (Active)',
  },
  kn: {
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    isAsrSupported: true,
    asrModel: 'AI4Bharat IndicWav2Vec-Kannada (Active)',
  },
  ml: {
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    isAsrSupported: false, // Architectural roadmap demonstration: toggleable ASR engine pack
    asrModel: 'Acoustic Model Pack Pending Certification (Unsupported in current profile)',
  },
  mr: {
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    isAsrSupported: false, // Uncertified ASR model demonstration
    asrModel: 'Acoustic Model Pack Pending Certification (Unsupported in current profile)',
  },
  bn: {
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    isAsrSupported: false, // Uncertified ASR model demonstration
    asrModel: 'Acoustic Model Pack Pending Certification (Unsupported in current profile)',
  },
};

export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      languageCode: 'en',
      languageName: 'English',
      nativeName: 'English (Indian)',
      confidence: 1.0,
      isCodeMixed: false,
      scriptDetected: 'Latin',
    };
  }

  // Count characters in each unicode block
  let devanagariCount = 0;
  let teluguCount = 0;
  let tamilCount = 0;
  let kannadaCount = 0;
  let malayalamCount = 0;
  let bengaliCount = 0;
  let latinCount = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097f) devanagariCount++;
    else if (code >= 0x0c00 && code <= 0x0c7f) teluguCount++;
    else if (code >= 0x0b80 && code <= 0x0bff) tamilCount++;
    else if (code >= 0x0c80 && code <= 0x0cff) kannadaCount++;
    else if (code >= 0x0d00 && code <= 0x0d7f) malayalamCount++;
    else if (code >= 0x0980 && code <= 0x09ff) bengaliCount++;
    else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) latinCount++;
  }

  const indicTotal =
    devanagariCount + teluguCount + tamilCount + kannadaCount + malayalamCount + bengaliCount;
  const isCodeMixed = indicTotal > 0 && latinCount > 4;

  if (teluguCount > 0 && teluguCount >= devanagariCount && teluguCount >= tamilCount) {
    return {
      languageCode: 'te',
      languageName: 'Telugu',
      nativeName: 'తెలుగు',
      confidence: Math.min(0.98, Number((teluguCount / Math.max(1, text.length)).toFixed(2)) + 0.3),
      isCodeMixed,
      scriptDetected: 'Telugu Script',
    };
  }

  if (tamilCount > 0 && tamilCount >= devanagariCount && tamilCount >= teluguCount) {
    return {
      languageCode: 'ta',
      languageName: 'Tamil',
      nativeName: 'தமிழ்',
      confidence: Math.min(0.98, Number((tamilCount / Math.max(1, text.length)).toFixed(2)) + 0.3),
      isCodeMixed,
      scriptDetected: 'Tamil Script',
    };
  }

  if (kannadaCount > 0 && kannadaCount >= devanagariCount) {
    return {
      languageCode: 'kn',
      languageName: 'Kannada',
      nativeName: 'ಕನ್ನಡ',
      confidence: Math.min(0.98, Number((kannadaCount / Math.max(1, text.length)).toFixed(2)) + 0.3),
      isCodeMixed,
      scriptDetected: 'Kannada Script',
    };
  }

  if (malayalamCount > 0) {
    return {
      languageCode: 'ml',
      languageName: 'Malayalam',
      nativeName: 'മലയാളം',
      confidence: Math.min(0.98, Number((malayalamCount / Math.max(1, text.length)).toFixed(2)) + 0.3),
      isCodeMixed,
      scriptDetected: 'Malayalam Script',
    };
  }

  if (bengaliCount > 0) {
    return {
      languageCode: 'bn',
      languageName: 'Bengali',
      nativeName: 'বাংলা',
      confidence: Math.min(0.98, Number((bengaliCount / Math.max(1, text.length)).toFixed(2)) + 0.3),
      isCodeMixed,
      scriptDetected: 'Bengali Script',
    };
  }

  if (devanagariCount > 0) {
    // Distinguish Marathi vs Hindi
    const isMarathi =
      /(आहे|नाही|कसे|पैसे|लगेच|खाते|सांगा|द्या|तपासून)/i.test(text) &&
      !/(है|नहीं|कैसे|रुपये|तुरंत|बताओ)/i.test(text);

    if (isMarathi) {
      return {
        languageCode: 'mr',
        languageName: 'Marathi',
        nativeName: 'मराठी',
        confidence: 0.92,
        isCodeMixed,
        scriptDetected: 'Devanagari (Marathi)',
      };
    }

    return {
      languageCode: 'hi',
      languageName: 'Hindi',
      nativeName: 'हिन्दी',
      confidence: Math.min(0.98, Number((devanagariCount / Math.max(1, text.length)).toFixed(2)) + 0.3),
      isCodeMixed,
      scriptDetected: 'Devanagari (Hindi)',
    };
  }

  // Transliterated / Romanized heuristics
  const lower = text.toLowerCase();

  // Telugu transliterated markers
  if (
    /(namaskaram|meeru|mee\s|ippude|tvaraga|khata|pampandi|cheppandi|dabbulu|mariyu|ayindi|enduku)/i.test(
      lower
    )
  ) {
    return {
      languageCode: 'te',
      languageName: 'Telugu',
      nativeName: 'తెలుగు (Romanized)',
      confidence: 0.88,
      isCodeMixed: true,
      scriptDetected: 'Latin (Transliterated)',
    };
  }

  // Hindi transliterated markers
  if (
    /(namaste|aapka|turant|jaldi|kijiye|bhejo|paise|batao|kripya|khate|aaj|mujhe)/i.test(
      lower
    )
  ) {
    return {
      languageCode: 'hi',
      languageName: 'Hindi',
      nativeName: 'हिन्दी (Romanized)',
      confidence: 0.89,
      isCodeMixed: true,
      scriptDetected: 'Latin (Transliterated)',
    };
  }

  // Tamil transliterated markers
  if (
    /(vanakkam|ungal|udane|ippo|anuppunga|sollunga|panam|kanakku)/i.test(
      lower
    )
  ) {
    return {
      languageCode: 'ta',
      languageName: 'Tamil',
      nativeName: 'தமிழ் (Romanized)',
      confidence: 0.87,
      isCodeMixed: true,
      scriptDetected: 'Latin (Transliterated)',
    };
  }

  // Kannada transliterated markers
  if (
    /(namaskara|nimma|bege|iga|kalisi|heli|hana|khatege)/i.test(
      lower
    )
  ) {
    return {
      languageCode: 'kn',
      languageName: 'Kannada',
      nativeName: 'ಕನ್ನಡ (Romanized)',
      confidence: 0.86,
      isCodeMixed: true,
      scriptDetected: 'Latin (Transliterated)',
    };
  }

  // Default to English
  return {
    languageCode: 'en',
    languageName: 'English',
    nativeName: 'English',
    confidence: 0.95,
    isCodeMixed: false,
    scriptDetected: 'Latin',
  };
}
