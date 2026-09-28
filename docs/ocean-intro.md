# Ocean intro

Home (`/`) now opens with an underwater 2.5D scene: wipe a water veil, reveal the
Ao Cá logo, then enter the existing home page. Other routes bypass the intro.
No Account API or authentication changes are required.

## Behavior

- A union-of-strokes grid unlocks the reveal at 24% coverage. Mouse and touch use
  Pointer Events, capture, interpolation and a maximum 48 FPS draw schedule.
- The redesigned veil draws drifting water mist and bubbles at up to 24 FPS idle,
  48 FPS while wiping. Its persistent offscreen mask preserves cleared strokes.
  Raster size is capped at 1280px per side and 921,600 pixels. A separate WebGL
  refraction/caustics pass animates the reef at up to 30 FPS, falling back to the
  picture if WebGL is unavailable. All loops stop in a hidden tab or on unmount.
- Reveal takes 1.2s; entering takes 1.8s. At the user's request, effects always
  start automatically, including when the OS requests reduced motion. There is
  no motion toggle or click-to-enable gate. A hidden tab pauses rendering and
  resumes on return. The intro has no audio or video dependency.
- `sessionStorage['aocavuive:ocean-intro:v1'] = '1'` records completion/skip.
  Storage failure falls back to memory for the current page lifetime. A full
  reload with storage blocked can show the intro again. Tabs duplicated by the
  browser may inherit sessionStorage according to the browser's normal behavior.
- The background has a 3s deadline; errors/timeouts show the gradient fallback.
  The Skip button is available during loading. Escape also skips. Keyboard users
  can open the ocean with Enter/Space without wiping. The round play button below
  the guide is removed; its accessible action is visually hidden. Focus stays within the intro and returns to
  the main content after completion. Background content is inert during intro.
- Route changes/unmount clear image listeners, timers, RAF, ResizeObserver,
  pointer handlers, visibility/viewport listeners and body scroll locking.
- `/?intro=1` previews the intro regardless of its completed-session marker.
  The welcome screen also has a replay icon. Neither changes the normal one-per-tab flow.
- Visual revision: logo only (no marketing headings/slogans), an illustrated
  shell/gold/turquoise Start button with sheen, floating logo with sparkles,
  three native AoCaVuiVe fish clips, sun shafts, plankton, pointer ripple trails,
  foreground bubbles and a zooming bubble-ring dive transition.

## Native fish animations

The moving fish use the existing `thulu`, `bongbong`, and `hecory` clips from
`ao-ca-vui-ve/assets/characters/fish/<skin>/frames/animation/`. Each retains all
48 original frames, 30 FPS and a 1.6s loop, including tail/fin movement and blinking.
They are visible from the opening screen, before any click or wipe. The earlier
generated `fish-school.webp` is no longer referenced by runtime code.

`tools/pack_intro_fish.py` reads the game's authoritative animation manifest and
packs each clip into an 8×6 lossless WebP sheet in `public/ocean-intro/fish/`.
All frames use the same 320px-wide scale and original canvas/anchor, without
individual crops, recentering or timing changes. The web manifest records source
and output SHA256 hashes, anchors, dimensions and QC. No game files are changed.
CSS uses 48 discrete frame positions, while a separate outer layer moves each
fish through the ocean; frame animation pauses with the hidden-tab class.

Verify all 144 tiles against normalized source frames, exact alpha, unchanged
source hashes and CSS frame positions with:

```sh
python -X utf8 tools/pack_intro_fish.py --verify
```

## Assets and generation

Generated with the built-in `imagegen` tool, then encoded to WebP using Sharp.
The original logo at `public/logo.png` is unchanged. The generated PNG originals
remain in the local Codex generated_images directory. Runtime files are in
`public/ocean-intro/`:

| File | Dimensions | Bytes |
| --- | --- | --- |
| reef-landscape-clear.webp | 1672 × 941 | 282602 |
| reef-portrait-clear.webp | 941 × 1672 | 270000 |
| fish-school.webp (legacy, unused) | 600 × 400, alpha | 39194 |
| start-button.webp | 1000 × 333, alpha | 77258 |
| fish/thulu.webp | 2560 × 1158, 48 frames | 846338 |
| fish/bongbong.webp | 2560 × 1242, 48 frames | 1144210 |
| fish/hecory.webp | 2560 × 1176, 48 frames | 1321434 |

Only the matching background is requested for the viewport's aspect ratio.
The portrait version is used at aspect ratios up to 3:4. Fish are separate layers.

### Final prompts

Landscape:

