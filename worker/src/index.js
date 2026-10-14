// Receives the quote form from fenegroni.com/quote.html and emails it to Filippo
// through Cloudflare Email Routing. The visitor's address goes in Reply-To,
// so pressing Reply in the inbox answers the visitor directly.

const LIMITS = { help: 5000, name: 200, email: 254 };
const EMAIL_PATTERN = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

function reply(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Strips control characters so nothing in a field can break the email headers.
function clean(value, keepNewlines) {
  var text = typeof value === 'string' ? value : '';
  text = keepNewlines ? text.replace(/\r\n?/g, '\n').replace(/[^\S\n]+\n/g, '\n') : text.replace(/\s+/g, ' ');
  return text.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').trim();
}

export default {
  async fetch(request, env) {
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

    if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.email) return reply(400, { ok: false, error: 'email' });
    if (help.length > LIMITS.help || name.length > LIMITS.name) return reply(400, { ok: false, error: 'length' });

    var text = 'New quote request from fenegroni.com\n\n' +
      'Name: ' + (name || '(not given)') + '\n' +
      'Email: ' + email + '\n\n' +
      'What would you like help with?\n' + (help || '(left blank)') + '\n\n' +
      'Press Reply to answer ' + (name || email) + ' directly.\n';

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
  },
};
