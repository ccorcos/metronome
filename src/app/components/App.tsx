import React, { useEffect, useRef, useState } from "react"

const isMobile = isMobileUserAgent()

type Point = { x: number; y: number }
type DragState =
	| { dragging: false }
	| { dragging: true; start: Point; current: Point; id?: number }

export function App() {
	const [bpm, setBpm] = useState(100)

	const [dragging, setDragging] = useState<DragState>({ dragging: false })

	let bpmOffset = 0
	if (dragging.dragging) {
		const { start, current } = dragging
		const diffPx = current.y - start.y

		const pxPerBpm = window.innerHeight / 100
		const diffBpm = diffPx / pxPerBpm

		bpmOffset = diffBpm
	}

	if (isMobile) bpmOffset *= -1

	const currentBpm = Math.round(bpm + bpmOffset)

	const currentBpmRef = useRef(currentBpm)
	currentBpmRef.current = currentBpm

	const draggingRef = useRef(dragging)
	draggingRef.current = dragging

	useEffect(() => {
		window.addEventListener("mousedown", (e) => {
			const point: Point = { x: e.pageX, y: e.pageY }
			setDragging({ dragging: true, start: point, current: point })
		})

		window.addEventListener("mousemove", (e) => {
			const dragging = draggingRef.current
			if (!dragging.dragging) return
			const { start } = dragging
			const point: Point = { x: e.pageX, y: e.pageY }
			setDragging({ dragging: true, start, current: point })
		})

		window.addEventListener("mouseup", (e) => {
			const dragging = draggingRef.current
			if (!dragging.dragging) return
			setBpm((bpm) => currentBpmRef.current)
			setDragging({ dragging: false })
		})

		window.addEventListener("touchstart", (e) => {
			const dragging = draggingRef.current
			const touch = e.touches[0]
			const id = touch.identifier
			const point: Point = { x: touch.pageX, y: touch.pageY }
			setDragging({ dragging: true, start: point, current: point, id })
		})

		window.addEventListener("touchmove", (e) => {
			const dragging = draggingRef.current
			if (!dragging.dragging) return
			const touch = Array.from(e.touches).find(
				(touch) => touch.identifier === dragging.id
			)
			if (!touch) return
			const { start, id } = dragging
			const point: Point = { x: touch.pageX, y: touch.pageY }
			setDragging({ dragging: true, start, current: point, id })
		})

		window.addEventListener("touchend", (e) => {
			const dragging = draggingRef.current
			if (!dragging.dragging) return
			setBpm((bpm) => currentBpmRef.current)
			setDragging({ dragging: false })
		})
		// TODO: technically should stop these listeners but w/e
	}, [])

	return (
		<div
			style={{
				padding: "1em",
				maxWidth: "100%",
				width: "24em",
				margin: "0 auto",
				textAlign: "center",
				display: "flex",
				alignItems: "center",
				flexDirection: "column",
			}}
		>
			<h2>Metronome</h2>
			<Blinker bpm={currentBpm} />
		</div>
	)
}

function Blinker(props: { bpm: number }) {
	const divRef = useRef<HTMLDivElement>(null)

	const bpmRef = useRef(props.bpm)
	bpmRef.current = props.bpm

	const getPeriodMs = () => {
		const bpm = bpmRef.current
		const msPerMinute = 1000 * 60
		const periodMs = (1 / bpm) * msPerMinute

		return periodMs
	}

	const touched = useRef(false)

	useEffect(() => {
		window.addEventListener("mousedown", (e) => {
			touched.current = true
			vibrate()
		})
		window.addEventListener("touchstart", (e) => {
			touched.current = true
			vibrate()
		})
		// TODO: return unsubscribe but w/e
	}, [])

	const vibrate = () => {
		if (!touched.current) return
		try {
			window.navigator?.vibrate?.(50)
		} catch (error) {}
	}

	useEffect(() => {
		let cancel = false

		const blink = async () => {
			const div = divRef.current
			if (!div) return

			div.style.background = "var(--red)"
			await sleep(getPeriodMs() / 2)
			div.style.background = "transparent"
		}

		const loop = async () => {
			while (!cancel) {
				await sleep(getPeriodMs())
				vibrate()
				blink()
			}
		}

		loop()

		return () => {
			cancel = true
		}
	}, [])

	return (
		<div
			ref={divRef}
			style={{
				border: "2px solid var(--text-color)",
				borderRadius: 99999,
				height: 300,
				width: 300,
				maxHeight: "80vw",
				maxWidth: "80vw",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				fontSize: "4em",
				transition: `ease-in-out ${Math.round(getPeriodMs() / 3)}ms background`,
			}}
		>
			{props.bpm}
		</div>
	)
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function isMobileUserAgent(): boolean {
	if (navigator && navigator.userAgent) {
		const userAgent: string = navigator.userAgent.toLowerCase()
		const mobileKeywords: string[] = [
			"android",
			"iphone",
			"ipad",
			"mobile",
			"windows phone",
		]

		for (const keyword of mobileKeywords) {
			if (userAgent.includes(keyword)) {
				return true
			}
		}
	}
	return false
}
