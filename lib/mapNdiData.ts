/**
 * Map NDI verified data to application form fields
 * Based on Bhutan NDI Technical Documentation v1.2
 */

import { NDICredential } from './ndiService';

export interface PersonalDetailFormData {
  // Basic Information
  salutation?: string;
  applicantName?: string;
  nationality?: string;
  identificationType?: string;
  identificationNo?: string;
  identificationIssueDate?: string;
  identificationExpiryDate?: string;
  tpn?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  
  // Contact Information
  currEmail?: string;
  currMobileNo?: string;
  currTelephoneNo?: string;
  
  // Permanent Address
  permCountry?: string;
  permDzongkhag?: string;
  permGewog?: string;
  permVillage?: string;
  permThram?: string;
  permHouseNo?: string;
  permPostalCode?: string;
  
  // Current Address
  currCountry?: string;
  currDzongkhag?: string;
  currGewog?: string;
  currVillage?: string;
  currThram?: string;
  currHouseNo?: string;
  currPostalCode?: string;
  
  [key: string]: any;
}

/**
 * Extract CID number from the full CID string
 * Example: "11234567890123 (CID)" -> "11234567890123"
 */
function extractCID(cidString?: string): string {
  if (!cidString) return '';
  // Remove any text in parentheses and trim
  return cidString.replace(/\s*\([^)]*\)\s*/g, '').trim();
}

/**
 * Format date from NDI format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
 */
