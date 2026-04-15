/**
 * Mapper utility to convert customer API response to form-compatible data
 */

export interface CustomerApiResponse {
  success: boolean;
  data: {
    success?: boolean;
    data?: {
      personal?: {
        party_id?: string;
        party_type?: string;
        party_name?: string;
        party_gender?: any;        // Can be string or object
        party_nationality?: any;    // Can be string or object
        party_identity_type?: any;  // Can be string or object
        party_identity_no?: string;
        party_identity_issued_date?: string;
        party_identity_expiry_date?: string;
        party_date_of_birth?: string;
        party_marital_status?: any; // Can be string or object
        party_bank_name?: any;      // Can be string or object
        party_bank_account_no?: string;
        party_tpn_number?: string;
        party_householder_number?: string;          // ADDED
        party_tax_identifier_type?: any;            // ADDED
        party_tax_identifier_no?: string | null;    // ADDED
        party_identity_proof?: string;               // ADDED
        party_photo_size?: string;                    // ADDED
        party_family_tree?: string;                   // ADDED
        party_related_declaration?: string;           // ADDED
        party_business_estab_date?: string | null;    // ADDED
        party_business_type?: string | null;          // ADDED
        party_business_inds_type?: string | null;     // ADDED
      };
      address?: {
        Bhutanese_Permanent_address?: {
          pty_adr_id?: string;
          pty_adr_permanent_country?: any;
          pty_adr_permanent_dzongkhag?: any;
          pty_adr_permanent_gewog?: any;
          pty_adr_permanent_street?: string;
          pty_adr_thram_no?: string;
          pty_adr_house_no?: string;
        };
        Other_Permanent_address?: {
          pty_adr_permanent_state?: string;
          pty_adr_permanent_province?: string;
          pty_adr_permanent_street?: string;
        };
        resident_address?: {
          pty_adr_resident_country?: any;
          pty_adr_resident_dzongkhag?: any;
          pty_adr_resident_gewog?: any;
          pty_adr_resident_street?: string;
          pty_adr_line_1?: string;
          pty_adr_thram_no?: string;
          pty_adr_house_no?: string;
        };
      };
      contact?: {
        pty_ctc_id?: string;
        pty_ctc_contact_no?: string;
        pty_ctc_alternate_contact_no?: string;
        pty_ctc_email_id?: string;
      };
      employment?: {
        pty_empl_id?: string;
        pty_empl_occupation?: any;
        pty_empl_employer_type?: any;
        pty_empl_type?: any;                         // ADDED
        pty_empl_organization_name?: string;
        pty_empl_organization_loc?: string;
        pty_empl_employee_id?: string;
        pty_empl_nature_of_service?: string;
        pty_empl_appointment_date?: string | null;
        pty_empl_designation?: string;
        pty_empl_grade?: string;
        pty_empl_contract_end_date?: string | null;  // ADDED
        pty_empl_annual_income?: string;
      };
      associate?: {
        asso_pty_id?: string;
        asso_associate_party_id?: string;
        asso_relationship_type?: any;                 // ADDED
      };
      pep?: {
        pep_id?: string;
        pep_party_id?: string;
        pep_declaration_type?: string | null;
        pep_category?: any;
        pep_sub_category?: any | null;
        related_to_any_pep?: string;
      };
    };
  };
}

export interface MappedFormData {
  // Personal Information
  salutation?: string;
  fullName?: string;
  applicantName?: string; // Form alias
  dateOfBirth?: string;
  gender?: string;
  idNumber?: string;
  identificationNo?: string; // Form alias
  idType?: string;
  identificationType?: string; // Form alias
  identityIssuedDate?: string;
  identificationIssueDate?: string; // Form alias
  identityExpiryDate?: string;
  identificationExpiryDate?: string; // Form alias
  maritalStatus?: string;
  nationality?: string;
  bankName?: string;
  bankAccount?: string; // Form alias
  bankAccountNo?: string;
  tpnNumber?: string;
  tpn?: string; // Form alias
  partyId?: string;

  // ADDED: household number (for Bhutanese)
  householdNumber?: string;

  // ADDED: tax identifier type (label)
  taxIdentifierType?: string;

  // ADDED: file names for identity proof, passport photo, family tree
  identityProofName?: string;
  passportPhotoName?: string;
  familyTreeName?: string;

