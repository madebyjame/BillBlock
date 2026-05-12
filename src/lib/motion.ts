/**
 * Shared Framer Motion presets — iOS / One UI feel
 *
 * Principles:
 *  - Decelerate (ease-out) for entrances
 *  - Accelerate (ease-in) for exits
 *  - Spring physics for interactive elements (responsive, not bouncy)
 *  - Short durations — UI should never feel slow
 */

// ── Easing curves ─────────────────────────────────────────────────────────────

export const ease = {
  /** iOS decelerate — elements entering from off-screen */
  out:   [0.32, 0.72, 0, 1] as const,
  /** Accelerate — elements leaving */
  in:    [0.55, 0, 1, 0.45] as const,
  /** Standard — subtle transitions */
  inOut: [0.65, 0, 0.35, 1] as const,
}

// ── Spring configs ────────────────────────────────────────────────────────────

export const spring = {
  /** Standard UI (cards, panels, modals) */
  ui: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 34,
    mass: 0.85,
  },
  /** Gentle (page transitions, drawers) */
  gentle: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 30,
    mass: 1,
  },
  /** Snappy (tooltips, dropdowns, badges) */
  snappy: {
    type: 'spring' as const,
    stiffness: 520,
    damping: 42,
    mass: 0.6,
  },
}

// ── Variant presets ───────────────────────────────────────────────────────────

/** Fade + slide up — general content blocks */
export const fadeUp = {
  hidden: { opacity: 0, y: 14, scale: 0.99 },
  show:   { opacity: 1, y: 0,  scale: 1,    transition: spring.ui },
  exit:   { opacity: 0, y: -6, scale: 0.99, transition: { duration: 0.16, ease: ease.in } },
}

/** Fade only */
export const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.22, ease: ease.out } },
  exit:   { opacity: 0, transition: { duration: 0.14, ease: ease.in } },
}

/** Page-level transition — main content area */
export const pageTransition = {
  hidden: { opacity: 0, y: 10 },
  show:   {
    opacity: 1,
    y: 0,
    transition: { ...spring.gentle, staggerChildren: 0.04 },
  },
  exit:   { opacity: 0, y: -6, transition: { duration: 0.16, ease: ease.in } },
}

/** Slide in from right (detail panel / modal) */
export const slideRight = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0,  transition: spring.gentle },
  exit:   { opacity: 0, x: 12, transition: { duration: 0.18, ease: ease.in } },
}

/** Scale pop — modals, popovers */
export const scalePop = {
  hidden: { opacity: 0, scale: 0.94 },
  show:   { opacity: 1, scale: 1,    transition: spring.ui },
  exit:   { opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: ease.in } },
}

/** Stagger container — wraps lists of children */
export const stagger = (delayChildren = 0.05) => ({
  show: { transition: { staggerChildren: delayChildren } },
})

// ── whileHover / whileTap helpers ─────────────────────────────────────────────

/** Subtle lift on card hover */
export const cardHover = { y: -2, transition: spring.ui }

/** iOS-style tap feedback */
export const tapScale  = { scale: 0.965, transition: spring.snappy }
