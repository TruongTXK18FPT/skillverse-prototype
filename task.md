# TASK: Visual Overhaul - Mentorship Page (High-Fidelity Sci-Fi)

## 1. Critique: Why it's not "WOW" yet
The current implementation is too safe. It looks like a standard website with a dark theme.
* **Pagination:** The "Previous/Next" buttons are standard web blocks. They break immersion.
* **Cards:** They are too simple. They lack "tech" details (greebles, brackets, layers).
* **Header:** It feels empty. It needs texture and depth.

## 2. Visual Requirements (The "Sci-Fi Injection")

### A. Pagination: "Data Stream Nodes" (Priority Fix)
Replace the standard pagination with a **"Node Chain"** design.
* **Container:** Center aligned. Add a faint horizontal line running through the center of the buttons.
* **Page Numbers:**
    * Shape: **Hexagons** (`clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`) OR **Rotated Squares** (Diamonds).
    * Active State: Filled Cyan/Blue, Glowing.
    * Inactive State: Hollow (Border only), tiny size.
* **Prev/Next:** Stylized arrowheads (`<` `>`) without background, just glowing text.

### B. Mentor Card: "Tactical Data Slate"
* **Shape:** Apply `clip-path` to cut the top-right and bottom-left corners aggressively.
    * `clip-path: polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px);`
* **Decorative Borders (Tech Brackets):**
    * Add 4 corner borders (L-shapes) that "float" slightly outside the main card content.
* **Price Tag:**
    * Don't just place text. Encapsulate `$18 CR/HR` inside a **"Capsule"** with a glowing border at the bottom right of the card.
    * Font: Space Habitat (Large).

### C. Header: "Academy Mainframe"
* **Background Texture:** Add a **"Cyber Grid"** pattern to the `.uplink-header` background.
    * CSS Hint: `background-image: linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px); background-size: 20px 20px;`
* **Decorations:** Add random "System Status" text (tiny font, opacity 0.5) in the top-right corner of the header (e.g., "SYS_ONLINE // V.4.2").

### D. CSS Polish
* **Global Background:** Ensure the page background isn't flat blue. Add a large, faint **Radial Gradient** behind the main grid to create a "spotlight" effect.

## 3. Implementation Steps

1.  **Refactor `UplinkDirectoryPage.tsx`**: Replace the Pagination component with a custom `HoloPagination` component.
2.  **Update `MasterProfileCard.tsx`**: Apply the `clip-path` and add the decorative price capsule.
3.  **Update `uplink-styles.css`**: Add the grid background and the hexagon shapes.

**Visual Goal:** It should look less like a website and more like a screen from *Star Trek* or *Halo*.