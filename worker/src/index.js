// Receives the quote form from fenegroni.com/quote.html and emails it to Filippo
// through Cloudflare Email Routing. The visitor's address goes in Reply-To,
// so pressing Reply in the inbox answers the visitor directly.
// It also serves exchange rates at /api/rates, so the prices can show other currencies.

const LIMITS = { help: 5000, name: 200, email: 254 };
const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

// The open ExchangeRate-API endpoint updates once a day and needs no key.
// Its terms ask for a link back, which quote.html shows under the currency menu.
const RATES_URL = 'https://open.er-api.com/v6/latest/GBP';
const RATES_SECONDS = 6 * 60 * 60;

function reply(status, body, cacheControl) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cacheControl || 'no-store' },
  });
}

// Strips control characters so nothing in a field can break the email headers.
function clean(value, keepNewlines) {
  var text = typeof value === 'string' ? value : '';
  text = keepNewlines ? text.replace(/\r\n?/g, '\n').replace(/[^\S\n]+\n/g, '\n') : text.replace(/\s+/g, ' ');
  return text.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim();
}

// Cloudflare caches the upstream answer for six hours, so visitors share one fetch.
// The visitor's browser talks only to fenegroni.com.
async function rates(request) {
  if (request.method !== 'GET') return reply(405, { ok: false, error: 'method' });
  try {
    var response = await fetch(RATES_URL, { cf: { cacheTtl: RATES_SECONDS, cacheEverything: true } });
    var data = await response.json();
    if (data.result !== 'success' || !data.rates) throw new Error('bad rates');
    return reply(200, { ok: true, base: 'GBP', updated: data.time_last_update_utc, rates: data.rates },
      'public, max-age=' + RATES_SECONDS);
  } catch (error) {
    console.error('rates failed', error && error.message);
    return reply(502, { ok: false, error: 'rates' });
  }
}

async function intake(request, env) {
  if (request.method !== 'POST') return reply(405, { ok: false, error: 'method' });

  // Browsers always send Origin on a form POST, so this blocks other sites from using the form.
  var allowed = (env.ALLOWED_ORIGINS || '').split(',').map(function (s) { return s.trim(); });
  if (!allowed.includes(request.headers.get('Origin'))) return reply(403, { ok: false, error: 'origin' });

  var form;
  try {
    form = await request.formData();
  } catch (e) {
    return reply(400, { ok: false, error: 'format' });
  }

  // The website field is hidden from people. Bots fill it, so pretend it worked and send nothing.
  if (clean(form.get('website'))) return reply(200, { ok: true });

  var help = clean(form.get('help'), true);
  var name = clean(form.get('name'));
  var email = clean(form.get('email'));
  // The updates box is unticked by default. The dated line in the email is the consent record.
  var newsletter = clean(form.get('newsletter')) === 'yes';
  var sentAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.email) return reply(400, { ok: false, error: 'email' });
  if (help.length > LIMITS.help || name.length > LIMITS.name) return reply(400, { ok: false, error: 'length' });

  var text = 'New quote request from fenegroni.com\n\n' +
    'Name: ' + (name || '(not given)') + '\n' +
    'Email: ' + email + '\n' +
    'Newsletter: ' + (newsletter ? 'yes (ticked on the quote form on ' + sentAt + ')' : 'no') + '\n\n' +
    'What could reduce friction in your life?\n' + (help || '(left blank)') + '\n\n' +
    'Press Reply to answer ' + (name || email) + ' directly.\n';

  // TO_ADDRESS is a Wrangler secret, so the inbox address stays out of the public repo.
  if (!env.TO_ADDRESS) {
    console.error('TO_ADDRESS is not set');
    return reply(502, { ok: false, error: 'send' });
  }

  try {
    await env.EMAIL.send({
      from: { email: env.FROM_ADDRESS, name: 'fenegroni.com quote form' },
      to: env.TO_ADDRESS,
      replyTo: name ? { email: email, name: name } : email,
      subject: 'Quote request from ' + (name || email),
      text: text,
    });
  } catch (error) {
    // Log the error code only. The message itself never goes to the logs.
    console.error('send failed', error && error.code);
    return reply(502, { ok: false, error: 'send' });
  }

  return reply(200, { ok: true });
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/api/rates') return rates(request);
    return intake(request, env);
  },
};
