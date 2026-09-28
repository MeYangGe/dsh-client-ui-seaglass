/**
 * Particle CPC Emblem: render the Chinese Communist Party Emblem as
 * interactive golden ambient particles in the chat area, faithfully
 * implementing the same 2D particle dynamics as the whale.
 */

const EMBLEM_SVG = `<svg width="32" height="32" viewBox="1 1 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg">
<path d="M4 14l7.923966-7.923966A5.315073 5.315073 0 0 0 17 5l2.5 2.5-4 4L33 29l-4 4-17.5-17.5-3 3z"/>
<path d="M4.5 22.5a16.62077 16.62077 0 0 0 12 5.12077A11.12077 11.12077 0 0 0 27.62077 16.5 16.62077 16.62077 0 0 0 17 1a16 16 0 0 1 0 32 18 18 0 0 1-14.979984-8.020016z"/>
<path d="M3 29l2-2 2 2-2 2z"/>
<circle cx="3.5" cy="30.5" r="2.5"/>
</svg>`

const GRID = 64
const UNIT = 0.16
const LIGHT_X = 4.5
const LIGHT_Y = 5.5
const LIGHT_RANGE = 14
const SHADE_MIN = 0.2
const SHADE_MAX = 0.4 * 2.79
const FOLLOW_X = 1.05
const LOOSE = 1
const MOUSE_RADIUS = 4.9
const MOUSE_STRENGTH = 0.8
const MOUSE_DECAY = 0.2
const MOUSE_DISTORT = 5
const FPS = 30
const WORLD_H = 2 * 18 * Math.tan((50 * Math.PI) / 360)

interface Particle {
  x: number
  y: number
  opacity: number
  edge: number
  sx: number
  sy: number
  sz: number
}

function hash(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s) - 0.5
}

export interface EmblemHandle {
  setDark: (dark: boolean) => void
  dispose: () => void
}

