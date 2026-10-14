# Quote form Worker

This Cloudflare Worker receives the quote form on `quote.html` at `fenegroni.com/api/intake`. It emails each message to Filippo through Cloudflare Email Routing. The visitor's address goes in Reply-To, so pressing Reply answers the visitor.

GitHub Pages does not publish this folder, because `_config.yml` excludes it.

## What it checks

- It accepts only POST requests whose Origin is in `ALLOWED_ORIGINS`.
- It needs a valid email address. The message and the name are optional.
- It limits the message to 5,000 characters and the name to 200.
- It drops any request that fills the hidden `website` field, which only bots see. The bot gets a normal success reply.
- It logs the error code when a send fails. It never logs what the visitor wrote.

## Deploy steps

You need Node.js 20 or later. Run every command from this `worker` folder.

1. Install the tools:

   ```bash
   npm install
   ```

2. Log in to Cloudflare. A browser window opens, and you approve the login there.

   ```bash
   npx wrangler login
   ```

3. Deploy the Worker. Wrangler also creates the route `fenegroni.com/api/intake`.

   ```bash
   npx wrangler deploy
   ```

4. Store the inbox address as a secret, so it stays out of this public repo. Type the address when Wrangler asks. It must be a verified destination address in Email Routing, such as the inbox that hello@fenegroni.com forwards to.

   ```bash
   npx wrangler secret put TO_ADDRESS
   ```

5. Send a test message from https://fenegroni.com/quote.html and check that it reaches your inbox. Press Reply and check that the reply goes to the address you typed in the form.

## Test it on your computer

```bash
npx wrangler dev
```

Wrangler runs the Worker at http://localhost:8787 and simulates the email binding, so nothing reaches a real inbox. Wrangler prints each simulated email in the terminal. Local tests need `http://localhost:8787` in `ALLOWED_ORIGINS`. Put it in a `.dev.vars` file so the live config stays strict:

```
ALLOWED_ORIGINS="https://fenegroni.com,http://localhost:8787"
TO_ADDRESS="you@example.com"
```

## If something goes wrong

- Run `npx wrangler tail` to watch the Worker's logs live.
- `E_RECIPIENT_NOT_ALLOWED` or a similar recipient error means `TO_ADDRESS` is not a verified destination address in Email Routing.
- `E_SENDER_NOT_VERIFIED` means Email Routing is not active for fenegroni.com.
- If the form shows "Your message did not send", visitors can still open their email app or copy the message, so no request is lost.
