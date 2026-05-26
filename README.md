# FixSend

FixSend by Yabato Co. is a zero-cost static web MVP for job seekers. It helps people decide whether they should **Send**, **Fix**, or **Skip** before applying to a role.

The first version is optimized for designers and creative job seekers. Users upload or paste their CV, select a target role, and get a browser-only rule-based analysis.

## How to open locally

1. Open the project folder:
   `C:\Users\batuu\OneDrive\Belgeler\GitHub\FixSend`
2. Double-click `index.html`.
3. The site will open in your browser.

No install, npm, backend, database, login, payment, or OpenAI API is needed.

PDF and DOCX reading uses browser-side libraries loaded from public CDNs. If those libraries do not load, users can still paste the CV text manually or upload a TXT file.

## How to publish with GitHub Pages

1. Go to your GitHub repository.
2. Open **Settings**.
3. Open **Pages** from the left menu.
4. Under **Build and deployment**, choose:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/root**
5. Click **Save**.
6. Wait a minute, then open the GitHub Pages link GitHub shows you.

## Files to edit

- `index.html` controls the page content and sections.
- `styles.css` controls the design, spacing, colors, and mobile layout.
- `script.js` controls validation and the Send / Fix / Skip Decision Engine.
- `README.md` is this instruction file.

## Where to change brand colors or text

Brand color is in `styles.css`:

```css
--primary: #2444e5;
```

Main homepage text is in `index.html`, especially the hero section near the top.

## Fix Pack payment and request links

The current Gumroad direct checkout link is:

`https://yabato.gumroad.com/l/fixsend-fix-pack?wanted=true`

The current post-purchase Tally request form is:

`https://tally.so/r/44p06b`

In `index.html`, find the comment near the **Get Fix Pack - $9** button:

```html
<!-- Gumroad overlay checkout. After purchase, Gumroad receipt sends customers to https://tally.so/r/44p06b. -->
```

The site loads Gumroad's overlay script and keeps the checkout links styled with local CSS. If Gumroad's overlay object is available, checkout opens on top of the FixSend page. If the script does not load, the same link still opens the Gumroad checkout page.

## Phase 2 automated dashboard delivery

Fix Pack is positioned as a private dashboard.

Automated MVP flow:

1. Customer buys Fix Pack on Gumroad.
2. Gumroad receipt/content should send the customer to `submit.html`.
3. Customer submits purchase email, target role, FixSend score, and CV text.
4. `submit.js` creates a rule-based Fix Pack dashboard.
5. The dashboard data is stored in Supabase.
6. Customer is redirected to `dashboard.html?id=<report-id>`.

Email delivery is the next step. Add Resend or another email service after the dashboard flow works.

## Supabase SQL

The full table and policy setup is in:

`supabase.sql`

For the browser-only dashboard MVP, the public anon key needs insert permission on `fixpack_reports`. This is what lets `submit.html` create the dashboard row.

## Where payment or AI can be added later

- Payment currently uses Gumroad through the **Get Fix Pack - $9** links in `index.html`.
- AI-powered reports can be added later by replacing or extending the rule-based logic in `script.js`.
- For the MVP, everything runs locally in the browser and no CV text is stored.