  // Contact Information
  phone?: string;
  contactNo?: string; // Form alias
  email?: string;
  emailId?: string; // Form alias
  alternatePhone?: string;
  alternateContactNo?: string; // Form alias
  currContact?: string; // Form uses currContact for current contact
  currEmail?: string; // Form uses currEmail for current email

  // Permanent Address
  permanentCountry?: string;
  permCountry?: string; // Form alias
  permanentDzongkhag?: string;
  permDzongkhag?: string; // Form alias
  permanentGewog?: string;
  permGewog?: string; // Form alias
  permanentStreet?: string;
  permStreet?: string; // Form alias
  permVillage?: string; // Form uses permVillage for Village/Street
  thramNo?: string;
  permThram?: string; // Form uses permThram
  houseNo?: string;
  permHouse?: string; // Form uses permHouse

  // Current/Resident Address
  currentCountry?: string;
  currCountry?: string; // Form alias
  currentDzongkhag?: string;
  currDzongkhag?: string; // Form alias
  currentGewog?: string;
  currGewog?: string; // Form alias
  currentStreet?: string;
  currStreet?: string; // Form alias
  currVillage?: string; // Form uses currVillage for Village/Street
  currentBuildingNo?: string;
  currBuildingNo?: string; // Form alias
  currFlat?: string; // Form uses currFlat for Flat/Building No
  currThram?: string; // Form uses currThram for current address thram
  currHouse?: string; // Form uses currHouse for current address house number

  // Employment Information
  occupation?: string;
  employerType?: string;
  organizationType?: string; // Form alias
  employerName?: string;
  organizationName?: string; // Form alias
  employerLocation?: string;
  organizationLocation?: string; // Form alias
  orgLocation?: string; // Form uses orgLocation
  employeeId?: string;
  serviceNature?: string;
  natureOfService?: string; // Form alias
  appointmentDate?: string;
  joiningDate?: string; // Form uses joiningDate
  designation?: string;
  grade?: string;
  annualIncome?: string;
  annualSalary?: string; // Form uses annualSalary
  contractEndDate?: string; // ADDED

  // PEP Information
  pepDeclaration?: string;
  pepPerson?: string; // Form alias for PEP status (yes/no)
  pepCategory?: string;
  pepSubCategory?: string | null;
  relatedToAnyPep?: string;
  pepRelated?: string; // Form alias for related to PEP (yes/no)



  // Co-borrower
  name?:string;
  // conationality?:string;
  // Metadata
  isVerified?: boolean;
  verifiedFields?: string[];
}

/**
 * Safely extract a string from an API field that may be:
 * - a primitive string
 * - an object with common label keys (value, name, label, íd)
 * - null/undefined
 */
function getStringValue(value: any, preferredKey?: string): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    // If a preferred key is given, try it first
    if (preferredKey && value[preferredKey] && typeof value[preferredKey] === 'string') {
      return value[preferredKey].trim();
    }
    // Common label keys in order of priority
    const keys = ['value', 'name', 'label', 'íd'];
    for (const key of keys) {
      if (value[key] && typeof value[key] === 'string') {
        return value[key].trim();
      }
    }
    // Fallback: convert to string (should rarely happen)
    return String(value);
  }
  return '';
}

/**
 * Safely extract value from object by trying multiple possible field names.
 * Now uses getStringValue to handle objects.
 */
function extractField(obj: any, ...fieldNames: string[]): string {
  for (const fieldName of fieldNames) {
    const value = obj?.[fieldName];
    if (value !== null && value !== undefined) {
      const strValue = getStringValue(value);
      if (strValue) {
        return strValue;
      }
    }
  }
  return '';
}

/**
 * Safely format date from YYYY-MM-DD to input-compatible format
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    // Already in YYYY-MM-DD format, just validate and return
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return dateString.split('T')[0]; // Remove time if present
  } catch {
    return '';
  }
}

/**
 * Safely get nested value with optional chaining
 */
