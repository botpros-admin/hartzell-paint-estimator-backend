# Paint Estimator Backend

Simple Node.js backend for handling Bitrix24 API calls.

## Quick Deploy to Render

1. Fork/Clone this repository
2. Create account at https://render.com
3. New Web Service → Connect your repo
4. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Deploy!

## Environment Variables

None required! The Bitrix24 webhook is included in the code.

## Updating CORS

After deploying, update the `allowedOrigins` in server.js with your Netlify URL.

## Test Endpoints

- Health Check: `GET /`
- Test API: `GET /api/test`
- Bitrix24 Proxy: `POST /api/bitrix/:method`
