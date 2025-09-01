// Razorpay Configuration
// Replace these with your actual Razorpay keys from https://dashboard.razorpay.com/app/website-app-settings/api-keys

export const RAZORPAY_CONFIG = {
  // Test Mode Key (starts with rzp_test_)
  KEY_ID: 'rzp_test_9999999999', // Replace with your test key
  
  // For production, use live key (starts with rzp_live_)
  // KEY_ID: 'rzp_live_xxxxxxxxxx', // Replace with your live key
  
  // Payment options
  CURRENCY: 'INR',
  COMPANY_NAME: 'SlideForge AI',
} as const;

// Payment methods configuration
export const PAYMENT_METHODS = {
  upi: true,           // UPI payments
  card: true,          // Credit/Debit cards
  netbanking: true,    // Net banking
  wallet: true,        // Paytm, PhonePe, etc.
  emi: true,           // EMI options
  paylater: true,      // Pay later options
} as const;