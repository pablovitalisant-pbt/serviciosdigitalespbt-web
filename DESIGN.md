---
name: PBT Digital Vanguard
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#594138'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#8d7166'
  outline-variant: '#e1bfb3'
  surface-tint: '#a63b00'
  primary: '#a63b00'
  on-primary: '#ffffff'
  primary-container: '#f26522'
  on-primary-container: '#4f1800'
  inverse-primary: '#ffb599'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#909191'
  on-tertiary-container: '#282a2b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb599'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#7f2b00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Archivo Narrow
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Archivo Narrow
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Archivo Narrow
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Archivo Narrow
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Archivo Narrow
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-bold:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  section-gap-lg: 120px
  section-gap-md: 80px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

This design system is engineered for **Servicios Digitales PBT**, focusing on a high-authority, results-driven digital presence. The visual language is deeply rooted in **Professional Minimalism** and **High-Contrast Modernism**, designed to evoke feelings of confidence, speed, and analytical precision.

The style leverages massive, impactful typography and a restricted color palette to drive focus toward conversion and content. It avoids decorative clutter, opting instead for structural integrity, generous whitespace, and a clear visual hierarchy that mirrors the efficiency of the digital services provided.

## Colors

The palette is anchored by **PBT Orange**, a high-energy hue used strategically for calls-to-action and primary brand accents. 

- **Primary Orange (#F26522):** Reserved for action-oriented elements: buttons, links, and key highlights.
- **Deep Black (#1A1A1A):** Used for primary headings and heavy text blocks to ensure maximum legibility and a premium feel.
- **Light Gray Background (#F5F5F5):** The default canvas for the UI, providing a softer alternative to pure white that reduces eye strain while maintaining a clean aesthetic.
- **Surface White (#FFFFFF):** Utilized for card backgrounds and input fields to create subtle depth against the light gray foundation.

## Typography

Typography is the primary driver of this design system's personality. 

**Headlines:** We use **Archivo Narrow** for its condensed, authoritative profile. Major display headings must be **Uppercase** to mirror the "Servicios Digitales PBT" logo and convey a sense of scale. Tight letter spacing on large sizes creates a cohesive, "locked-in" look.

**Body:** **Hanken Grotesk** provides a clean, contemporary contrast. It is highly legible at smaller sizes and maintains a professional tone that balances the aggressive nature of the headlines.

**Scale:** Large typography is used even for secondary information to ensure the message is unavoidable. Vertical rhythm is maintained through a base 8px grid.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a maximum container width to maintain readability on ultra-wide monitors. 

- **Grid:** 12-column system for desktop, 4-column for mobile.
- **Rhythm:** Generous vertical spacing (Section Gaps) is mandatory to create a high-end, editorial feel. Content should never feel "cramped."
- **Alignment:** Consistent left-alignment for text blocks to maintain a clean, readable "axis" down the page.
- **Mobile:** Margins shrink to 16px, and font sizes scale down (specifically Display and Headline LG) to fit narrower viewports while maintaining the bold impact.

## Elevation & Depth

To maintain a "Professional Minimal" aesthetic, this design system rejects heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface depth:** Depth is communicated primarily through color transitions (e.g., a white card on a light gray background).
- **Subtle Shadows:** Where shadows are necessary (e.g., for hovering over cards), use a "Large-Blur, Low-Opacity" shadow: `0px 10px 30px rgba(0,0,0,0.05)`. It should be felt rather than seen.
- **Borders:** 1px solid borders in `#E5E5E5` are used to define containers without adding visual weight.

## Shapes

The shape language is **Soft (Level 1)**. Elements use a 4px (0.25rem) corner radius. This is enough to prevent the UI from feeling "sharp" or "hostile" while remaining professional and structured. 

- **Buttons & Inputs:** Consistent 4px radius.
- **Cards:** 8px (0.5rem) radius to distinguish them from smaller UI components.
- **Large Sections:** 0px radius (sharp) for full-width background blocks to maintain the architectural feel of the layout.

## Components

### Buttons
- **Primary:** Solid `#F26522` background, white text, uppercase bold labels. No gradients. Flat style.
- **Secondary:** Transparent background with a 2px `#1A1A1A` border and black text.
- **Hover States:** Primary buttons shift 10% darker on hover; secondary buttons fill with a light gray tint.

### Cards
- **Style:** White background, 1px `#E5E5E5` border, 8px corner radius.
- **Interaction:** On hover, apply the subtle ambient shadow and a slight upward translate (-4px) to indicate interactivity.

### Input Fields
- **Style:** White background, 1px border, large internal padding (16px).
- **Focus:** Border color changes to `#F26522`. Labels are small and placed above the field in **Label-Bold** style.

### Chips & Tags
- **Style:** Light gray background (`#E5E5E5`), small uppercase text, used primarily for categories or status indicators.

### Lists
- Use custom iconography (clean, thin-line orange icons) for bullet points to reinforce brand identity in text-heavy service descriptions.