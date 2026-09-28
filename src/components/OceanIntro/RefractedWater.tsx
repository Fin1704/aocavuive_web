'use client'

import { useEffect, useRef, useState } from 'react'
import { PORTRAIT_QUERY, rasterSize } from './model'

const vertex = `attribute vec2 position; varying vec2 uv;
void main(){ uv=(position+1.0)*0.5; gl_Position=vec4(position,0.0,1.0); }`
const fragment = `precision mediump float;
uniform sampler2D reef; uniform float time; uniform float aspect; uniform float imageAspect;
varying vec2 uv;
void main(){
 vec2 p=uv-0.5;
 if(aspect>imageAspect) p.y*=imageAspect/aspect; else p.x*=aspect/imageAspect;
 vec2 wave=vec2(sin(uv.y*23.0+time*.8)+sin(uv.x*14.0-time*.55),cos(uv.x*20.0+time*.65));
 vec2 sampleUV=clamp(p*.975+0.5+wave*.0028,0.001,0.999);
 vec3 color=texture2D(reef,sampleUV).rgb;
 float lattice=sin(uv.x*32.0+sin(uv.y*19.0+time*.65)*2.0+time*.4);
 float lattice2=sin(uv.y*28.0+sin(uv.x*21.0-time*.45)*2.0-time*.55);
 float caustic=pow(max(0.0,1.0-abs(lattice+lattice2)*.72),14.0);
 float ray=(uv.x-.52)/(1.3-uv.y);
 float shafts=pow(max(0.0,sin(ray*26.0+time*.28)*.65+sin(ray*39.0-time*.2)*.35),5.0);
 color+=vec3(.42,.92,.8)*(caustic*.105+shafts*.13);
 gl_FragColor=vec4(color,1.0);
}`

/** A bounded 30fps water refraction pass. The picture underneath is the fallback. */
export default function RefractedWater({ active }: { active: boolean }) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const running = useRef(active)
	const resume = useRef<() => void>(() => {})
	const [ready, setReady] = useState(false)
	useEffect(() => { running.current = active; resume.current() }, [active])
	useEffect(() => {
		const canvas = canvasRef.current!
		const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' })
		if (!gl) return
		let alive = true, frame = 0, last = 0, elapsed = 0, imageReady = false
		const shaders: WebGLShader[] = []
		const program = gl.createProgram()
		const buffer = gl.createBuffer()
		const texture = gl.createTexture()
		const release = () => {
			cancelAnimationFrame(frame)
			if (program) gl.deleteProgram(program)
			if (buffer) gl.deleteBuffer(buffer)
			if (texture) gl.deleteTexture(texture)
			shaders.forEach(shader => gl.deleteShader(shader))
		}
		if (!program || !buffer || !texture) { release(); return }
		for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
			const shader = gl.createShader(type)
			if (!shader) { release(); return }
			shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader)
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { release(); return }
			gl.attachShader(program, shader)
		}
		gl.linkProgram(program)
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { release(); return }
		gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
		const position = gl.getAttribLocation(program, 'position')
		gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
		gl.bindTexture(gl.TEXTURE_2D, texture)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
		gl.uniform1i(gl.getUniformLocation(program, 'reef'), 0)
		const clock = gl.getUniformLocation(program, 'time')
		const viewport = gl.getUniformLocation(program, 'aspect')
		const imageAspect = gl.getUniformLocation(program, 'imageAspect')
		function draw() {
			if (!imageReady || !alive) return
			gl!.uniform1f(clock, elapsed); gl!.drawArrays(gl!.TRIANGLES, 0, 6)
		}
		function tick(now: number) {
			frame = 0
			if (!alive || !running.current || document.hidden || !imageReady) { last = 0; return }
			if (!last || now - last >= 1000 / 30) {
				elapsed += last ? Math.min(now - last, 80) / 1000 : 0
				last = now; draw()
			}
			frame = requestAnimationFrame(tick)
		}
		const start = () => {
			cancelAnimationFrame(frame); frame = 0; last = 0
			if (running.current && !document.hidden && imageReady) frame = requestAnimationFrame(tick)
		}
		resume.current = start
		const portrait = window.matchMedia(PORTRAIT_QUERY)
		let image: HTMLImageElement | null = null
		function load() {
			if (image) image.onload = image.onerror = null
			const current = new Image(); image = current
			current.onload = () => {
				if (!alive) return
				gl!.bindTexture(gl!.TEXTURE_2D, texture)
				gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true)
				gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, current)
				gl!.uniform1f(imageAspect, current.naturalWidth / current.naturalHeight)
				imageReady = true; draw(); setReady(true); start()
			}
			current.onerror = () => { if (alive) setReady(false) }
			current.src = `/ocean-intro/${portrait.matches ? 'reef-portrait-clear' : 'reef-landscape-clear'}.webp`
		}
		function resize() {
			const bounds = canvas.getBoundingClientRect()
			const w = Math.max(1, bounds.width), h = Math.max(1, bounds.height)
			const size = rasterSize(w, h, 1)
			canvas.width = size.width; canvas.height = size.height
			gl!.viewport(0, 0, size.width, size.height); gl!.uniform1f(viewport, w / h); draw()
		}
		function lost(event: Event) { event.preventDefault(); imageReady = false; setReady(false); cancelAnimationFrame(frame) }
		resize(); load()
		const observer = new ResizeObserver(resize); observer.observe(canvas)
		portrait.addEventListener('change', load)
		canvas.addEventListener('webglcontextlost', lost)
		document.addEventListener('visibilitychange', start)
		return () => {
			alive = false; resume.current = () => {}; release(); observer.disconnect()
			if (image) image.onload = image.onerror = null
			portrait.removeEventListener('change', load)
			canvas.removeEventListener('webglcontextlost', lost)
			document.removeEventListener('visibilitychange', start)
		}
	}, [])
	return <canvas ref={canvasRef} className='ocean-refraction' style={{ opacity: ready ? 1 : 0 }} aria-hidden='true' />
}
