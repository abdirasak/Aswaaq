# Email Service Setup Guide for Production

This guide shows you how to set up actual email sending for password reset codes in production.

## 📧 How You'll Know Emails Are Being Sent

### **In Development (Current)**
- ✅ Code appears in console: `[DEV] Verification code for user@email.com: 123456`
- ✅ Code shows in alert popup in the app
- ❌ No actual email sent

### **In Production (After Setup)**
- ✅ User receives actual email with verification code
- ✅ Professional HTML email template
- ✅ Console logs: `Email sent successfully to: user@email.com`
- ❌ No code shown in alert (user must check email)

## 🚀 Production Setup Options

### **Option 1: Resend (Recommended - Easiest)**

1. **Sign up for Resend**: https://resend.com
2. **Get API Key**: Dashboard → API Keys → Create API Key
3. **Add to Appwrite Environment**:
   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxx
   ```

4. **Deploy Appwrite Function**:
   ```bash
   appwrite functions create
   appwrite functions createVariable --key RESEND_API_KEY --value "your_api_key"
   appwrite functions deploy
   ```

### **Option 2: SendGrid**

1. **Sign up for SendGrid**: https://sendgrid.com
2. **Get API Key**: Settings → API Keys → Create API Key
3. **Add to Appwrite Environment**:
   ```
   SENDGRID_API_KEY = SG.xxxxxxxxxxxxxxxxxx
   ```

### **Option 3: AWS SES**

1. **Set up AWS SES**: https://aws.amazon.com/ses/
2. **Verify your domain**
3. **Get credentials**
4. **Configure in function**

## 📋 Deployment Steps

### **Step 1: Choose Email Service**
Pick one of the options above and get your API key.

### **Step 2: Deploy Appwrite Function**

```bash
# Navigate to your project
cd c:\Users\abdi\Desktop\projects\aswaaq

# Deploy the email function
appwrite functions create \
  --function-id send-email \
  --name "Send Email" \
  --runtime node-18.0 \
  --execute "node main.js"

# Add environment variables
appwrite functions createVariable \
  --function-id send-email \
  --key RESEND_API_KEY \
  --value "your_resend_api_key"

# Deploy the function
appwrite functions deploy --function-id send-email
```

### **Step 3: Update Environment Variables**

Add this to your production `.env` file:
```bash
NODE_ENV=production
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

### **Step 4: Test Production Email**

1. **Build your app for production**
2. **Test password reset flow**
3. **Check email inbox** for verification code

## 🔍 Testing & Verification

### **Development Testing**
```bash
# Current behavior
npm start
# → Code shows in console and alert
# → No email sent
```

### **Production Testing**
```bash
# After deployment
# → User receives professional email
# → Code NOT shown in alert
# → Console: "Email sent successfully to: user@email.com"
```

## 📧 Email Template Preview

Users will receive a professional email like this:

```
┌─────────────────────────────────────┐
│           Aswaaq                    │
│     Password Reset Verification      │
├─────────────────────────────────────┤
│                                     │
│ Hello,                              │
│                                     │
│ You requested to reset your password │
│ for your Aswaaq account. Use the    │
│ verification code below:            │
│                                     │
│         1 2 3 4 5 6                 │
│                                     │
│ Important:                          │
│ • This code expires in 10 minutes   │
│ • Never share this code             │
│ • If you didn't request this,       │
│   please ignore                     │
│                                     │
│ Best regards,                       │
│ The Aswaaq Team                     │
└─────────────────────────────────────┘
```

## 🛠️ Troubleshooting

### **Email Not Sending?**
1. **Check API Key**: Verify it's correct and has permissions
2. **Check Function Logs**: Appwrite Console → Functions → Logs
3. **Check Environment Variables**: Ensure they're set correctly
4. **Check Email Service Status**: Resend/SendGrid status pages

### **Common Issues**
- **API Key Invalid**: Regenerate API key
- **Domain Not Verified**: Verify your domain in email service
- **Function Not Deployed**: Redeploy the function
- **Environment Not Production**: Set `NODE_ENV=production`

## 📊 Monitoring

### **Check Email Delivery**
```javascript
// In your function logs, you'll see:
log(`Email sent successfully to ${to}`);
error('Failed to send email:', err);
```

### **Monitor in Appwrite Console**
1. Go to Appwrite Console
2. Functions → send-email → Logs
3. Check for success/error messages

## ✅ Production Checklist

- [ ] Choose email service (Resend recommended)
- [ ] Get API key
- [ ] Deploy Appwrite function
- [ ] Set environment variables
- [ ] Set NODE_ENV=production
- [ ] Test with real email
- [ ] Verify email template looks good
- [ ] Check spam folder if needed

## 🎯 Result

After setup:
- ✅ **Development**: Code shows in alert and console
- ✅ **Production**: Professional email sent to user
- ✅ **Security**: No code exposure in production
- ✅ **User Experience**: Clear, professional emails

You'll know it's working when users start receiving actual emails instead of seeing the code in the app!
