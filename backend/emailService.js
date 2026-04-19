/* ===== ClassHub Email Notification Service ===== */

/**
 * Sends a broadcast email to multiple recipients (BCC-based for privacy).
 * @param {object} transporter - Nodemailer transporter
 * @param {string[]} emails    - Array of recipient emails
 * @param {string} subject     - Email subject
 * @param {string} html        - HTML body
 */
async function sendBroadcast(transporter, emails, subject, html) {
    if (!emails || emails.length === 0) {
        console.warn('⚠️  No recipients found for broadcast');
        return { sentCount: 0, errors: [] };
    }

    const errors = [];
    let sentCount = 0;

    // Send in chunks of 50 BCC to avoid rate limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
        const chunk = emails.slice(i, i + CHUNK_SIZE);
        try {
            await transporter.sendMail({
                from: `"ClassHub 🎓" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER,  // sender to themselves
                bcc: chunk,
                subject,
                html
            });
            sentCount += chunk.length;
        } catch (err) {
            console.error(`❌ Chunk ${i}-${i + CHUNK_SIZE} failed:`, err.message);
            errors.push(err.message);
        }
    }

    console.log(`📧 Broadcast sent to ${sentCount}/${emails.length} students`);
    return { sentCount, errors };
}

// ---- HTML Email Templates ----

/**
 * Wraps content in the ClassHub branded email shell.
 */
function emailShell(bodyContent) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ClassHub Notification</title>
    </head>
    <body style="margin:0;padding:0;background:#080f1e;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#080f1e;padding:32px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="border-radius:20px;overflow:hidden;border:1px solid rgba(99,102,241,0.25);background:#0f172a;">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%);padding:28px 36px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:26px;letter-spacing:4px;font-weight:800;">CLASSHUB</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:1px;text-transform:uppercase;">IET Lucknow — CSE Department</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px 36px;">
                  ${bodyContent}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#080f1e;padding:20px 36px;border-top:1px solid rgba(99,102,241,0.15);text-align:center;">
                  <p style="margin:0;color:#475569;font-size:12px;">This is an automated notification from ClassHub.</p>
                  <p style="margin:4px 0 0;color:#334155;font-size:11px;">IET Lucknow • Class of 2026 • CSE B Section</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;
}

/**
 * Announcement notification email
 */
function announcementTemplate({ title, message, priority, audience, facultyName }) {
    const priorityConfig = {
        urgent:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '🚨', label: 'URGENT' },
        important: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⚠️', label: 'IMPORTANT' },
        normal:    { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: '📢', label: 'ANNOUNCEMENT' }
    };
    const cfg = priorityConfig[priority] || priorityConfig.normal;

    const body = `
      <!-- Priority Badge -->
      <div style="display:inline-block;background:${cfg.bg};border:1px solid ${cfg.color};border-radius:8px;padding:6px 16px;margin-bottom:20px;">
        <span style="color:${cfg.color};font-size:12px;font-weight:700;letter-spacing:1px;">${cfg.icon} ${cfg.label}</span>
      </div>

      <h2 style="margin:0 0 12px;color:#e2e8f0;font-size:22px;font-weight:700;line-height:1.3;">${title}</h2>

      <div style="background:#1e293b;border-left:4px solid ${cfg.color};border-radius:8px;padding:18px 20px;margin:20px 0;">
        <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.7;">${message}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
        <tr>
          <td style="width:50%;padding-right:8px;">
            <div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;">
              <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Posted By</p>
              <p style="margin:0;color:#a5b4fc;font-size:14px;font-weight:600;">${facultyName || 'Faculty'}</p>
            </div>
          </td>
          <td style="width:50%;padding-left:8px;">
            <div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;">
              <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Audience</p>
              <p style="margin:0;color:#a5b4fc;font-size:14px;font-weight:600;">${audience}</p>
            </div>
          </td>
        </tr>
      </table>

      <p style="margin:28px 0 0;color:#475569;font-size:12px;text-align:center;">
        Posted on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </p>
    `;

    return emailShell(body);
}

/**
 * Assignment notification email
 */
function assignmentTemplate({ title, subject, description, dueDate, totalMarks, facultyName }) {
    const body = `
      <!-- Badge -->
      <div style="display:inline-block;background:rgba(245,158,11,0.1);border:1px solid #f59e0b;border-radius:8px;padding:6px 16px;margin-bottom:20px;">
        <span style="color:#f59e0b;font-size:12px;font-weight:700;letter-spacing:1px;">📝 NEW ASSIGNMENT</span>
      </div>

      <h2 style="margin:0 0 6px;color:#e2e8f0;font-size:22px;font-weight:700;">${title}</h2>
      <p style="margin:0 0 20px;color:#7c3aed;font-size:14px;font-weight:600;">${subject}</p>

      <div style="background:#1e293b;border-left:4px solid #f59e0b;border-radius:8px;padding:18px 20px;margin-bottom:20px;">
        <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">${description || 'Please check ClassHub for full assignment details.'}</p>
      </div>

      <!-- Info Grid -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:33%;padding:4px 6px 4px 0;">
            <div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;">
              <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Due Date</p>
              <p style="margin:0;color:#f87171;font-size:14px;font-weight:700;">📅 ${dueDate}</p>
            </div>
          </td>
          <td style="width:33%;padding:4px 3px;">
            <div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;">
              <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Total Marks</p>
              <p style="margin:0;color:#34d399;font-size:14px;font-weight:700;">🏆 ${totalMarks || 100}</p>
            </div>
          </td>
          <td style="width:33%;padding:4px 0 4px 6px;">
            <div style="background:#1e293b;border-radius:10px;padding:14px;text-align:center;">
              <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Assigned By</p>
              <p style="margin:0;color:#a5b4fc;font-size:13px;font-weight:600;">${facultyName || 'Faculty'}</p>
            </div>
          </td>
        </tr>
      </table>

      <div style="margin-top:24px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:10px;padding:14px;text-align:center;">
        <p style="margin:0;color:#a5b4fc;font-size:13px;">
          ⚡ Log in to <strong>ClassHub</strong> to view full details and submit your assignment before the deadline.
        </p>
      </div>
    `;

    return emailShell(body);
}

/**
 * Timetable change notification email
 */
function timetableTemplate({ day, time, subject, faculty, room, reason, changedBy }) {
    const body = `
      <!-- Badge -->
      <div style="display:inline-block;background:rgba(6,182,212,0.1);border:1px solid #06b6d4;border-radius:8px;padding:6px 16px;margin-bottom:20px;">
        <span style="color:#06b6d4;font-size:12px;font-weight:700;letter-spacing:1px;">📅 TIMETABLE UPDATE</span>
      </div>

      <h2 style="margin:0 0 6px;color:#e2e8f0;font-size:22px;font-weight:700;">Schedule Change Notice</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Your class timetable has been updated. Please take note of the following change.</p>

      <!-- Change Details Box -->
      <div style="background:#1e293b;border:1px solid rgba(6,182,212,0.3);border-radius:12px;padding:24px;margin-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid rgba(99,102,241,0.1);">
              <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Day</span>
              <p style="margin:4px 0 0;color:#e2e8f0;font-size:16px;font-weight:600;">📆 ${day}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid rgba(99,102,241,0.1);">
              <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Time Slot</span>
              <p style="margin:4px 0 0;color:#06b6d4;font-size:16px;font-weight:600;">⏰ ${time}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid rgba(99,102,241,0.1);">
              <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Subject</span>
              <p style="margin:4px 0 0;color:#a5b4fc;font-size:16px;font-weight:600;">📘 ${subject}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid rgba(99,102,241,0.1);">
              <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Faculty</span>
              <p style="margin:4px 0 0;color:#e2e8f0;font-size:15px;font-weight:500;">👨‍🏫 ${faculty}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;">
              <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Room / Lab</span>
              <p style="margin:4px 0 0;color:#34d399;font-size:15px;font-weight:500;">🏫 ${room}</p>
            </td>
          </tr>
        </table>
      </div>

      ${reason ? `
      <div style="background:rgba(245,158,11,0.08);border-left:4px solid #f59e0b;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
        <p style="margin:0 0 4px;color:#f59e0b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Reason for Change</p>
        <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">${reason}</p>
      </div>` : ''}

      <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
        Updated by <strong style="color:#a5b4fc;">${changedBy || 'Faculty'}</strong> on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
      </p>
    `;

    return emailShell(body);
}

/**
 * General / Custom alert email
 */
function alertTemplate({ title, message, alertType, facultyName }) {
    const alertConfig = {
        low_attendance: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '⚠️', label: 'ATTENDANCE ALERT' },
        exam:           { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '📋', label: 'EXAM NOTICE' },
        holiday:        { color: '#34d399', bg: 'rgba(52,211,153,0.1)', icon: '🎉', label: 'HOLIDAY NOTICE' },
        general:        { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: '🔔', label: 'NOTICE' }
    };
    const cfg = alertConfig[alertType] || alertConfig.general;

    const body = `
      <div style="display:inline-block;background:${cfg.bg};border:1px solid ${cfg.color};border-radius:8px;padding:6px 16px;margin-bottom:20px;">
        <span style="color:${cfg.color};font-size:12px;font-weight:700;letter-spacing:1px;">${cfg.icon} ${cfg.label}</span>
      </div>

      <h2 style="margin:0 0 20px;color:#e2e8f0;font-size:22px;font-weight:700;">${title}</h2>

      <div style="background:#1e293b;border-left:4px solid ${cfg.color};border-radius:8px;padding:18px 20px;margin-bottom:20px;">
        <p style="margin:0;color:#94a3b8;font-size:15px;line-height:1.8;">${message}</p>
      </div>

      <div style="text-align:center;margin-top:16px;">
        <p style="margin:0;color:#475569;font-size:12px;">
          Sent by <strong style="color:#a5b4fc;">${facultyName || 'ClassHub Admin'}</strong> • ${new Date().toLocaleString('en-IN')}
        </p>
      </div>
    `;

    return emailShell(body);
}

module.exports = {
    sendBroadcast,
    announcementTemplate,
    assignmentTemplate,
    timetableTemplate,
    alertTemplate
};