export function mountEmblem(host: HTMLElement, dark: boolean): EmblemHandle {
  const holder = document.createElement('div')
  holder.setAttribute('data-dsh-aqua-whale', '')
  holder.setAttribute('data-dsh-aqua-emblem-canvas', '')
  holder.setAttribute('data-scheme', dark ? 'dark' : 'light')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  holder.appendChild(canvas)
  host.appendChild(holder)
  const ctx = canvas.getContext('2d')
  if (ctx === null) {
    holder.remove()
    return { setDark: () => {}, dispose: () => {} }
  }

  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const particles: Particle[] = []
  let raf = 0
  let disposed = false
  let startedAt = performance.now()
  let darkMode = dark
  let mouseWorld = { x: 0, y: 0 }
  let dpr = 1
  let scale = 1
  let width = 0
  let height = 0

  const positionHost = (): void => {
    const phase = document.querySelector<HTMLElement>('[data-phase]')
    const rect = phase?.getBoundingClientRect()
    const r = (rect !== undefined && rect.width > 0)
      ? rect
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
    const size = Math.round(Math.max(220, Math.min(660, window.innerHeight * 0.76, r.width * 0.8)))
    const left = Math.round(r.left + r.width / 2)
    const top = Math.round(r.top + r.height / 2)
    if (holder.style.width !== `${size}px`) holder.style.width = `${size}px`
    if (holder.style.height !== `${size}px`) holder.style.height = `${size}px`
    if (holder.style.left !== `${left}px`) holder.style.left = `${left}px`
    if (holder.style.top !== `${top}px`) holder.style.top = `${top}px`
  }

  const resize = (): void => {
    positionHost()
    const rect = holder.getBoundingClientRect()
    holderRect = rect
    width = Math.max(1, rect.width)
    height = Math.max(1, rect.height)
    dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    scale = height / WORLD_H
  }

  const sample = (img: HTMLImageElement): void => {
    const off = document.createElement('canvas')
    off.width = GRID
    off.height = GRID
    const octx = off.getContext('2d')
    if (octx === null) return
    octx.fillStyle = '#000'
    octx.fillRect(0, 0, GRID, GRID)
    const fit = Math.min(GRID / img.width, GRID / img.height)
    const w = img.width * fit
    const h = img.height * fit
    octx.drawImage(img, (GRID - w) / 2, (GRID - h) / 2, w, h)
    const data = octx.getImageData(0, 0, GRID, GRID).data
    const lum = new Float32Array(GRID * GRID)
    for (let i = 0; i < GRID * GRID; i++) {
      lum[i] = (0.299 * data[4 * i] + 0.587 * data[4 * i + 1] + 0.114 * data[4 * i + 2]) / 255
    }
    const hasBrightNeighbor = (x: number, y: number): boolean => {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue
          if (lum[ny * GRID + nx] > 0.2) return true
        }
      }
      return false
    }
    for (let e = 0; e < GRID; e++) {
      for (let n = 0; n < GRID; n++) {
        const a = lum[e * GRID + n]
        if (a <= 0.2 || !hasBrightNeighbor(n, e)) continue
        const x = (n - GRID / 2) * UNIT
        const y = (GRID / 2 - e) * UNIT
        let edge = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = n + dx
            const ny = e + dy
            if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || lum[ny * GRID + nx] <= 0.2) edge++
          }
        }
        const phi = Math.random() * Math.PI * 2
        const theta = Math.acos(2 * Math.random() - 1)
        const rad = 3 * (0.4 + 0.6 * Math.random())
        particles.push({
          x,
          y,
          opacity: a,
          edge,
          sx: rad * Math.sin(theta) * Math.cos(phi),
          sy: rad * Math.sin(theta) * Math.sin(phi),
          sz: rad * Math.cos(theta),
        })
      }
    }
  }

  const phaseObserver = new ResizeObserver(() => {
    resize()
    if (reduced && particles.length > 0) draw(1, 2)
  })
  const observePhase = (): void => {
    const phase = document.querySelector('[data-phase]')
    if (phase !== null) phaseObserver.observe(phase)
  }
  observePhase()
  const phaseWatch = window.setInterval(observePhase, 1500)
  const recenterTimer = window.setTimeout(resize, 400)

  const draw = (assembly: number, time: number): void => {
    ctx.clearRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'lighter'
    const rotZ = Math.sin(time * 0.45) * 0.05
    const cosZ = Math.cos(rotZ)
    const sinZ = Math.sin(rotZ)
    const breathe = Math.sin(time * 0.8) * 0.08
    const size = Math.max(1, 1.7 * dpr)

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const tx = p.x
      const ty = p.y
      let px = p.sx + (tx - p.sx) * assembly
      let py = p.sy + (ty - p.sy) * assembly

      // Golden particle floating motion
      const sway = Math.sin(time * 1.2 + px * 0.8) * 0.08 * assembly
      py += sway

      const rx = px * cosZ - py * sinZ
      const ry = px * sinZ + py * cosZ
      px = rx
      py = ry

      // Interactive mouse repel
      const dx = px - mouseWorld.x
      const dy = py - mouseWorld.y
      const mdist = Math.sqrt(dx * dx + dy * dy)
      if (mdist < MOUSE_RADIUS && mdist > 0.001) {
        const factor = (1 - mdist / MOUSE_RADIUS) * MOUSE_STRENGTH * assembly
        px += (dx / mdist) * factor
        py += (dy / mdist) * factor
      }

      // Golden radiance shading
      const lx = LIGHT_X + mouseWorld.x * 0.3
      const ly = LIGHT_Y + mouseWorld.y * 0.3
      const ldx = px - lx
      const ldy = py - ly
      const lit = Math.min(1, Math.max(0, 1 - Math.sqrt(ldx * ldx + ldy * ldy) / LIGHT_RANGE))
      const vLight = SHADE_MIN + SHADE_MAX * lit * lit

      const dist = Math.sqrt(px * px + py * py)
      const glow = smoothstep(8, 0, dist) * 0.4 * assembly
      const baseAlpha = 0.5 + 0.35 * assembly
      const shimmer = Math.sin(time * 2.0 + px * 4 + py * 4) * 0.12 + 0.88
      const alpha = p.opacity * (baseAlpha + glow) * shimmer * Math.min(vLight, 1.2)

      // Rich gold hues: R: 255, G: 215, B: 0 / warm gold
      const gr = 1.0
      const gg = darkMode ? 0.82 : 0.72
      const gb = darkMode ? 0.28 : 0.15
      const r = Math.min(255, Math.round((gr * assembly + glow * 0.3) * vLight * 255))
      const g = Math.min(255, Math.round((gg * assembly + glow * 0.2) * vLight * 255))
      const b = Math.min(255, Math.round((gb * assembly + glow * 0.1) * vLight * 255))

      if (alpha <= 0.004) continue
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
      const sx = width / 2 + px * scale - size / 2
      const sy = height / 2 - (py + breathe) * scale - size / 2
      ctx.fillRect(sx, sy, size, size)
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  function smoothstep(a: number, b: number, t: number): number {
    const x = Math.min(1, Math.max(0, (t - a) / (b - a)))
    return x * x * (3 - 2 * x)
  }

  let mouseNdc = { x: 0, y: 0 }
  let holderRect = holder.getBoundingClientRect()
  const onMove = (event: PointerEvent): void => {
    const rect = holderRect
    if (rect.width === 0 || rect.height === 0) return
    mouseNdc = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
    }
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  const start = (): void => {
    if (disposed) return
    let last = performance.now()
    const step = (now: number): void => {
      if (disposed) return
      if (now - last < 1000 / FPS) {
        raf = requestAnimationFrame(step)
        return
      }
      last = now - ((now - last) % (1000 / FPS))
      const elapsed = (now - startedAt) / 1000
      const raw = Math.min(1, Math.max(0, (elapsed - 0.3) / 2.5))
      const D = 1 - Math.pow(1 - raw, 3)
      const assembly = smoothstep(0, 1, D)
      const targetX = (mouseNdc.x * WORLD_H) / 2
      const targetY = (mouseNdc.y * WORLD_H) / 2
      mouseWorld.x += (targetX - mouseWorld.x) * 0.08
      mouseWorld.y += (targetY - mouseWorld.y) * 0.08
      draw(assembly, elapsed)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }

  const img = new Image()
  img.onload = () => {
    if (disposed) return
    sample(img)
    resize()
    if (reduced) {
      mouseWorld = { x: 0, y: 0 }
      draw(1, 2)
      window.setTimeout(() => {
        if (disposed) return
        resize()
        draw(1, 2)
      }, 600)
    } else {
      start()
    }
  }
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(EMBLEM_SVG)}`

  return {
    setDark: (dark: boolean): void => {
      if (darkMode === dark) return
      darkMode = dark
      holder.setAttribute('data-scheme', dark ? 'dark' : 'light')
      if (reduced && particles.length > 0) draw(1, 2)
    },
    dispose: (): void => {
      disposed = true
      cancelAnimationFrame(raf)
      window.clearTimeout(recenterTimer)
      window.clearInterval(phaseWatch)
      phaseObserver.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', resize)
      holder.remove()
    },
  }
}
