/* POST /api/contact — delivers the enquiry form.
 *
 * Vercel picks this up automatically on a static project; there is no build step
 * and no dependencies. The form posts natively, so it works with JavaScript
 * disabled; site.js upgrades it to a fetch when JS is available.
 *
 * Environment variables (Vercel dashboard → Settings → Environment Variables):
 *   RESEND_API_KEY   an API key from resend.com
 *   CONTACT_TO       where enquiries are delivered, e.g. hello@example.com
 *   CONTACT_FROM     optional; a verified sender on your domain.
 *                    Defaults to onboarding@resend.dev, which Resend only
 *                    delivers to the address that owns the account.
 */

const FIELDS = ['name', 'company', 'email', 'phone', 'sector', 'location', 'message'];
const LABELS = {
  name: 'Name', company: 'Company', email: 'Email', phone: 'Phone',
  sector: 'Sector', location: 'Location', message: 'Project',
};
const LIMIT = 4000;

const esc = s => String(s).replace(/[<>&"]/g, c => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;      // Vercel pre-parses
  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    raw = Buffer.concat(chunks).toString('utf8');
  }
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) { try { return JSON.parse(raw); } catch { return {}; } }
  return Object.fromEntries(new URLSearchParams(raw));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await readBody(req);
  const wantsJson = (req.headers.accept || '').includes('application/json');
  const done = (status, ok, message) => wantsJson
    ? res.status(status).json({ ok, message })
    : res.redirect(303, ok ? '/contact?sent=1' : `/contact?error=${encodeURIComponent(message)}#enquiry`);

  /* Honeypot: a real person never fills a field they cannot see. Answer as if
     it succeeded so the bot has nothing to learn. */
  if (body._gotcha) return done(200, true, 'Thank you — your enquiry is on its way.');

  const data = {};
  for (const f of FIELDS) data[f] = String(body[f] ?? '').trim().slice(0, LIMIT);

  if (!data.name || !data.email || !data.message)
    return done(400, false, 'Please complete your name, email and a note about the project.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
    return done(400, false, 'That email address does not look right.');

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!key || !to) {
    console.error('contact: RESEND_API_KEY and/or CONTACT_TO are not set');
    return done(500, false, 'The enquiry form is not configured yet. Please email us directly.');
  }

  const lines = FIELDS.filter(f => data[f]).map(f => `${LABELS[f]}: ${data[f]}`);
  const text = lines.join('\n');
  const html = FIELDS.filter(f => data[f])
    .map(f => `<p><strong>${LABELS[f]}</strong><br>${esc(data[f]).replace(/\n/g, '<br>')}</p>`)
    .join('');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Frameworks Studios <onboarding@resend.dev>',
        to: [to],
        reply_to: data.email,
        subject: `Enquiry — ${data.name}${data.company ? ` (${data.company})` : ''}`,
        text, html,
      }),
    });
    if (!r.ok) {
      console.error('contact: resend returned', r.status, await r.text());
      return done(502, false, 'We could not send that just now. Please try again shortly.');
    }
  } catch (err) {
    console.error('contact: resend request failed', err);
    return done(502, false, 'We could not send that just now. Please try again shortly.');
  }

  return done(200, true, 'Thank you — your enquiry is on its way.');
}
