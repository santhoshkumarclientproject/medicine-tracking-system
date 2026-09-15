export async function sendEmailNotification({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey || apiKey.startsWith("SG.your")) {
    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "alerts@medtrack.system", name: "MedTrack Clinical Alerts" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    return { success: res.ok, status: res.status };
  } catch (err) {
    console.error("Failed to send email via SendGrid:", err);
    return { success: false, error: String(err) };
  }
}

export async function sendSmsNotification({
  to,
  body,
}: {
  to: string;
  body: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from || accountSid.startsWith("ACxxx")) {
    console.log(`[SIMULATED SMS] To: ${to} | Body: ${body}`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      }
    );
    return { success: res.ok, status: res.status };
  } catch (err) {
    console.error("Failed to send SMS via Twilio:", err);
    return { success: false, error: String(err) };
  }
}