function safeGet(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

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

  // Gender mappings - normalize abbreviations only
  if (type === 'gender') {
    if (labelLower === 'm') return 'male';
    if (labelLower === 'f') return 'female';
    // Keep original API values (should already be 'male', 'female', 'other')
    return cleaned.toLowerCase(); // Ensure lowercase for consistency
  }

  // Marital Status mappings - preserve exact API values, normalize common aliases
  if (type === 'maritalStatus') {
    if (labelLower === 'unmarried') return 'single';
    // Keep original API values for standard statuses
    return cleaned.toLowerCase(); // Ensure lowercase for consistency
  }

  // Nationality mappings - preserve exact API values, only normalize codes
  if (type === 'nationality') {
    if (labelLower === 'bt' || labelLower === 'bhu') return 'Bhutanese';
    if (labelLower === 'in') return 'Indian';
    if (labelLower === 'np') return 'Nepali';
    if (labelLower === 'bd') return 'Bangladeshi';
    // Keep original API value for full names
    return cleaned;
  }

  // Country mappings (for addresses) - preserve exact API values, only normalize codes
  if (type === 'country') {
    if (labelLower === 'bt' || labelLower === 'btn') return 'Bhutan';
    if (labelLower === 'in') return 'India';
    if (labelLower === 'np') return 'Nepal';
    if (labelLower === 'bd') return 'Bangladesh';
    // Keep original API value for full country names
    return cleaned;
  }

  // Identification Type mappings - preserve exact API values
  if (type === 'identificationType') {
    // Only normalize common abbreviations, otherwise keep original
    if (labelLower === 'cid') return 'Citizenship Identification';
    // For everything else, return the original value as-is
    return cleaned;
  }

  // Bank Name mappings - preserve exact API values, only normalize abbreviations
  if (type === 'bankName') {
    if (labelLower === 'bob') return 'Bank of Bhutan Limited';
    if (labelLower === 'bnb') return 'Bhutan National Bank Limited';
    if (labelLower === 'dpnb') return 'Druk PNB Bank Limited';
    if (labelLower === 'tbank') return 'T Bank Limited';
    // Keep original API value for full bank names
    return cleaned;
  }

  // Salutation mappings - remove periods and normalize to lowercase
  if (type === 'salutation') {
    // Remove periods and convert to lowercase
    return cleaned.replace(/\./g, '').toLowerCase();
  }

  // Default: return cleaned value as-is (preserve original for dropdown matching)
  console.log(`⚠️ No specific mapping for ${type}: "${cleaned}", returning: "${cleaned}"`);
  return cleaned;
}

/**
 * Normalize employer type to match form dropdown values: government, private, corporate
 */
function normalizeEmployerType(value: string): string {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();

  console.log(`🏢 normalizeEmployerType - Input: "${value}", Normalized: "${normalized}"`);

  // Map common variations to form values
  if (normalized.includes('government') || normalized.includes('govt')) {
    console.log(`  → Matched: government`);
    return 'government';
  }
  if (normalized.includes('private')) {
    console.log(`  → Matched: private`);
    return 'private';
  }
  if (normalized.includes('corporate') || normalized.includes('corp')) {
    console.log(`  → Matched: corporate`);
    return 'corporate';
  }

  console.log(`  → No match, returning: "${value.trim()}"`);
  // Keep original value if no match
  return value.trim();
}

/**
 * Normalize designation to match form dropdown values: manager, officer, assistant
 */
function normalizeDesignation(value: string): string {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();

  // Map common variations to form values
  if (normalized.includes('manager') || normalized.includes('mgr')) return 'manager';
  if (normalized.includes('officer')) return 'officer';
  if (normalized.includes('assistant') || normalized.includes('asst')) return 'assistant';

  // Keep original value if no match - user can see API value
  return value.trim();
}

/**
 * Normalize grade to match form dropdown values: 1-11, p1, p2, p3
 */
function normalizeGrade(value: string): string {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();

  // Remove "grade" prefix if present (e.g., "Grade 11" -> "11")
  const withoutPrefix = normalized.replace(/^grade\s*/i, '');

  // If it's a valid numeric grade (1-11), return it
  const numericGrade = parseInt(withoutPrefix, 10);
  if (!isNaN(numericGrade) && numericGrade >= 1 && numericGrade <= 11) {
    return String(numericGrade);
  }

  // Handle p-grades
  if (normalized === 'p1' || normalized === 'p-1') return 'p1';
  if (normalized === 'p2' || normalized === 'p-2') return 'p2';
  if (normalized === 'p3' || normalized === 'p-3') return 'p3';

  return withoutPrefix; // Return cleaned value
}

