# gasis.ae — static website

A dependency-free rebuild of the Gas Integrated Solutions website. Plain HTML,
CSS and JavaScript: no WordPress, no database, no plugins, nothing to patch.
Any static host (or any web server) can serve it.

## Pages

| URL | File |
| --- | --- |
| `/` | `index.html` |
| `/about-us/` | `about-us/index.html` |
| `/message-from-management/` | `message-from-management/index.html` |
| `/services/` | `services/index.html` |
| `/contact-us/` | `contact-us/index.html` |
| `/about-us-2/` | redirects to `/about-us/` (kept so old links keep working) |
| `/GIS Company Profile.pdf` | the eBrochure, same path as before |

External links (customer portal, billing login and registration) point to
`erp.gasis.ae` and `billing.gasis.ae` exactly as on the original site.

## Folder layout

```
index.html, */index.html   finished pages (generated, but plain HTML you can edit)
assets/css/style.css       all styling
assets/css/fonts.css       self-hosted Open Sans + Poppins (no Google Fonts call)
assets/fonts/              the .woff2 font files
assets/img/                optimized images (logo, icons, photos)
assets/js/main.js          slideshow, menu, animations, counters, tabs, carousel, forms
assets/js/config.js        form endpoints and contact emails — the only file you must configure
src/                       page sources + shared header/footer used by build.py
build.py                   regenerates the pages from src/ (Python 3, standard library only)
```

## Editing content

Two ways, pick whichever suits you:

1. **Edit the finished HTML directly** (`index.html`, `about-us/index.html`, …).
   Simple, but the header and footer are repeated in every page, so a change
   to the menu or footer has to be made in each file.
2. **Edit `src/` and rebuild.** Page text lives in `src/pages/*.html`, the
   header and footer live once in `src/partials/`. Then run:

   ```bash
   python3 build.py
   ```

   and upload the regenerated files. Icons are written as `{{icon:name}}`
   and inlined by the build.

## Forms (contact page and newsletter)

The site is static, so form submissions need a destination. Open
`assets/js/config.js`:

- Paste a form-to-email endpoint (for example from Formspree or Basin) into
  `contactEndpoint` / `newsletterEndpoint`. Submissions are then POSTed there
  and the visitor sees a success or error message on the page.
- Leave the endpoints empty and the forms fall back to opening the visitor's
  email client with the message pre-filled to `business@gasis.ae` /
  `help@gasis.ae`.

## Deployment (Azure Static Web Apps, Free plan)

The customer portal already runs in Azure, so the website lives in the same
tenant. The **Free** plan of Azure Static Web Apps costs nothing, includes a
global CDN, automatic HTTPS, two custom domains and 100 GB of bandwidth a
month, which is far more than a brochure site uses.

The repository lives at `github.com/Gasis-ae/website`. Every push to `main`
is published automatically by the GitHub Actions workflow in
`.github/workflows/azure-static-web-apps.yml`. Pull requests get a temporary
preview URL, posted as a comment on the PR, which disappears when the PR is
closed.

### One-time setup

1. In the Azure portal choose **Create a resource → Static Web App**.
   - Subscription / resource group: the one the portal uses (or a new
     `rg-gasis-web`).
   - Name: `gasis-website`. Plan type: **Free**. Region: closest available
     (for example *East Asia* or *West Europe*; the CDN serves globally anyway).
   - Deployment source: **GitHub**. Sign in, pick organisation `Gasis-ae`,
     repository `website`, branch `main`.
   - Build presets: **Custom**. App location `/`, Api location empty,
     Output location empty.
2. Azure commits its own workflow file to the repository, named like
   `.github/workflows/azure-static-web-apps-<random>.yml`, and creates a
   repository secret named `AZURE_STATIC_WEB_APPS_API_TOKEN_<RANDOM>`.
   We keep our own workflow instead because it regenerates the pages from
   `src/` before uploading. So, once:
   - `git pull`, delete the generated `azure-static-web-apps-<random>.yml`,
     commit and push.
   - In GitHub → **Settings → Secrets and variables → Actions**, add a secret
     named exactly `AZURE_STATIC_WEB_APPS_API_TOKEN`. Its value is the
     deployment token from the Azure portal (the Static Web App →
     **Overview → Manage deployment token**). You can then delete the
     randomly-suffixed secret Azure created.
