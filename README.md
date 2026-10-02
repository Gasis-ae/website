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

## Hosting

Upload the whole folder (everything except `src/`, `build.py` and `.claude/`
if you like, though they are harmless) to any of:

- **Cloudflare Pages / Netlify / Vercel / GitHub Pages** — free, global CDN,
  automatic HTTPS. Drag-and-drop the folder or connect a Git repository.
- **Any shared hosting or VPS** (Apache, Nginx, IIS) — copy the files into the
  web root. Directory-style URLs (`/about-us/`) work because each page is an
  `index.html` inside its folder.

Point the `gasis.ae` DNS A/CNAME record at the new host and the site is live.
No PHP, MySQL or WordPress is required, so downtime from plugin updates or
server-side compromises is no longer possible.

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
