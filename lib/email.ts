type InviteEmail = {
  to: string;
  title: string;
  hostEmail: string | null;
  startTime: string;
  fastingHoursGoal: number;
  inviteUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatInviteStart(startTime: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(startTime));
}

function buildInviteHtml({
  title,
  hostEmail,
  startTime,
  fastingHoursGoal,
  inviteUrl
}: InviteEmail) {
  const safeTitle = escapeHtml(title);
  const safeHost = hostEmail ? escapeHtml(hostEmail) : "A friend";
  const safeUrl = escapeHtml(inviteUrl);

  return `
    <div style="font-family: Arial, sans-serif; color: #20302a; line-height: 1.5;">
      <h1 style="margin: 0 0 12px; font-size: 24px;">Join ${safeTitle}</h1>
      <p style="margin: 0 0 16px;">${safeHost} invited you to fast together in HealthInHand.</p>
      <div style="margin: 0 0 20px; padding: 16px; border: 1px solid #dce8d6; border-radius: 8px; background: #fbfaf6;">
        <p style="margin: 0 0 8px;"><strong>Starts:</strong> ${escapeHtml(formatInviteStart(startTime))}</p>
        <p style="margin: 0;"><strong>Goal:</strong> ${fastingHoursGoal} hours</p>
      </div>
      <a href="${safeUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #f47f58; color: white; text-decoration: none; font-weight: 700;">
        Join shared fast
      </a>
      <p style="margin: 20px 0 0; font-size: 13px; color: #78716c;">
        If the button does not work, open this link: ${safeUrl}
      </p>
    </div>
  `;
}

export function parseEmailList(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((email): email is string => typeof email === "string")
          .flatMap((email) => email.split(/[\s,;]+/))
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }

  if (typeof value !== "string") {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export async function sendInviteEmail(invite: InviteEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      error: "Missing RESEND_API_KEY or RESEND_FROM_EMAIL."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: invite.to,
      subject: `Join ${invite.title} on HealthInHand`,
      html: buildInviteHtml(invite)
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();

    return {
      ok: false,
      error: errorBody || `Resend returned ${response.status}.`
    };
  }

  return {
    ok: true,
    error: null
  };
}
