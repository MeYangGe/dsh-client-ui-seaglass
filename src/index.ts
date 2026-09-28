/**
 * Seaglass theme-layer plugin, node half. The browser half ships via
 * exports["./client"], discovered through the package.json dsh.client
 * declaration.
 *
 * Settings span two Host eras. 0.1.7+ reads a plugin's durable form from its
 * own entry `Config` schema (through `entry.fiber.runtime.Config`, addressed
 * by the profile entry id — `ui-seaglass`, the row this package's
 * cordis.patch.yml inserts); exporting `Config` below is that entire
 * registration. <=0.1.6-alpha.2 Hosts (the DSHD desktop v0.3.2 baseline among
 * them) instead key settings pages by namespace registrations on the `settings`
 * service, and the browser-side `settingsScope` mirror reports `unavailable`
 * for a namespace its Host never registered — so the legacy registration is
 * restored there, behind a runtime feature check.
 */

import type { Context } from '@deepseek-ai/cordis'
import { AQUA_SETTINGS_NAMESPACE } from './aqua-settings-constants.ts'
import { AquaSettingsSchema, LegacyAquaSettingsSchema } from './aqua-settings.ts'

/**
 * The plugin entry's configuration schema: the durable `enabled` preference.
 * `volatile` marks it as a live preference the settings wire may write into
 * the profile patch without re-resolving the entry.
 */
export const Config = AquaSettingsSchema

/**
 * Host plugin body. The scoped `settings` waiter covers both eras: the
 * service NAME exists on both, with different APIs — only the <=0.1.6
 * namespace registry exposes `register(ns, schema)`; 0.1.7's `settings`
 * seam (SettingsForms) does not, and the waiter then adopts nothing (the
 * `Config` export already carries the form there). Waiting as a scoped
 * effect rather than declaring `settings` in `inject` keeps the entry from
 * stranding on Hosts whose settings era provides nothing to wait for.
 * The legacy registration uses the plain ({@link LegacyAquaSettingsSchema})
 * copy: schemastery resolves volatile fields into boxed references that the
 * 0.1.6 describe wire flattens to `{}`, while 0.1.6's write path never
 * gates on the volatile mark.
 * @param ctx - host cordis context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (scope) => {
    const legacy = scope.settings as { register?: (ns: string, schema: unknown) => unknown }
    if (typeof legacy.register !== 'function') return
    legacy.register(AQUA_SETTINGS_NAMESPACE, LegacyAquaSettingsSchema)
  })
}

export {
  AQUA_ENABLED_FIELD, AQUA_SETTINGS_NAMESPACE, AquaSettingsSchema,
  DEFAULT_ENABLED, LegacyAquaSettingsSchema, type AquaSettings,
} from './aqua-settings.ts'
