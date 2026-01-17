# Gmail Email Setup Guide

## Problem
You're seeing this error:
```
535-5.7.8 Username and Password not accepted
```

This means Gmail is rejecting your authentication credentials.

## Solution: Use Gmail App Passwords

Gmail no longer accepts regular passwords for SMTP. You need to use **App Passwords**.

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Complete the setup process

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Save2740" as the name
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update .env.local

Add these to your `.env.local` file:

```env
# Gmail Configuration
EMAIL_SERVICE=gmail
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM=your-email@gmail.com

# Alternative (if using EMAIL_ prefix)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Important Notes:**
- Use your **full Gmail address** (e.g., `shahidx345@gmail.com`)
- Use the **16-character App Password** (remove spaces if any)
- Do NOT use your regular Gmail password

### Step 4: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Test

1. Go to forgot password page
2. Enter your email
3. Check console - should see: `[EMAIL] Password reset OTP sent successfully`
4. Check your email inbox for the OTP

## Alternative: Use Other Email Services

If you don't want to use Gmail, you can use:

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@save2740.com
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=noreply@save2740.com
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASSWORD=your-aws-secret-key
SMTP_FROM=noreply@save2740.com
```

## Troubleshooting

### Still getting 535 error?
1. ✅ Make sure 2FA is enabled
2. ✅ Use App Password (not regular password)
3. ✅ Remove spaces from App Password
4. ✅ Restart dev server after changing .env.local
5. ✅ Check that email address matches exactly

### Email not sending but no error?
- Check spam folder
- Verify SMTP credentials are correct
- Check console logs for detailed error messages

### For Development/Testing
If you don't want to configure email right now, the app will still work:
- OTP is generated and stored in database
- You can manually check the database for the OTP
- Or use a test email service like Mailtrap

## Quick Test

After setup, test with:
```bash
# The forgot password flow should now send emails
# Check console for success message
```

---

**Need Help?** Check the console logs for detailed error messages.