function formatDateToISO(dateString?: string): string {
  if (!dateString) return '';
  
  // Try DD/MM/YYYY format
  const ddmmyyyyMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month}-${day}`;
  }
  
  // Try YYYY-MM-DD format (already ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  return '';
}

/**
 * Determine salutation from gender
 */
function determineSalutation(gender?: string): string {
  if (!gender) return '';
  const normalizedGender = gender.toLowerCase();
  if (normalizedGender === 'male' || normalizedGender === 'm') {
    return 'mr';
  }
  if (normalizedGender === 'female' || normalizedGender === 'f') {
    return 'ms';
  }
  return '';
}

/**
 * Parse address components from NDI address string
 * Example: "Thimphu, Kawang, Kawang" -> { dzongkhag: 'Thimphu', gewog: 'Kawang', village: 'Kawang' }
 */
function parseAddress(addressString?: string): {
  dzongkhag?: string;
  gewog?: string;
  village?: string;
} {
  if (!addressString) return {};
  
  const parts = addressString.split(',').map(s => s.trim()).filter(s => s);
  
  return {
    dzongkhag: parts[0] || '',
    gewog: parts[1] || '',
    village: parts[2] || parts[1] || '', // Use gewog as village if village not provided
  };
}

/**
 * Map NDI credential data to Personal Detail form structure
 */
export function mapNdiDataToPersonalDetail(ndiData: NDICredential): PersonalDetailFormData {
  const formData: PersonalDetailFormData = {};
  
  // NDI can return attributes in different formats:
  // 1. Standard camelCase (citizenshipIdentificationNumber, fullName)
  // 2. Title Case with spaces (Full Name, Date of Birth, ID Number)
  // We need to handle both formats
  
  // Helper to get value by multiple possible keys
  const getValue = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      if (ndiData[key]) return ndiData[key];
    }
    return undefined;
  };
  
  // Basic Information
  const gender = getValue('gender', 'Gender');
  if (gender) {
    formData.salutation = determineSalutation(gender);
    formData.gender = gender.toLowerCase() === 'male' || gender.toLowerCase() === 'm' ? 'male' : 
                      gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f' ? 'female' : 
                      gender;
  }
  
  const fullName = getValue('fullName', 'Full Name', 'name');
  if (fullName) {
    formData.applicantName = fullName;
  }
  
  const nationality = getValue('nationality', 'Nationality', 'Citizenship', 'citizenship');
  if (nationality) {
    formData.nationality = nationality;
  }
  
  // Identification Information
  const cidNumber = getValue('citizenshipIdentificationNumber', 'ID Number', 'idNumber', 'CID', 'cid');
  if (cidNumber) {
    formData.identificationNo = extractCID(cidNumber);
    // Check ID Type to determine identification type
    const idType = getValue('idType', 'ID Type', 'identificationType');
    if (idType && idType.toLowerCase().includes('cid')) {
      formData.identificationType = 'cid';
    } else if (idType && idType.toLowerCase().includes('passport')) {
      formData.identificationType = 'passport';
    } else {
      // Default to CID for Bhutan NDI
      formData.identificationType = 'cid';
    }
  }
  
  // Date of Birth
  const dob = getValue('dateOfBirth', 'Date of Birth', 'dob', 'DOB');
  if (dob) {
    formData.dateOfBirth = formatDateToISO(dob);
  }
  
  // Family Information
  const fatherName = getValue('fatherName', 'Father Name', 'father');
  if (fatherName) {
    formData.fatherName = fatherName;
  }
  
  const motherName = getValue('motherName', 'Mother Name', 'mother');
  if (motherName) {
    formData.motherName = motherName;
  }
  
  const spouseName = getValue('spouseName', 'Spouse Name', 'spouse');
  if (spouseName) {
    formData.spouseName = spouseName;
    // If spouse name exists, assume married
    formData.maritalStatus = 'married';
  }
  
  // Contact Information
  const mobileNumber = getValue('mobileNumber', 'Mobile Number', 'mobile', 'phone');
  if (mobileNumber) {
    formData.currMobileNo = mobileNumber;
  }
  
  const email = getValue('email', 'Email', 'Email Address');
  if (email) {
    formData.currEmail = email;
  }
  
  // Permanent Address
  const permanentAddress = getValue('permanentAddress', 'Permanent Address');
  if (permanentAddress) {
    const permAddress = parseAddress(permanentAddress);
    formData.permDzongkhag = permAddress.dzongkhag;
    formData.permGewog = permAddress.gewog;
    formData.permVillage = permAddress.village;
    formData.permCountry = 'Bhutan'; // Default for Bhutan NDI
  } else {
    // Try individual fields if available
    const dzongkhag = getValue('dzongkhag', 'Dzongkhag');
    if (dzongkhag) {
      formData.permDzongkhag = dzongkhag;
    }
    const gewog = getValue('gewog', 'Gewog');
    if (gewog) {
      formData.permGewog = gewog;
    }
    const village = getValue('village', 'Village');
    if (village) {
      formData.permVillage = village;
    }
    const houseNumber = getValue('houseNumber', 'House Number');
    if (houseNumber) {
      formData.permHouseNo = houseNumber;
    }
  }
  
  // Current Address (default to same as permanent)
  const presentAddress = getValue('presentAddress', 'Present Address', 'currentAddress', 'Current Address');
  if (presentAddress) {
    const currAddress = parseAddress(presentAddress);
    formData.currDzongkhag = currAddress.dzongkhag;
    formData.currGewog = currAddress.gewog;
    formData.currVillage = currAddress.village;
    formData.currCountry = 'Bhutan'; // Default for Bhutan NDI
  } else {
    // If no present address, copy permanent address
    formData.currDzongkhag = formData.permDzongkhag;
    formData.currGewog = formData.permGewog;
    formData.currVillage = formData.permVillage;
    formData.currHouseNo = formData.permHouseNo;
    formData.currCountry = formData.permCountry;
  }
  
  return formData;
}

/**
 * Store mapped NDI data in session storage
 */
export function storeNdiDataInSession(ndiData: NDICredential): void {
  const mappedData = mapNdiDataToPersonalDetail(ndiData);
  
  // Store both raw and mapped data
  sessionStorage.setItem('ndi_verified_data', JSON.stringify(ndiData));
  sessionStorage.setItem('ndi_mapped_personal_details', JSON.stringify(mappedData));
  
  console.log('NDI data stored in session:', {
    raw: ndiData,
    mapped: mappedData
  });
}

/**
 * Retrieve mapped NDI data from session storage
 */
export function getNdiDataFromSession(): PersonalDetailFormData | null {
  try {
    const mappedData = sessionStorage.getItem('ndi_mapped_personal_details');
    if (mappedData) {
      return JSON.parse(mappedData);
    }
    
    // Fallback: try to map from raw data
    const rawData = sessionStorage.getItem('ndi_verified_data');
    if (rawData) {
      const ndiData: NDICredential = JSON.parse(rawData);
      const mapped = mapNdiDataToPersonalDetail(ndiData);
      // Store it for next time
      sessionStorage.setItem('ndi_mapped_personal_details', JSON.stringify(mapped));
      return mapped;
    }
  } catch (error) {
    console.error('Error retrieving NDI data from session:', error);
  }
  
  return null;
}

/**
 * Clear NDI data from session storage
 */
export function clearNdiDataFromSession(): void {
  sessionStorage.removeItem('ndi_verified_data');
  sessionStorage.removeItem('ndi_mapped_personal_details');
}
