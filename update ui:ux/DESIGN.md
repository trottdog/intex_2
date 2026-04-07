# Design System Specification: The Human Laboratory

## 1. Overview & Creative North Star
**Creative North Star: "The Human Laboratory"**

This design system is a departure from the sterile, clinical interfaces of traditional data-heavy platforms. Our objective is to balance high-precision utility with an editorial warmth that fosters emotional trust. We move beyond the "template" look by embracing **Intentional Asymmetry** and **Tonal Depth**.

Instead of a rigid, boxed-in grid, "The Human Laboratory" treats the canvas as a series of layered, organic surfaces. We use high-contrast typography scales and generous breathing room to guide the eye, ensuring that while the system remains "data-capable," it feels like an artisanal, curated experience. 

---

## 2. Colors & Surface Logic

The palette shifts from cold slates to a grounding foundation of warm teals, soft sage greens, and earthy creams.

### The Color Palette (Material Design Convention)
*   **Primary (#00474b):** A deep, warm teal used for authoritative actions and brand presence.
*   **Secondary (#526352):** A soft sage green for supporting elements and calming interactions.
*   **Tertiary (#593711):** An earthy wood-tone for highlights and human touchpoints.
*   **Surface (#fbf9f2):** A warm off-white canvas that reduces eye strain and builds trust.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts.
*   **Primary Sectioning:** Use `surface` as the global background.
*   **Secondary Sectioning:** Use `surface-container-low` (#f6f4ec) to define distinct content areas.
*   **Tertiary Sectioning:** Use `surface-container-high` (#eae8e1) for inner-nested utility panels.

### The "Glass & Gradient" Rule
To elevate the experience, avoid flat blocks of color for high-impact areas.
*   **Signature Gradients:** For primary CTAs or Hero backgrounds, transition from `primary` (#00474b) to `primary-container` (#1e5f64) at a 135-degree angle.
*   **Glassmorphism:** For floating modals or navigation bars, use `surface` at 80% opacity with a `24px` backdrop-blur. This allows the warmth of the underlying content to bleed through, creating an integrated, high-end feel.

---

## 3. Typography: Editorial Authority

We use **Manrope** exclusively. It is a geometric sans-serif that maintains a humanist soul, making it perfect for "The Human Laboratory."

*   **Display (lg: 3.5rem / md: 2.75rem):** Use for "Big Moment" headlines. Tighten letter-spacing by -0.02em to give it an editorial, "printed" feel.
*   **Headline (lg: 2rem / sm: 1.5rem):** Use for major section starts. These should often be placed with intentional asymmetry (e.g., left-aligned with a massive right-side margin).
*   **Title (lg: 1.375rem / sm: 1rem):** Used for card titles and high-level data categories.
*   **Body (lg: 1rem / md: 0.875rem):** The workhorse. `body-lg` is used for long-form reading to maintain the "warm" feel; `body-md` is for dense data sets.
*   **Labels (md: 0.75rem / sm: 0.6875rem):** Always in uppercase with +0.05em tracking when used for metadata or categorization to provide professional "precision."

---

## 4. Elevation & Depth: Tonal Layering

We convey hierarchy through physical stacking rather than artificial shadows.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f6f4ec) section. This creates a natural, soft lift.
*   **Ambient Shadows:** If a floating element is required (e.g., a dropdown or floating action button), use an extra-diffused shadow: `0px 12px 32px rgba(27, 28, 24, 0.06)`. Note the color is a tint of our `on-surface` (#1b1c18), not pure black.
*   **The "Ghost Border" Fallback:** If a boundary is strictly required for accessibility, use the `outline-variant` (#bfc8c9) at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`) with `on-primary` text. `DEFAULT` (0.5rem) rounded corners.
*   **Secondary:** `secondary-container` (#d4e8d3) background with `on-secondary-container` text. No border.
*   **Tertiary:** Ghost style. No background, `primary` text. Use for low-emphasis actions.

### Cards & Lists
*   **Structure:** Forbid the use of divider lines. Separate items using `16px` or `24px` of vertical white space. 
*   **Interactive Cards:** Use `surface-container-low`. On hover, transition to `surface-container-lowest` and apply a subtle Ambient Shadow.

### Input Fields
*   **Styling:** Use `surface-container-highest` (#e4e2dc) as the background. 
*   **Focus State:** A 2px "Ghost Border" using `primary` at 40% opacity. This provides a "soft glow" rather than a harsh click-on state.

### Specialized Component: The Curator's Tray
A bottom-pinned, semi-transparent container using the **Glassmorphism** rule. Used for batch actions or data summaries. It should use `xl` (1.5rem) rounded corners on the top-left and top-right only.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts (e.g., a 2/3 column for content and a 1/3 column for metadata) to create an editorial feel.
*   **Do** leverage `tertiary` (#593711) for small details like "Last Updated" timestamps or "Verified" badges to add human warmth.
*   **Do** use `xl` (1.5rem) radiuses for large outer containers and `sm` (0.25rem) for small internal elements like tags or checkboxes.

### Don't
*   **Don't** use pure black (#000000) or pure white (#ffffff) unless specified in the `surface-container-lowest` or `on-primary` tokens. Use the warm neutrals provided.
*   **Don't** use 1px dividers to separate list items. Use tonal shifts or white space.
*   **Don't** use sharp 90-degree corners. Everything must feel "held" and "humane."