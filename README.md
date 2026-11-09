# Michigan Ability Partners — redesign concept

A pitch build by Affine for mapagency.org. It's a static site with no build step and no dependencies. To see it, open `index.html` in a browser.

## Concept

**"Navigation for Real Life"**: MAP's own tagline turned into a full visual system.

- **NPS Unigrid bones.** Vignelli's National Park brochure system gives the site a black band header, a strict grid, real photography and figure captions. It reads as civic and trustworthy, and it is clearly not a template.
- **The four programs are transit lines.** Housing (teal), Representative Payee (violet), Veterans (brick) and Eviction Prevention (ochre). Each line has a station for each step. Every color comes from MAP's logo except the ochre.
- **Trip planner (home page).** Visitors pick their county and their situation. The planner shows the right program, the first step, what to bring and the nearest office, along with honest eligibility rules (Washtenaw-only eviction funds, the $3,000 cap, HAWC referrals first).
- **Accessibility as a feature.** The whole site is set in Atkinson Hyperlegible Next and Mono, the typefaces the Braille Institute designed for low-vision readers. It has a three-step text-size toggle, 44px+ tap targets, visible focus states and reduced-motion support.
- **Live office status.** The site shows whether each office is open right now in Michigan time, including the lunch hour and the 2026 closures.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: hero, system map, trip planner, impact, quote, service area, get involved |
| `housing.html` | Line 01: Housing |
| `representative-payee.html` | Line 02: Representative Payee |
| `veteran-services.html` | Line 03: Veteran Services (HVRP) |
| `eviction-prevention.html` | Line 04: Eviction Prevention, with an inquiry form |
| `about.html` | Mission, CEO quote, values, history timeline, document library |
| `get-involved.html` | Ways to give, volunteer roles, events, careers |
| `contact.html` | Offices, contact form, 2026 closures |

## Editing

All pages are generated from `tools/build.py`, which holds one shared header and footer. Change copy there, then run:

```
python3 tools/build.py
```

You can also edit the generated `.html` files directly. A later build overwrites those edits.

- Styles: `css/map.css`
- Behavior: `js/map.js` (text size, menu, line drawing, trip planner, office hours, forms)

## Before this goes live

- [ ] **Photos and logo are hotlinked from MAP's current Wix media library.** Download them and self-host them in an `img/` folder. If MAP cancels Wix, those URLs die.
- [ ] **Forms open the visitor's email app** (mailto to info@mapagency.org). Swap them to Formspree or another form service so submissions arrive without an email client.
- [ ] Confirm that the About page photo is Jan Little. It is the only photo on their current About page.
- [ ] Confirm the mailing address for checks. The current site says "the address listed below" and lists both offices. This build uses the Ann Arbor address.
- [ ] The Cornhole fundraiser has no date on the current site. It shows "Date to be announced."
- [ ] Staff, Board, Partners, Newsletters, Financials, Advocate, Jobs, Resources, Maintenance Requests and the payee application still link to the old site's pages. Migrate them or rebuild them.
- [ ] Office hours and closures are hard-coded in `js/map.js` (`HOURS`, `CLOSED`). Update them each year.
