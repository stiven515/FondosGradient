# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences with equal weight, confirmed by the user:

- **Designers and content creators.** They need a background for a presentation, social post, cover or wallpaper. They pick a look, tweak colors, export an image or a video loop.
- **Front-end developers.** They need an animated background for a site. They copy the CSS, share a design as a link, or export an asset.

Both work on desktop at a screen, usually mid-task, and want a result in minutes without an account. The interface speaks Spanish and English, switchable by the visitor.

## Product Purpose

Gradient Studio is a browser editor for animated gradient backgrounds rendered in real time with WebGL. A visitor chooses a style, tunes the palette and parameters, adds an effect, and leaves with an image, a video loop, CSS, or a link to the exact design. Success: someone lands, understands in seconds that the backgrounds are live and editable, opens the studio, and exports something they would use.

## Positioning

The gradients are not stock images or CSS approximations: they are generated live by the product's own WebGL engine, so every design is a moving, parameter-driven artifact that can be exported as video, as a still at up to 4K, or as a shareable link that restores the exact state. It runs entirely in the browser, with no backend and no account.

## Operating Context

The studio is a single-screen editor: a live canvas, a controls panel (style, palette, parameters, effects), a timeline with playback, and presets (palettes, looks, saved designs). Work is iterative and visual; undo/redo, keyboard shortcuts and autosave matter. State persists in the browser (localStorage) and travels in shareable URLs. It ships as a static site on Vercel.

## Capabilities and Constraints

- 7 animated styles: Flow, Beam, Mesh, Liquid, Wave, Silk, Stripe.
- Palette of 2 to 8 colors: picker, hex input, presets, harmonious generator, lock, drag reorder, extract from an image.
- 6 effects with adjustable intensity: grain, glow, chromatic, glass, dither, halftone.
- Timeline: scrubbing, durations of 5/10/20/30 s, seamless loops (except Flow).
- Export: PNG/JPG/WebP at current size, 2x or 4K; video loop (MP4 or WebM by browser); CSS (linear or mesh); shareable link; aspect ratios Free, 16:9, 4:3, 1:1, 9:16.
- 8 complete looks and up to 24 saved designs per browser.
- Technical constraints: WebGL 1, React 18 + TypeScript + Vite + Tailwind + Zustand, no backend, static deploy. Must keep working: every existing feature, keyboard shortcuts, URL state, export pipeline and the Vitest/Playwright suites (update their expectations rather than deleting coverage).
- Undecided: product copy for the landing (the user has not supplied any), a logo (none exists; the favicon is a placeholder gradient square).

## Brand Commitments

- Name: Gradient Studio. License: MIT. Repository: stiven515/FondosGradient.
- The user supplied a screen recording of an award-style website as the binding visual reference (see the surface briefs for what was taken from it). The light theme is confirmed; interface text is bilingual Spanish/English with a visitor-facing selector; conversation and commit messages are in Spanish.

## Evidence on Hand

- The live product and its engine: 7 styles, 6 effects, exports and share links that work today.
- No customers, testimonials, benchmarks, pricing or press exist; none may be invented. The landing must prove the product through its own live output.

## Product Principles

- **Show the engine, not a picture of it.** Wherever the product is described, the live WebGL output is the evidence.
- **The first result takes seconds.** Nothing between a visitor and a moving, exportable design: no account, no wall.
- **Every control keeps its keyboard and screen-reader path.** Expressive motion never replaces a usable control.
- **Both audiences are served by one surface.** Designers and developers meet the same editor; the export menu is where they diverge.
- **Motion is respectful.** Everything honors reduced-motion and stays usable when WebGL or video recording is unavailable.

## Accessibility & Inclusion

Keyboard navigation for all controls, visible focus, ARIA on custom controls (timeline slider, tabs, dialogs), `prefers-reduced-motion` honored (animation starts paused), and graceful messages when WebGL is unavailable. Bilingual interface (Spanish and English) with the choice remembered.
