import nodemailer from 'nodemailer';

interface AlertDetails {
  signature: string;
  source_ip: string;
  count: number;
}

export async function sendCriticalAlert(details: AlertDetails): Promise<void> {
  // 1. Setup Transporter
  // In production, these would be process.env.SMTP_HOST, etc.
  // For this demo, we can fall back to a generated Ethereal account if env vars are missing.
  
  let transporter;

  try {
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development Fallback: Create a temporary test account
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[MAIL] Using Ethereal Test Account: ${testAccount.user}`);
    }
  } catch (error) {
    console.error('[MAIL] Failed to create transporter:', error);
    throw new Error('Failed to initialize email transporter');
  }

  // 2. Format the Email Body (HTML)
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #ef4444;">🚨 CRITICAL SECURITY ALERT</h2>
      <p>The IDS has detected a <strong>Severity 1</strong> threat on the network.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background-color: #f3f4f6;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Signature:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #dc2626;">${details.signature}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Source IP:</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${details.source_ip}</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Occurrences (Last 1m):</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${details.count}</td>
        </tr>
      </table>

      <p style="margin-top: 20px; font-size: 12px; color: #666;">
        Log into the dashboard immediately to investigate.
      </p>
    </div>
  `;

  // 3. Send Mail
  const recipientEmail = process.env.ALERT_EMAIL_RECIPIENT || "admin@yourdomain.com";
  
  try {
    const info = await transporter.sendMail({
      from: '"OpenIDS System" <alerts@yourdomain.com>',
      to: recipientEmail,
      subject: `[Sev-1] ${details.signature} detected from ${details.source_ip}`,
      html: htmlBody,
    });

    console.log(`[MAIL] Message sent: ${info.messageId}`);
    
    // If using Ethereal, log the preview URL so you can click and see it in console
    if (!process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[MAIL] Preview URL: ${previewUrl}`);
      }
    }
  } catch (error) {
    console.error('[MAIL] Failed to send email:', error);
    throw new Error(`Failed to send critical alert email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}