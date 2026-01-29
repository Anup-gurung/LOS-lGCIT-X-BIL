/**
 * Simple in-memory store for verification status
 * In production, this would be replaced with database storage
 */

interface VerificationStatus {
  presentationRequestId: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedData?: any;
  timestamp: string;
}

// In-memory store (resets on server restart)
const verificationStore = new Map<string, VerificationStatus>();

export function setVerificationStatus(
  presentationRequestId: string,
  status: 'pending' | 'verified' | 'rejected' | 'expired',
  verifiedData?: any
): void {
  verificationStore.set(presentationRequestId, {
    presentationRequestId,
    status,
    verifiedData,
    timestamp: new Date().toISOString(),
  });
}

export function getVerificationStatus(
  presentationRequestId: string
): VerificationStatus | null {
  return verificationStore.get(presentationRequestId) || null;
}

export function clearVerificationStatus(presentationRequestId: string): void {
  verificationStore.delete(presentationRequestId);
}