/**
 * Normalize service nature to match form dropdown values: permanent, contract, temporary
 */
function normalizeServiceNature(value: string): string {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();

  // Map common variations to form values
  if (normalized.includes('permanent') || normalized.includes('perm')) return 'permanent';
  if (normalized.includes('contract')) return 'contract';
  if (normalized.includes('temporary') || normalized.includes('temp')) return 'temporary';
  if (normalized.includes('regular')) return 'permanent'; // Regular service is typically permanent

  return normalized; // Return as-is if no match (form will show placeholder)
}

/**
 * Extract salutation prefix from full name (e.g., "Mr Thinley Gyeltshen" -> "mr")
 * If API provides party_salutation, use that; otherwise extract from name
 */
function extractSalutation(fullName: string, apiSalutation?: string): string {
  // If API provides salutation, use it
  if (apiSalutation) {
    return mapLabelToCode(apiSalutation, 'salutation');
  }

  // Otherwise, try to extract from the beginning of the name
  if (!fullName) return '';

  const nameLower = fullName.toLowerCase();

  if (nameLower.startsWith('mr')) return 'mr';
  if (nameLower.startsWith('mrs')) return 'mrs';
  if (nameLower.startsWith('ms')) return 'ms';
  if (nameLower.startsWith('dr')) return 'dr';

  return ''; // No salutation found
}

/**
 * Extract the actual name without salutation prefix
 */
function extractNameWithoutSalutation(fullName: string): string {
  if (!fullName) return '';

  const trimmed = fullName.trim();

  // Remove common salutation prefixes (case-insensitive, with or without period)
  const withoutSalutation = trimmed
    .replace(/^(Mr\.?|Mrs\.?|Ms\.?|Miss|Dr\.?)\s+/i, '')
    .trim();

  // Always return something - prefer name without salutation, fallback to original
  const result = withoutSalutation || trimmed;
  console.log(`extractNameWithoutSalutation: "${fullName}" -> "${result}"`);
  return result;
}

/**
 * Map customer API response to form-compatible data structure
 */
