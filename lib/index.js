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
const LegacyAquaSettingsSchema = z.object({ [AQUA_ENABLED_FIELD]: z.boolean().default(true) });

//#endregion
//#region src/index.ts
/**
* The plugin entry's configuration schema: the durable `enabled` preference.
* `volatile` marks it as a live preference the settings wire may write into
* the profile patch without re-resolving the entry.
*/
const Config = AquaSettingsSchema;
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
function apply(ctx) {
	ctx.inject(["settings"], (scope) => {
		const legacy = scope.settings;
		if (typeof legacy.register !== "function") return;
		legacy.register(AQUA_SETTINGS_NAMESPACE, LegacyAquaSettingsSchema);
	});
}

//#endregion
export { AQUA_ENABLED_FIELD, AQUA_SETTINGS_NAMESPACE, AquaSettingsSchema, Config, DEFAULT_ENABLED, LegacyAquaSettingsSchema, apply };