import { Resend } from "resend";

// Initialize Resend
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (resend) {
  console.log("✅ Resend email service configured");
} else {
  console.warn("⚠️ RESEND_API_KEY not set - email notifications will be skipped");
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
  if (!resend) {
    console.warn("Email not configured. Skipping partner notification.");
    return { skipped: true };
  }

  console.log("Attempting to send email to:", partnerEmail);

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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Canvas Session Invitation</h1>
              </div>
              
              <div style="padding: 30px;">
                <p style="font-size: 16px; color: #111827; margin: 0 0 20px 0;">Hi <strong>${partnerName}</strong>,</p>
                <p style="font-size: 16px; color: #374151; margin: 0 0 30px 0;">${inviterName} has invited you to join a canvassing session!</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                  <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 18px;">Session Details</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>📅 Date & Time:</strong></td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px;">${dateTimeStr}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>⏱️ Duration:</strong></td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px;">${durationHours} hour${durationHours !== 1 ? "s" : ""}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>🧰 Materials:</strong></td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px;">${materialsStr}</td>
                    </tr>
                    ${notes ? `
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>📝 Notes:</strong></td>
                      <td style="padding: 8px 0; color: #111827; font-size: 14px;">${notes}</td>
                    </tr>
                    ` : ""}
                  </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${markerUrl}" style="display: inline-block; background-color: #ec4899; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Canvas Marker</a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">Thank you for your community organizing work! 💪</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">Angry Queers</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const fromName = process.env.APP_NAME || "Angry Queers";

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [partnerEmail],
      subject: "You've been invited to join a canvassing session",
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return { error: error.message };
    }

    console.log("✅ Partner notification email sent via Resend");
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Error sending partner notification email:", error);
    return { error: error.message };
  }
}

export async function sendVolunteerSignupNotification(formData) {
  if (!resend) {
    console.warn("Email not configured. Skipping volunteer signup notification.");
    return { skipped: true };
  }

  console.log("Attempting to send volunteer signup notification to: patricksegura@gmail.com");

  try {
    // Format availability as HTML
    const availabilityHtml = Object.keys(formData.availability)
      .map((day) => {
        const slots = formData.availability[day];
        if (slots.length > 0) {
          return `<div style="margin-bottom: 8px;">
            <strong style="color: #ec4899;">${day}:</strong><br/>
            <span style="color: #6b7280; font-size: 14px;">${slots.join("<br/>")}</span>
          </div>`;
        }
        return "";
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%); padding: 30px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🌈 New Volunteer Signup</h1>
                <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">Block Guardians and Faeries</p>
              </div>
              
              <div style="padding: 30px;">
                <h2 style="color: #111827; margin: 0 0 20px 0; border-bottom: 3px solid #ec4899; padding-bottom: 10px; font-size: 22px;">Volunteer Information</h2>
                
                <div style="margin-bottom: 25px;">
                  <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Personal Details</h3>
                  <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; width: 40%;"><strong>Name:</strong></td>
                      <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb;">${formData.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb;"><strong>Pronouns:</strong></td>
                      <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb;">${formData.pronouns || "Not provided"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb;"><strong>Mobile Number:</strong></td>
                      <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb;">${formData.mobile_number || "Not provided"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb;"><strong>Has Signal:</strong></td>
                      <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb;">${formData.has_signal ? "✅ Yes" : "❌ No"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb;"><strong>Signal Username:</strong></td>
                      <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb;">${formData.signal_username || "Not provided"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb;"><strong>Neighborhood:</strong></td>
                      <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb;"><strong style="color: #ec4899;">${formData.neighborhood}</strong></td>
                    </tr>
                  </table>
                </div>

                <div style="margin-bottom: 25px;">
                  <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Roles (${formData.roles.length} selected)</h3>
                  <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px;">
                    <ul style="margin: 0; padding-left: 20px; color: #374151;">
                      ${formData.roles.map((role) => `<li style="padding: 5px 0;">${role}</li>`).join("")}
                    </ul>
                  </div>
                </div>

                <div style="margin-bottom: 25px;">
                  <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Availability</h3>
                  <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px;">
                    ${availabilityHtml || '<p style="margin: 0; color: #6b7280;">No availability specified</p>'}
                  </div>
                </div>

                <div style="margin-bottom: 25px;">
                  <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Trainings Completed</h3>
                  <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px;">
                    <p style="margin: 0; white-space: pre-wrap; color: #374151;">${formData.trainings_completed}</p>
                  </div>
                </div>

                <div style="margin-bottom: 25px;">
                  <h3 style="color: #374151; font-size: 18px; margin: 0 0 15px 0;">Consent & Accessibility</h3>
                  <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; width: 40%;"><strong>Signal Consent:</strong></td>
                      <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb;">${formData.consent_signal ? "✅ Yes" : "❌ No"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; vertical-align: top;"><strong>Accessibility Needs:</strong></td>
                      <td style="padding: 12px; background-color: #ffffff; border: 1px solid #e5e7eb;">${formData.accessibility_needs || "None specified"}</td>
                    </tr>
                  </table>
                </div>

                <div style="background-color: #fef3c7; border: 2px solid #fbbf24; padding: 20px; border-radius: 6px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>📅 Submitted:</strong> ${new Date().toLocaleString("en-US", {
                      timeZone: "America/Chicago",
                      dateStyle: "full",
                      timeStyle: "long",
                    })}
                  </p>
                </div>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0;">Angry Queers - Block Guardians and Faeries</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const recipientEmail = "patricksegura@gmail.com";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const fromName = process.env.APP_NAME || "Angry Queers";

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [recipientEmail],
      subject: `New Volunteer Signup: ${formData.name} - ${formData.neighborhood}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      return { error: error.message };
    }

    console.log("✅ Volunteer signup notification sent via Resend");
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Error sending volunteer signup notification:", error);
    return { error: error.message };
  }
}