export function mapCustomerDataToForm(response: CustomerApiResponse): MappedFormData {
  console.log('mapCustomerDataToForm - Input response:', response);

  // Handle nested data structure (data.data.data)
  const customerData = response?.data?.data || response?.data;

  if (!customerData) {
    console.warn('mapCustomerDataToForm - No customer data found');
    return { isVerified: false, verifiedFields: [] };
  }

  const { personal, address, contact, employment, pep } = customerData as any;

  // Determine which permanent address object exists (Bhutanese or Other)
  const permAddress = address?.Bhutanese_Permanent_address || address?.Other_Permanent_address || {};
  const resident = address?.resident_address || {};

  // Permanent dzongkhag/gewog: label is in 'íd', code in 'value'
  const permDzongkhagObj = permAddress?.pty_adr_permanent_dzongkhag;
  const permGewogObj = permAddress?.pty_adr_permanent_gewog;

  const mappedData: MappedFormData = {
    // Personal Information
    salutation: extractSalutation(personal?.party_name || '', getStringValue(personal?.party_salutation, 'value')),
    fullName: extractNameWithoutSalutation(personal?.party_name || ''),
    applicantName: extractNameWithoutSalutation(personal?.party_name || ''),
    dateOfBirth: formatDate(personal?.party_date_of_birth),
    gender: mapLabelToCode(getStringValue(personal?.party_gender, 'value'), 'gender'),
    idNumber: personal?.party_identity_no || '',
    identificationNo: personal?.party_identity_no || '',
    idType: mapLabelToCode(getStringValue(personal?.party_identity_type, 'value'), 'identificationType'),
    identificationType: mapLabelToCode(getStringValue(personal?.party_identity_type, 'value'), 'identificationType'),
    identityIssuedDate: formatDate(personal?.party_identity_issued_date),
    identificationIssueDate: formatDate(personal?.party_identity_issued_date),
    identityExpiryDate: formatDate(personal?.party_identity_expiry_date),
    identificationExpiryDate: formatDate(personal?.party_identity_expiry_date),
    maritalStatus: mapLabelToCode(getStringValue(personal?.party_marital_status, 'value'), 'maritalStatus'),
    nationality: mapLabelToCode(getStringValue(personal?.party_nationality, 'value'), 'nationality'),
    bankName: mapLabelToCode(getStringValue(personal?.party_bank_name, 'value'), 'bankName'),
    bankAccount: personal?.party_bank_account_no || '',
    bankAccountNo: personal?.party_bank_account_no || '',
    tpnNumber: personal?.party_tax_identifier_no || '',
    tpn: personal?.party_tax_identifier_no || '',
    partyId: personal?.party_id || '',
    // NEW FIELDS
    householdNumber: personal?.party_householder_number || '',
    taxIdentifierType: getStringValue(personal?.party_tax_identifier_type, 'value'),
    identityProofName: personal?.party_identity_proof || '',
    passportPhotoName: personal?.party_photo_size || '',
    familyTreeName: personal?.party_family_tree || '',

    // Contact Information
    phone: extractField(contact, 'pty_ctc_contact_no'),
    contactNo: extractField(contact, 'pty_ctc_contact_no'),
    email: extractField(contact, 'pty_ctc_email_id'),
    emailId: extractField(contact, 'pty_ctc_email_id'),
    alternatePhone: extractField(contact, 'pty_ctc_alternate_contact_no'),
    alternateContactNo: extractField(contact, 'pty_ctc_alternate_contact_no'),
    currContact: extractField(contact, 'pty_ctc_contact_no'),
    currEmail: extractField(contact, 'pty_ctc_email_id'),

    // Permanent Address
    permanentCountry: mapLabelToCode(getStringValue(permAddress?.pty_adr_permanent_country, 'value'), 'country'),
    permCountry: mapLabelToCode(getStringValue(permAddress?.pty_adr_permanent_country, 'value'), 'country'),
    permanentDzongkhag: getStringValue(permDzongkhagObj, 'íd'), // label from 'íd'
    permDzongkhag: getStringValue(permDzongkhagObj, 'íd'),
    permanentGewog: getStringValue(permGewogObj, 'íd'),
    permGewog: getStringValue(permGewogObj, 'íd'),
    permanentStreet: extractField(permAddress, 'pty_adr_permanent_street'),
    permStreet: extractField(permAddress, 'pty_adr_permanent_street'),
    permVillage: extractField(permAddress, 'pty_adr_permanent_street'),
    thramNo: extractField(permAddress, 'pty_adr_thram_no'),
    permThram: extractField(permAddress, 'pty_adr_thram_no'),
    houseNo: extractField(permAddress, 'pty_adr_house_no'),
    permHouse: extractField(permAddress, 'pty_adr_house_no'),

    // Current/Resident Address
    currentCountry: mapLabelToCode(getStringValue(resident?.pty_adr_resident_country, 'value'), 'country'),
    currCountry: mapLabelToCode(getStringValue(resident?.pty_adr_resident_country, 'value'), 'country'),
    currentDzongkhag: getStringValue(resident?.pty_adr_resident_dzongkhag, 'value'), // label from 'value'
    currDzongkhag: getStringValue(resident?.pty_adr_resident_dzongkhag, 'value'),
    currentGewog: getStringValue(resident?.pty_adr_resident_gewog, 'value'),
    currGewog: getStringValue(resident?.pty_adr_resident_gewog, 'value'),
    currentStreet: extractField(resident, 'pty_adr_resident_street'),
    currStreet: extractField(resident, 'pty_adr_resident_street'),
    currVillage: extractField(resident, 'pty_adr_resident_street'),
    currentBuildingNo: extractField(resident, 'pty_adr_line_1', 'pty_adr_resident_building_no'),
    currBuildingNo: extractField(resident, 'pty_adr_line_1', 'pty_adr_resident_building_no'),
    currFlat: extractField(resident, 'pty_adr_line_1', 'pty_adr_resident_building_no'),
    currThram: extractField(resident, 'pty_adr_thram_no') || '',
    currHouse: extractField(resident, 'pty_adr_house_no') || '',

    // Employment Information
    occupation: getStringValue(employment?.pty_empl_occupation, 'value'),
    employerType: normalizeEmployerType(getStringValue(employment?.pty_empl_employer_type, 'value')),
    organizationType: normalizeEmployerType(getStringValue(employment?.pty_empl_employer_type, 'value')),
    employerName: extractField(employment, 'pty_empl_organization_name'),
    organizationName: extractField(employment, 'pty_empl_organization_name'),
    employerLocation: extractField(employment, 'pty_empl_organization_loc'),
    organizationLocation: extractField(employment, 'pty_empl_organization_loc'),
    orgLocation: extractField(employment, 'pty_empl_organization_loc'),
    employeeId: extractField(employment, 'pty_empl_employee_id'),
    serviceNature: normalizeServiceNature(extractField(employment, 'pty_empl_nature_of_service')),
    natureOfService: normalizeServiceNature(extractField(employment, 'pty_empl_nature_of_service')),
    appointmentDate: formatDate(extractField(employment, 'pty_empl_appointment_date')),
    joiningDate: formatDate(extractField(employment, 'pty_empl_appointment_date')),
    designation: normalizeDesignation(extractField(employment, 'pty_empl_designation')),
    grade: normalizeGrade(extractField(employment, 'pty_empl_grade')),
    annualIncome: extractField(employment, 'pty_empl_annual_income'),
    annualSalary: extractField(employment, 'pty_empl_annual_income'),
    contractEndDate: formatDate(extractField(employment, 'pty_empl_contract_end_date')), // ADDED

    // PEP Information
    pepDeclaration: extractField(pep, 'pep_declaration_type'),
    pepPerson: getStringValue(pep?.pep_category, 'value') === 'Not Applicable' ? 'no' : 'yes',
    pepCategory: getStringValue(pep?.pep_category, 'value'),
    pepSubCategory: getStringValue(pep?.pep_sub_category, 'value'),
    relatedToAnyPep: extractField(pep, 'related_to_any_pep'),
    pepRelated: extractField(pep, 'related_to_any_pep') === 'Yes' ? 'yes' : 'no',


    name: extractNameWithoutSalutation(personal?.party_name || ''),
    
    // Metadata
    isVerified: true,
  };

  // Determine verified fields
  const fieldsToCheck = [
    'fullName', 'dateOfBirth', 'gender', 'idNumber', 'idType',
    'maritalStatus', 'nationality', 'phone', 'email',
    'permanentCountry', 'permanentDzongkhag', 'permanentGewog',
    'currentCountry', 'currentDzongkhag', 'currentGewog',
    'occupation', 'employerName', 'designation', 'annualIncome'
  ];

  mappedData.verifiedFields = fieldsToCheck.filter(field => {
    const value = mappedData[field as keyof MappedFormData];
    return value !== '' && value !== null && value !== undefined;
  });

  console.log('mapCustomerDataToForm - Final mapped data:', mappedData);
  return mappedData;
}

