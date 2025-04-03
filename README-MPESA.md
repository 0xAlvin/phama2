# M-Pesa Integration Guide

This guide explains how to set up and test M-Pesa integration in your application.

## Development Setup

When developing locally, M-Pesa's API requires callback URLs that are publicly accessible. Since `localhost` URLs aren't accessible from the internet, you need to use a tunneling service.

### Option 1: Use a Tunneling Service (Recommended)

1. Install [ngrok](https://ngrok.com/download) or another tunneling service

2. Start your Next.js application:
   ```
   npm run dev
   ```

3. In another terminal, start ngrok to create a tunnel to your local server:
   ```
   ngrok http 3000
   ```

4. Copy the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`)

5. Update your `.env` file:
   ```
   MPESA_CALLBACK_URL=https://abc123.ngrok.io
   ```

6. Restart your Next.js application

### Option 2: Use Safaricom's Test Callback (Sandbox Only)

For quick testing in sandbox mode, you can run without a proper callback URL. The application will use Safaricom's test endpoint, but note that your local application won't receive the callback data.

### Option 3: Deploy to Production

In production, your application will have a real domain name, and callbacks will work properly.

## Troubleshooting

### "Invalid CallBackURL" Error

This error occurs when:
1. You're using a `localhost` URL in your callback
2. Your ngrok tunnel has expired or changed
3. The URL format is incorrect

Solution:
- Ensure you're using a public URL or ngrok tunnel
- Make sure the URL is properly formatted and accessible
- For sandbox testing, you can leave `MPESA_CALLBACK_URL` blank to use Safaricom's test endpoint

### Authentication Errors

If you're getting authentication errors:
1. Validate your credentials using the validation script:
   ```
   node scripts/validate-mpesa-credentials.js
   ```
2. Ensure your consumer key and secret are correct
3. Check the environment setting (sandbox vs production)

## Test Phone Numbers

For sandbox testing, you can use these test phone numbers:
- `254708374149`
- `254700000000`

The test PIN is `12345`

## Resources

- [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)
