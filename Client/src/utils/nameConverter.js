/**
 * English to Gujarati name converter
 * Uses comprehensive phonetic mapping for accurate transliteration
 */

// Comprehensive consonant mappings with proper Gujarati phonetic equivalents
const consonantMappings = {
  // Basic consonants (lowercase) - using proper Gujarati characters
  'b': 'બ', 'c': 'ક', 'd': 'દ', 'f': 'ફ', 'g': 'ગ', 'h': 'હ', 'j': 'જ',
  'k': 'ક', 'l': 'લ', 'm': 'મ', 'n': 'ન', 'p': 'પ', 'q': 'ક', 'r': 'ર',
  's': 'સ', 't': 'ત', 'v': 'વ', 'w': 'વ', 'x': 'ક્સ', 'y': 'ય', 'z': 'ઝ',

  // Capital consonants - using proper Gujarati characters
  'B': 'બ', 'C': 'ક', 'D': 'દ', 'F': 'ફ', 'G': 'ગ', 'H': 'હ', 'J': 'જ',
  'K': 'ક', 'L': 'લ', 'M': 'મ', 'N': 'ન', 'P': 'પ', 'Q': 'ક', 'R': 'ર',
  'S': 'સ', 'T': 'ત', 'V': 'વ', 'W': 'વ', 'X': 'ક્સ', 'Y': 'ય', 'Z': 'ઝ',

  // Special consonant clusters (important for Gujarati)
  'dh': 'ધ', 'th': 'ત', 'sh': 'શ', 'ch': 'ચ', 'kh': 'ખ', 'gh': 'ઘ',
  'ph': 'ફ', 'bh': 'ભ', 'rh': 'ર્હ', 'nh': 'ન્હ', 'mh': 'મ્હ',
  'lh': 'લ્હ', 'vh': 'વ્હ', 'yh': 'ય્હ', 'wh': 'વ્હ',
  'jh': 'ઝ', 'oh': 'ઓહ',
};

// Vowel mappings (matras in Gujarati)
const vowelMappings = {
  // Vowels
  'a': 'અ', 'A': 'અ', 'e': 'ઇ', 'E': 'ઈ', 'i': 'ઈ', 'I': 'ઈ',
  'o': 'અ', 'O': 'ઓ', 'u': 'ઉ', 'U': 'ઊ', 'y': 'ય',

  // Vowel sounds (matras)
  'aa': 'ા', 'ee': 'ી', 'ii': 'ી', 'oo': 'ો', 'uu': 'ૂ',
  'ai': 'ૈ', 'au': 'ૌ', 'ou': 'ૌ',

  // Long vowels
  'ā': 'ા', 'ē': 'ી', 'ī': 'ી', 'ō': 'ો', 'ū': 'ૂ',
  'AI': 'ૈ', 'AU': 'ૌ', 'OU': 'ૌ',
};

// Common name patterns with proper Gujarati equivalents
const commonNamePatterns = {
  // Common first names and their Gujarati equivalents
  'utsav': 'ઉત્સવ', 'utsavbhai': 'ઉત્સવભાઈ',
  'himat': 'હિંમત', 'himatbhai': 'હિંમતભાઈ',
  'himanshu': 'હિમાંશુ', 'himanshubhai': 'હિમાંશુભાઈ',
  'rahul': 'રાહુલ', 'rahulbhai': 'રાહુલભાઈ',
  'ajay': 'અજય', 'ajaybhai': 'અજયભાઈ',
  'vijay': 'વિજય', 'vijaybhai': 'વિજયભાઈ',
  'jay': 'જય', 'jaybhai': 'જયભાઈ',
  'raj': 'રાજ', 'rajbhai': 'રાજભાઈ',
  'amit': 'અમિત', 'amitbhai': 'અમિતભાઈ',
  'sumit': 'સુમિત', 'sumitbhai': 'સુમિતભાઈ',
  'keval': 'કેવલ', 'kevalbhai': 'કેવલભાઈ',
  'prince': 'પ્રિંસ', 'princebhai': 'પ્રિંસભાઈ',
  'yash': 'યશ', 'yashbhai': 'યશભાઈ',
  'darshan': 'દર્શન', 'darshanbhai': 'દર્શનભાઈ',
  'nilesh': 'નિલેશ', 'nileshbhai': 'નિલેશભાઈ',
  'milap': 'મિલપ', 'milapbhai': 'મિલપભાઈ',
  'snehal': 'સ્નેહલ', 'snehalbhai': ' સ્નેહલભાઈ',
  'sneh': 'સ્નેહ', 'snehbhai': 'સ્નેહભાઈ',
  'kalpesh': 'કલ્પેશ', 'kalpeshbhai': 'કલ્પેશભાઈ',
  'paresh': 'પરેશ', 'pareshbhai': 'પરેશભાઈ',
  'mahesh': 'મહેશ', 'maheshbhai': 'મહેશભાઈ',
  'ramesh': 'રમેશ', 'rameshbhai': 'રમેશભાઈ',
  'suresh': 'સુરેશ', 'sureshbhai': 'સુરેશભાઈ',
  'naresh': 'નરેશ', 'nareshbhai': 'નરેશભાઈ',
  'chandresh': 'ચંદ્રેશ', 'chandreshbhai': 'ચંદ્રેશભાઈ',
  'pankaj': 'પંકજ', 'pankajbhai': 'પંકજભાઈ',
  'prashant': 'પ્રશાંત', 'prashantbhai': 'પ્રશાંતભાઈ',
  'ankur': 'અંકુર', 'ankurbhai': 'અંકુરભાઈ',
  'ankit': 'અંકિત', 'ankitbhai': 'અંકિતભાઈ',
  'vivek': 'વિવેક', 'vivekbhai': 'વિવેકભાઈ',
  'chirag': 'ચિરાગ', 'chiragbhai': 'ચિરાગભાઈ',
  'meet': 'મીત', 'meetbhai': 'મીતભાઈ',
  'mitesh': 'મિતેશ', 'miteshbhai': 'મિતેશભાઈ',
  'dhaval': 'ધવલ', 'dhavalbhai': 'ધવલભાઈ',
  'ધવલ': 'ધવલ', 'b': 'ભ',

  // Common surnames
  'dholakiya': 'ધોળકિયા',
  'patel': 'પટેલ', 'shah': 'શાહ', 'desai': 'દેસાઈ',
  'joshi': 'જોશી', 'panchal': 'પંચાલ', 'rane': 'રાણે',
  'raut': 'રાઉત', 'solanki': 'સોલંકી', 'chavda': 'ચાવડા',
  'parmar': 'પરમાર', 'rathod': 'રાઠોડ', 'thakor': 'ઠાકોર',
  'gupta': 'ગુપ્તા', 'sharma': 'શર્મા', 'singh': 'સિંહ',

  // Village names
  'khambhaliya': 'ખાંભડા', 'khambhada': 'ખાંભડા',
  'tajpur': 'તાજપર', 'tajpura': 'તાજપર',
  'untavad': 'ઉંટવડ', 'untvad': 'ઉંટવડ',
  'limda': 'લીમડા', 'limadia': 'લીમડા',
  'dudhala': 'દૂધળા', 'dudhla': 'દૂધળા',
  'mandvi': 'માંડવી',
};

