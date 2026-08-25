# Pending rebuilds — client-approved specs and verbatim copy

Written to disk so the copy survives a context reset. **The copy below is final
and verbatim** — do not rewrite, shorten, expand or add to it. UK English. A
spaced hyphen ( - ) normalises to a spaced em dash ( — ); nothing else changes.
Sentence-level line breaks are deliberate: keep them as separate lines.

Status: tasks 1–3 done (route rename, STUDIOS, SOCIAL_LINKS). Tasks 4–7 below.

---

## Standing rules (apply to every edit)

- **Brand locked.** Only existing tokens/colours/fonts/spacing. No new colour,
  font family, shadow or border radius. Nearest existing token if a mockup
  implies a new one.
- **Reuse components before writing new ones.** New ones built from same tokens.
- **Keep existing motion language** (scroll reveals, easing, durations). No new
  animation libraries.
- **Copy verbatim.** No filler, taglines or microcopy of my own.
- Don't delete a route/component/asset another page uses — check first.
- **Missing image →** render the existing panel/card component with its
  background token + `data-asset-slot="<page>-<section>"`, and append a row to
  `/ASSET-SLOTS.md`. Never a stock image, placeholder service, broken path, or
  colour block with lorem.
- One h1 per page, alt text on every image, aria-label on icon-only links,
  visible focus, 44px touch targets.
- Must work at 360 / 768 / 1024 / 1440.
- Print a short diff summary after each task: files touched, components added,
  anything not done.

## Verification gate (there is no lint/typecheck — no package.json)

```sh
python3 tools/sync-partials.py --check      # shared regions + generated runs
node --check assets/*.js api/contact.js
python3 -c "import glob;[__import__('sys').exit('unbalanced '+f) for f in glob.glob('assets/*.css') if open(f).read().count('{')!=open(f).read().count('}')]"
# headless: serve.py + check.mjs in the scratchpad; console errors + overflow at 360/768/1024/1440
```

## Architecture reminders

- Static HTML, no framework, no build step. Six pages at repo root.
- `tools/site_config.py` holds `NAV`, `STUDIOS`, `STUDIO_LINE`, `SOCIAL_LINKS`,
  `SOCIAL_ICONS`, `CONTACT_EMAIL`(""), `CONTACT_PHONE`("").
- `tools/sync-partials.py` copies `SHARED:head|nav|cta|foot` from `index.html`
  and fills `<!-- gen:x -->` runs. **Run it after editing any shared region.**
- Page CSS/JS load *after* `site.css`/`site.js`, below `#endregion SHARED:head`.
- Available images: `assets/studio/monaco-terrace.webp`,
  `studio-interior.webp`, `waterfront-direction.webp` (all 1122×1402, 4:5).

---

# TASK 4 — rebuild /studio

Replaces page content entirely.

**REMOVE:** enquiry form section, "Book a call" tab, results/stats band, "What we
do" three-discipline block, VR market statistic strip, camera-HUD hero overlay
(REC / aperture / ISO). Check `/digital-services` and `/` for shared usage before
deleting a component — if shared, leave it and just stop rendering it here.

**KEEP:** shared header, footer, existing global CTA band at the foot.

**LAYOUT**
- Full-bleed hero ~80vh, image background, dark gradient scrim from the left.
  Title + subtitle in the upper-left third.
  Image `assets/studio/monaco-terrace.webp`, alt "A terrace above Monaco harbour at dusk".
- Below: mosaic of five numbered tiles, not full-width stacked sections.
  Row 1 — three equal tiles: 01, 02, 03. Row 2 — 04 at ~⅓ width, 05 at ~⅔.
- Each tile: small index+label top-left ("01  THE STUDIO"), letterspaced,
  uppercase, muted token. Image/panel fills the tile; body copy in a readable
  column with a scrim behind where it overlaps imagery.
