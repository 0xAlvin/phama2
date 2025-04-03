/**
 * Script to validate M-Pesa credentials
 * 
 * Run with: node scripts/validate-mpesa-credentials.js
 */

const axios = require('axios');
require('dotenv').config();

async function validateMpesaCredentials() {
  try {
    console.log('Validating M-Pesa credentials...');
    
    const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
    const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
    const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
    
    if (!MPESA_CONSUMER_KEY) {
      console.error('❌ MPESA_CONSUMER_KEY is missing in your .env file');
      return false;
    }
    
    if (!MPESA_CONSUMER_SECRET) {
      console.error('❌ MPESA_CONSUMER_SECRET is missing in your .env file');
      return false;
    }
    
    console.log('Environment:', MPESA_ENV);
    console.log('Consumer Key (first 10 chars):', MPESA_CONSUMER_KEY.substring(0, 10) + '...');
    console.log('Consumer Secret (first 10 chars):', MPESA_CONSUMER_SECRET.substring(0, 10) + '...');
    
    // Base URL based on environment
    const MPESA_BASE_URL = MPESA_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
    
    // Generate auth string
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    
    console.log('Generated auth token (first 20 chars):', auth.substring(0, 20) + '...');
    console.log('Making test request to M-Pesa API...');
    
    const response = await axios({
      method: 'get',
      url: `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    
    if (response.data && response.data.access_token) {
      console.log('✅ SUCCESS! M-Pesa credentials are valid!');
      console.log('Access token received (first few characters):', response.data.access_token.substring(0, 10) + '...');
      return true;
    } else {
      console.error('❌ Invalid response format from M-Pesa API');
      console.error('Full response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error validating M-Pesa credentials:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 400) {
        console.error('The 400 Bad Request error typically means your consumer key or secret is not valid.');
      } else if (error.response.status === 401) {
        console.error('The 401 Unauthorized error means your credentials were rejected.');
      }
    } else if (error.request) {
      console.error('No response received from the server. The server might be down or there might be network issues.');
    } else {
      console.error('Error:', error.message);
    }
    
    return false;
  }
}

// Execute validation
validateMpesaCredentials()
  .then(isValid => {
    if (!isValid) {
      console.log('\n📋 Troubleshooting tips:');
      console.log('1. Double-check your MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET values');
      console.log('2. Ensure you are using the correct environment (sandbox/production)');
      console.log('3. For sandbox, use the standard test credentials provided by Safaricom');
      console.log('4. If using your own credentials, check if they have expired or been revoked');
      console.log('5. Verify there are no whitespace characters in your credentials');
      console.log('6. If you are using the Safaricom Developer Portal, regenerate your credentials');
    } else {
      console.log('\n🎉 Next steps:');
      console.log('- Your M-Pesa integration should now work correctly');
      console.log('- Try initiating an STK push or B2C payment to confirm');
    }
    process.exit(isValid ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
