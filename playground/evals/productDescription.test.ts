/**
 * Test configuration for product description generator
 * This file contains all the assertions and test rules
 */

import { productDescriptionHandle } from "../agents/productDescription.ts";

/**
 * Global rules that apply to ALL test cases
 * These assertions run every time any test case is executed
 */
productDescriptionHandle.for_all((a) => {
  a.ensure_doesnt_contain("VR")          // Never mention VR
   .ensure_doesnt_contain("virtual tour") // Never mention virtual tour  
   .ensure_response_time_under(5000)     // Must respond within 5 seconds
   .ensure_length_over(50);              // Must be at least 50 characters
});

/**
 * Specific test cases with their own assertions
 */
productDescriptionHandle.for_input("Wireless Earbuds", (a) => {
  a.ensure_contains("wireless")          // Must mention wireless
   .ensure_contains("sound");            // Must mention sound
});

productDescriptionHandle.for_input("iPhone 15 Pro", (a) => {
  a.ensure_contains("iPhone")            // Must mention iPhone
   .ensure_contains("technology");       // Must mention technology
});

// Tests configured - CLI will show status

// Export the handle so the CLI can discover and run it
export { productDescriptionHandle };