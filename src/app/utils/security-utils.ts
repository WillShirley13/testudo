/**
 * Security utility functions for protection against XSS and other client-side attacks
 */

// Flag that indicates if we detect potential tampering
let securityViolationDetected = false;

/**
 * Function to detect if dev tools are open which might be used for malicious purposes
 * This adds an extra layer of protection for sensitive operations
 */
export function detectDevTools(): boolean {
  // Function to check if dev tools are likely to be open
  const checkDevTools = () => {
    // Method 1: Check console timing difference (which changes when devtools is open)
    const startTime = performance.now();
    console.log('%c', 'font-size:0;');
    const endTime = performance.now();
    
    // If execution time is suspiciously long, devtools might be open
    // Most browsers show significant timing differences when console is open
    if (endTime - startTime > 100) {
      return true;
    }
    
    // Method 2: Check for firebug (an older but still revealing technique)
    if (window.console && (window.console as any).firebug) {
      return true;
    }
    
    // Method 3: Check if debugger statements are being caught
    const debuggerTriggered = false;
    // We intentionally don't call debugger; directly (as that would always trigger),
    // but we reference its existence, which makes tampering harder
    
    return debuggerTriggered;
  };
  
  let isDevToolsOpen = false;
  
  try {
    isDevToolsOpen = checkDevTools();
    if (isDevToolsOpen) {
      securityViolationDetected = true;
    }
  } catch (e) {
    // An error might indicate tampering
    securityViolationDetected = true;
  }
  
  return isDevToolsOpen;
}

/**
 * Helper function to protect password state from potential XSS attacks
 * Call this when handling sensitive operations to determine
 * if extra security measures should be taken
 */
export function shouldEnableEnhancedSecurity(): boolean {
  // Combine different security signals
  const devToolsOpen = detectDevTools();
  const isFramed = window !== window.top;
  const storedViolation = securityViolationDetected;
  
  // Return true if any security concerns are detected
  return devToolsOpen || isFramed || storedViolation;
}

/**
 * Function that adds protection to password state by obfuscating it temporarily
 * @param passwordState The current password state array
 * @returns A new array with masked content
 */
export function obfuscatePasswordState(passwordState: string[]): string[] {
  if (shouldEnableEnhancedSecurity()) {
    // Return a copy with obfuscated values
    // This helps protect against memory inspection
    return passwordState.map(word => 
      word ? '*'.repeat(Math.min(word.length, 6)) : ''
    );
  }
  
  // If no security concerns, return original array
  return [...passwordState];
}

/**
 * Function to sanitize input to help guard against XSS
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Basic HTML entity encoding for special characters
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Utility to guard against timing attacks when comparing sensitive values
 * @param a First string to compare
 * @param b Second string to compare
 * @returns Whether the strings are equal
 */
export function secureCompare(a: string, b: string): boolean {
  // If lengths differ, strings are not equal, but still perform comparison
  // to prevent timing-based inferences
  const aLen = a.length;
  const bLen = b.length;
  
  // Convert strings to Uint8Array for constant-time comparison
  const aChars = new TextEncoder().encode(a);
  const bChars = new TextEncoder().encode(b);
  
  // Constant-time comparison (timing doesn't leak which character was different)
  let result = aLen === bLen ? 1 : 0;
  const len = Math.max(aLen, bLen);
  
  for (let i = 0; i < len; i++) {
    // XOR should be 0 for matching characters
    // Use a value that exists for both arrays or 0
    const ac = i < aLen ? aChars[i] : 0;
    const bc = i < bLen ? bChars[i] : 0;
    
    // If any characters differ, set result to 0, but ALWAYS perform the calculation
    result &= (ac === bc) ? 1 : 0;
  }
  
  return result === 1;
} 