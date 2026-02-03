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
  thramNo?: string;
  houseNo?: string;
  
  // Current/Resident Address
  currentCountry?: string;
  currCountry?: string; // Form alias
  currentDzongkhag?: string;
  currDzongkhag?: string; // Form alias
  currentGewog?: string;
  currGewog?: string; // Form alias
  currentStreet?: string;
  currStreet?: string; // Form alias
  currentBuildingNo?: string;
  currBuildingNo?: string; // Form alias
  
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
 */
function mapLabelToCode(label: string, type: string): string {
  if (!label) return '';
  
  const labelLower = label.toLowerCase().trim();
  
  // Nationality mappings
  if (type === 'nationality') {
    const nationalityMap: Record<string, string> = {
      'bhutanese': 'bhutanese',
      'indian': 'indian',
      'nepali': 'nepali',
      'bangladeshi': 'bangladeshi',
    };
    for (const [key, value] of Object.entries(nationalityMap)) {
      if (labelLower.includes(key)) {
        console.log(`Mapped ${type}: "${label}" -> "${value}"`);
        return value;
      }
    }
  }
  
  // Identification Type mappings
  if (type === 'identificationType') {
    const idTypeMap: Record<string, string> = {
      'citizenship identity card': 'cid',
      'cid': 'cid',
      'work permit': 'workpermit',
      'workpermit': 'workpermit',
      'passport': 'passport',
    };
    for (const [key, value] of Object.entries(idTypeMap)) {
      if (labelLower.includes(key)) {
        console.log(`Mapped ${type}: "${label}" -> "${value}"`);
        return value;
      }
    }
  }
  
  // Marital Status mappings
  if (type === 'maritalStatus') {
    const maritalMap: Record<string, string> = {
      'single': 'single',
      'married': 'married',
      'divorced': 'divorced',
      'widowed': 'widowed',
      'separated': 'separated',
    };
    for (const [key, value] of Object.entries(maritalMap)) {
      if (labelLower.includes(key)) {
        console.log(`Mapped ${type}: "${label}" -> "${value}"`);
        return value;
      }
    }
  }
  
  // Gender mappings
  if (type === 'gender') {
    const genderMap: Record<string, string> = {
      'male': 'male',
      'female': 'female',
      'other': 'other',
    };
    for (const [key, value] of Object.entries(genderMap)) {
      if (labelLower.includes(key)) {
        console.log(`Mapped ${type}: "${label}" -> "${value}"`);
        return value;
      }
    }
  }
  
  // Bank Name mappings
  if (type === 'bankName') {
    const bankMap: Record<string, string> = {
      'bank of bhutan': 'bob',
      'bob': 'bob',
      'bhutan national bank': 'bnb',
      'bnb': 'bnb',
      'druk pnb': 'dpnb',
      'dpnb': 'dpnb',
      't bank': 'tbank',
      'tbank': 'tbank',
      'bhutan development bank': 'bdbl',
      'bdbl': 'bdbl',
    };
    for (const [key, value] of Object.entries(bankMap)) {
      if (labelLower.includes(key)) {
        console.log(`Mapped ${type}: "${label}" -> "${value}"`);
        return value;
      }
    }
  }
  
  // If no mapping found, return the original label (it might already be a code)
  console.log(`No mapping for ${type}: "${label}" - using as-is`);
  return label;
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
    return { isVerified: false, verifiedFields: [] };
  }

  const { personal, address, contact, employment, pep } = customerData as any;
  
  console.log('mapCustomerDataToForm - Destructured sections:', {
    personal,
    address,
    contact,
    employment,
    pep
  });
  
  const mappedData: MappedFormData = {
    // Personal Information
    fullName: personal?.party_name || '',
    applicantName: personal?.party_name || '', // Form uses applicantName
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
    maritalStatus: mapLabelToCode(personal?.party_marital_status || '', 'maritalStatus'),
    nationality: mapLabelToCode(personal?.party_nationality || '', 'nationality'),
    bankName: mapLabelToCode(personal?.party_bank_name || '', 'bankName'),
    bankAccount: personal?.party_bank_account_no || '', // Form uses bankAccount
    bankAccountNo: personal?.party_bank_account_no || '',
    tpnNumber: personal?.party_tpn_number || '',
    tpn: personal?.party_tpn_number || '', // Form uses tpn
    partyId: personal?.party_id || '',
    
    // Contact Information
    phone: contact?.pty_ctc_contact_no || '',
    contactNo: contact?.pty_ctc_contact_no || '', // Form uses contactNo
    email: contact?.pty_ctc_email_id || '',
    emailId: contact?.pty_ctc_email_id || '', // Form uses emailId
    alternatePhone: contact?.pty_ctc_alternate_contact_no || '',
    alternateContactNo: contact?.pty_ctc_alternate_contact_no || '', // Form uses alternateContactNo
    
    // Permanent Address
    permanentCountry: address?.Permanent_address?.pty_adr_permanent_country || '',
    permCountry: address?.Permanent_address?.pty_adr_permanent_country || '', // Form uses permCountry
    permanentDzongkhag: address?.Permanent_address?.pty_adr_permanent_dzongkhag || '',
    permDzongkhag: address?.Permanent_address?.pty_adr_permanent_dzongkhag || '', // Form uses permDzongkhag
    permanentGewog: address?.Permanent_address?.pty_adr_permanent_gewog || '',
    permGewog: address?.Permanent_address?.pty_adr_permanent_gewog || '', // Form uses permGewog
    permanentStreet: address?.Permanent_address?.pty_adr_permanent_street || '',
    permStreet: address?.Permanent_address?.pty_adr_permanent_street || '', // Form uses permStreet
    thramNo: address?.Permanent_address?.pty_adr_thram_no || '',
    houseNo: address?.Permanent_address?.pty_adr_house_no || '',
    
    // Current/Resident Address
    currentCountry: address?.resident_address?.pty_adr_resident_country || '',
    currCountry: address?.resident_address?.pty_adr_resident_country || '', // Form uses currCountry
    currentDzongkhag: address?.resident_address?.pty_adr_resident_dzongkhag || '',
    currDzongkhag: address?.resident_address?.pty_adr_resident_dzongkhag || '', // Form uses currDzongkhag
    currentGewog: address?.resident_address?.pty_adr_resident_gewog || '',
    currGewog: address?.resident_address?.pty_adr_resident_gewog || '', // Form uses currGewog
    currentStreet: address?.resident_address?.pty_adr_resident_street || '',
    currStreet: address?.resident_address?.pty_adr_resident_street || '', // Form uses currStreet
    currentBuildingNo: address?.resident_address?.pty_adr_resident_building_no || '',
    currBuildingNo: address?.resident_address?.pty_adr_resident_building_no || '', // Form uses currBuildingNo
    
    // Employment Information
    occupation: employment?.pty_empl_occupation || '',
    employerType: employment?.pty_empl_employer_type || '',
    organizationType: employment?.pty_empl_employer_type || '', // Form uses organizationType
    employerName: employment?.pty_empl_organization_name || '',
    organizationName: employment?.pty_empl_organization_name || '', // Form uses organizationName
    employerLocation: employment?.pty_empl_organization_loc || '',
    organizationLocation: employment?.pty_empl_organization_loc || '', // Form uses organizationLocation
    employeeId: employment?.pty_empl_employee_id || '',
    serviceNature: employment?.pty_empl_nature_of_service || '',
    natureOfService: employment?.pty_empl_nature_of_service || '', // Form uses natureOfService
    appointmentDate: formatDate(employment?.pty_empl_appointment_date),
    designation: employment?.pty_empl_designation || '',
    grade: employment?.pty_empl_grade || '',
    annualIncome: employment?.pty_empl_annual_income || '',
    
    // PEP Information
    pepDeclaration: pep?.pep_declaration_type || '',
    pepPerson: pep?.pep_category === 'Not Applicable' ? 'no' : 'yes', // Form uses pepPerson (yes/no)
    pepCategory: pep?.pep_category || '',
    pepSubCategory: pep?.pep_sub_category,
    relatedToAnyPep: pep?.related_to_any_pep || '',
    pepRelated: pep?.related_to_any_pep === 'Yes' ? 'yes' : 'no', // Form uses pepRelated (yes/no)
    
    // Metadata
    isVerified: true,
  };

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
 * Retrieve verified customer data from session storage
 */
export function getVerifiedCustomerDataFromSession(): MappedFormData | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const storedData = sessionStorage.getItem('verifiedCustomerData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      console.log('✅ Retrieved verified customer data from session:', parsedData);
      console.log('✅ Number of fields:', Object.keys(parsedData).length);
      return parsedData;
    } else {
      console.log('⚠️ No verified customer data found in sessionStorage');
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
