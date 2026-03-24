/**
 * Map NDI verified data to application form fields (resilient to missing data)
 * Based on Bhutan NDI Technical Documentation v1.2
 */

// lib/ndiRole.ts
export const getRoleFromStep = (step: string | null) => {
  switch (step) {
    case "1":
      return "applicant";
    case "2":
      return "co-applicant";
    case "3":
    case "4":
      return "guarantor";
    default:
      return "applicant";
  }
};

import { getNDIDataByRef } from './indexDB';
import { NDICredential } from './ndiService';
/**
 * Map text labels to their corresponding codes for dropdown values
 * Smart mapping that handles both codes and labels
 */
function mapLabelToCode(label: string, type: string): string {
  if (!label) return '';
  
  const cleaned = String(label).trim();
  if (!cleaned) return '';
  
  const labelLower = cleaned.toLowerCase();
  
  console.log(`mapLabelToCode - Input: "${label}", Type: "${type}", Cleaned: "${cleaned}"`);
  
  // Gender mappings - MOST IMPORTANT, exact matching first
  if (type === 'gender') {
    if (labelLower === 'male' || labelLower === 'm') return 'male';
    if (labelLower === 'female' || labelLower === 'f') return 'female';
    if (labelLower === 'other') return 'other';
    return cleaned; // Fallback
  }
 
  // Nationality mappings
  if (type === 'nationality') {
    if (labelLower.includes('bhutan')) return cleaned;
    if (labelLower.includes('indian') || labelLower.includes('india')) return cleaned;
    if (labelLower.includes('nepali') || labelLower.includes('nepal')) return cleaned;
    if (labelLower.includes('bangladeshi') || labelLower.includes('bangladesh')) return cleaned;
    return cleaned; // Fallback
  }
  
  // Identification Type mappings
  if (type === 'identificationType') {
    if (labelLower.includes('citizenship') || labelLower === 'cid') return cleaned;
    if (labelLower.includes('work') || labelLower.includes('permit')) return cleaned;
    if (labelLower === 'passport') return cleaned;
    return cleaned; // Fallback
  }
 

// Inside mapLabelToCode
if (type === 'nationality') {
    const val = labelLower;
    if (val.includes('bhutan')) return 'Bhutan';
    if (val.includes('india')) return 'India';
    if (val.includes('nepal')) return 'Nepal';
    if (val.includes('bangladesh')) return 'Bangladesh';
    return label;
}
 
  
  // Default: return cleaned value as-is
  console.log(`No mapping found for ${type}: "${cleaned}", returning as-is`);
  return cleaned;
}

  export interface PersonalDetailFormData {
    salutation?: string;
    applicantName?: string;
    nationality?: string;
    identificationType?: string;
    identificationNo?: string;
    dateOfBirth?: string;
    gender?: string;
    maritalStatus?: string;
    fatherName?: string;
    motherName?: string;
    spouseName?: string;

    currEmail?: string;
    currContact?: string;
    // currTelephoneNo?: string;

    permCountry?: string;
    permDzongkhag?: string;
    permGewog?: string;
    permVillage?: string;
    permHouse?: string;
    permThram?: string;

    currCountry?: string;
    currDzongkhag?: string;
    currGewog?: string;
    currVillage?: string;
    currHouseNo?: string;
    currThram?: string;

    [key: string]: any;
  }

  /** Sample dropdown lists */
  const COUNTRIES = ['Bhutan'];
  const DZONGKHAGS = ['Thimphu', 'Paro', 'Punakha', 'Dagana']; // Add all dzongkhags
  const GEWOGS: Record<string, string[]> = {
    Thimphu: ['Kawang', 'Chang'],
    Dagana: ['Kana', 'Tashiding'],
    // add other dzongkhag -> gewogs
  };

  /** Normalize string for dropdown matching */
  function normalize(value?: string) {
    return value?.trim().toLowerCase();
  }

  /** Match a value against options (case-insensitive) */
  function matchDropdown(options: string[], value?: string): string {
    if (!value) return '';
    return options.find(opt => normalize(opt) === normalize(value)) || '';
  }

  /** Format DD/MM/YYYY to ISO */
  function formatDateToISO(date?: string): string {
    if (!date) return '';
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [, dd, mm, yyyy] = match;
      return `${yyyy}-${mm}-${dd}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    return '';
  }

  /** Determine salutation from gender */
  function determineSalutation(gender?: string): string {
    if (!gender) return '';
    const g = gender.toLowerCase();
    if (g === 'male' || g === 'm') return 'mr';
    if (g === 'female' || g === 'f') return 'ms';
    return '';
  }

  /** Helper to pick value from multiple possible keys */
  function getValue(ndiData: any, ...keys: string[]): string | undefined {
    for (const key of keys) {
      if (ndiData[key] !== undefined && ndiData[key] !== null) {
        return ndiData[key];
      }

      // Try snake_case version automatically
      const snakeKey = key
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase();

      if (ndiData[snakeKey] !== undefined && ndiData[snakeKey] !== null) {
        return ndiData[snakeKey];
      }
    }
    return "";
  }

  /** Main mapping function */
  export function mapNdiDataToPersonalDetail(ndiData: any): PersonalDetailFormData {
    console.log("Mapping NDI data:", ndiData);
    console.log("Available keys in NDI data:", Object.keys(ndiData));
    const formData: PersonalDetailFormData = {};

    // Gender
    const genderRaw = getValue(ndiData, 'Gender');
    formData.gender = mapLabelToCode(genderRaw || '', 'gender');
    formData.salutation = determineSalutation(formData.gender);

    // Name
    formData.applicantName = getValue(ndiData, 'Full Name', 'Name');
    // const nameRaw = getValue(ndiData, 'Full Name', 'Name');
    // console.log("Raw name value from NDI data:", nameRaw);
    console.log('')
    console.log("Mapped applicant name:", formData.applicantName);

    // Nationality
      const nationalityRaw = getValue(ndiData, 'nationality', 'Citizenship');
      console.log("Raw nationality value from NDI data:", nationalityRaw);
      formData.nationality = mapLabelToCode(nationalityRaw || '', 'nationality');

    // Identification
    formData.identificationNo = getValue(
      ndiData,
      'citizenshipIdentificationNumber',
      'idNumber',
      'id_number',
      'ID Number'
    );

    
    const idTypeRaw = getValue(ndiData, 'idType', 'id_type');
    formData.identificationType = mapLabelToCode(idTypeRaw || '', 'identificationType');

    // Date of birth
    formData.dateOfBirth = formatDateToISO(
      getValue(ndiData, 'dateOfBirth', 'date_of_birth', 'dob', 'Date of Birth')
    );

    // console.log("Mobile from getValue:", getValue(ndiData, 'mobileNumber', 'mobile_number'));

    // Contact
    // formData.currContact = getValue(
    //   ndiData,
    //   'mobileNumber',
    //   'mobile_number',
    // );
    // console.log("Mapped mobile number:", formData.currContact);

    // formData.currEmail = getValue(
    //   ndiData,
    //   'email'
    // );
  //  formData.currContact = getValue(ndiData, 'mobileNumber', 'phone') || '';
  // formData.currEmail = getValue(ndiData, 'email') || '';

    // Permanent Address
    formData.permCountry = matchDropdown(COUNTRIES, getValue(ndiData, 'country'));
    formData.permDzongkhag = matchDropdown(
      DZONGKHAGS,
      getValue(ndiData, 'dzongkhag')
    );

    formData.permGewog = formData.permDzongkhag
      ? matchDropdown(
          GEWOGS[formData.permDzongkhag] || [],
          getValue(ndiData, 'gewog')
        )
      : '';


    formData.permVillage = getValue(ndiData, 'village');
    formData.permThram = getValue(ndiData, 'thramNumber', 'thram_number');
    formData.permHouse = getValue(ndiData, 'houseNumber', 'house_no');
    // Copy permanent to current if not present
    formData.currCountry = formData.permCountry;
    formData.currDzongkhag = formData.permDzongkhag;
    formData.currGewog = formData.permGewog;
    formData.currVillage = formData.permVillage;
    formData.currThram = formData.permThram;
    formData.currHouseNo = formData.permHouse;

    console.log("Mapped Form Data:", formData);



    // Co-borrower
       // Name
      //  console.log("Form data fields for co-borrower",formData.fields )
    formData.name = getValue(ndiData, 'Full Name', 'Name');
    const nameRaw = getValue(ndiData, 'Full Name', 'Name');
    console.log("Raw name value from NDI data:", nameRaw);
    console.log('')
    // console.log("Mapped co-borrower name:", formData.name);
    return formData;
  }

/**
 * Session storage helpers
 */
export function storeNdiDataInSession(ndiData: NDICredential): void {
  const mappedData = mapNdiDataToPersonalDetail(ndiData);
  sessionStorage.setItem('ndi_verified_data', JSON.stringify(ndiData));
  sessionStorage.setItem('verifiedCustomerData', JSON.stringify(mappedData));
  console.log('NDI data stored in session:', { raw: ndiData, mapped: mappedData });
}

export function getNdiDataFromSession(): PersonalDetailFormData | null {
  try {
    const mappedData = sessionStorage.getItem('verifiedCustomerData');
    if (mappedData) return JSON.parse(mappedData);

    const rawData = sessionStorage.getItem('ndi_verified_data');
    if (rawData) {
      const mapped = mapNdiDataToPersonalDetail(JSON.parse(rawData));
      sessionStorage.setItem('verifiedCustomerData', JSON.stringify(mapped));
      return mapped;
    }
  } catch (error) {
    console.error('Error retrieving NDI data from session:', error);
  }
  return null;
}

export function clearNdiDataFromSession(): void {
  sessionStorage.removeItem('ndi_verified_data');
  sessionStorage.removeItem('verifiedCustomerData');
}

export const loadNDIFromIndexedDBToSession = async (refId: string) => {
  try {
    console.log("🔍 Loading NDI data from IndexedDB...");

    const ndiIndexedData = await getNDIDataByRef(refId);

    if (!ndiIndexedData) {
      console.warn("⚠️ No NDI data found in IndexedDB");
      return null;
    }

    const rawData = ndiIndexedData?.data || ndiIndexedData;

    console.log("📦 Raw IndexedDB NDI:", rawData);

    // ✅ Map data
    const mappedData = mapNdiDataToPersonalDetail(rawData);

    // ✅ Store ONLY mapped data
    storeNdiDataInSession(mappedData);
    console.log("✅ Mapped NDI data stored in session:", mappedData);

    return mappedData;
  } catch (error) {
    console.error("❌ Failed to load from IndexedDB:", error);
    return null;
  }
};

export interface CoBorrowerFormData {
  name?: string;
  salutation?: string;
  nationality?: string;
  identificationType?: string;
  identificationNo?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;

  currEmail?: string;
  currContact?: string;

  permCountry?: string;
  permDzongkhag?: string;
  permGewog?: string;
  permVillage?: string;
  permHouse?: string;
  permThram?: string;

  currCountry?: string;
  currDzongkhag?: string;
  currGewog?: string;
  currVillage?: string;
  currHouseNo?: string;
  currThram?: string;

  isVerified?: boolean;
  verifiedFields?: string[];

}export interface CoBorrowerFormData {
  name?: string;
  salutation?: string;
  nationality?: string;
  identificationType?: string;
  identificationNo?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;

  currEmail?: string;
  currContact?: string;

  permCountry?: string;
  permDzongkhag?: string;
  permGewog?: string;
  permVillage?: string;
  permHouse?: string;
  permThram?: string;

  currCountry?: string;
  currDzongkhag?: string;
  currGewog?: string;
  currVillage?: string;
  currHouseNo?: string;
  currThram?: string;

  isVerified?: boolean;
  verifiedFields?: string[];
}

export function mapNdiDataToCoBorrower(ndiData: any) {
  console.log("Mapping NDI data for CoBorrower:", ndiData);

  return {
    name: getValue(ndiData, 'Full Name', 'Name'),
  
    
    nationality: mapLabelToCode(
      getValue(ndiData, 'nationality', 'Citizenship') || '',
      'nationality'
    ),

    gender: mapLabelToCode(
      getValue(ndiData, 'Gender') || '',
      'gender'
    ),

    dateOfBirth: formatDateToISO(
      getValue(ndiData, 'dateOfBirth', 'dob', 'Date of Birth')
    ),

    identificationNo: getValue(
      ndiData,
      'citizenshipIdentificationNumber',
      'ID Number'
    ),

    identificationType: mapLabelToCode(
      getValue(ndiData, 'idType', 'ID Type') || '',
      'identificationType'
    ),

    maritalStatus: '',

    // Contact
    currContact: getValue(ndiData, 'mobileNumber', 'phone'),
    currEmail: getValue(ndiData, 'email'),

    // Address (optional reuse)
    permCountry: 'Bhutan',
    permDzongkhag: getValue(ndiData, 'dzongkhag'),
    permGewog: getValue(ndiData, 'gewog'),

    isVerified: true,
  };
}


export interface SecurityFormData {
  name?: string;
  salutation?: string;
  nationality?: string;
  identificationType?: string;
  identificationNo?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;

  currEmail?: string;
  currContact?: string;

  permCountry?: string;
  permDzongkhag?: string;
  permGewog?: string;
  permVillage?: string;
  permHouse?: string;
  permThram?: string;

  currCountry?: string;
  currDzongkhag?: string;
  currGewog?: string;
  currVillage?: string;
  currHouseNo?: string;
  currThram?: string;

  isVerified?: boolean;
  verifiedFields?: string[];
}

export function mapNdiDataToSecurityGuarantor(ndiData: any) {
  console.log("Mapping NDI data for CoBorrower:", ndiData);

  return {
    name: getValue(ndiData, 'Full Name', 'Name'),
    
    nationality: mapLabelToCode(
      getValue(ndiData, 'nationality', 'Citizenship') || '',
      'nationality'
    ),

    gender: mapLabelToCode(
      getValue(ndiData, 'Gender') || '',
      'gender'
    ),

    dateOfBirth: formatDateToISO(
      getValue(ndiData, 'dateOfBirth', 'dob', 'Date of Birth')
    ),

    identificationNo: getValue(
      ndiData,
      'citizenshipIdentificationNumber',
      'ID Number'
    ),

    identificationType: mapLabelToCode(
      getValue(ndiData, 'idType', 'ID Type') || '',
      'identificationType'
    ),

    maritalStatus: '',

    // Contact
    currContact: getValue(ndiData, 'mobileNumber', 'phone'),
    currEmail: getValue(ndiData, 'email'),

    // Address (optional reuse)
    permCountry: 'Bhutan',
    permDzongkhag: getValue(ndiData, 'dzongkhag'),
    permGewog: getValue(ndiData, 'gewog'),

    isVerified: true,
  };
}

export interface RepaymentFormData {
  name?: string;
  salutation?: string;
  nationality?: string;
  identificationType?: string;
  identificationNo?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;

  currEmail?: string;
  currContact?: string;

  permCountry?: string;
  permDzongkhag?: string;
  permGewog?: string;
  permVillage?: string;
  permHouse?: string;
  permThram?: string;

  currCountry?: string;
  currDzongkhag?: string;
  currGewog?: string;
  currVillage?: string;
  currHouseNo?: string;
  currThram?: string;

  isVerified?: boolean;
  verifiedFields?: string[];
}

export function mapNdiDataToRepaymentGuarantor(ndiData: any) {
  console.log("Mapping NDI data for CoBorrower:", ndiData);

  return {
    name: getValue(ndiData, 'Full Name', 'Name'),
    
    nationality: mapLabelToCode(
      getValue(ndiData, 'nationality', 'Citizenship') || '',
      'nationality'
    ),

    gender: mapLabelToCode(
      getValue(ndiData, 'Gender') || '',
      'gender'
    ),

    dateOfBirth: formatDateToISO(
      getValue(ndiData, 'dateOfBirth', 'dob', 'Date of Birth')
    ),

    identificationNo: getValue(
      ndiData,
      'citizenshipIdentificationNumber',
      'ID Number'
    ),

    identificationType: mapLabelToCode(
      getValue(ndiData, 'idType', 'ID Type') || '',
      'identificationType'
    ),

    maritalStatus: '',

    // Contact
    currContact: getValue(ndiData, 'mobileNumber', 'phone'),
    currEmail: getValue(ndiData, 'email'),

    // Address (optional reuse)
    permCountry: 'Bhutan',
    permDzongkhag: getValue(ndiData, 'dzongkhag'),
    permGewog: getValue(ndiData, 'gewog'),

    isVerified: true,
  };
}

