'use client'

import { useEffect, useRef } from 'react'
import { coverCircle, rasterSize, REVEAL_COVERAGE } from './model'

export default function WaterVeil({ onReveal, animated = true }: { onReveal: () => void; animated?: boolean }) {
 const canvasRef = useRef<HTMLCanvasElement>(null)
 const motion = useRef(animated)
 const invalidate = useRef<() => void>(() => {})
 useEffect(() => { motion.current = animated; invalidate.current() }, [animated])
 useEffect(() => {
  const canvas = canvasRef.current!
  const ctx = canvas.getContext('2d')
  const mask = document.createElement('canvas'), base = document.createElement('canvas'), mist = document.createElement('canvas')
  const maskCtx = mask.getContext('2d'), baseCtx = base.getContext('2d'), mistCtx = mist.getContext('2d')
  if (!ctx || !maskCtx || !baseCtx || !mistCtx) return
  let width = 1, height = 1, initialized = false, pointer: number | null = null
  let previous: { x: number; y: number } | null = null
  let pending: { x: number; y: number } | null = null
  let frame = 0, lastFrame = 0, elapsed = 0, revealed = false, disposed = false
  const coverage = new Uint8Array(80 * 50)
  mist.width = mist.height = 256
  const glow = mistCtx.createRadialGradient(128, 128, 0, 128, 128, 128)
  glow.addColorStop(0, 'rgba(157,255,235,.4)'); glow.addColorStop(.4, 'rgba(73,208,220,.24)'); glow.addColorStop(1, 'rgba(19,131,179,0)')
  mistCtx.fillStyle = glow; mistCtx.fillRect(0, 0, 256, 256)
  function draw() {
   ctx!.globalCompositeOperation = 'source-over'; ctx!.clearRect(0, 0, width, height)
   ctx!.drawImage(base, 0, 0, width, height)
   for (let i = 0; i < 12; i++) {
    const size = Math.min(width, height) * (.65 + (i % 3) * .18)
    const x = ((i * .317 + elapsed * .013 * (i % 2 ? 1 : -1)) % 1.6 + 1.6) % 1.6 * width - width * .3
    const y = (i * .273 % 1) * height + Math.sin(elapsed * .42 + i) * 45
    ctx!.drawImage(mist, x - size / 2, y - size / 2, size, size)
   }
   for (let i = 0; i < 25; i++) {
    const r = 3 + i % 5 * 5
    const x = (i * .371 % 1) * width + Math.sin(elapsed * .8 + i) * 20
    const y = height - ((i * .233 * height + elapsed * (12 + i % 4 * 5)) % (height + 80))
    ctx!.beginPath(); ctx!.arc(x, y, r, 0, Math.PI * 2)
    ctx!.strokeStyle = 'rgba(186,255,250,.36)'; ctx!.lineWidth = 1.2; ctx!.stroke()
    ctx!.beginPath(); ctx!.arc(x - r * .3, y - r * .4, Math.max(1, r * .12), 0, Math.PI * 2)
    ctx!.fillStyle = 'rgba(245,255,236,.65)'; ctx!.fill()
   }
   ctx!.globalCompositeOperation = 'destination-in'; ctx!.drawImage(mask, 0, 0, width, height)
   ctx!.globalCompositeOperation = 'source-over'
  }
  function resize() {
   const rect = canvas.getBoundingClientRect()
   width = Math.max(1, rect.width); height = Math.max(1, rect.height)
   const raster = rasterSize(width, height, window.devicePixelRatio || 1)
   const old = document.createElement('canvas'); old.width = mask.width; old.height = mask.height
   old.getContext('2d')?.drawImage(mask, 0, 0)
   for (const surface of [canvas, mask, base]) { surface.width = raster.width; surface.height = raster.height }
   for (const context of [ctx!, maskCtx!, baseCtx!]) context.setTransform(raster.width / width, 0, 0, raster.height / height, 0, 0)
   if (initialized) maskCtx!.drawImage(old, 0, 0, width, height)
   else { maskCtx!.fillStyle = '#fff'; maskCtx!.fillRect(0, 0, width, height) }
   const water = baseCtx!.createLinearGradient(0, 0, width * .4, height)
   water.addColorStop(0, 'rgba(19,173,196,.86)'); water.addColorStop(.5, 'rgba(5,83,128,.92)'); water.addColorStop(1, 'rgba(3,33,72,.97)')
   baseCtx!.fillStyle = water; baseCtx!.fillRect(0, 0, width, height)
   initialized = true; previous = null; draw()
  }
  function stamp(x: number, y: number, radius: number) {
   const gradient = maskCtx!.createRadialGradient(x, y, radius * .65, x, y, radius)
   gradient.addColorStop(0, 'rgba(0,0,0,1)'); gradient.addColorStop(1, 'rgba(0,0,0,0)')
   maskCtx!.globalCompositeOperation = 'destination-out'; maskCtx!.fillStyle = gradient
   maskCtx!.beginPath(); maskCtx!.arc(x, y, radius, 0, Math.PI * 2); maskCtx!.fill()
   maskCtx!.globalCompositeOperation = 'source-over'
   return coverCircle(coverage, x, y, radius * .75, width, height)
  }
  function paint(time: number) {
   frame = 0
   if (disposed || revealed || document.hidden) return
   const interval = 1000 / (pending ? 48 : 24)
   if (time - lastFrame < interval) { frame = requestAnimationFrame(paint); return }
   if (motion.current) elapsed += lastFrame ? Math.min(time - lastFrame, 80) / 1000 : 0
   lastFrame = time
   if (pending) {
    const point = pending; pending = null
    const radius = Math.max(48, Math.min(105, Math.min(width, height) * .14))
    const from = previous ?? point
    const steps = Math.max(1, Math.ceil(Math.hypot(point.x - from.x, point.y - from.y) / (radius * .25)))
    let fraction = 0
    for (let i = 1; i <= steps; i++) fraction = stamp(from.x + (point.x - from.x) * i / steps, from.y + (point.y - from.y) * i / steps, radius)
    previous = point
    if (fraction >= REVEAL_COVERAGE) { revealed = true; onReveal() }
   }
   draw()
   if (motion.current && !revealed) frame = requestAnimationFrame(paint)
  }
  function start() { if (!frame && !document.hidden && !revealed && !disposed) frame = requestAnimationFrame(paint) }
  invalidate.current = start
  function queue(event: PointerEvent) {
   const rect = canvas.getBoundingClientRect(); pending = { x: event.clientX - rect.left, y: event.clientY - rect.top }; start()
  }
  function down(event: PointerEvent) {
   if (pointer !== null || !event.isPrimary || event.button !== 0) return
   pointer = event.pointerId; previous = null; canvas.setPointerCapture(pointer); queue(event)
  }
  function move(event: PointerEvent) { if (pointer === event.pointerId) queue(event) }
  function up(event: PointerEvent) {
   if (pointer !== event.pointerId) return
   pointer = null
   if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
  }
  function visibility() {
   cancelAnimationFrame(frame); frame = 0; lastFrame = 0; pending = null; previous = null
   if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer)
   pointer = null
   if (!document.hidden && motion.current) start()
  }
  resize(); if (motion.current) start()
  const observer = new ResizeObserver(resize); observer.observe(canvas)
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up)
  document.addEventListener('visibilitychange', visibility)
  return () => {
   disposed = true; invalidate.current = () => {}; cancelAnimationFrame(frame); observer.disconnect()
   canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move)
   canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up)
   document.removeEventListener('visibilitychange', visibility)
  }
 }, [onReveal])
 return <canvas ref={canvasRef} className='ocean-veil' aria-hidden='true' />
}
