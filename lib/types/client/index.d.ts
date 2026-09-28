/**
 * Aqua client plugin body: the toggleable glassmorphism skin. Owns the durable
 * enable flag through the Host settings mirror (the entry's config form on
 * 0.1.7+, the registered namespace scope on <=0.1.6), applies/retracts the
 * theme layer through {@link AquaLayer}, and registers one settings surface:
 * a dedicated "Seaglass" page in the settings nav (`settings.section`) — the
 * master switch plus every glass knob. One click on the master switch returns
 * the stock UI (every layer is an effect, disposed on flip).
 */
import type { Context } from '@deepseek-ai/cordis';
import './aqua.module.css';
import './fonts.module.css';
/**
 * Required services: theme override stack and the settings surfaces. The
 * settings mirror (configForms on 0.1.7+, settingsScope on <=0.1.6) is
 * deliberately NOT a hard activation dependency: waiting for a service the
 * host's settings era never provides would strand the entry, so the mirror
 * is adopted through scoped optional waiters instead.
 */
export declare const inject: string[];
/**
 * Client plugin body.
 * @param ctx - client cordis context.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map