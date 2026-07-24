---
name: app-ui-decomposition
description: >
  Decompose any web or mobile application UI into a complete, deduplicated, tagged
  component library. Use when the user wants to break an app interface into editable
  building blocks, extract design tokens, generate themed component assets (light and
  dark, every state), build a component catalogue or design system inventory, produce a
  tag to image map, or rebuild and restyle an app from its parts. Triggers include
  "decompose the UI", "break the app into components", "build a component library",
  "extract the design system", "componentise the interface", "create every element of
  the app", "make a styled variation of these components".
license: Authored for Ayodeji Falope, RevenStrat / iicocece.
---

# App UI Decomposition and Component Library Builder

## Purpose

Turn a working application into a single source of truth: every screen broken into the
smallest editable parts, each part captured once in every state and theme, named, tagged
and traceable, so a small edit to a master flows through the whole product. The output is
a design system of assets, not a pile of screenshots.

## When to use

- The user wants every element of an app pulled apart into editable images or vectors.
- The user wants light and dark, and every interaction state, of each component.
- The user wants a catalogue or inventory of components with machine readable tags.
- The user wants to restyle a whole app by editing the small parts and feeding them back.

## Core principle

Render from the real source, not from flat screenshots. A screenshot is a dead image with
no layers, so removing text means guessing pixels and editors shift every size and shadow.
If the source code or design tokens exist, render each component from those values. Then
the with text and without text versions are exact, light and dark are exact, and the parts
actually drive the live app.

## Workflow

1. Find the source of truth. Look for the codebase, the design token file (CSS custom
   properties, a tokens file, a Tailwind config) and any existing component kit. Read the
   real colour, font, radius, shadow and spacing values for light and dark.

2. Build the token control sheet. List every token in a readable table. This is the lever
   that changes the whole look and feel at once.

3. Enumerate the components. List every primitive (button, input, select, toggle, checkbox,
   radio, chip, pill, avatar, tooltip, progress, spinner, tabs, breadcrumb, pagination) and
   every organism (card, list row, table, sidebar, header, hero, modal, sheet, toast, alert,
   date picker, empty, loading and error states, brand mark, icons).

4. Enumerate states and themes. For each component capture default, hover, active, focus,
   selected, disabled, loading, error, success, checked, unchecked, open, closed, empty,
   filled, and any others that apply, in both light and dark.

5. Render masters as SVG, rasterise to PNG. Build each component as a clean SVG using the
   real token values, keeping the text label as a separate node so with text and without
   text are pixel identical in structure. Rasterise with a renderer that supports filters
   (resvg via @resvg/resvg-js is reliable; cairosvg works for flat shapes only).

6. Deduplicate and tag. Many usages share one visual. Render each unique
   component, variant, state, theme once. Give each a stable component ID. Tag every usage
   with a parseable path, for example tp.<page>.<category>.<component>.<variant>.<state>.<theme>,
   plus a short uppercase code.

7. Build the deliverables. A folder tree by component and theme; a registry (JSON and CSV)
   of the unique masters; an instance index mapping every tagged usage to its master; a
   catalogue document; and a token control sheet.

## Styled variations

To restyle (for example a claymation skin), keep the originals untouched in their own
folder and render variations into a separate folder. For clay, use an SVG filter chain of
feTurbulence plus feDisplacementMap for lumpy edges, feSpecularLighting for the soft three
dimensional sheen, and feDropShadow for grounding. Recolour with the target palette.

## Reference and reuse pattern

Never duplicate image bytes for repeated usages. Store each unique master once with a
stable ID and let every usage reference that ID through a registry and an index. This is
how design tokens and master components work: define once, reference many. Avoid operating
system symlinks; they are fragile and do not survive zipping or moving.

## Tools

- @resvg/resvg-js for SVG to PNG with full filter support.
- Python for token mining and catalogue generation.
- docx (npm) for the catalogue Word document; build per group tables, not one giant table.

## Output checklist

- Token control sheet.
- Component masters, light and dark, every state, PNG and SVG.
- Originals and any styled variations kept in separate folders.
- Registry of unique masters with stable IDs.
- Instance index or tag to image map covering every usage.
- Catalogue document and a short guide explaining the tag scheme.
