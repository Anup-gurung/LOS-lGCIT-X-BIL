/**
 * TypeScript type definitions for Bhutan NDI Integration
 * Based on Bhutan NDI Technical Documentation v1.2
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface NDITokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

export interface NDITokenRequest {
  grant_type: 'client_credentials';
  scope: string;
}

// ============================================================================
// Proof Request Types
// ============================================================================

export interface ProofRequestPayload {
  comment: string;
  proofRequest: {
    name: string;
    version: string;
    requestedAttributes: Record<string, RequestedAttribute>;
    requestedPredicates: Record<string, any>;
  };
  webhookUrl?: string;
}

export interface RequestedAttribute {
  name: string;
  restrictions: Array<{
    schema_name: string;
    schema_id?: string;
    schema_issuer_did?: string;
    schema_version?: string;
    issuer_did?: string;
    cred_def_id?: string;
  }>;
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
  status: VerificationState;
  verifiedData?: NDICredential;
  timestamp?: string;
}

export type VerificationState = 'pending' | 'verified' | 'rejected' | 'expired';

// ============================================================================
// Credential Types
// ============================================================================

export interface NDICredential {
  // Core Identity Fields
  citizenshipIdentificationNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  
  // Family Information
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  
  // Address Information
  presentAddress?: string;
  permanentAddress?: string;
  dzongkhag?: string;
  gewog?: string;
  village?: string;
  
  // Contact Information
  mobileNumber?: string;
  email?: string;
  
  // Additional Fields
  nationality?: string;
  maritalStatus?: string;
  occupation?: string;
  bloodGroup?: string;
  
  // Allow for additional fields
  [key: string]: any;
}

export interface ParsedCredential {
  cid?: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  presentAddress?: string;
  permanentAddress?: string;
  mobile?: string;
  email?: string;
  dzongkhag?: string;
  gewog?: string;
  village?: string;
  nationality?: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookPayload {
  presentationRequestId: string;
  state: VerificationState;
  verifiedData?: NDICredential;
  timestamp: string;
  signature?: string;
}

export interface WebhookResponse {
  success: boolean;
  received: boolean;
  presentationRequestId: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface NDISession {
  presentationRequestId: string;
  invitationUrl: string;
  qrCodeData: string;
  status: VerificationState;
  timestamp: string;
  expiresAt?: string;
  verifiedData?: NDICredential;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APISuccessResponse<T> {
  success: true;
  data: T;
}

export interface APIErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;

// ============================================================================
// Configuration Types
// ============================================================================

export interface NDIConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  verifierUrl: string;
  webhookUrl: string;
  webhookSecret: string;
}

// ============================================================================
// Schema Types (Based on NDI Documentation)
// ============================================================================

export interface BhutanCitizenSchema {
  schema_name: 'Bhutan_Citizen_Schema';
  schema_version: string;
  attributes: string[];
}

export interface CredentialDefinition {
  id: string;
  schema_id: string;
  tag: string;
  type: string;
  value: {
    primary: Record<string, any>;
    revocation?: Record<string, any>;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type AttributeName = 
  | 'citizenshipIdentificationNumber'
  | 'fullName'
  | 'dateOfBirth'
  | 'gender'
  | 'fatherName'
  | 'motherName'
  | 'spouseName'
  | 'presentAddress'
  | 'permanentAddress'
  | 'mobileNumber'
  | 'email'
  | 'dzongkhag'
  | 'gewog'
  | 'village'
  | 'nationality'
  | 'maritalStatus'
  | 'occupation'
  | 'bloodGroup';

export interface AttributeMapping {
  ndiName: AttributeName;
  displayName: string;
  required: boolean;
  format?: 'string' | 'date' | 'email' | 'phone';
}

// ============================================================================
// QR Code Types
// ============================================================================

export interface QRCodeData {
  presentationRequestId: string;
  verifierUrl: string;
  invitationUrl: string;
}

export interface QRCodeOptions {
  size: number;
  format: 'png' | 'svg' | 'jpeg';
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// Event Types
// ============================================================================

export type NDIEventType = 
  | 'proof_request_created'
  | 'qr_code_generated'
  | 'wallet_scanned'
  | 'verification_pending'
  | 'verification_success'
  | 'verification_failed'
  | 'verification_expired'
  | 'webhook_received';

export interface NDIEvent {
  type: NDIEventType;
  presentationRequestId: string;
  timestamp: string;
  data?: any;
}

// ============================================================================
// Error Types
// ============================================================================

export class NDIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NDIError';
  }
}

export type NDIErrorCode =
  | 'TOKEN_GENERATION_FAILED'
  | 'PROOF_REQUEST_FAILED'
  | 'INVALID_SIGNATURE'
  | 'VERIFICATION_EXPIRED'
  | 'VERIFICATION_REJECTED'
  | 'INVALID_CREDENTIALS'
  | 'NETWORK_ERROR'
  | 'CONFIGURATION_ERROR';
