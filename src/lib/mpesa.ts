import axios from 'axios';

// M-Pesa API configuration
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || '';
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || '';
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';

// Base URLs for Safaricom APIs
const MPESA_BASE_URL = MPESA_ENV === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

// Get OAuth token for authentication
export async function getMpesaToken(): Promise<string> {
  try {
    // Validate credentials first
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
      throw new Error('M-Pesa API credentials are missing');
    }

    console.log('Requesting M-Pesa token with credentials:');
    console.log('- Consumer Key: ' + (MPESA_CONSUMER_KEY ? MPESA_CONSUMER_KEY.substring(0, 10) + '...' : 'missing'));
    console.log('- Consumer Secret: ' + (MPESA_CONSUMER_SECRET ? MPESA_CONSUMER_SECRET.substring(0, 10) + '...' : 'missing'));
    
    // Create the base64 encoded auth string
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    
    // Use the proper URL structure for the Safaricom API OAuth token endpoint
    const tokenUrl = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
    
    console.log(`Making auth request to: ${tokenUrl}`);
    
    const response = await axios({
      method: 'get',
      url: tokenUrl,
      headers: {
        'Authorization': `Basic ${auth}`
      },
      // Don't add Content-Type for simple GET requests as it can cause issues
    });
    
    console.log('M-Pesa token response:', JSON.stringify(response.data));
    
    if (!response.data || !response.data.access_token) {
      console.error('Invalid response format from M-Pesa API:', response.data);
      throw new Error('Failed to get access token: Invalid response format');
    }
    
    console.log('Successfully retrieved M-Pesa token');
    return response.data.access_token;
  } catch (error: any) {
    console.error('Error getting M-Pesa token:', error);
    
    // Enhanced error reporting
    if (error.response) {
      console.error(`Full error response data:`, JSON.stringify(error.response.data));
      console.error(`Status code: ${error.response.status}`);
      
      // For common error codes, provide more specific guidance
      if (error.response.status === 400) {
        console.error('400 Bad Request: Check your consumer key and secret as they may be invalid');
      } else if (error.response.status === 401) {
        console.error('401 Unauthorized: Authentication failed - credentials are incorrect');
      }
    }
    
    throw new Error(`M-Pesa authentication failed: ${error.message || 'Unknown error'}`);
  }
}

// Validate and format phone number
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats (0712345678, 712345678, 254712345678, +254712345678)
  if (cleaned.startsWith('0')) {
    // Convert 0712345678 to 254712345678
    cleaned = '254' + cleaned.substring(1);
  } else if (!cleaned.startsWith('254')) {
    // If it doesn't start with 254, add it
    cleaned = '254' + cleaned;
  }
  
  // Ensure it's a proper Kenya number format
  if (!/^254\d{9}$/.test(cleaned)) {
    throw new Error('Invalid phone number format. Use format: 07XXXXXXXX or 254XXXXXXXXX');
  }
  
  console.log(`Phone number formatted: Original=${phoneNumber}, Formatted=${cleaned}`);
  return cleaned;
}

// Initialize STK Push
export async function initiateSTKPush(
  phoneNumber: string, 
  amount: number, 
  callbackUrl: string,
  accountReference: string,
  transactionDesc: string
): Promise<any> {
  try {
    if (!MPESA_SHORTCODE) {
      throw new Error('M-Pesa shortcode not configured');
    }
    
    if (!MPESA_PASSKEY) {
      throw new Error('M-Pesa passkey not configured');
    }
    
    // Sanitize and validate callback URL
    let sanitizedCallbackUrl = callbackUrl;
    
    // In sandbox mode, we can use a special ngrok URL or the Safaricom test callback
    if (MPESA_ENV === 'sandbox') {
      // If we're in development and no proper URL is provided, use Safaricom's test callback endpoint
      if (sanitizedCallbackUrl.includes('localhost') && !process.env.MPESA_CALLBACK_URL) {
        console.warn('WARNING: Using localhost URL for M-Pesa callback. This will not work in production!');
        console.warn('Set MPESA_CALLBACK_URL in .env to your public-facing URL (e.g., from ngrok)');
        
        // For sandbox testing, you can use Safaricom's test callback endpoint
        // Note: This won't send data back to your app but will allow the transaction to complete
        sanitizedCallbackUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query';
      }
    } else {
      // For production, enforce HTTPS
      if (!/^https:\/\//.test(sanitizedCallbackUrl)) {
        throw new Error('Callback URL must be a secure HTTPS URL in production');
      }
    }

    const token = await getMpesaToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    console.log('STK Push Request Data:', {
      shortcode: MPESA_SHORTCODE,
      timestamp,
      phoneNumber: formattedPhone,
      amount: Math.round(amount),
      callbackUrl: sanitizedCallbackUrl, // Log the sanitized URL
      accountReference,
      transactionDesc,
      environment: MPESA_ENV
    });
    
    const response = await axios({
      method: 'post',
      url: `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // M-Pesa expects whole numbers
        PartyA: formattedPhone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: sanitizedCallbackUrl, // Use sanitized URL
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      }
    });

    console.log('STK Push Response Data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error initiating STK Push:', error);
    
    // Extract the error details from the Safaricom API response if available
    const responseData = error.response?.data;
    if (responseData) {
      console.error('M-Pesa API Error Response:', responseData);
      throw new Error(`M-Pesa Error: ${JSON.stringify(responseData)}`);
    }
    
    throw error;
  }
}

// Initialize B2C Payment
export async function initiateB2CPayment({
  amount,
  phoneNumber,
  remarks = 'Payment',
  occasion = '',
  commandID = 'BusinessPayment'
}: {
  amount: number;
  phoneNumber: string;
  remarks?: string;
  occasion?: string;
  commandID?: 'BusinessPayment' | 'SalaryPayment' | 'PromotionPayment';
}): Promise<any> {
  try {
    const token = await getMpesaToken();
    
    // Format phone number (remove leading + if present)
    const formattedPhone = phoneNumber.replace(/^\+/, '');
    
    // Generate a unique conversation ID
    const originatorConversationID = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Construct the full URLs for callback endpoints
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const queueTimeOutURL = `${baseUrl}/api/payments/mpesa/b2c/queue`;
    const resultURL = `${baseUrl}/api/payments/mpesa/b2c/result`;
    
    const response = await axios({
      method: 'post',
      url: `${MPESA_BASE_URL}/mpesa/b2c/v3/paymentrequest`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        OriginatorConversationID: originatorConversationID,
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: commandID,
        Amount: Math.round(amount), // M-Pesa expects whole numbers
        PartyA: MPESA_SHORTCODE,
        PartyB: formattedPhone,
        Remarks: remarks,
        QueueTimeOutURL: queueTimeOutURL,
        ResultURL: resultURL,
        Occasion: occasion
      }
    });
    
    return {
      ...response.data,
      originatorConversationID
    };
  } catch (error) {
    console.error('Error initiating B2C payment:', error);
    throw error;
  }
}

// Generate timestamp in the format required by M-Pesa (YYYYMMDDHHmmss)
function generateTimestamp(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Generate the password used for STK Push
function generatePassword(timestamp: string): string {
  return Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
}

// Check STK Push transaction status
export async function checkTransactionStatus(checkoutRequestID: string): Promise<any> {
  try {
    const token = await getMpesaToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);
    
    const response = await axios({
      method: 'post',
      url: `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error checking transaction status:', error);
    throw error;
  }
}
