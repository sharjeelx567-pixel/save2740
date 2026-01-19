// Twilio SMS service - disabled until credentials configured
// To enable: npm install twilio
// import twilio from "twilio"
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function sendVerificationSMS(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  // SMS service disabled - Twilio not configured
  console.warn("[SMS] SMS service is not configured. Phone verification is disabled.")
  return false
}

export async function sendLoginOTP(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  // SMS service disabled - Twilio not configured
  console.warn("[SMS] SMS service is not configured. Phone login OTP is disabled.")
  return false
}

export async function sendTransactionAlert(
  phoneNumber: string,
  amount: string,
  type: "deposit" | "withdrawal"
): Promise<boolean> {
  // SMS service disabled - Twilio not configured
  console.warn("[SMS] SMS service is not configured. Transaction alerts are disabled.")
  return false
}