> Create a polished 2.5D stylized game background illustration for a cheerful underwater ocean website intro. Landscape 16:9 composition, wide full bleed. Camera submerged near a beautiful tropical coral reef, looking through clear turquoise water toward soft sunlight shafts from the surface above. Rich layered lavender, peach, orange and teal corals frame the bottom corners, soft rounded rock formations at left and right, tiny distant schools of fish. Center 50 percent is open luminous turquoise water with plenty of negative space for a logo and button that will be added separately in code. Premium cozy adventure game concept art, painterly rendered 3D volume, gorgeous soft underwater caustics, gentle inviting mood, strong foreground/background depth. No text, no logo, no interface, no border, no humans. Save the generated image and provide its local output path if available.

Portrait (the landscape image was supplied as reference):

> Adapt this exact underwater game illustration into a tall portrait 9:16 mobile background. Preserve the same 2.5D game art, turquoise palette, soft sun rays from the surface, lavender and orange corals, rounded reefs. Recompose rather than squash: corals frame bottom and lower side edges, central upper-middle water spacious and calm for logo and button added in code. No text, logo, border or UI. Keep premium inviting cheerful game atmosphere.

Transparent fish:

> Generate a single isolated small school of three cute tropical reef fish swimming toward the RIGHT, with genuine transparent alpha background. 2.5D cozy adventure game illustration, polished softly painted 3D volume matching a turquoise coral reef environment. One orange-yellow striped fish and two smaller turquoise-blue fish. Natural staggered diagonal school, all full bodies visible, no overlap, generous transparent margin around group. Soft sunlight on upper edges, clean silhouette, lively but tasteful. No scenery, no water rectangle, no shadows on ground, no text, no logo, no border. Landscape aspect ratio.

Shell button (built-in imagegen, transparent PNG converted to WebP):

> Create a single premium casual fantasy ocean game START BUTTON asset with a genuine transparent alpha background. Wide horizontal ornate button, aspect ratio 3:1 for the object, centered and tightly framed with modest transparent padding, canvas landscape. A thick sculpted golden rim with beautiful warm highlights, glossy turquoise and emerald inset center with ample empty flat readable space, elegant small pearly seashell crown on top center, small peach coral and polished cream pearl accents only at left and right ends, slightly curved organic silhouette, dimensional beveled edges, soft hand-painted 2.5D game render, high-end mobile ocean adventure UI. Light from above, vivid yet tasteful, clean crisp silhouette. The center MUST be blank, no text, no letters, no symbol, no background scene, no rectangle backdrop, no ground shadow. This is a single usable UI button sprite, not a sheet, not a mockup.

## Validation

```sh
npm run test:ocean-intro
npm run build
npx tsc --noEmit
```

Tests use Node's test runner, TypeScript and JSDOM. They cover the state machine,
storage success/failure, image success/error/deadline/disposal, bounded raster and
stroke union, plus React DOM integration for pointer reveal, focus/inert, double
clicks, session remount, always-on motion, Escape, stalled images, unmount during
entry, background visibility, storage denial and route isolation.

JSDOM uses simulated canvas/pointer/media APIs and stub header/sidebar components
in the layout test. It does not verify rendered pixels, native mobile gestures,
actual admin API data, GPU usage or FPS. The connected browser was unavailable
(`Browser is not available: iab` and `Browser is not available: chrome`) during implementation, so these visual checks
remain necessary on a browser/device before production release:

- Desktop 1440×900, mobile 390×844, small 320×568 and mobile landscape.
- Verify the moving hand, smooth clear stroke, coral framing, readable text,
  fish alpha edges, bubbles and entering transition.
- Verify touch scrolling stays blocked only inside intro; after Skip/Enter the
  home page scrolls and login/admin navigation works normally.
- Verify refresh/back navigation skips completed intro; test a fresh independent
  tab, automatic motion even with reduced-motion preference, image blocking and denied storage.

The initial release passed 18 Node/DOM tests, production Next.js build, TypeScript
check and git whitespace check. An HTTP smoke check returned 200 for home, login,
admin/users and all three WebP files. Built HTML contains the intro only on home,
not login or admin/users. The temporary production server was stopped afterward.

No production deployment is included.

Revision tests additionally exercise automatic idle drawing without interaction,
native fish presence on first load, stopping drawing on unmount, absence of a
motion toggle even with reduced-motion OS settings, forced preview after completion,
the image button and replay. JSDOM deliberately takes the no-WebGL fallback path;
the shader and visual appearance still require a real browser/device check.

Revision validation: all 20 Node/DOM tests and the production build passed.
The local server was restarted at http://127.0.0.1:3105; `/?intro=1` and the new
button asset return HTTP 200. No connected browser was available for visual QA.
