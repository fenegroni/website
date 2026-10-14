# fenegroni.com

This repo is the website for fenegroni.com. It is plain static HTML, CSS and JavaScript with no build step. The site serves adults with ADHD who pay for themselves.

## Hosting

- GitHub Pages publishes the site from the `master` branch. A push to `master` goes live within a few minutes.
- `_config.yml` keeps `worker/` and this file off the published site. Add any other non-site file or folder to its `exclude` list.
- Cloudflare manages the domain and proxies the site. It tells browsers to cache CSS and JavaScript for 4 hours.
- Every page links `styles.css?v=...` and `site.js?v=...`. When you change either file, bump its `?v=` value on every page. Otherwise visitors get the new HTML with the old styles.

## Pages

- `index.html` is the home page. `quote.html` holds the quote form, How it works and the prices.
- `site.js` is shared by every page. It handles the footer year, the mobile menu and the email copy buttons.
- The pages named `example-*.html` describe example tools.

## Quote form

- The form on `quote.html` posts `help`, `email`, `name` and the honeypot `website` to `/api/intake`.
- A Cloudflare Worker in `worker/` handles that route. It emails each message through Cloudflare Email Routing, with Reply-To set to the visitor. `worker/README.md` has the deploy and test steps.
- The inbox address is the Wrangler secret `TO_ADDRESS`. Never write it into a file in this public repo.
- A change to `worker/src/index.js` goes live only after `npx wrangler deploy` from `worker/`.
- On Windows PowerShell, use `npx.cmd` instead of `npx`, because the execution policy blocks `npx.ps1`.
- The page falls back to "Open my email app" and "Copy my message" when a send fails. Keep that fallback.

## Rules for changes

- Ask the owner before any push, deploy or Cloudflare change.
- This repo is public. Keep personal details, private email addresses and business notes out of every file.

## Voice for site copy

- Write in plain English, with full sentences and active verbs.
- Do not use em dashes.
- Do not use "not X, it's Y" contrasts.
- Do not end sentences with trailing participial clauses.