3. Open the **Actions** tab, run *Deploy to Azure Static Web Apps* once by
   hand (or just push). The job log ends with the `*.azurestaticapps.net`
   URL: check the site there before changing DNS.

### Day-to-day

Edit, commit, push to `main`. That is the whole deployment. To preview a
larger change first, push a branch and open a pull request; the workflow
comments a preview link on it.

### Manual fallback

If GitHub is unavailable, `./deploy.sh` uploads the folder directly with the
Static Web Apps CLI. It needs the same deployment token stored in
`~/.gasis-swa-token` (never commit it).

`staticwebapp.config.json` tells Azure to add trailing slashes, return a 301
for the old `/about-us-2/` URL, serve `404.html` for unknown paths, cache
fonts and images, hide `src/` and the build scripts, and send basic security
headers.

### Custom domain and DNS cut-over

1. In the Static Web App open **Custom domains → Add**.
2. Add `www.gasis.ae` first: Azure asks for a CNAME record pointing at the
   `*.azurestaticapps.net` host. Create it at your DNS provider.
3. Add the apex `gasis.ae`: Azure asks for a TXT record to prove ownership,
   then needs the apex to point at the app. Apex domains cannot use a plain
   CNAME, so either
   - move the zone to **Azure DNS** (about USD 0.50/month) and create an
     *alias* record, which the portal offers to do for you, or
   - if the current DNS provider supports ALIAS/ANAME/CNAME-flattening
     (Cloudflare does, free), use that.
4. Set `gasis.ae` as the default domain so `www` redirects to it (or the other
   way round, your choice). Certificates are issued and renewed automatically.
5. Lower the DNS TTL to 300 seconds a day before the switch so the change
   propagates quickly, and keep the old hosting alive for 24–48 hours.

**Before you start, confirm who controls the gasis.ae registrar and DNS
login.** If the previous IT team holds it, request a transfer of the
registrar account to the company now; without it no cut-over is possible.

### Other free options

If you prefer not to use Azure: Cloudflare Pages, Netlify and GitHub Pages
all host this folder for free too. Any ordinary web server (Apache, Nginx,
IIS) also works: copy the files into the web root. Directory-style URLs
(`/about-us/`) work because each page is an `index.html` inside its folder.
Only `staticwebapp.config.json` is Azure-specific; the `about-us-2/index.html`
redirect page covers that case on other hosts.

## Local preview

```bash
python3 -m http.server 8765
```

then open <http://localhost:8765>.

## Differences from the original

- The obfuscated third-party script injected into the WordPress pages is not
  included (see "Security note" below).
- The "About Us" menu item links to the About page instead of an empty page.
- Footer quick links are real links; the label typo "E-brocure" was corrected.
- The copyright year updates automatically.
- Images were re-encoded (JPEG/PNG) so the whole site weighs ~2.6 MB instead
  of ~25 MB; visual quality is unchanged at display size.
- Fonts are self-hosted, so the site does not depend on Google's servers.

## Security note

While copying the live site, every page on `gasis.ae` was found to contain a
~30 KB obfuscated inline `<script data-sc="…">` that is not part of WordPress,
Elementor or the theme. When the site was opened with a mobile browser, it
redirected visitors to unrelated gambling/spam domains. This is a known type
of WordPress malware. The rebuild contains none of that code. Until the DNS is
switched to the new site, the old WordPress install should be treated as
compromised: change its admin and hosting passwords and, ideally, take it
offline once this static version is live.

## Credits

Icons: original site assets plus Font Awesome Free (CC BY 4.0).
Fonts: Open Sans and Poppins (SIL Open Font License).
