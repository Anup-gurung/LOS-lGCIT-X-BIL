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
  currContact(arg0: string, currContact: any): unknown;
  currEmail(arg0: string, currEmail: any): unknown;
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
    if (value) {
      return String(value).trim();
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
  
  // Gender mappings - MOST IMPORTANT, exact matching first
  if (type === 'gender') {
    if (labelLower === 'male' || labelLower === 'm') return 'male';
    if (labelLower === 'female' || labelLower === 'f') return 'female';
    if (labelLower === 'other') return 'other';
    return cleaned; // Fallback
  }
  
  // Marital Status mappings
  if (type === 'maritalStatus') {
    if (labelLower === 'single' || labelLower === 'unmarried') return 'single';
    if (labelLower === 'married') return 'married';
    if (labelLower === 'divorced') return 'divorced';
    if (labelLower === 'widowed') return 'widowed';
    if (labelLower === 'separated') return 'separated';
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
  
  // Bank Name mappings
  if (type === 'bankName') {
    if (labelLower.includes('bank of bhutan') || labelLower === 'bob') return cleaned;
    if (labelLower.includes('bhutan national bank') || labelLower === 'bnb') return cleaned;
    if (labelLower.includes('druk') || labelLower === 'dpnb') return cleaned;
    if (labelLower.includes('t bank') || labelLower === 'tbank') return cleaned;
    if (labelLower.includes('development')) return cleaned;
    return cleaned; // Fallback
  }
  
  // Salutation mappings
  if (type === 'salutation') {
    if (labelLower === 'mr' || labelLower === 'mr.' || labelLower.includes('mister')) return 'mr';
    if (labelLower === 'mrs' || labelLower === 'mrs.') return 'mrs';
    if (labelLower === 'ms' || labelLower === 'ms.' || labelLower === 'miss') return 'ms';
    if (labelLower === 'dr' || labelLower === 'dr.' || labelLower.includes('doctor')) return 'dr';
    return cleaned; // Fallback
  }
  
  // Default: return cleaned value as-is
  console.log(`No mapping found for ${type}: "${cleaned}", returning as-is`);
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
  
  // Remove common salutation prefixes
  const withoutSalutation = trimmed
    .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Mr|Mrs|Ms|Dr)\s+/i, '')
    .trim();
  
  return withoutSalutation || trimmed; // Return original if no salutation found
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
  isVerified: false, verifiedFields: [],
  currContact: function (arg0: string, currContact: any): unknown {
    throw new Error("Function not implemented.");
  },
  currEmail: function (arg0: string, currEmail: any): unknown {
    throw new Error("Function not implemented.");
  }
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
  console.log('   party_marital_status:', personal?.party_marital_status);
  console.log('   party_bank_name:', personal?.party_bank_name);
  console.log('   pty_adr_permanent_country:', address?.Permanent_address?.pty_adr_permanent_country);
  console.log('\n🔍 ALL PERSONAL FIELDS:', Object.keys(personal || {}));
  console.log('🔍 ALL ADDRESS FIELDS:', Object.keys(address?.Permanent_address || {}));
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


    // Permanent Address
    permanentCountry: extractField(address?.Permanent_address, 'pty_adr_permanent_country', 'permanent_country', 'country'),
    permCountry: extractField(address?.Permanent_address, 'pty_adr_permanent_country', 'permanent_country', 'country'), // Form uses permCountry
    permanentDzongkhag: extractField(address?.Permanent_address, 'pty_adr_permanent_dzongkhag', 'permanent_dzongkhag', 'dzongkhag'),
    permDzongkhag: extractField(address?.Permanent_address, 'pty_adr_permanent_dzongkhag', 'permanent_dzongkhag', 'dzongkhag'), // Form uses permDzongkhag
    permanentGewog: extractField(address?.Permanent_address, 'pty_adr_permanent_gewog', 'permanent_gewog', 'gewog'),
    permGewog: extractField(address?.Permanent_address, 'pty_adr_permanent_gewog', 'permanent_gewog', 'gewog'), // Form uses permGewog
    permanentStreet: extractField(address?.Permanent_address, 'pty_adr_permanent_street', 'permanent_street', 'street'),
    permStreet: extractField(address?.Permanent_address, 'pty_adr_permanent_street', 'permanent_street', 'street'), // Form uses permStreet
    permVillage: extractField(address?.Permanent_address, 'pty_adr_permanent_street', 'permanent_street', 'street'), // Form uses permVillage for Village/Street
    thramNo: extractField(address?.Permanent_address, 'pty_adr_thram_no', 'thram_no', 'thramNo'),
    permThram: extractField(address?.Permanent_address, 'pty_adr_thram_no', 'thram_no', 'thramNo'), // Form uses permThram
    houseNo: extractField(address?.Permanent_address, 'pty_adr_house_no', 'house_no', 'houseNo'),
    permHouse: extractField(address?.Permanent_address, 'pty_adr_house_no', 'house_no', 'houseNo'), // Form uses permHouse

    // Current/Resident Address
    currentCountry: extractField(address?.resident_address, 'pty_adr_resident_country', 'resident_country', 'country'),
    currCountry: extractField(address?.resident_address, 'pty_adr_resident_country', 'resident_country', 'country'), // Form uses currCountry
    currentDzongkhag: extractField(address?.resident_address, 'pty_adr_resident_dzongkhag', 'resident_dzongkhag', 'dzongkhag'),
    currDzongkhag: extractField(address?.resident_address, 'pty_adr_resident_dzongkhag', 'resident_dzongkhag', 'dzongkhag'), // Form uses currDzongkhag
    currentGewog: extractField(address?.resident_address, 'pty_adr_resident_gewog', 'resident_gewog', 'gewog'),
    currGewog: extractField(address?.resident_address, 'pty_adr_resident_gewog', 'resident_gewog', 'gewog'), // Form uses currGewog
    currentStreet: extractField(address?.resident_address, 'pty_adr_resident_street', 'resident_street', 'street'),
    currStreet: extractField(address?.resident_address, 'pty_adr_resident_street', 'resident_street', 'street'), // Form uses currStreet
    currVillage: extractField(address?.resident_address, 'pty_adr_resident_street', 'resident_street', 'street'), // Form uses currVillage for Village/Street
    currentBuildingNo: extractField(address?.resident_address, 'pty_adr_resident_building_no', 'resident_building_no', 'buildingNo'),
    currBuildingNo: extractField(address?.resident_address, 'pty_adr_resident_building_no', 'resident_building_no', 'buildingNo'), // Form uses currBuildingNo
    currFlat: extractField(address?.resident_address, 'pty_adr_resident_building_no', 'resident_building_no', 'buildingNo'), // Form uses currFlat for Flat/Building No


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
    isVerified: true,
    currContact: function (arg0: string, currContact: any): unknown {
      throw new Error("Function not implemented.");
    },
    currEmail: function (arg0: string, currEmail: any): unknown {
      throw new Error("Function not implemented.");
    }
  };

  // Diagnostic logging for missing fields
  console.log('🔴 CHECKING MAPPED FIELDS:');
  console.log('   maritalStatus:', mappedData.maritalStatus || '❌ EMPTY');
  console.log('   bankName:', mappedData.bankName || '❌ EMPTY');
  console.log('   permCountry:', mappedData.permCountry || '❌ EMPTY');
  console.log('   permanentCountry:', mappedData.permanentCountry || '❌ EMPTY');

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
