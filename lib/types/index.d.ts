/**
 * Seaglass theme-layer plugin, node half. The browser half ships via
 * exports["./client"], discovered through the package.json dsh.client
 * declaration.
 *
 * Settings span two Host eras. 0.1.7+ reads a plugin's durable form from its
 * own entry `Config` schema (through `entry.fiber.runtime.Config`, addressed
 * by the profile entry id — `ui-seaglass`, the row this package's
 * cordis.patch.yml inserts); exporting `Config` is that entire registration.
 * <=0.1.6-alpha.2 Hosts (the DSHD desktop v0.3.2 baseline among them) instead
 * key settings pages by namespace registrations on the `settings` service,
 * so the legacy registration is restored there behind a runtime feature
 * check (see `apply`).
 */
import type { Context } from '@deepseek-ai/cordis';
/**
 * The plugin entry's configuration schema: the durable `enabled` preference.
 * `volatile` marks it as a live preference the settings wire may write into
 * the profile patch without re-resolving the entry.
 */
export declare const Config: typeof import('./aqua-settings.js').AquaSettingsSchema;
/**
 * Host plugin body: a scoped optional waiter that registers the settings
 * namespace on <=0.1.6 Hosts (feature-detected) and adopts nothing on 0.1.7+,
 * where the `Config` export already carries the form.
 * @param ctx - host cordis context.
 */
export declare function apply(ctx: Context): void;
export { AQUA_ENABLED_FIELD, AQUA_SETTINGS_NAMESPACE, AquaSettingsSchema, DEFAULT_ENABLED, LegacyAquaSettingsSchema, type AquaSettings, } from './aqua-settings.ts';
//# sourceMappingURL=index.d.ts.map