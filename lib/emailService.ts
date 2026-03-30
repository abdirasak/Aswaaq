// Email Service for Production
// This file handles sending verification codes to users' emails

interface EmailService {
  sendVerificationCode(email: string, code: string): Promise<void>;
}

// Development: Log to console and show in UI
export const DevelopmentEmailService: EmailService = {
  async sendVerificationCode(email: string, code: string) {
    console.log(`[DEV] Verification code for ${email}: ${code}`);
    // In development, the code is shown in the UI alert
  }
};

// Production: Send actual email using Appwrite Functions
export const ProductionEmailService: EmailService = {
  async sendVerificationCode(email: string, code: string) {
    try {
      // Call your Appwrite Function endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT}/functions/send-email/executions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
        },
        body: JSON.stringify({
          to: email,
          subject: 'Aswaaq - Password Reset Code',
          template: 'verification-code',
          data: {
            code: code,
            expirationMinutes: 10,
            appName: 'Aswaaq'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Email service failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Email sent successfully:', result);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send verification email. Please try again.');
    }
  }
};

// Choose service based on environment
export const emailService = process.env.NODE_ENV === 'production' 
  ? ProductionEmailService 
  : DevelopmentEmailService;

// Helper function to send verification code
export const sendVerificationEmail = async (email: string, code: string) => {
  await emailService.sendVerificationCode(email, code);
};
