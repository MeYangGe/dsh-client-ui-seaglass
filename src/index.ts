/**
 * Seaglass theme-layer plugin, node half. The browser half ships via
 * exports["./client"], discovered through the package.json dsh.client
 * declaration.
 *
 * Settings follow the 0.1.7 model: a plugin's durable form is its own entry
 * `Config` schema (read through `entry.fiber.runtime.Config` by the Host
 * `SettingsForms` and addressed by the profile entry id — `ui-seaglass`, the
 * row this package's cordis.patch.yml inserts). No Host-side service call
 * exists to make any more; exporting `Config` is the whole registration.
 */

import type { Context } from '@deepseek-ai/cordis'
import { AquaSettingsSchema } from './aqua-settings.ts'

/**
 * The plugin entry's configuration schema: the durable `enabled` preference.
 * `volatile` marks it as a live preference the settings wire may write into
 * the profile patch without re-resolving the entry.
 */
export const Config = AquaSettingsSchema

/** Host plugin body — no host-side behavior beyond the Config export. */
export function apply(_ctx: Context): void {}

export {
  AQUA_ENABLED_FIELD, AQUA_SETTINGS_NAMESPACE, AquaSettingsSchema,
  DEFAULT_ENABLED, type AquaSettings,
} from './aqua-settings.ts'
