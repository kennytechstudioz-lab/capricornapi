"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmailHtml = buildEmailHtml;
function buildEmailHtml(opts) {
    const { logoUrl, bannerUrl, title, greeting, content, companyName = process.env.EMAIL_FROM_NAME || "Capricorn Energy", companyEmail = process.env.EMAIL_FROM_ADDRESS || "", year = new Date().getFullYear(), } = opts;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f0f2f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; }
    a { color: #c8a70e; text-decoration: none; }
    p { margin: 0 0 16px 0; }
    ul, ol { padding-left: 20px; margin: 0 0 16px 0; }
    li { margin-bottom: 6px; }
    h1, h2, h3 { margin: 0 0 12px 0; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- LOGO ROW -->
          <tr>
            <td align="center" style="background:#0d0e12; padding: 28px 40px;">
              ${logoUrl
        ? `<img src="${logoUrl}" alt="${companyName}" style="height:48px; max-width:220px; object-fit:contain;" />`
        : `<span style="font-size:22px; font-weight:900; color:#e4c126; letter-spacing:1px;">${companyName}</span>`}
            </td>
          </tr>

          ${bannerUrl ? `
          <!-- BANNER ROW -->
          <tr>
            <td style="padding:0;">
              <img src="${bannerUrl}" alt="Banner" style="width:100%; max-height:220px; object-fit:cover; display:block;" />
            </td>
          </tr>` : ""}

          <!-- TITLE ROW -->
          <tr>
            <td align="center" style="background:#0d0e12; border-top: 3px solid #e4c126; padding: 24px 40px 20px;">
              <h1 style="font-size:22px; font-weight:900; color:#ffffff; letter-spacing:0.5px; line-height:1.3;">${title}</h1>
            </td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 36px 40px 28px; background:#ffffff;">

              <!-- GREETING -->
              <p style="font-size:16px; font-weight:600; color:#1a1a1a; margin-bottom:24px;">${greeting}</p>

              <!-- RICH CONTENT -->
              <div style="font-size:15px; color:#3a3a3a; line-height:1.75;">
                ${content}
              </div>

            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top:1px solid #e8e8e8;"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding: 28px 40px 36px; background:#f8f8f8;">
              <p style="font-size:13px; color:#888888; line-height:1.6; margin:0;">
                You are receiving this email because you have an account with <strong style="color:#555;">${companyName}</strong>.<br/>
                ${companyEmail ? `Questions? Contact us at <a href="mailto:${companyEmail}" style="color:#c8a70e;">${companyEmail}</a>.<br/>` : ""}
              </p>
              <p style="font-size:11px; color:#aaaaaa; margin-top:16px;">
                &copy; ${year} ${companyName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