- 1px hairline gutter between tiles in the hairline token — not a background gap.
- Responsive: 3-up → 1-up below 768px; row-2 pair stacks below 1024px. On mobile
  each tile is a full-width block, **image above copy — never text over image at 360px**.
- Page ends with a single centred CTA.

**IMAGERY**
- 01: wide crop of `assets/studio/monaco-terrace.webp`, alt "The Monaco coastline seen from the studio".
- 04: `assets/studio/studio-interior.webp`, alt "Material samples and reference prints laid out on a studio table".
- 05: `assets/studio/waterfront-direction.webp`, alt "A contemporary waterfront pavilion at golden hour".
- 02: slot `studio-philosophy` — close detail shot suggesting optics or light. 3:2.
- 03: slot `studio-today` — the team at work around a layout table. 3:2.

**COPY — verbatim**

HERO
Eyebrow: THE STUDIO
Headline: BORN IN MONACO. CREATED AROUND EXPERIENCE.

TILE 01 — label "01  THE STUDIO"
Frameworks Studios was founded in Monaco in 2018 with a simple belief:
EXTRAORDINARY PLACES DESERVE EXTRAORDINARY EXPERIENCES.
At a time when exceptional spaces were still being presented through traditional photography, brochures and familiar marketing formats, we saw an opportunity to create something more powerful.
An experience that could transport people into a place long before arrival.
One that could communicate its ambience, character and ambition — creating emotion, inspiring confidence and building a deeper connection between brands and their audiences.
THAT BELIEF BECAME FRAMEWORKS.

TILE 02 — label "02  THE PHILOSOPHY"
WE ARE NOT DEFINED BY THE TECHNOLOGY WE USE, BUT BY THE EXPERIENCES WE CREATE.
Technology has always been part of our craft, but it has never been the purpose.
Every project begins with the real world: the architecture, the atmosphere, the light, the detail and the feeling that make a place distinctive.
Through real-world capture, visual storytelling, design and technology, we preserve those qualities and transform them into digital experiences that feel intuitive, engaging and true to the place they represent.
The technology should never become the experience.
It should allow the experience to come forward.

TILE 03 — label "03  THE STUDIO TODAY"
DIFFERENT DISCIPLINES. ONE CREATIVE VISION.
Today, Frameworks brings together a global collective of specialists across real-world capture, immersive media, visual storytelling, audio, graphic design, AI and technology.
Each discipline brings a different perspective.
Together, they allow us to see the complete experience — from the first captured image to the final interaction.
We combine creative instinct with technical intelligence to craft digital journeys that reveal the true essence of remarkable places, moving beyond traditional media to create something audiences can explore, understand and feel.

TILE 04 — label "04  BESPOKE BY NATURE"
Every Frameworks commission is shaped by the identity, ambition and character of the brand behind it.
We listen, interpret and create from the inside out — developing a visual language, rhythm and journey that could belong to no one else.
Nothing is templated. Nothing is imposed.
The result is more than an experience of a place. It is an expression of the brand itself.

TILE 05 — label "05  THE DIRECTION"
THE WAY PEOPLE EXPERIENCE PLACES IS CHANGING.
The first encounter with a destination no longer begins at the entrance.
It begins on a screen, in a story, through an interaction and often long before a journey is made.
As brands and destinations become more ambitious, the experiences surrounding them must evolve too.
Frameworks exists to lead that evolution — continuing to expand our craft, embrace new possibilities and create more meaningful ways for people to connect with the world's most remarkable places.

CLOSING CTA — button label "The Craft", destination `/craft`, existing primary button component.

**TYPOGRAPHY MAPPING (all five tiles)**
- All-caps line at top of a tile's copy = the tile's statement line: largest type
  in the tile, display font, existing h2 scale.
- Ordinary sentences: body copy, existing body scale, muted token.
- Final all-caps line in tiles 01 and 02 = closing statement: same treatment as
  the statement line but at h3 scale, full ink/ivory token.
- Three-line rhythm ("Nothing is templated. Nothing is imposed.") stays as
  separate lines, not run together.

