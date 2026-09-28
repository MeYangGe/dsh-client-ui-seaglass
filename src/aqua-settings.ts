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

/**
 * The same section for the <=0.1.6-alpha.2 namespace registry, without the
 * volatile annotation. Schemastery resolves a volatile field into a boxed
 * reference, and the 0.1.6 settings service serializes the resolved value
 * straight onto the describe wire, where the box degrades to `{}` — the
 * browser mirror then cannot read the field back. The 0.1.7 form path is
 * unaffected (it unwraps volatile boxes before serving values) and its
 * write path demands the volatile mark, so only the legacy registration
 * uses this plain copy; the 0.1.6 scope write path does not gate on
 * volatile annotations.
 */
export const LegacyAquaSettingsSchema = z.object({
  [AQUA_ENABLED_FIELD]: z.boolean().default(DEFAULT_ENABLED),
})
