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
        party_gender?: string;
        party_nationality?: string;
        party_identity_type?: string;
        party_identity_no?: string;
        party_identity_issued_date?: string;
        party_identity_expiry_date?: string;
        party_date_of_birth?: string;
        party_marital_status?: string;
        party_bank_name?: string;
        party_bank_account_no?: string;
        party_tpn_number?: string;
      };
      address?: {
        Permanent_address?: {
          pty_adr_id?: string;
          pty_adr_permanent_country?: string;
          pty_adr_permanent_dzongkhag?: string;
          pty_adr_permanent_gewog?: string;
          pty_adr_permanent_street?: string;
          pty_adr_thram_no?: string;
          pty_adr_house_no?: string;
        };
        resident_address?: {
          pty_adr_resident_country?: string;
          pty_adr_resident_dzongkhag?: string;
          pty_adr_resident_gewog?: string;
          pty_adr_resident_street?: string;
          pty_adr_resident_building_no?: string;
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
        pty_empl_occupation?: string;
        pty_empl_employer_type?: string;
        pty_empl_organization_name?: string;
        pty_empl_organization_loc?: string;
        pty_empl_employee_id?: string;
        pty_empl_nature_of_service?: string;
        pty_empl_appointment_date?: string;
        pty_empl_designation?: string;
        pty_empl_grade?: string;
        pty_empl_annual_income?: string;
      };
      associate?: {
        asso_pty_id?: string;
        asso_associate_party_id?: string;
        asso_relationship_type?: string;
      };
      pep?: {
        pep_id?: string;
        pep_party_id?: string;
        pep_declaration_type?: string | null;
        pep_category?: string;
        pep_sub_category?: string | null;
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
  employeeId?: string;
  serviceNature?: string;
  natureOfService?: string; // Form alias
  appointmentDate?: string;
  designation?: string;
  grade?: string;
  annualIncome?: string;
  
  // PEP Information
  pepDeclaration?: string;
  pepPerson?: string; // Form alias for PEP status (yes/no)
  pepCategory?: string;
  pepSubCategory?: string | null;
  relatedToAnyPep?: string;
  pepRelated?: string; // Form alias for related to PEP (yes/no)
  
  // Metadata
  isVerified?: boolean;
  verifiedFields?: string[];
}

/**
 * Safely extract value from object by trying multiple possible field names
 */
function extractField(obj: any, ...fieldNames: string[]): string {
  for (const fieldName of fieldNames) {
    const value = obj?.[fieldName];
    if (value !== null && value !== undefined && value !== '') {
      const cleaned = String(value).trim();
      if (cleaned) {
        return cleaned;
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
    if (labelLower === 'cid') return 'Citizenship Identity card';
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
  
  console.log('mapCustomerDataToForm - Extracted customerData:', customerData);
  
  if (!customerData) {
    console.warn('mapCustomerDataToForm - No customer data found');
    return {
      isVerified: false, 
      verifiedFields: []
    };
  }

  const { personal, address, contact, employment, pep } = customerData as any;
  
  console.log('mapCustomerDataToForm - Destructured sections:', {
    personal,
    address,
    contact,
    employment,
    pep
  });
  
  // Log critical fields that user reported are missing
  console.log('📋 CRITICAL FIELDS FROM API:');
  console.log('   party_name:', personal?.party_name);
  console.log('   party_gender:', personal?.party_gender);
  console.log('   party_marital_status:', personal?.party_marital_status);
  console.log('   party_nationality:', personal?.party_nationality);
  console.log('   party_identity_type:', personal?.party_identity_type);
  console.log('   party_bank_name:', personal?.party_bank_name);
  console.log('   pty_adr_permanent_country:', address?.Permanent_address?.pty_adr_permanent_country);
  console.log('\n🔍 ALL PERSONAL FIELDS:', Object.keys(personal || {}));
  console.log('🔍 ALL PERMANENT ADDRESS FIELDS:', Object.keys(address?.Permanent_address || {}));
  console.log('🔍 ALL RESIDENT ADDRESS FIELDS:', Object.keys(address?.resident_address || {}));
  console.log('🔍 ALL ADDRESS STRUCTURE:', Object.keys(address || {}));
  
  const mappedData: MappedFormData = {
    // Personal Information
    salutation: extractSalutation(personal?.party_name || '', personal?.party_salutation),
    fullName: extractNameWithoutSalutation(personal?.party_name || ''),
    applicantName: extractNameWithoutSalutation(personal?.party_name || ''), // Form uses applicantName
    dateOfBirth: formatDate(personal?.party_date_of_birth),
    gender: mapLabelToCode(personal?.party_gender || '', 'gender'),
    idNumber: personal?.party_identity_no || '',
    identificationNo: personal?.party_identity_no || '', // Form uses identificationNo
    idType: mapLabelToCode(personal?.party_identity_type || '', 'identificationType'),
    identificationType: mapLabelToCode(personal?.party_identity_type || '', 'identificationType'), // Form uses identificationType
    identityIssuedDate: formatDate(personal?.party_identity_issued_date),
    identificationIssueDate: formatDate(personal?.party_identity_issued_date), // Form uses identificationIssueDate
    identityExpiryDate: formatDate(personal?.party_identity_expiry_date),
    identificationExpiryDate: formatDate(personal?.party_identity_expiry_date), // Form uses identificationExpiryDate
    maritalStatus: mapLabelToCode(extractField(personal, 'party_marital_status', 'marital_status', 'maritalStatus'), 'maritalStatus'),
    nationality: mapLabelToCode(personal?.party_nationality || '', 'nationality'),
    bankName: mapLabelToCode(extractField(personal, 'party_bank_name', 'bank_name', 'bankName'), 'bankName'),
    bankAccount: extractField(personal, 'party_bank_account_no', 'bank_account_no', 'bankAccount'), // Form uses bankAccount
    bankAccountNo: extractField(personal, 'party_bank_account_no', 'bank_account_no', 'bankAccount'),
    tpnNumber: extractField(personal, 'party_tpn_number', 'tpn_number', 'tpn'),
    tpn: extractField(personal, 'party_tpn_number', 'tpn_number', 'tpn'), // Form uses tpn
    partyId: extractField(personal, 'party_id', 'id'),

    // Contact Information
    phone: extractField(contact, 'pty_ctc_contact_no', 'contact_no', 'phone'),
    contactNo: extractField(contact, 'pty_ctc_contact_no', 'contact_no', 'phone'), // Form uses contactNo
    email: extractField(contact, 'pty_ctc_email_id', 'email_id', 'email'),
    emailId: extractField(contact, 'pty_ctc_email_id', 'email_id', 'email'), // Form uses emailId
    alternatePhone: extractField(contact, 'pty_ctc_alternate_contact_no', 'alternate_contact_no', 'alternateContactNo'),
    alternateContactNo: extractField(contact, 'pty_ctc_alternate_contact_no', 'alternate_contact_no', 'alternateContactNo'), // Form uses alternateContactNo
    currContact: extractField(contact, 'pty_ctc_contact_no', 'contact_no', 'phone'), // Form uses currContact
    currEmail: extractField(contact, 'pty_ctc_email_id', 'email_id', 'email'), // Form uses currEmail

    // Permanent Address
    // Permanent Address - keep exact API values for dropdown matching
    permanentCountry: mapLabelToCode(extractField(address?.Permanent_address, 'pty_adr_permanent_country', 'permanent_country', 'country'), 'country'),
    permCountry: mapLabelToCode(extractField(address?.Permanent_address, 'pty_adr_permanent_country', 'permanent_country', 'country'), 'country'), // Form uses permCountry
    permanentDzongkhag: extractField(address?.Permanent_address, 'pty_adr_permanent_dzongkhag', 'permanent_dzongkhag', 'dzongkhag'), // Keep exact API value
    permDzongkhag: extractField(address?.Permanent_address, 'pty_adr_permanent_dzongkhag', 'permanent_dzongkhag', 'dzongkhag'), // Form uses permDzongkhag - keep exact API value
    permanentGewog: extractField(address?.Permanent_address, 'pty_adr_permanent_gewog', 'permanent_gewog', 'gewog'), // Keep exact API value
    permGewog: extractField(address?.Permanent_address, 'pty_adr_permanent_gewog', 'permanent_gewog', 'gewog'), // Form uses permGewog - keep exact API value
    permanentStreet: extractField(address?.Permanent_address, 'pty_adr_permanent_street', 'permanent_street', 'street'),
    permStreet: extractField(address?.Permanent_address, 'pty_adr_permanent_street', 'permanent_street', 'street'), // Form uses permStreet
    permVillage: extractField(address?.Permanent_address, 'pty_adr_permanent_street', 'permanent_street', 'street'), // Form uses permVillage for Village/Street
    thramNo: extractField(address?.Permanent_address, 'pty_adr_thram_no', 'thram_no', 'thramNo'),
    permThram: extractField(address?.Permanent_address, 'pty_adr_thram_no', 'thram_no', 'thramNo'), // Form uses permThram
    houseNo: extractField(address?.Permanent_address, 'pty_adr_house_no', 'house_no', 'houseNo'),
    permHouse: extractField(address?.Permanent_address, 'pty_adr_house_no', 'house_no', 'houseNo'), // Form uses permHouse

    // Current/Resident Address - keep exact API values for dropdown matching
    currentCountry: mapLabelToCode(extractField(address?.resident_address, 'pty_adr_resident_country', 'resident_country', 'country'), 'country'),
    currCountry: mapLabelToCode(extractField(address?.resident_address, 'pty_adr_resident_country', 'resident_country', 'country'), 'country'), // Form uses currCountry
    currentDzongkhag: extractField(address?.resident_address, 'pty_adr_resident_dzongkhag', 'resident_dzongkhag', 'dzongkhag'), // Keep exact API value
    currDzongkhag: extractField(address?.resident_address, 'pty_adr_resident_dzongkhag', 'resident_dzongkhag', 'dzongkhag'), // Form uses currDzongkhag - keep exact API value
    currentGewog: extractField(address?.resident_address, 'pty_adr_resident_gewog', 'resident_gewog', 'gewog'), // Keep exact API value
    currGewog: extractField(address?.resident_address, 'pty_adr_resident_gewog', 'resident_gewog', 'gewog'), // Form uses currGewog - keep exact API value
    currentStreet: extractField(address?.resident_address, 'pty_adr_resident_street', 'resident_street', 'street'),
    currStreet: extractField(address?.resident_address, 'pty_adr_resident_street', 'resident_street', 'street'), // Form uses currStreet
    currVillage: extractField(address?.resident_address, 'pty_adr_resident_street', 'resident_street', 'street'), // Form uses currVillage for Village/Street
    currentBuildingNo: extractField(address?.resident_address, 'pty_adr_resident_building_no', 'resident_building_no', 'buildingNo'),
    currBuildingNo: extractField(address?.resident_address, 'pty_adr_resident_building_no', 'resident_building_no', 'buildingNo'), // Form uses currBuildingNo
    currFlat: extractField(address?.resident_address, 'pty_adr_resident_building_no', 'resident_building_no', 'buildingNo'), // Form uses currFlat for Flat/Building No
    currThram: extractField(address?.resident_address, 'pty_adr_resident_thram_no', 'resident_thram_no', 'thramNo', 'pty_adr_thram_no') || '', // Form uses currThram for current address
    currHouse: extractField(address?.resident_address, 'pty_adr_resident_house_no', 'resident_house_no', 'houseNo', 'pty_adr_house_no') || '', // Form uses currHouse for current address

    // Employment Information
    occupation: employment?.pty_empl_occupation || '',
    employerType: employment?.pty_empl_employer_type || '',
    organizationType: extractField(employment, 'pty_empl_employer_type', 'employer_type', 'organizationType'), // Form uses organizationType
    employerName: extractField(employment, 'pty_empl_organization_name', 'organization_name', 'employerName'),
    organizationName: extractField(employment, 'pty_empl_organization_name', 'organization_name', 'employerName'), // Form uses organizationName
    employerLocation: extractField(employment, 'pty_empl_organization_loc', 'organization_location', 'employerLocation'),
    organizationLocation: extractField(employment, 'pty_empl_organization_loc', 'organization_location', 'employerLocation'), // Form uses organizationLocation
    employeeId: extractField(employment, 'pty_empl_employee_id', 'employee_id', 'employeeId'),
    serviceNature: extractField(employment, 'pty_empl_nature_of_service', 'nature_of_service', 'serviceNature'),
    natureOfService: extractField(employment, 'pty_empl_nature_of_service', 'nature_of_service', 'serviceNature'), // Form uses natureOfService
    appointmentDate: formatDate(extractField(employment, 'pty_empl_appointment_date', 'appointment_date', 'appointmentDate')),
    designation: extractField(employment, 'pty_empl_designation', 'designation'),
    grade: extractField(employment, 'pty_empl_grade', 'grade'),
    annualIncome: extractField(employment, 'pty_empl_annual_income', 'annual_income', 'annualIncome'),

    // PEP Information
    pepDeclaration: extractField(pep, 'pep_declaration_type', 'declaration_type'),
    pepPerson: extractField(pep, 'pep_category', 'category') === 'Not Applicable' ? 'no' : 'yes', // Form uses pepPerson (yes/no)
    pepCategory: extractField(pep, 'pep_category', 'category'),
    pepSubCategory: extractField(pep, 'pep_sub_category', 'sub_category'),
    relatedToAnyPep: extractField(pep, 'related_to_any_pep', 'relatedToAnyPep'),
    pepRelated: extractField(pep, 'related_to_any_pep', 'relatedToAnyPep') === 'Yes' ? 'yes' : 'no', // Form uses pepRelated (yes/no)


    // Metadata
    isVerified: true
  };

  // Diagnostic logging for missing fields
 

  // Filter verified fields after mappedData is fully defined
  const fieldsToCheck = [
    'fullName', 'dateOfBirth', 'gender', 'idNumber', 'idType',
    'maritalStatus', 'nationality', 'phone', 'email',
    'permanentCountry', 'permanentDzongkhag', 'permanentGewog',
    'currentCountry', 'currentDzongkhag', 'currentGewog',
    'occupation', 'employerName', 'designation', 'annualIncome'
  ];
  
  mappedData.verifiedFields = fieldsToCheck.filter(field => {
    // Only mark fields as verified if they have values
    const value = mappedData[field as keyof MappedFormData];
    return value !== '' && value !== null && value !== undefined;
  });

  console.log('mapCustomerDataToForm - Final mapped data:', mappedData);
  console.log('mapCustomerDataToForm - Verified fields:', mappedData.verifiedFields);

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
    const verifiedData = sessionStorage.getItem('verifiedCustomerData');
    
    if (verifiedData) {
      const parsedData = JSON.parse(verifiedData);
      console.log('✅ getVerifiedCustomerDataFromSession: Data found!');
      console.log('   Data keys:', Object.keys(parsedData));
      console.log('   Applicant Name:', parsedData.applicantName);
      console.log('   Email:', parsedData.currEmail || parsedData.email);
      console.log('   Phone:', parsedData.currContact || parsedData.phone);
      return parsedData;
    } else {
      console.log('❌ getVerifiedCustomerDataFromSession: No data in sessionStorage');
      console.log('   Available keys:', Object.keys(sessionStorage));
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
