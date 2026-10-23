# fenegroni.com

This repo is the website for fenegroni.com. It is plain static HTML, CSS and JavaScript with no build step. The site serves adults with ADHD who pay for themselves.

## Hosting

- GitHub Pages publishes the site from the `master` branch. A push to `master` goes live within a few minutes.
- `_config.yml` keeps `worker/` and this file off the published site. Add any other non-site file or folder to its `exclude` list.
- Cloudflare manages the domain and proxies the site. It tells browsers to cache CSS and JavaScript for 4 hours.
- Every page links `styles.css?v=...` and `site.js?v=...`. When you change either file, bump its `?v=` value on every page. Otherwise visitors get the new HTML with the old styles.

## Pages

- `index.html` is the home page. Its two option cards show no prices and no payment link. They link to `quote.html`.
- `quote.html` is the "How it works" page. It is the only page with prices and the £50 Stripe link. It holds both options with their steps, the currency menu, the quote form and Good to know.
- Every page has the same menu: Home, Solutions, Media and How it works. The current page carries `aria-current`, which shows it as a pill.
- The pages named `example-*.html` describe example tools. `work.html` lists them as Solutions, and `media.html` lists articles. Both pages use the same page title layout.
- `site.js` is shared by every page. It handles the footer year, the mobile menu, the email copy buttons and the newsletter forms.

## Prices

- Every price on `quote.html` is a `<span class="gbp" data-gbp="50">£50</span>`. The currency menu rewrites these spans, so a new price needs the same markup.
- The rates come from `/api/rates`. If they do not load, the menu stays hidden and the page shows pounds.
- Good to know says that other currencies are estimates. The prices themselves carry no note.

## Forms and the Worker

- The quote form on `quote.html` posts `help`, `email`, `name`, the `newsletter` box and the honeypot `website` to `/api/intake`.
- Every footer has a newsletter form. It posts `email` and the honeypot `website` to `/api/newsletter`.
- A Cloudflare Worker in `worker/` handles `/api/intake`, `/api/newsletter` and `/api/rates`. It emails each form through Cloudflare Email Routing, with Reply-To set to the visitor. `worker/README.md` has the deploy and test steps.
- The inbox address is the Wrangler secret `TO_ADDRESS`. Never write it into a file in this public repo.
- A change to `worker/src/index.js` or `worker/wrangler.jsonc` goes live only after `npx wrangler deploy` from `worker/`.
- On Windows PowerShell, use `npx.cmd` instead of `npx`, because the execution policy blocks `npx.ps1`.
- When a send fails, the quote form offers "Open my email app" and "Copy my message", and the newsletter form offers "Open my email app". Keep those fallbacks.

## Rules for changes

- Ask the owner before any push, deploy or Cloudflare change.
- This repo is public. Keep personal details, private email addresses and business notes out of every file.

## Voice for site copy

- Write in plain English, with full sentences and active verbs.
- Do not use em dashes.
- Do not use "not X, it's Y" contrasts.
- Do not end sentences with trailing participial clauses.