/**
 * Apply mapped data to form state
 * Use this with useState or react-hook-form
 */
export function applyDataToFormState(
  mappedData: MappedFormData,
  setFormData: React.Dispatch<React.SetStateAction<any>>
) {
  setFormData((prev: any) => ({
    ...prev,
    ...mappedData
  }));
}

/**
 * Check if a field should be readonly (verified from API)
 */
export function isFieldVerified(fieldName: string, mappedData: MappedFormData): boolean {
  return mappedData.verifiedFields?.includes(fieldName) || false;
}

/**
 * Retrieve verified customer data from session storage (for existing users)
 */
export function getVerifiedCustomerDataFromSession(): MappedFormData | null {
  try {
    console.log('🔍 getVerifiedCustomerDataFromSession: Checking sessionStorage...');
    
    // Check for both the standard key and the potentially misspelled key from some sources
    let verifiedData = sessionStorage.getItem('verifiedCustomerData');
    if (!verifiedData) {
      verifiedData = sessionStorage.getItem('verifiedCustomeData');
      if (verifiedData) console.log('⚠️ getVerifiedCustomerDataFromSession: Data found under misspelled key "verifiedCustomeData"');
    }

    if (verifiedData) {
      const parsedData = JSON.parse(verifiedData);
      console.log('✅ getVerifiedCustomerDataFromSession: Data found!');
      return parsedData;
    } else {
      console.log('❌ getVerifiedCustomerDataFromSession: No data found in keys "verifiedCustomerData" or "verifiedCustomeData"');
    }
  } catch (error) {
    console.error('❌ Error retrieving verified customer data from session:', error);
  }
  return null;
}

