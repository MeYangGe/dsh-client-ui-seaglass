/**
 * Aqua client plugin body: the toggleable glassmorphism skin. Owns the durable
 * enable flag through the Host settings mirror (the entry's config form on
 * 0.1.7+, the registered namespace scope on <=0.1.6 — see the adoption in
 * {@link apply}), applies/retracts the theme layer through {@link AquaLayer},
 * and registers one settings surface: a dedicated "Seaglass" page in the
 * settings nav (`settings.section`) — the master switch at the top of the
 * page (reachable in every deployment, even when the Host serves no settings
 * mirror) plus every glass knob and the per-script font pickers. The
 * Plugins-section card was removed: it duplicated the master switch. One
 * click on the master switch returns the stock UI (every layer is an
 * effect, disposed on flip).
 */
import type { Context } from '@deepseek-ai/cordis'
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `settings.section` SlotMap merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { AQUA_SETTINGS_NAMESPACE } from '../aqua-settings-constants.ts'
import type { AquaSettings } from '../aqua-settings.ts'
import { AquaAppearanceRow, type AquaAppearanceRowInjected } from './AquaAppearanceRow.tsx'
import { createAquaRowStore, type AquaSettingsPayload } from './settings-store.ts'
import { en, NS, zh } from './locales.ts'
import { AQUA_ENABLED_KEY, writeEnabled, AquaLayer } from './theme-layer.ts'
// Side-effect imports: the theme-layer stylesheet (unloaded with the plugin)
// and the self-hosted Space Grotesk @font-face (no shell dependency).
import './aqua.module.css'
import './fonts.module.css'

/**
 * Required services: theme override stack and the settings surfaces. The
 * settings mirror (configForms on 0.1.7+, settingsScope on <=0.1.6) is
 * deliberately NOT a hard activation dependency — see the mirror adoption
 * below — so one bundle activates across both settings eras.
 */
export const inject = ['theme', 'slots', 'locale']

/**
 * The Host settings mirror's reactive face — the intersection the mirror
 * consumes. 0.1.7+ serves per-entry config forms (`configForms`, keyed by
 * the profile entry id); <=0.1.6 served namespace scopes (`settingsScope`,
 * keyed by the registered namespace). Both expose the same snapshot fields
 * (`status`/`value`/`user`) and the same mutation methods, so one narrow
 * interface covers both eras.
 */
interface AquaSettingsForm {
  getSnapshot(): { status: 'loading' | 'ready' | 'unavailable', value?: AquaSettings, user?: unknown }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<unknown>
  unset(field: string): Promise<unknown>
}

/**
 * Read the pre-settings-namespace enable flag without confusing an absent
 * key with an explicitly stored `false` value.
 */
function readLegacyEnabled(): boolean | undefined {
  try {
    const raw = localStorage.getItem(AQUA_ENABLED_KEY)
    return raw === null ? undefined : raw === 'true'
  } catch {
    return undefined
  }
}

