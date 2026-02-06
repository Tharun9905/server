# Autoflowmation AI - Backend

Express.js backend for handling email submissions via Brevo API.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Brevo credentials:

```bash
cp .env.example .env
```

Then edit `.env` with:
- **BREVO_API_KEY**: Get from https://app.brevo.com/settings/keys/api
- **BREVO_SENDER_EMAIL**: Your verified sender email (must be verified in Brevo)
- **BREVO_SENDER_NAME**: Display name for emails
- **BREVO_ADMIN_EMAIL**: Where admin notifications are sent

### 3. Get Brevo API Key

1. Go to [Brevo Dashboard](https://app.brevo.com)
2. Navigate to Settings → SMTP & API → API Keys
3. Copy your API key
4. Paste into `.env`

### 4. Verify Sender Email

1. In Brevo dashboard, go to Senders
2. Add and verify your sender email
3. Use that verified email in `BREVO_SENDER_EMAIL`

## Running

### Development (with auto-reload)
```bash
npm run dev
```

### Production
```bash
npm start
```

Server runs on `http://localhost:5000` by default.

## API Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Send Email
```
POST /api/send-email
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "company": "Acme Corp",
  "requirements": "We need automation for...",
  "budget": "$10,000 - $50,000",
  "timeline": "3 months"
}
```

**Required Fields:** `name`, `email`, `requirements`

**Response (Success):**
```json
{
  "success": true,
  "message": "Emails sent successfully!"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Frontend Integration

Update your React component to call this API:

```typescript
const handleSubmit = async (formData) => {
  try {
    const response = await fetch('http://localhost:5000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    if (data.success) {
      // Show success message
      setIsSuccess(true);
    } else {
      // Show error message
      console.error(data.message);
    }
  } catch (error) {
    console.error('Submission error:', error);
  }
};
```

## Security Features

✅ **API Key Protection**: Key never exposed to frontend  
✅ **Input Validation**: Email format and required fields validated  
✅ **XSS Prevention**: HTML escaping for user inputs  
✅ **CORS Configuration**: Only allow requests from your frontend  
✅ **Error Handling**: Secure error messages (no sensitive data leaked)

## Deployment

### Vercel
```bash
vercel
```

Add environment variables in Vercel dashboard.

### Heroku
```bash
heroku create your-app-name
heroku config:set BREVO_API_KEY=your_key
git push heroku main
```

### Railway/Render
Follow platform-specific deployment guides and add env variables.

## Troubleshooting

**Issue:** `BREVO_API_KEY is missing`
- Solution: Create `.env` file and add your API key

**Issue:** "Invalid email format" error
- Solution: Ensure email is valid and properly formatted

**Issue:** "Failed to send email"
- Check Brevo API key is correct
- Verify sender email is confirmed in Brevo
- Check internet connection

## License
MIT
