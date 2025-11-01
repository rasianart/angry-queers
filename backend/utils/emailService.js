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

export async function sendVolunteerSignupNotification(formData) {
  // Check if any email service is configured
  if (
    !sendgridConfigured &&
    (!process.env.SMTP_USER || !process.env.SMTP_PASS)
  ) {
    console.warn(
      "Email not configured. Skipping volunteer signup notification."
    );
    return { skipped: true };
  }

  console.log(
    "Attempting to send volunteer signup notification to: vmartin90@icloud.com"
  );
  console.log("Using:", sendgridConfigured ? "SendGrid API" : "SMTP");

  try {
    // Format availability as a readable string
    const availabilityFormatted = Object.keys(formData.availability)
      .map((day) => {
        const slots = formData.availability[day];
        if (slots.length > 0) {
          return `${day}: ${slots.join(", ")}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");

    // Format roles
    const rolesFormatted = formData.roles.join(", ");

    const textContent = `NEW VOLUNTEER SIGNUP

Name: ${formData.name}
Pronouns: ${formData.pronouns || "Not provided"}
Mobile Number: ${formData.mobile_number || "Not provided"}
Has Signal: ${formData.has_signal ? "Yes" : "No"}
Signal Username: ${formData.signal_username || "Not provided"}

Neighborhood: ${formData.neighborhood}

Roles Selected (${formData.roles.length}):
${rolesFormatted}

Availability:
${availabilityFormatted}

Trainings Completed:
${formData.trainings_completed}

Signal Consent: ${formData.consent_signal ? "Yes" : "No"}

Accessibility Needs:
${formData.accessibility_needs || "None specified"}

Submitted at: ${new Date().toLocaleString("en-US", {
      timeZone: "America/Chicago",
    })}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🌈 New Volunteer Signup</h1>
          <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Block Guardians and Faeries</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <h2 style="color: #111827; margin-top: 0; border-bottom: 2px solid #ec4899; padding-bottom: 10px;">Volunteer Information</h2>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Personal Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb;"><strong>Name:</strong></td>
                <td style="padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb;">${
                  formData.name
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb;"><strong>Pronouns:</strong></td>
                <td style="padding: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb;">${
                  formData.pronouns || "Not provided"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb;"><strong>Mobile Number:</strong></td>
                <td style="padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb;">${
                  formData.mobile_number || "Not provided"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb;"><strong>Has Signal:</strong></td>
                <td style="padding: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb;">${
                  formData.has_signal ? "✅ Yes" : "❌ No"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb;"><strong>Signal Username:</strong></td>
                <td style="padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb;">${
                  formData.signal_username || "Not provided"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb;"><strong>Neighborhood:</strong></td>
                <td style="padding: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb;"><strong>${
                  formData.neighborhood
                }</strong></td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Roles (${
              formData.roles.length
            } selected)</h3>
            <div style="background-color: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px;">
              <ul style="margin: 0; padding-left: 20px;">
                ${formData.roles
                  .map((role) => `<li style="padding: 3px 0;">${role}</li>`)
                  .join("")}
              </ul>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Availability</h3>
            <div style="background-color: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px;">
              ${Object.keys(formData.availability)
                .map((day) => {
                  const slots = formData.availability[day];
                  if (slots.length > 0) {
                    return `<div style="margin-bottom: 8px;">
                    <strong style="color: #ec4899;">${day}:</strong><br/>
                    <span style="color: #6b7280; font-size: 14px;">${slots.join(
                      "<br/>"
                    )}</span>
                  </div>`;
                  }
                  return "";
                })
                .join("")}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Trainings Completed</h3>
            <div style="background-color: #ffffff; padding: 15px; border: 1px solid #e5e7eb; border-radius: 5px;">
              <p style="margin: 0; white-space: pre-wrap;">${
                formData.trainings_completed
              }</p>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 16px; margin-bottom: 10px;">Consent & Accessibility</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb;"><strong>Signal Consent:</strong></td>
                <td style="padding: 8px; background-color: #ffffff; border: 1px solid #e5e7eb;">${
                  formData.consent_signal ? "✅ Yes" : "❌ No"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb; vertical-align: top;"><strong>Accessibility Needs:</strong></td>
                <td style="padding: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb;">${
                  formData.accessibility_needs || "None specified"
                }</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>📅 Submitted:</strong> ${new Date().toLocaleString(
                "en-US",
                {
                  timeZone: "America/Chicago",
                  dateStyle: "full",
                  timeStyle: "long",
                }
              )}
            </p>
          </div>
        </div>
        
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Angry Queers - Block Guardians and Faeries</p>
        </div>
      </div>
    `;

    const recipientEmail = "vmartin90@icloud.com";

    // Use SendGrid API if configured, otherwise fall back to SMTP
    if (sendgridConfigured) {
      const fromEmail =
        process.env.SENDGRID_FROM_EMAIL ||
        process.env.SMTP_USER ||
        "noreply@yourdomain.com";
      const fromName = process.env.APP_NAME || "Angry Queers";

      const msg = {
        to: recipientEmail,
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: `New Volunteer Signup: ${formData.name} - ${formData.neighborhood}`,
        text: textContent,
        html: htmlContent,
      };

      const response = await sgMail.send(msg);
      console.log("Volunteer signup notification sent via SendGrid");
      return { success: true, messageId: response[0].headers["x-message-id"] };
    } else {
      // Use SMTP
      const mailOptions = {
        from: `"${process.env.APP_NAME || "Angry Queers"}" <${
          process.env.SMTP_USER
        }>`,
        to: recipientEmail,
        subject: `New Volunteer Signup: ${formData.name} - ${formData.neighborhood}`,
        text: textContent,
        html: htmlContent,
      };

      const info = await getTransporter().sendMail(mailOptions);
      console.log(
        "Volunteer signup notification sent via SMTP:",
        info.messageId
      );
      return { success: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error("Error sending volunteer signup notification:", error);

    // Log more details for SendGrid errors
    if (error.response && error.response.body) {
      console.error(
        "SendGrid error details:",
        JSON.stringify(error.response.body, null, 2)
      );
    }

    // Don't throw - we don't want email failures to block the signup
    return { error: error.message };
  }
}
