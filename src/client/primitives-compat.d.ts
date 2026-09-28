/**
 * Compat typing for the legacy icon name: 0.1.7 renamed the primitives icon
 * set to stroke-variant names (`IconCheckOutlineRegular`/`…Medium`) and the
 * 0.1.7 type declarations no longer carry the legacy `*16` names, while
 * <=0.1.6-alpha.2 shells (the DSHD desktop baseline among them) expose ONLY
 * the legacy name. The appearance row imports both names and picks
 * whichever the shell's seed table exposes at module scope; this merge adds
 * the missing legacy name to the published 0.1.7 module shape so the dual
 * import typechecks against either era's declarations.
 */
import type { JSX } from 'react'

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  export const IconCheckOutline16: (props: { size?: number, className?: string }) => JSX.Element
}