/**
 * Client plugin body.
 * @param ctx - client cordis context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-aqua: settings dictionaries')

  // The layer owns its lifecycle: enable flag, token stack, and CSS attribute
  // are all effects released on disable/dispose. The durable flag rides the
  // Host settings mirror when one exists (0.1.7+: the entry's config form;
  // <=0.1.6: the registered namespace scope).
  const layer = new AquaLayer(ctx)
  let legacyMigrationAttempted = false
  const syncHostEnabled = (): void => {
    // localStorage stays the DURABLE authority for the enable flag (a
    // client-only visual preference, per machine): the Host mirror carries
    // the same choice for fresh machines, but a local choice always wins
    // over a stale Host snapshot so the theme never flips on reload.
    const remembered = readLegacyEnabled()
    if (remembered !== undefined) {
      legacyMigrationAttempted = true
      layer.setEnabled(remembered)
      return
    }
    if (settings === undefined) return
    const snapshot = settings.getSnapshot()
    if (snapshot.status !== 'ready' || typeof snapshot.value?.enabled !== 'boolean') return

    const user = snapshot.user
    const hasHostEnabled = typeof user === 'object'
      && user !== null
      && !Array.isArray(user)
      && Object.prototype.hasOwnProperty.call(user, 'enabled')
    if (hasHostEnabled) {
      legacyMigrationAttempted = true
      layer.setEnabled(snapshot.value.enabled)
      writeEnabled(snapshot.value.enabled)
      return
    }

    layer.setEnabled(snapshot.value.enabled)
    writeEnabled(snapshot.value.enabled)
  }

  // The settings mirror is OPTIONAL at activation: the theme layer runs on
  // localStorage alone, and the mirror only syncs fresh machines. Exactly
  // one era service exists on any given host, so the entry must not hard
  // depend on either name — waiting for a service the host will never
  // provide strands the entry (0.1.7 hosts never provide `settingsScope`;
  // <=0.1.6 hosts never provide `configForms`). Each scoped waiter adopts
  // whichever form its era serves; re-adoption replaces the live mirror.
  let settings: AquaSettingsForm | undefined
  let mirrorDispose: (() => void) | undefined
  const adoptSettingsForm = (form: AquaSettingsForm): void => {
    settings = form
    mirrorDispose?.()
    mirrorDispose = form.subscribe(syncHostEnabled)
    syncHostEnabled()
  }
  ctx.effect(() => () => { mirrorDispose?.() }, 'ui-aqua: settings mirror')
  ctx.inject(['configForms'], (scope) => {
    adoptSettingsForm(scope.configForms.get<AquaSettings>(AQUA_SETTINGS_NAMESPACE))
  })
  ctx.inject(
    ['settingsScope'],
    (scope: Context & { settingsScope?: { bind(spec: { namespace: string }): unknown } }) => {
      if (scope.settingsScope === undefined) return
      adoptSettingsForm(scope.settingsScope.bind({ namespace: AQUA_SETTINGS_NAMESPACE }) as AquaSettingsForm)
    },
  )

  // One store mirror of the layer state: the settings section's Appearance
  // row (master switch + every knob).
  const appearanceStore = createAquaRowStore()
  let appearanceBound: BoundActions<typeof appearanceStore> | undefined
  let revision = 0
  const payload = (): AquaSettingsPayload => {
    const s = layer.getSettings()
    return {
      enabled: layer.getEnabled(),
      mode: s.mode,
      blur: s.blur,
      frost: s.frost,
      codeFrost: s.codeFrost,
      fluidHue: s.fluidHue,
      fluidDepth: s.fluidDepth,
      bgBrightness: s.bgBrightness,
      dark: layer.getDark(),
      background: s.background,
      wallpaper: s.wallpaper,
      whale: s.whale,
      critters: s.critters,
      emblem: s.emblem,
      emblemCritters: s.emblemCritters,
      mesh: s.mesh,
      spotlight: s.spotlight,
      press: s.press,
      wallpaperBlur: s.wallpaperBlur,
      wallpaperFrost: s.wallpaperFrost,
      videoBlur: s.videoBlur,
      videoBrightness: s.videoBrightness,
      fontLatin: s.fontLatin,
      fontCjk: s.fontCjk,
    }
  }
  const sync = (): void => {
    const next = payload()
    appearanceBound?.sync(next, revision)
    revision += 1
  }
  // The Appearance switch flips the brightness knob's half-range; re-sync
  // both stores so the row re-renders with the new range.
  ctx.effect(() => ctx.on('theme/change', () => { sync() }), 'ui-aqua: appearance scheme sync')

  const appearanceInjected = (actions: BoundActions<typeof appearanceStore>): AquaAppearanceRowInjected => {
    appearanceBound = actions
    sync()
    return {
      setMode: (mode) => {
        layer.setMode(mode)
        sync()
      },
      setBlur: (blur) => {
        layer.setBlur(blur)
        sync()
      },
      setFrost: (frost) => {
        layer.setFrost(frost)
        sync()
      },
      setCodeFrost: (codeFrost) => {
        layer.setCodeFrost(codeFrost)
        sync()
      },
      setFluidHue: (fluidHue) => {
        layer.setFluidHue(fluidHue)
        sync()
      },
      setFluidDepth: (fluidDepth) => {
        layer.setFluidDepth(fluidDepth)
        sync()
      },
      setBgBrightness: (bgBrightness) => {
        layer.setBgBrightness(bgBrightness)
        sync()
      },
      setBackground: (background) => {
        layer.setBackground(background)
        sync()
      },
      setWallpaper: (wallpaper) => {
        layer.setWallpaper(wallpaper)
        sync()
      },
      setWhale: (whale) => {
        layer.setWhale(whale)
        sync()
      },
      setCritters: (critters) => {
        layer.setCritters(critters)
        sync()
      },
      setEmblemCritters: (emblemCritters) => {
        layer.setEmblemCritters(emblemCritters)
        sync()
      },
      setEmblem: (emblem) => {
        layer.setEmblem(emblem)
        sync()
      },
      setMesh: (mesh) => {
        layer.setMesh(mesh)
        sync()
      },
      setSpotlight: (spotlight) => {
        layer.setSpotlight(spotlight)
        sync()
      },
      setPress: (press) => {
        layer.setPress(press)
        sync()
      },
      setWallpaperBlur: (wallpaperBlur) => {
        layer.setWallpaperBlur(wallpaperBlur)
        sync()
      },
      setWallpaperFrost: (wallpaperFrost) => {
        layer.setWallpaperFrost(wallpaperFrost)
        sync()
      },
      setVideoBlur: (videoBlur) => {
        layer.setVideoBlur(videoBlur)
        sync()
      },
      setVideoBrightness: (videoBrightness) => {
        layer.setVideoBrightness(videoBrightness)
        sync()
      },
      setFontLatin: (fontLatin) => {
        layer.setFontLatin(fontLatin)
        sync()
      },
      setFontCjk: (fontCjk) => {
        layer.setFontCjk(fontCjk)
        sync()
      },
      setEnabled: (enabled) => {
        layer.setEnabled(enabled)
        void settings?.set('enabled', enabled)
        sync()
      },
      authorizeVideo: () => {
        layer.authorizeVideo()
      },
    }
  }

  // Dedicated "Seaglass" page in the settings nav (after General, before
  // Models): the section page owns the master switch and every knob — the
  // Plugins-section card (a duplicate master switch) was removed.
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'aqua',
    order: 5,
    label: () => t('aqua.nav'),
    locale: NS,
    store: appearanceStore,
    inject: appearanceInjected,
  }, AquaAppearanceRow))
}
