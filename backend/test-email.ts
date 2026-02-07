import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

async function main() {
    console.log('Sending test email...');
    console.log(`From: ${process.env.SMTP_USER}`);
    console.log(`To: ${process.env.SMTP_USER}`); // Send to self

    try {
        const info = await transporter.sendMail({
            from: `"Save2740 Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to self for testing
            subject: "Test Email from Save2740",
            text: "If you receive this, your SMTP configuration is working correctly!",
            html: "<b>If you receive this, your SMTP configuration is working correctly!</b>",
        });

        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

main().catch(console.error);