**METADATA**
Title: The Studio — Born in Monaco | Frameworks Studios
Description: Frameworks Studios was founded in Monaco in 2018 on one belief: extraordinary places deserve extraordinary experiences. The studio, the philosophy and the direction.

---

# TASK 5 — rebuild /craft

Replaces page content entirely.

**REMOVE:** six-step process strip (Capture, Stitch, Retouch, Stage, Interface,
Deliver), the DSLR technical specification strip, the two existing explanatory
paragraphs. Check shared usage first. **KEEP:** shared header and footer.

**LAYOUT**
- Full-bleed hero ~70vh. Title + subtitle upper-left. Lower-right of the hero: a
  small right-aligned text block — a short all-caps statement above a three-line
  paragraph, small body scale.
- Below: five stage rows. Each row a two-column split — dark copy panel left at
  ~27%, media zone filling the remaining ~73%. Rows separated by a 1px hairline
  rule; copy panel separated from media zone by the same rule.
- Left copy panel, top to bottom: large ghosted stage number in display type at
  existing display scale, muted token; stage title in caps; short hairline rule
  ~32px wide; the stage lead line; then the body paragraph at small body scale.
- **Copy panel is always on the left. Do not mirror alternate rows.**
- Responsive: below 1024px each row becomes copy above media, full width. The
  ghosted number stays but drops to h2 scale.

**MEDIA ZONE PER STAGE**
- 01: one full-bleed image slot filling the zone. `craft-01-brief`. 16:9.
- 02: 55% image slot `craft-02-direction` (4:5) + 45% dark panel holding the
  viewpoint sequence as a numbered list, each row "NN  LABEL", hairline rule
  between rows, letterspaced small caps:
  01 ARRIVAL / 02 PRINCIPAL VIEW / 03 ARCHITECTURAL DETAIL / 04 TRANSITION / 05 FINAL REVEAL
- 03: upper band of three equal image slots with a caption bar beneath each —
  REAL WORLD, CAPTURE, DIGITAL JOURNEY (`craft-03-a`…`craft-03-c`, 16:9).
  Beneath, a lower strip of five smaller equal slots with caption bars, in order:
  LIVING LIGHT, IMMERSIVE SOUND, EMBEDDED MEDIA, INTUITIVE INTERACTION,
  NATURAL TRANSITIONS (`craft-03-1`…`craft-03-5`, 4:3).
  **Below 768px the lower strip becomes a horizontally scrollable row with scroll
  snap, not a five-wide grid.**
- 04: 50% image slot `craft-04-review` (16:10) beside a 50% zone split
  horizontally — upper half a before/after comparison panel with two image slots
  labelled BEFORE and AFTER in a caption bar (`craft-04-before`, `craft-04-after`,
  both 16:9); lower half a single wide slot `craft-04-grade` (21:9).
- 05: 60% image slot `craft-05-launch` (4:5) beside a 40% dark closing panel,
  centred, holding the closing copy and the CTA.

**COPY — verbatim**

HERO
Eyebrow: THE CRAFT
Headline: THE ART OF CREATING PRESENCE.
Lower-right statement line: EXTRAORDINARY EXPERIENCES ARE NEVER ACCIDENTAL.
Lower-right paragraph: They are shaped by vision, refined by judgement and brought to life with precision.

INTRO — directly beneath the hero, full width, centred, max 68 characters per line:
Every commission begins with a clear ambition: to translate the character of a place into an experience that feels distinctive, effortless and true to the brand behind it.
Our craft lies in the decisions that carry that ambition from the first conversation to the final interaction.

STAGE 01 — number "01", title "THE BRIEF"
Lead: Understanding the ambition.
Body:
We begin by listening.
The project, the place, the audience and the commercial purpose are considered alongside the identity, values and aspirations of the brand.
This creates a clear foundation for the commission — defining what the experience must communicate, how it should feel and what it ultimately needs to achieve.
Closing statement line (caps, h3 scale, full ink/ivory token, foot of the copy panel): A CLEAR BRIEF GIVES EVERY DECISION THAT FOLLOWS A PURPOSE.

