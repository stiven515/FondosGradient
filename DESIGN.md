---
name: Gradient Studio
description: A live gradient engine shown as its own gallery, a light cool-grey frame with a teal hand and one copper note.
colors:
  page-grey: "#E3E8EC"
  frame-mist: "#F3F6F8"
  raised-white: "#FBFCFD"
  sunken-grey: "#E8EDF0"
  teal-wash: "#E2EDEF"
  ink-teal: "#12343B"
  ink-2: "#3F5A61"
  ink-3: "#567078"
  line: "#D2D9DE"
  line-strong: "#B4BFC6"
  teal: "#1D6670"
  teal-hover: "#17555E"
  on-teal: "#F3F8F9"
  copper: "#B8643F"
  copper-ink: "#94492A"
  danger: "#A33A2E"
typography:
  display:
    fontFamily: "Hanken Grotesk Variable, Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(3.4rem, 11vw, 7.5rem)"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Hanken Grotesk Variable, Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 5.2vw, 4.2rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Hanken Grotesk Variable, Hanken Grotesk, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Hanken Grotesk Variable, Hanken Grotesk, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Hanken Grotesk Variable, Hanken Grotesk, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 650
    lineHeight: 1.45
    letterSpacing: "0.16em"
rounded:
  frame: "22px"
  canvas: "18px"
  control: "10px"
  chamfer: "10px"
spacing:
  page-margin: "10px"
  gutter: "12px"
  notch-height: "52px"
  header-height: "64px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.on-teal}"
    typography: "{typography.label}"
    height: "36px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
  button-outline:
    backgroundColor: "{colors.raised-white}"
    textColor: "{colors.ink-teal}"
    height: "36px"
    padding: "0 16px"
  button-outline-hover:
    backgroundColor: "{colors.teal-wash}"
  button-quiet:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 16px"
  icon-button:
    textColor: "{colors.ink-3}"
    rounded: "{rounded.control}"
    size: "32px"
  segmented-control:
    backgroundColor: "{colors.sunken-grey}"
    rounded: "11px"
    padding: "4px"
---

# Design System: Gradient Studio

## Overview

**Creative North Star: "The Gallery Frame"**

The product is its own gallery. The page is a cool-grey mat, the app sits in a lighter rounded frame 10px inside it, and the only image anywhere is the live WebGL artwork. Everything else is a quiet instrument: teal-ink type, thin lines, teal action fills, and a single warm copper note for live state and recording. The frame, the notch tab set into its top edge, and the chamfered controls do the work that decoration usually does.

The mood is calm, precise and a little architectural. Density is moderate on the landing (large type, wide air) and tight in the studio (small tracked labels, 32-36px controls). Type is one family at extreme contrast: a huge semibold lowercase title against tiny tracked uppercase labels. The language is bilingual ES/EN, and every label must survive the longer Spanish string.

**Key Characteristics:**
- Light, cool-grey world; ink is deep teal-navy, never pure black or neutral grey.
- Teal is the action colour; copper appears once per context (live indicator, recording, one stop of the artwork palette).
- Two signature shapes: the notch tab with inverted corners, and the chamfer (top-right and bottom-left corners cut at 45 degrees).
- Hanken Grotesk only, with tabular figures for every live number.
- Depth is a single soft, ink-tinted offset shadow reserved for floating layers.

## Colors

A cool-grey paper with a teal-navy ink, one teal hand and one copper accent.