/**
 * Clear verified customer data from session storage
 */
export function clearVerifiedCustomerDataFromSession(): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('verifiedCustomerData');
      console.log('Cleared verified customer data from session');
    }
  } catch (error) {
    console.error('Error clearing verified customer data from session:', error);
  }
}


export interface CoBorrowerFormData {
  // Personal Information
  name?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  salutation?:string;
  identificationNo?: string;
  maritalStatus?: string;

  identificationType?: string;
  identificationIssueDate?: string;
  identificationExpiryDate?: string;

  tpn?: string;
  taxIdentifierType?: string;
  householdNumber?: string;

  bankName?: string;
  bankAccount?: string;

  // Contact
  currContact?: string;
  currEmail?: string;

  // Permanent Address
  permCountry?: string;
  permDzongkhag?: string;
  permGewog?: string;
  permVillage?: string;
  permThram?: string;
  permHouse?: string;

  // Current/Resident Address
  currentCountry?: string;
  currCountry?: string; // Form alias
  currentDzongkhag?: string;
  currDzongkhag?: string; // Form alias
  currGewog?: string;
  currentStreet?: string;
  currStreet?: string; // Form alias
  currVillage?: string; // Form uses currVillage for Village/Street
  currentBuildingNo?: string;
  currBuildingNo?: string; // Form alias
  currFlat?: string; // Form uses currFlat for Flat/Building No
  currThram?: string; // Form uses currThram for current address thram
  currHouse?: string; // Form uses currHouse for current address house number

  // Employment
  occupation?: string;
  employerType?: string;
  organizationName?: string;
  designation?: string;
  annualSalary?: string;
  employeeId?: string;
  serviceNature?: string;
  joiningDate?: string;
  grade?: string;
  orgLocation?: string;
  contractEndDate?: string;

  // PEP
  pepPerson?: string;
  pepCategory?: string;
  pepRelated?: string;

  // Metadata
  isVerified?: boolean;
  verifiedFields?: string[];
}