STAGE 02 — number "02", title "THE DIRECTION"
Lead: Seeing the whole before capturing the first frame.
Body:
Through on-site discovery, we determine how the experience should unfold.
We consider how the place is approached, how its spaces connect and which perspectives, moments and details will leave the strongest impression.
From this understanding, we establish the creative direction and map the complete journey.
Every viewpoint is chosen.
Every transition is planned.
Every interaction is intentional.
Closing statement line: THE FOUNDATION FOR EVERYTHING THAT FOLLOWS.

STAGE 03 — number "03", title "THE MAKING"
Lead: From the real world to a complete digital journey.
Body:
Real-world capture preserves the architecture, materials, light and character of the place.
The captured environment is then shaped through sound, content, interface, design and interaction. Sound creates depth. Content adds meaning. Design establishes clarity. Interaction invites discovery.
Transitions feel natural. Navigation remains intuitive. Information appears at the right moment without competing with the environment.
Closing statement line: THE PLACE LEADS · DESIGN GIVES IT RHYTHM · TECHNOLOGY WORKS QUIETLY BENEATH THE SURFACE.

STAGE 04 — number "04", title "THE REFINEMENT"
Lead: Tested against the brief. Refined against the standard.
Body:
The complete experience is reviewed with the client and examined across devices, screen sizes and viewing conditions.
We test the imagery, navigation, transitions, interactions, sound, content and performance — ensuring every element remains aligned with the original vision.
Anything unnecessary is removed.
Anything distracting is resolved.
Anything incomplete is refined.
Closing statement line: NOTHING MOVES FORWARD UNTIL IT FEELS COMPLETE.

STAGE 05 — number "05", title "THE LAUNCH"
Lead: Delivered with confidence.
Body:
Once approved, the experience is prepared for launch across the selected platforms, devices and digital environments.
Every commission is delivered as a considered brand asset — ready to be shared with audiences, integrated into wider campaigns and supported as it continues to evolve.
The work may be complete.
Its journey is only beginning.

