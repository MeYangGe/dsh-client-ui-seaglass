/**
 * Settings namespace shared by the plugin's Host entry and browser card.
 * The 0.1.7 settings model keys a plugin's form by its unique profile entry
 * id (`ctx.configForms.get(entryId)`, served from the entry's `Config`
 * export): this is the `id` the package's own `cordis.patch.yml` inserts.
 */
export const AQUA_SETTINGS_NAMESPACE = 'ui-seaglass'

/** Field carrying the durable layer enable flag. */
export const AQUA_ENABLED_FIELD = 'enabled'

