# Palette's Journal

## 2025-05-15 - [Avoid Hover-to-Reveal Patterns]
**Learning:** Interactive elements hidden by `opacity-0` until hover are inaccessible to touch users and keyboard navigators. They also create a "mystery meat" navigation experience where users don't know what's interactive.
**Action:** Use a base visibility (e.g., `opacity-40`) and ensure `focus` states make them fully visible for keyboard/touch accessibility.

## 2025-05-20 - [Dynamic ARIA Labels for Toggle Actions]
**Learning:** Interactive toggle elements (like Pin/Unpin) must have dynamic `aria-label` attributes that reflect the *action* the button will perform or its current state. Static labels on toggles are confusing for screen reader users.
**Action:** Use conditional logic for ARIA labels (e.g., `:aria-label="isPinned ? 'Unpin' : 'Pin'"`).

## 2025-05-24 - [Keyboard Accessibility for Card Interfaces]
**Learning:** For Kanban-style boards, cards must be focusable and operable via keyboard. Using `tabindex="0"` and `role="button"` makes them discoverable, while `enter` and `space` handlers ensure they are interactive. Visual focus indicators (like `focus-visible:ring-2`) are essential to guide the user.
**Action:** Always add keyboard handlers and focus rings to interactive div/card elements.
