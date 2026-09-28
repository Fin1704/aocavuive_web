# Fish-free ocean backgrounds

Edited with the built-in imagegen tool. Original backgrounds are retained; the intro image preload, responsive picture and WebGL refraction now use:

- `public/ocean-intro/reef-landscape-clear.webp` (1672 × 941)
- `public/ocean-intro/reef-portrait-clear.webp` (941 × 1672)

Outputs were visually inspected and encoded as WebP at quality 88. Fish are rendered separately using the game's animated atlases. No round play button is displayed beneath the swipe guide; a visually hidden native button preserves Enter/Space and screen-reader access, with focus indicated by the guide text glow.

## Prompts (built-in imagegen edits)

### Landscape

Use case: precise-object-edit. Edit target: supplied landscape underwater reef background. Remove EVERY fish from this image, including all large foreground colorful fish, the schools of tiny fish in the upper left and upper right, all tiny yellow fish near rocks, and all distant fish silhouettes. Seamlessly reconstruct empty water or reef behind removed fish. Keep the landscape aspect ratio, camera framing, beautiful 2.5D game illustration style, turquoise water, sunbeams, caustics, sandy central corridor, all rocks, seaweed and colorful corals unchanged as closely as possible. This is a clean environmental background for separately animated fish overlays. Absolutely no fish anywhere, no other animals, no text, no logo, no UI. Output one edited landscape image.

### Landscape cleanup

Precise cleanup edit of this existing landscape underwater reef background. The fish have mostly been removed, but clean ALL remaining yellow fish fragments and fish-tail-shaped artifacts, particularly the yellow triangular fish-tail remnants against the RIGHT rock around x=1540 y=340 (image width1672 height941), and the scattered tiny yellow fish-shaped dots in the water around the seaweed on both sides. Replace these fragments with continuous blue water or rock texture. Preserve every other element exactly: camera, landscape ratio, corals, seaweed leaves connected to stems, rocks, sand, sunbeams, ripples, colors, style. Do not add any objects, fish, animals, text or UI. Output one clean fish-free environmental landscape background.

### Portrait

Use case: precise-object-edit. Edit target: supplied portrait underwater reef background. Remove EVERY fish from this image. Remove the complete schools on the upper left and upper right, all big orange fish at bottom left and bottom right, all striped black/yellow fish near the right side, every tiny yellow fish scattered near the reef at every depth, all distant silhouettes. No remaining fish bodies, tails, fins, fragments or fish-shaped dots anywhere. Seamlessly fill the removed regions with empty turquoise water or appropriate reef surface. Preserve portrait aspect ratio, framing, 2.5D game illustration style, turquoise water and sunbeams, caustics on sand, central empty sandy corridor, the rocks and colorful coral and seaweed as closely as possible. This is the environment layer for a game with separate animated fish. Absolutely no fish, no animals, no text, no UI, no logos. Output one edited portrait image.
