import z from "@deepseek-ai/schemastery";

//#region src/aqua-settings-constants.ts
/**
* Settings namespace shared by the plugin's Host entry and browser card.
* The 0.1.7 settings model keys a plugin's form by its unique profile entry
* id (`ctx.configForms.get(entryId)`, served from the entry's `Config`
* export): this is the `id` the package's own `cordis.patch.yml` inserts.
*/
const AQUA_SETTINGS_NAMESPACE = "ui-seaglass";
/** Field carrying the durable layer enable flag. */
const AQUA_ENABLED_FIELD = "enabled";

//#endregion
//#region src/aqua-settings.ts
/** Aqua theme-layer preference stored in the Host user-settings document. */
/** Default state when the user-settings document has no override: on. */
const DEFAULT_ENABLED = true;
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
const AquaSettingsSchema = z.object({ [AQUA_ENABLED_FIELD]: z.boolean().default(true).volatile() });

//#endregion
//#region src/index.ts
/**
* The plugin entry's configuration schema: the durable `enabled` preference.
* `volatile` marks it as a live preference the settings wire may write into
* the profile patch without re-resolving the entry.
*/
const Config = AquaSettingsSchema;
/** Host plugin body — no host-side behavior beyond the Config export. */
function apply(_ctx) {}

//#endregion
export { AQUA_ENABLED_FIELD, AQUA_SETTINGS_NAMESPACE, AquaSettingsSchema, Config, DEFAULT_ENABLED, apply };