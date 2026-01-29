/**
 * NDI Service Utilities
 * Helper functions for NDI integration based on Bhutan NDI Technical Documentation v1.2
 */

export interface NDICredential {
  citizenshipIdentificationNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  presentAddress?: string;
  permanentAddress?: string;
  mobileNumber?: string;
  email?: string;
  dzongkhag?: string;
  gewog?: string;
  village?: string;
  nationality?: string;
  [key: string]: any;
}

export interface ProofRequestResponse {
  success: boolean;
  presentationRequestId: string;
  invitationUrl: string;
  qrCodeData: string;
  expiresAt?: string;
}

export interface ProofRequestStatus {
  presentationRequestId: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedData?: NDICredential;
  timestamp?: string;
}

/**
 * Generate an NDI access token
 */
export async function getNDIToken(): Promise<string> {
  const response = await fetch('/api/ndi/token', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to obtain NDI access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a new proof request for identity verification
 */
export async function createProofRequest(
  requestedAttributes?: string[],
  webhookUrl?: string
): Promise<ProofRequestResponse> {
  const response = await fetch('/api/ndi/proof-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requestedAttributes,
      webhookUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create proof request');
  }

  return response.json();
}

/**
 * Check the status of a proof request
 */
export async function checkProofRequestStatus(
  presentationRequestId: string
): Promise<ProofRequestStatus> {
  const response = await fetch(
    `/api/ndi/proof-request?presentationRequestId=${presentationRequestId}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to check proof request status');
  }

  return response.json();
}

/**
 * Generate QR code URL from proof request data
 */
export function generateQRCodeURL(qrCodeData: string): string {
  // Using a public QR code API
  const encodedData = encodeURIComponent(qrCodeData);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;
}

/**
 * Parse and extract citizen data from NDI verified credentials
 */
export function parseNDICredentials(verifiedData: any): NDICredential {
  const credentials: NDICredential = {};

  if (verifiedData && typeof verifiedData === 'object') {
    // Map NDI attribute names to our application's field names
    const attributeMap: { [key: string]: string } = {
      citizenshipIdentificationNumber: 'cid',
      fullName: 'fullName',
      dateOfBirth: 'dob',
      gender: 'gender',
      fatherName: 'fatherName',
      motherName: 'motherName',
      spouseName: 'spouseName',
      presentAddress: 'presentAddress',
      permanentAddress: 'permanentAddress',
      mobileNumber: 'mobile',
      email: 'email',
      dzongkhag: 'dzongkhag',
      gewog: 'gewog',
      village: 'village',
      nationality: 'nationality',
    };

    Object.entries(verifiedData).forEach(([key, value]) => {
      if (attributeMap[key]) {
        credentials[key] = value as string;
      }
    });
  }

  return credentials;
}

/**
 * Validate CID format (11 digits for Bhutanese citizens)
 */
export function isValidCID(cid: string): boolean {
  return /^\d{11}$/.test(cid);
}

/**
 * Format date from NDI format (YYYY-MM-DD) to display format
 */
export function formatNDIDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Store NDI verification session data
 */
export function storeNDISession(presentationRequestId: string, sessionData: any): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      `ndi_session_${presentationRequestId}`,
      JSON.stringify({
        ...sessionData,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Retrieve NDI verification session data
 */
export function getNDISession(presentationRequestId: string): any | null {
  if (typeof window !== 'undefined') {
    const data = sessionStorage.getItem(`ndi_session_${presentationRequestId}`);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

/**
 * Clear NDI verification session data
 */
export function clearNDISession(presentationRequestId: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(`ndi_session_${presentationRequestId}`);
  }
}