CLOSING PANEL (inside stage 05's media zone)
Statement: FROM FIRST IDEA TO FINAL INTERACTION.
Paragraph: Every stage is connected by one creative vision and one uncompromising standard.
Button label: Explore the Works — destination `/works` — existing outline/secondary button component.

**METADATA**
Title: The Craft — From First Idea to Final Interaction | Frameworks Studios
Description: How a Frameworks commission is created: the brief, the creative direction, real-world capture and making, refinement against the standard, and launch.

---

# TASK 6 — rebuild /contact

Six sections: 01 hero · 02 project form · 03 the first conversation · 04 our
studios · 05 direct contact · 06 closing statement.

**KEEP the form plumbing** — same endpoint (`/api/contact`), same success/error
states, same honeypot (`_gotcha`), same validation approach. Changing fields and
copy, not transport.

**01 HERO** — id `start` (the closing button scrolls here).
Eyebrow: CONTACT
Headline: START YOUR JOURNEY
Paragraph: Every extraordinary project begins with a conversation. Tell us about your vision, and we'll transform it into an unforgettable experience the world will want to discover.

**02 PROJECT FORM** — exactly these fields in this order. Labels uppercase and
letterspaced at the existing label scale; placeholder is the second string.
1. NAME — "Your name" — required
2. COMPANY / ORGANISATION — "Company or brand" — optional
3. EMAIL — "Email address" — required, type email
4. PHONE — "Telephone number" — optional, type tel
5. PROJECT LOCATION — "City, region or country" — optional
6. PROJECT TYPE — select, default option "Select one", required. Options in order:
   Hospitality or Destination / Real Estate or Development / Culture or Landmark /
   Sport or Entertainment / Automotive or Yachting / Brand Experience /
   Healthcare / Digital Services / Other

Required fields carry an asterisk in the label and `aria-required`.
**Remove** the old Sector, Timeline, Budget and "What do you need?" chip fields.
Keep the free-text message field with label ANYTHING ELSE WE SHOULD KNOW and
placeholder "Tell us about the project" if one already exists; do not add one if not.

Consent checkbox, verbatim, required:
I agree to Frameworks Studios storing these details in order to respond to my enquiry.

Submit button label: Start your journey
Beneath the button, small muted text: A CONSIDERED RESPONSE WITHIN ONE WORKING DAY.

**Map new fields to the existing endpoint payload.** If the endpoint expects old
names, add an explicit mapping layer in the submit handler rather than renaming
at the API — and print that mapping in the summary.
(API currently accepts: name, company, email, phone, sector, location, services,
budget, timeline, date, time, message, source + control fields mode/next/_gotcha.
PROJECT TYPE most likely maps → `sector`; PROJECT LOCATION → `location`.)

**03 THE FIRST CONVERSATION**
Heading: THE FIRST CONVERSATION
Paragraph: We listen first. We will ask the right questions, understand the ambition and give you a clear view of the creative direction, scope and next steps.

**04 OUR STUDIOS**
Eyebrow: OUR STUDIOS
Heading: THREE STUDIOS. ONE GLOBAL PERSPECTIVE.
Render from the `STUDIOS` constant as three equal columns separated by hairline
rules, each showing the city on one line and the role beneath in the muted token:
MONACO · Headquarters
JEDDAH, KINGDOM OF SAUDI ARABIA · Studio
UNITED KINGDOM · Studio
Below 768px they stack.

**05 DIRECT CONTACT** — email and telephone not yet supplied. Do not invent them.
`CONTACT_EMAIL` / `CONTACT_PHONE` already exist in site_config as empty strings.
Render conditionally: if both empty the section does not render at all and
nothing breaks. If populated: two hairline-separated columns, uppercase label
(EMAIL / TELEPHONE), value as a `mailto:` / `tel:` link in the existing link style.
Already recorded under "Pending client content" in ASSET-SLOTS.md.

**06 CLOSING**
Statement: THE NEXT EXTRAORDINARY EXPERIENCE BEGINS HERE.
Button label: Start your journey
Behaviour: smooth-scrolls to `#start` on the same page — not a route link.
Respect `prefers-reduced-motion` by jumping instead of animating.

**REMOVE:** the old five-location line at the foot of the page — section 04 replaces it.

**METADATA**
Title: Contact — Start Your Journey | Frameworks Studios
Description: Every extraordinary project begins with a conversation. Tell Frameworks Studios about your vision. Studios in Monaco, the Kingdom of Saudi Arabia and the United Kingdom.

---

# TASK 7 — sitewide consistency pass (no new features)

1. **CTA chain.** Journey reads Home → Studio → Craft → Works → Digital Services
   → Contact. `/studio` ends with a button to `/craft`; `/craft` ends with a
   button to `/works`. Confirm `/works` and `/digital-services` both end with the
   existing global CTA band pointing at `/contact` — leave that band alone.
2. **Typography audit** across `/studio`, `/craft`, `/contact`: every uppercase
   statement line on the same display token, tracking and scale; every body
   paragraph on the same body token. Print inconsistencies found and fix them.
3. **Exactly one h1 per page**, h2/h3 nest correctly. `/craft` stage titles are
   h2; stage lead lines are **not** headings.
4. **Dash normalisation**: hyphen surrounded by spaces → spaced em dash. Do not
   touch hyphenated compounds (real-world, high-end, 360°).
5. Every internal link resolves; every external link `target="_blank"` +
   `rel="noopener noreferrer"`.
6. Run the build; report bundle size change and new console warnings.
   *(No build exists — report file-size deltas and the headless console pass.)*
7. Print the final `ASSET-SLOTS.md` contents.
