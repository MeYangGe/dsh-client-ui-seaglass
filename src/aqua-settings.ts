/** Aqua theme-layer preference stored in the Host user-settings document. */

import z from '@deepseek-ai/schemastery'
import { AQUA_ENABLED_FIELD } from './aqua-settings-constants.ts'

export { AQUA_ENABLED_FIELD, AQUA_SETTINGS_NAMESPACE } from './aqua-settings-constants.ts'

/** Durable Aqua section shared by the Host entry schema and the browser config form. */
export interface AquaSettings {
  enabled: boolean
}

/** Default state when the user-settings document has no override: on. */
export const DEFAULT_ENABLED = true

/**
 * Durable schema of the plugin entry's `Config` export; the browser config
 * form resolves values through the same shape. `volatile` marks the field
 * as a live preference the settings write path may persist into the
 * profile patch without re-resolving the entry (`SettingsForms` refuses
 * non-volatile writes). Deliberately unannotated: `volatile()` widens the
 * schema's own value type to `Volatile<boolean>`, which a
 * `z<AquaSettings>` annotation rejects even though resolved config
 * values stay plain booleans.
 */
export const AquaSettingsSchema = z.object({
  [AQUA_ENABLED_FIELD]: z.boolean().default(DEFAULT_ENABLED).volatile(),
})