### Primary
- **Harbour Teal** (#1D6670): action fills (primary button), slider track and thumb ring, focus ring, text selection, active card outline. Hover deepens to #17555E; text on it is #F3F8F9.

### Secondary
- **Annealed Copper** (#B8643F): the single warm accent. Live and recording state (record dot, progress bar) and one warm stop in the artwork palette. Copper-ink (#94492A) is the text-safe variant.

### Neutral
- **Page Grey** (#E3E8EC): the mat around the frame and the colour of the notch and corner tabs, so tabs read as bites out of the frame.
- **Frame Mist** (#F3F6F8): the frame surface.
- **Raised White** (#FBFCFD): cards, popover fill, active segment.
- **Sunken Grey** (#E8EDF0): wells for segmented controls and the language toggle.
- **Teal Wash** (#E2EDEF): opaque hover/active fill on top of an outline layer (translucent colours would show the outline through).
- **Teal-Navy Ink** (#12343B): primary text. Ink-2 (#3F5A61) for secondary copy, ink-3 (#567078) for labels and inactive icons.
- **Line** (#D2D9DE) hairlines; **Line Strong** (#B4BFC6) for control outlines and slider rails.
- **Danger** (#A33A2E): errors only (soft tint at 10% alpha).

### Named Rules
**The One Warm Note Rule.** Copper marks live state and nothing else on a given screen. It is never a button fill or a heading colour.
**The Tinted Ink Rule.** No pure black, no neutral grey text. Every dark is the teal-navy ink at some strength; every shadow is ink-tinted.

## Typography

**Display / Body / Label Font:** Hanken Grotesk Variable (fallback Hanken Grotesk, system-ui, Segoe UI, sans-serif), stylistic sets ss01 and cv11 on.

**Character:** One grotesque used at two extremes: very large and tight, or very small and widely tracked. The middle of the scale is kept short.

### Hierarchy
- **Display** (600, clamp(3.4rem, 11vw, 7.5rem), 0.9, -0.04em): the lowercase "gradient studio" title only.
- **Headline** (800, clamp(2.2rem, 5.2vw, 4.2rem), 0.95, -0.02em, uppercase, balanced wrap): landing section headings.
- **Title** (700, 16px, 1.2, -0.01em): style-card names; brand name at 14px.
- **Body** (400, 14px, 1.45; descriptions 12.5px ink-3; section hints ink-2, max about 28rem): all running text.
- **Label** (650, 10.5px, 0.16em, uppercase, ink-3): panel labels, HUD, readouts, nav anchors. Buttons use bold 10.5-11px at 0.14em, uppercase. The hero tagline is the same voice at 12.5px/0.2em, bold, ink.

### Named Rules
**The Two Extremes Rule.** Size jumps from tiny tracked caps to huge display; do not add mid-size decorative headings.
**The Tabular Rule.** Any number that changes live carries `tabular-nums`.

## Layout

The viewport is a fixed page-grey surface with a 10px margin; one rounded frame fills the rest (38px bottom margin when a footer HUD sits beneath it). Screens never scroll the page; the landing scrolls inside the frame with scroll-linked CSS variables driving parallax, and the studio is a flex column: 64px header, a row of sidebar plus canvas separated by 12px gutters, then a bottom dock and a readout footer. The landing uses wide sections (py-28 to py-36, max-w-6xl, a three-column grid of cards / disc / cards at lg that collapses to disc-first single column). Spacing is a 4px-based Tailwind rhythm; 12px is the studio gutter. Secondary toolbar buttons hide below the `sm` breakpoint (fullscreen, help, button label), and the brand name hides too.

## Elevation & Depth

Hybrid: tonal layering first (page, frame, raised, sunken), with one soft shadow vocabulary for things that float. Surfaces at rest are flat and outlined with a 1px line.

### Shadow Vocabulary
- **Raised** (`0 1px 2px rgba(18,52,59,0.07), 0 16px 32px -16px rgba(18,52,59,0.26)`): resting panels that need lift.
- **Pop** (`0 2px 4px rgba(18,52,59,0.08), 0 22px 44px -18px rgba(18,52,59,0.34)`): menus and the landing style disc.
- **Segment** (`0 1px 2px rgba(18,52,59,0.2)`): the active segment in a segmented control and the language toggle.

### Named Rules
**The Soft Float Rule.** Shadows are an offset plus a wide soft blur, tinted from the ink. Shadows only mark floating layers, not decoration.

## Shapes

Three radii and one cut. The frame is 22px, the canvas inside it 18px, controls 10px (segments 8px inside an 11px well). The signature silhouette is the chamfer: top-right and bottom-left corners are cut at 45 degrees, 10px, by `clip-path`. Because clipping removes borders, outlined chamfers are built as two layers: a 1px line-strong outer layer and a raised inner fill with a 9.5px cut. The second signature is the notch: a page-grey tab, 52px tall, centered in the frame's top edge with 22px inverted corners (a corner variant hugs the top-left). Sliders are 3px rails with a 14px ring thumb. The landing disc is the one organic form: a slowly morphing blob border around the live canvas, conic-lit.

## Components

### Buttons
- **Shape:** chamfered (primary, outline) or 10px-radius (quiet). Height 36px (md) or 32px (sm), bold uppercase 10.5-11px at 0.14em.
- **Primary:** teal fill, on-teal text, 16px side padding; optional trailing arrow that nudges up-right on hover.
- **Outline:** 1px line-strong chamfered outline over raised fill; hover fills with teal wash.
- **Quiet:** ink-2 text, hover teal-soft background.
- **Hover / Focus / Active:** colour shifts over 150ms, press scales to 0.98, disabled 50% opacity. Focus is a 2px teal outline offset 2px.

### Icon buttons
32px square, 10px radius, ink-3, hover or active teal-soft with ink. Always carry an aria-label and title. Icons are 16px stroke 1.8 line icons.

### Segmented controls
Sunken well with 4px padding; the active option is a raised-white pill with the segment shadow. Used for format, size and language (ES/EN).

### Cards / Containers
Outlined chamfered card: raised fill, 1px line-strong edge; the selected card swaps its edge to teal and fills teal wash. Popover is the same with Pop shadow, 268px wide, 16px padding, 16px internal gaps.

### Inputs / Fields
Range sliders (3px teal fill over line-strong, ring thumb, focus ring offset 6px). Radios are visually hidden inside segment labels with a focus-within outline in teal.

### Navigation (Notch)
A page-grey tab with inverted corners, 52px tall, holding the landing's four anchors or the studio's tool icons separated by 1px dividers. Anchors are label type, active in ink.

### Brand mark
A 28px rounded tile with two crossing glass ribbons, teal-navy and copper gradients. Drawn, not a glyph.

### Artwork (signature)
The WebGL canvas is the only imagery. The `ribbon` shader renders half-round glass tubes lit by an environment drawn from the palette (dark below, pale above, a warm patch at the palette's end). A 60% frame-mist radial veil sits under the hero title for legibility.

### Motion
Ease-out is `cubic-bezier(0.16, 1, 0.3, 1)`; most transitions are 150-200ms, reveals rise 18px over 0.9s with a stagger, the hero frame becomes the studio canvas through a 0.62s view transition. All motion collapses to 0.01ms under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** draw every panel, card and primary/outline button with the chamfer (10px, top-right and bottom-left) and use the two-layer outline when it needs an edge.
- **Do** colour tabs the page grey (#E3E8EC) so they read as cut-outs of the frame.
- **Do** keep copper to live and recording state; use teal for every action.
- **Do** give icon-only controls a required accessible label and write copy in both ES and EN.
- **Do** use tabular figures for live readouts, and keep text on the teal-navy ink scale.
- **Do** keep content visible by default and animate entrances only from a visible state.

### Don't:
- **Don't** make a dark, neon creative-tool dashboard or a stock-gradient SaaS landing with a screenshot mockup (the confirmed refusal of this world).
- **Don't** use pure black, neutral grey text, or hard offset shadows; shadows are soft and ink-tinted.
- **Don't** put a translucent fill over an outline layer; use the opaque wash instead.
- **Don't** put images other than the live engine on a surface, or invent customers, quotes or numbers.
- **Don't** apply `border-radius` to chamfered shapes; the clip-path defines them.
