/** Aqua theme-layer preference stored in the Host user-settings document. */
import z from '@deepseek-ai/schemastery';
export { AQUA_ENABLED_FIELD, AQUA_SETTINGS_NAMESPACE } from './aqua-settings-constants.ts';
/** Durable Aqua section shared by the Host entry schema and the browser config form. */
export interface AquaSettings {
    enabled: boolean;
}
/** Default state when the user-settings document has no override: on. */
export declare const DEFAULT_ENABLED = true;
/**
 * Durable schema of the plugin entry's `Config` export. `volatile` marks
 * the field as a live preference the settings write path may persist into
 * the profile patch without re-resolving the entry (`SettingsForms`
 * refuses non-volatile writes). The annotation stays deliberately wide:
 * `volatile()` widens the schema's own value type to `Volatile<boolean>`,
 * which a `z<AquaSettings>` annotation rejects even though resolved
 * config values stay plain booleans.
 */
export declare const AquaSettingsSchema: z<any>;
//# sourceMappingURL=aqua-settings.d.ts.map