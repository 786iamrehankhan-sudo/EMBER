// This file handles authentication session brokering for preview environments.
// Uses localStorage for production, with fallback session management.
export function brokeredPreviewStorage() {
  if (typeof window === 'undefined') return undefined;
  
  // For EMBER production environments, always use localStorage
  return localStorage;
}
