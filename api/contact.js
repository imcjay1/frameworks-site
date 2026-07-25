/* POST /api/contact — delivers enquiries and call requests.
 *
 * Vercel picks this up automatically on a static project; there is no build step
 * and no dependencies. Both forms post natively, so they work with JavaScript
 * disabled; site.js and digital.js upgrade them to submit in place.
 *
 * Environment variables (Vercel dashboard → Settings → Environment Variables):
 *   RESEND_API_KEY   an API key from resend.com — required
 *   CONTACT_TO       override the destination; defaults to the address below
 *   CONTACT_FROM     optional; a verified sender on your own domain. Defaults to
 *                    onboarding@resend.dev, which Resend will only deliver to
 *                    the address that owns the account.
 */

const DEFAULT_TO = 'cameron@frameworksstudios.com';

const FIELDS = ['name', 'company', 'email', 'phone', 'sector', 'location',
                'services', 'budget', 'timeline', 'date', 'time', 'message', 'source'];
const LABELS = {
  name: 'Name', company: 'Company', email: 'Email', phone: 'Phone',
  sector: 'Sector', location: 'Location', services: 'Services of interest',
  budget: 'Budget', timeline: 'Timeline', date: 'Requested date',
  time: 'Requested time (CET)', message: 'Notes', source: 'Enquiry from',
};
const LIMIT = 4000;

const esc = s => String(s).replace(/[<>&"]/g, c => (
  { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/* Checkbox groups arrive as repeated keys; keep every value rather than the
   last one, which is what a plain Object.fromEntries would leave you with. */
function fromParams(raw) {
  const out = {};
  for (const [k, v] of new URLSearchParams(raw)) {
    if (k in out) out[k] = [].concat(out[k], v);
    else out[k] = v;
  }
  return out;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw && Buffer.isBuffer(req.body)) raw = req.body.toString('utf8');
  if (!raw) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    raw = Buffer.concat(chunks).toString('utf8');
  }
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) { try { return JSON.parse(raw); } catch { return {}; } }
  return fromParams(raw);
}

const clean = v => (Array.isArray(v) ? v : [v])
  .filter(x => x != null && String(x).trim() !== '')
  .map(x => String(x).trim().slice(0, LIMIT));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = await readBody(req);
  const wantsJson = (req.headers.accept || '').includes('application/json');
  const isCall = String(body.mode || '') === 'call';

  /* Where a no-JavaScript submit lands. Only same-origin paths are honoured —
     "//host" would leave the site, so it is rejected along with absolute URLs. */
  const back = typeof body.next === 'string'
      && body.next.startsWith('/') && !body.next.startsWith('//')
    ? body.next
    : '/contact?sent=1';
  const fail = back.split('?')[0] + '?error=';

  const done = (status, ok, message) => wantsJson
    ? res.status(status).json({ ok, message })
    : res.redirect(303, ok ? back : fail + encodeURIComponent(message) + '#enquire');

  /* Honeypot: a real person never fills a field they cannot see. Answer as if it
     succeeded so the bot has nothing to learn from the difference. */
  if (clean(body._gotcha).length) {
    return done(200, true, 'Thank you — your enquiry is on its way.');
  }

  const data = {};
  for (const f of FIELDS) {
    const v = clean(body[f]);
    if (v.length) data[f] = v.join(f === 'services' ? ', ' : ' ');
  }

  if (!data.name || !data.email) {
    return done(400, false, 'Please give us your name and an email address.');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    return done(400, false, 'That email address does not look right.');
  }
  if (isCall && (!data.date || !data.time)) {
    return done(400, false, 'Please choose a date and a time for the call.');
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO || DEFAULT_TO;
  if (!key) {
    console.error('contact: RESEND_API_KEY is not set');
    return done(500, false,
      `The form is not connected yet — please email ${to} directly.`);
  }

  const rows = FIELDS.filter(f => data[f]);
  const text = rows.map(f => `${LABELS[f]}: ${data[f]}`).join('\n');
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;line-height:1.55">
    <h2 style="font-weight:600;margin:0 0 4px">${isCall ? 'Call request' : 'New enquiry'}</h2>
    <p style="color:#666;margin:0 0 18px">${esc(data.source || 'Website')}</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      ${rows.map(f => `<tr>
        <td style="padding:7px 22px 7px 0;color:#666;vertical-align:top;white-space:nowrap">${LABELS[f]}</td>
        <td style="padding:7px 0">${esc(data[f]).replace(/\n/g, '<br>')}</td>
      </tr>`).join('')}
    </table>
  </div>`;

  const subject = isCall
    ? `Call request — ${data.name}${data.date ? ` · ${data.date} ${data.time}` : ''}`
    : `Enquiry — ${data.name}${data.company ? ` (${data.company})` : ''}`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Frameworks Studios <onboarding@resend.dev>',
        to: [to],
        reply_to: data.email,
        subject, text, html,
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

  return done(200, true, isCall
    ? 'Thank you — we will confirm your call by email.'
    : 'Thank you — your enquiry is on its way.');
}
