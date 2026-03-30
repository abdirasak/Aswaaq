// Appwrite Function for Sending Emails
// This function runs on Appwrite's server and sends actual emails


// Email service configuration (choose one)
const EMAIL_SERVICE = 'RESEND'; // Options: RESEND, SENDGRID, AWS_SES

// Resend Configuration (Recommended)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = 'noreply@aswaaq.app';

// SendGrid Configuration
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_FROM_EMAIL = 'noreply@aswaaq.app';

export default async ({ req, res, log, error }) => {
  try {
    const { to, subject, template, data } = JSON.parse(req.body);

    if (!to || !subject) {
      return res.json({ error: 'Missing required fields: to, subject' }, 400);
    }

    let emailContent;

    // Generate email content based on template
    switch (template) {
      case 'verification-code':
        emailContent = generateVerificationCodeEmail(data);
        break;
      default:
        emailContent = {
          html: `<p>${data.message || 'Default email content'}</p>`,
          text: data.message || 'Default email content'
        };
    }

    // Send email based on configured service
    let result;
    switch (EMAIL_SERVICE) {
      case 'RESEND':
        result = await sendEmailWithResend(to, subject, emailContent);
        break;
      case 'SENDGRID':
        result = await sendEmailWithSendGrid(to, subject, emailContent);
        break;
      default:
        throw new Error('No email service configured');
    }

    log(`Email sent successfully to ${to}`);
    return res.json({ 
      success: true, 
      messageId: result.id,
      to: to,
      subject: subject 
    });

  } catch (err) {
    error('Failed to send email:', err);
    return res.json({ 
      error: 'Failed to send email', 
      details: err.message 
    }, 500);
  }
};

// Generate verification code email content
function generateVerificationCodeEmail(data) {
  const { code, expirationMinutes, appName } = data;
  
  return {
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code - ${appName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .code { background: #E5E7EB; padding: 15px; margin: 20px 0; text-align: center; }
          .code-number { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${appName}</h1>
            <p>Password Reset Verification</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for your ${appName} account. Use the verification code below to proceed:</p>
            <div class="code">
              <div class="code-number">${code}</div>
            </div>
            <p><strong>Important:</strong></p>
            <ul>
              <li>This code will expire in ${expirationMinutes} minutes</li>
              <li>Never share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The ${appName} Team</p>
          </div>
          <div class="footer">
            <p>© 2024 ${appName}. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ${appName} - Password Reset Verification
      
      Hello,
      
      You requested to reset your password for your ${appName} account. 
      Your verification code is: ${code}
      
      This code will expire in ${expirationMinutes} minutes.
      
      Important:
      - Never share this code with anyone
      - If you didn't request this, please ignore this email
      
      Best regards,
      The ${appName} Team
    `
  };
}

// Send email using Resend (Recommended)
async function sendEmailWithResend(to, subject, content) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject: subject,
      html: content.html,
      text: content.text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

// Send email using SendGrid
async function sendEmailWithSendGrid(to, subject, content) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: to }],
      }],
      from: { email: SENDGRID_FROM_EMAIL },
      subject: subject,
      content: [
        { type: 'text/html', value: content.html },
        { type: 'text/plain', value: content.text },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }

  return { id: 'sent' }; // SendGrid doesn't return an ID in the same way
}
