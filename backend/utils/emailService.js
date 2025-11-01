import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

// Create reusable transporter
let transporter = null;
let sendgridConfigured = false;

// Configure SendGrid if API key is provided
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sendgridConfigured = true;
  console.log("SendGrid configured with API key");
}

function getTransporter() {
  if (!transporter) {
    // Use SMTP settings from environment variables
    const smtpConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    };

    // Add TLS options for better compatibility
    if (!smtpConfig.secure) {
      smtpConfig.requireTLS = true;
      smtpConfig.tls = {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      };
    }

    transporter = nodemailer.createTransport(smtpConfig);
  }
  return transporter;
}

export async function sendCanvasPartnerInvite({
  partnerEmail,
  partnerName,
  inviterName,
  canvasDate,
  canvasTime,
  durationHours,
  materials,
  notes,
  markerId,
}) {
  // Check if any email service is configured
  if (
    !sendgridConfigured &&
    (!process.env.SMTP_USER || !process.env.SMTP_PASS)
  ) {
    console.warn("Email not configured. Skipping partner notification.");
    console.warn(
      "SENDGRID_API_KEY:",
      process.env.SENDGRID_API_KEY ? "SET" : "NOT SET"
    );
    console.warn("SMTP_USER:", process.env.SMTP_USER ? "SET" : "NOT SET");
    console.warn("SMTP_PASS:", process.env.SMTP_PASS ? "SET" : "NOT SET");
    return { skipped: true };
  }

  console.log("Attempting to send email to:", partnerEmail);
  console.log("Using:", sendgridConfigured ? "SendGrid API" : "SMTP");

  try {
    const dateTimeStr = `${canvasDate} at ${canvasTime}`;
    const materialsStr =
      materials && materials.length > 0
        ? materials.join(", ")
        : "None specified";

    // Construct the app URL with marker ID
    let appUrl = process.env.APP_URL || "http://localhost:3001";
    // Ensure HTTPS for production URLs (not localhost)
    if (!appUrl.includes("localhost") && !appUrl.startsWith("https://")) {
      appUrl = appUrl.replace("http://", "https://");
    }
    const markerUrl = `${appUrl}/canvas?marker=${markerId}`;

    const textContent = `Hi ${partnerName},

${inviterName} has invited you to join a canvassing session!

Details:
- Date & Time: ${dateTimeStr}
- Duration: ${durationHours} hour${durationHours !== 1 ? "s" : ""}
- Materials: ${materialsStr}
${notes ? `- Notes: ${notes}` : ""}

View this canvas marker: ${markerUrl}

Thank you for your community organizing work!`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Canvas Session Invitation</h2>
        <p>Hi <strong>${partnerName}</strong>,</p>
        <p>${inviterName} has invited you to join a canvassing session!</p>
        
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Session Details</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>📅 Date & Time:</strong> ${dateTimeStr}</li>
            <li><strong>⏱️ Duration:</strong> ${durationHours} hour${
      durationHours !== 1 ? "s" : ""
    }</li>
            <li><strong>🧰 Materials:</strong> ${materialsStr}</li>
            ${notes ? `<li><strong>📝 Notes:</strong> ${notes}</li>` : ""}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${markerUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Canvas Marker</a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">Thank you for your community organizing work!</p>
      </div>
    `;

    // Use SendGrid API if configured, otherwise fall back to SMTP
    if (sendgridConfigured) {
      const fromEmail =
        process.env.SENDGRID_FROM_EMAIL ||
        process.env.SMTP_USER ||
        "noreply@yourdomain.com";
      const fromName = process.env.APP_NAME || "Angry Queers";

      const msg = {
        to: partnerEmail,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: "You've been invited to join a canvassing session",
        text: textContent,
        html: htmlContent,
      };

      const response = await sgMail.send(msg);
      console.log("Partner notification email sent via SendGrid");
      return { success: true, messageId: response[0].headers["x-message-id"] };
    } else {
      // Use SMTP
      const mailOptions = {
        from: `"${process.env.APP_NAME || "No ICE"}" <${
          process.env.SMTP_USER
        }>`,
        to: partnerEmail,
        subject: "You've been invited to join a canvassing session",
        text: textContent,
        html: htmlContent,
      };

      const info = await getTransporter().sendMail(mailOptions);
      console.log("Partner notification email sent via SMTP:", info.messageId);
      return { success: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error("Error sending partner notification email:", error);

    // Log more details for SendGrid errors
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }

    // Don't throw - we don't want email failures to block the canvas operation
    return { error: error.message };
  }
}
