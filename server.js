import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow both common dev ports
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Brevo API Configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Autoflowmation AI';
const ADMIN_EMAIL = process.env.BREVO_ADMIN_EMAIL;
const BREVO_API_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

// Validation
const validateConfig = () => {
  const missing = [];
  if (!BREVO_API_KEY) missing.push('BREVO_API_KEY');
  if (!SENDER_EMAIL) missing.push('BREVO_SENDER_EMAIL');
  if (!ADMIN_EMAIL) missing.push('BREVO_ADMIN_EMAIL');

  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

validateConfig();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Send email endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    console.log('📩 [' + new Date().toISOString() + '] POST /api/send-email');
    const { name, email, phone, company, requirements, budget, timeline } = req.body;
    console.log('📨 From:', email, '| Name:', name);

    // Validation
    if (!name || !email || !requirements) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, requirements'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Prepare email to admin
    const adminEmailContent = `
      <h2>New Form Submission from Autoflowmation AI</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || 'N/A')}</p>
      <p><strong>Company:</strong> ${escapeHtml(company || 'N/A')}</p>
      <p><strong>Requirements:</strong></p>
      <p>${escapeHtml(requirements).replace(/\n/g, '<br>')}</p>
      <p><strong>Budget:</strong> ${escapeHtml(budget || 'N/A')}</p>
      <p><strong>Timeline:</strong> ${escapeHtml(timeline || 'N/A')}</p>
    `;

    // Prepare email to user (confirmation)
    const userEmailContent = `
      <h2>Thank You for Your Submission!</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>We've received your requirements and will review them shortly. Our team will get back to you within 24 hours with next steps.</p>
      <p>In the meantime, if you have any questions, feel free to reach out.</p>
      <br>
      <p>Best regards,<br>Autoflowmation AI Team</p>
    `;

    // Send email to admin
    await sendBrevoEmail({
      to: [{ email: ADMIN_EMAIL, name: 'Admin' }],
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: `New Form Submission - ${name}`,
      htmlContent: adminEmailContent
    });

    // Send confirmation email to user
    await sendBrevoEmail({
      to: [{ email: email, name: name }],
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      subject: 'We Received Your Requirements - Autoflowmation AI',
      htmlContent: userEmailContent
    });

    return res.json({
      success: true,
      message: 'Emails sent successfully!'
    });

  } catch (error) {
    console.error('Email sending error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Send email using Brevo API
 */
async function sendBrevoEmail(emailData) {
  const response = await axios.post(BREVO_API_ENDPOINT, emailData, {
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email endpoint: POST http://localhost:${PORT}/api/send-email`);
});