// Convert a word using comprehensive mapping
function convertWordToGujarati(word) {
  if (!word) return '';

  const lowerWord = word.toLowerCase().trim();

  // Check for exact match in common patterns first
  if (commonNamePatterns[lowerWord]) {
    return commonNamePatterns[lowerWord];
  }

  // Check if it ends with 'bhai' and we have a pattern
  if (lowerWord.endsWith('bhai')) {
    const baseName = lowerWord.slice(0, -4);
    if (commonNamePatterns[baseName]) {
      return commonNamePatterns[baseName] + 'ભાઈ';
    }
  }

  let result = '';
  let i = 0;

  while (i < word.length) {
    let found = false;

    // Check for 3-character clusters
    if (i < word.length - 2) {
      const threeChar = word.substr(i, 3).toLowerCase();
      if (consonantMappings[threeChar]) {
        result += consonantMappings[threeChar];
        i += 3;
        found = true;
        continue;
      }
    }

    // Check for 2-character clusters
    if (i < word.length - 1) {
      const twoChar = word.substr(i, 2).toLowerCase();
      if (consonantMappings[twoChar]) {
        result += consonantMappings[twoChar];
        i += 2;
        found = true;
        continue;
      }
    }

    // Single character conversion
    if (!found) {
      const char = word[i];

      // Check consonant
      if (consonantMappings[char]) {
        result += consonantMappings[char];
      }
      // Check vowel
      else if (vowelMappings[char]) {
        result += vowelMappings[char];
      }
      // Keep as is
      else {
        result += char;
      }
      i++;
    }
  }

  return result;
}

// Convert full name to Gujarati
export function convertNameToGujarati(name) {
  if (!name) return '';

  // Split name into words
  const words = name.trim().split(/\s+/);

  // If the name already contains Gujarati characters, return as is
  // Gujarati Unicode Range: 0A80–0AFF
  if (/[\u0A80-\u0AFF]/.test(name)) {
    return name.trim();
  }

  // Convert each word
  const convertedWords = words.map(word => convertWordToGujarati(word));

  return convertedWords.join(' ');
}

// Convert full name with surname (Dholakiya family format)
export function convertFullNameToGujarati(firstName, fatherName, surname = 'Dholakiya') {
  const gujaratiSurname = 'ધોળકિયા';
  const gujaratiFirstName = convertNameToGujarati(firstName);
  const gujaratiFatherName = convertNameToGujarati(fatherName);

  // Use the surname parameter if it's different from default
  const finalSurname = surname && surname.toLowerCase() !== 'dholakiya'
    ? convertNameToGujarati(surname)
    : gujaratiSurname;

  return `${finalSurname} ${gujaratiFirstName} ${gujaratiFatherName}`.trim();
}

// Convert village name to Gujarati
export function convertVillageToGujarati(village) {
  if (!village) return '';

  const lowerVillage = village.toLowerCase().trim();

  // Check for exact match
  if (commonNamePatterns[lowerVillage]) {
    return commonNamePatterns[lowerVillage];
  }

  // Try to convert
  return convertNameToGujarati(village);
}

// Default export
export default {
  convertNameToGujarati,
  convertFullNameToGujarati,
  convertVillageToGujarati
};