export function mapCoBorrowerData(
  response: CustomerApiResponse
): CoBorrowerFormData {

  console.log('mapCoBorrowerData - Input:', response);

  const customerData = response?.data?.data || response?.data;

  if (!customerData) {
    return { isVerified: false, verifiedFields: [] };
  }

  const { personal, address, contact, employment, pep } = customerData as any;

  const permDzongkhagObj = address?.Bhutanese_Permanent_address?.pty_adr_permanent_dzongkhag;
  const permGewogObj = address?.Bhutanese_Permanent_address?.pty_adr_permanent_gewog;

  const permAddress =
    address?.Bhutanese_Permanent_address ||
    address?.Other_Permanent_address ||
    {};

  const resident = address?.resident_address || {};

  const mappedData: CoBorrowerFormData = {
    // =========================
    // PERSONAL INFO
    // =========================
    name: extractNameWithoutSalutation(personal?.party_name || ''),

    nationality: mapLabelToCode(getStringValue(personal?.party_nationality, 'value'), 'nationality'),

    salutation: extractSalutation(personal?.party_name || '', getStringValue(personal?.party_salutation, 'value')),
    dateOfBirth: formatDate(personal?.party_date_of_birth),

    gender: mapLabelToCode(
      getStringValue(personal?.party_gender, 'value'),
      'gender'
    ),

    identificationNo: personal?.party_identity_no || '',

    identificationType: mapLabelToCode(
      getStringValue(personal?.party_identity_type, 'value'),
      'identificationType'
    ),

    identificationIssueDate: formatDate(
      personal?.party_identity_issued_date
    ),

    identificationExpiryDate: formatDate(
      personal?.party_identity_expiry_date
    ),

    maritalStatus: mapLabelToCode(
      getStringValue(personal?.party_marital_status, 'value'),
      'maritalStatus'
    ),

    tpn: personal?.party_tax_identifier_no || '',
    taxIdentifierType: getStringValue(
      personal?.party_tax_identifier_type,
      'value'
    ),

    householdNumber: personal?.party_householder_number || '',

    bankName: mapLabelToCode(getStringValue(personal?.party_bank_name, 'value'), 'bankName'),

    bankAccount: personal?.party_bank_account_no || '',

    // =========================
    // CONTACT
    // =========================
    currContact: extractField(contact, 'pty_ctc_contact_no'),
    currEmail: extractField(contact, 'pty_ctc_email_id'),

    // =========================
    // PERMANENT ADDRESS
    // =========================
    permCountry: mapLabelToCode(getStringValue(permAddress?.pty_adr_permanent_country, 'value'), 'country'),
    permDzongkhag: getStringValue(permDzongkhagObj, 'íd') || getStringValue(permDzongkhagObj, 'value') || '',
    permGewog: getStringValue(permGewogObj, 'íd') || getStringValue(permGewogObj, 'value') || '',
    permVillage: extractField(permAddress, 'pty_adr_permanent_street'),
    permThram: extractField(permAddress, 'pty_adr_thram_no'),
    permHouse: extractField(permAddress, 'pty_adr_house_no'),

    // =========================
    // CURRENT/RESIDENT ADDRESS
    // =========================
    currCountry: mapLabelToCode(getStringValue(resident?.pty_adr_resident_country, 'value'), 'country'),
    currDzongkhag: getStringValue(resident?.pty_adr_resident_dzongkhag, 'value') || getStringValue(resident?.pty_adr_resident_dzongkhag, 'íd') || '',
    currGewog: getStringValue(resident?.pty_adr_resident_gewog, 'íd') || getStringValue(resident?.pty_adr_resident_gewog, 'value') || '',
    currentStreet: extractField(resident, 'pty_adr_resident_street'),
    currStreet: extractField(resident, 'pty_adr_resident_street'),
    currVillage: extractField(resident, 'pty_adr_resident_street'),
    currentBuildingNo: extractField(resident, 'pty_adr_line_1', 'pty_adr_resident_building_no'),
    currBuildingNo: extractField(resident, 'pty_adr_line_1', 'pty_adr_resident_building_no'),
    currFlat: extractField(resident, 'pty_adr_line_1', 'pty_adr_resident_building_no'),
    currThram: extractField(resident, 'pty_adr_thram_no') || '',
    currHouse: extractField(resident, 'pty_adr_house_no') || '',


    // =========================
    // EMPLOYMENT
    // =========================
    occupation: getStringValue(
      employment?.pty_empl_occupation,
      'value'
    ),

    employerType: normalizeEmployerType(
      getStringValue(employment?.pty_empl_employer_type || employment?.pty_empl_type, 'value')
    ),

    organizationName: extractField(
      employment,
      'pty_empl_organization_name'
    ),

    designation: normalizeDesignation(
      extractField(employment, 'pty_empl_designation')
    ),

    annualSalary: extractField(
      employment,
      'pty_empl_annual_income'
    ),

    employeeId: extractField(employment, 'pty_empl_employee_id'),
    serviceNature: normalizeServiceNature(extractField(employment, 'pty_empl_nature_of_service')),
    joiningDate: formatDate(extractField(employment, 'pty_empl_appointment_date')),
    grade: normalizeGrade(extractField(employment, 'pty_empl_grade')),
    orgLocation: extractField(employment, 'pty_empl_organization_loc'),
    contractEndDate: formatDate(extractField(employment, 'pty_empl_contract_end_date')),

    // =========================
    // PEP
    // =========================
    pepPerson:
      getStringValue(pep?.pep_category, 'value') === 'Not Applicable'
        ? 'no'
        : 'yes',

    pepCategory: getStringValue(pep?.pep_category, 'value'),

    pepRelated:
      extractField(pep, 'related_to_any_pep') === 'Yes'
        ? 'yes'
        : 'no',

    // =========================
    // METADATA
    // =========================
    isVerified: true,
  };

  // Verified fields
  const fieldsToCheck = [
    'name',
    'dateOfBirth',
    'gender',
    'identificationNo',
    'nationality',
    'currContact',
    'currEmail',
  ];

  mappedData.verifiedFields = fieldsToCheck.filter((field) => {
    const value = mappedData[field as keyof CoBorrowerFormData];
    return value !== '' && value !== null && value !== undefined;
  });

  console.log('mapCoBorrowerData - Output:', mappedData);

  return mappedData;
}