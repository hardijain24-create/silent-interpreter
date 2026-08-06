'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Menu, Pause, Play, Volume2, Video, X } from 'lucide-react'

type Stage = { label: string; detail: string; color: string }

const stages: Stage[] = [
  { label: 'Gesture', detail: 'Camera input received', color: 'teal' },
  { label: 'Landmarks', detail: 'Hand movement mapped', color: 'blue' },
  { label: 'Meaning', detail: 'Sequence understood', color: 'coral' },
  { label: 'Voice', detail: 'Translation ready', color: 'lime' },
]

const phrases = [
  { gesture: 'Open palm', english: 'I need help finding my appointment.', hindi: 'मुझे अपनी अपॉइंटमेंट में मदद चाहिए।', confidence: 96 },
  { gesture: 'Point & cup', english: 'One coffee, please.', hindi: 'एक कॉफ़ी दे दीजिए।', confidence: 94 },
  { gesture: 'Directional sign', english: 'Where is Gate 12?', hindi: 'गेट 12 कहाँ है?', confidence: 92 },
]

function Mark() {
  return <span className="mark" aria-hidden="true"><i /><i /><i /></span>
}

function Observer() {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const update = () => {
      if (frame.current !== null) return
      frame.current = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight
        const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
        setProgress(next)
        setActive(Math.min(stages.length - 1, Math.floor(next * stages.length)))
        frame.current = null
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', update)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  const degrees = Math.round(progress * 360)
  const current = stages[active]

  return (
    <div className="observer-shell" style={{ '--progress': progress, '--degrees': `${degrees}deg` } as React.CSSProperties}>
      <div className="observer-ring ring-back" aria-hidden="true" />
      <div className="observer-ring ring-ticks" aria-hidden="true" />
      <div className="observer-arc arc-teal" aria-hidden="true" />
      <div className="observer-arc arc-blue" aria-hidden="true" />
      <div className="observer-arc arc-coral" aria-hidden="true" />
      <div className="observer-arc arc-lime" aria-hidden="true" />
      <div className="observer-core">
        <span className={`core-icon ${current.color}`} aria-hidden="true"><span /></span>
        <strong>{current.label}</strong>
        <small>{current.detail}</small>
        <span className="core-count">0{active + 1} / 04</span>
      </div>
      <div className="observer-readout"><span>SCROLL OBSERVER</span><b>{String(degrees).padStart(3, '0')}°</b></div>
    </div>
  )
}

function LiveDemo() {
  const [running, setRunning] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [language, setLanguage] = useState<'english' | 'hindi'>('english')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [cameraGranted, setCameraGranted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const phrase = phrases[phraseIndex]

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setRunning(true)
      return
    }
    try {
      streamRef.current?.getTracks().forEach(track => track.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setCameraGranted(true)
      setRunning(true)
    } catch {
      setCameraGranted(false)
      setRunning(true)
    }
  }, [])

  return (
    <section className="live-section" id="demo" aria-labelledby="demo-title">
      <div className="section-kicker">LIVE TRANSLATION DEMO <span>SIMULATION</span></div>
      <div className="demo-card">
        <div className="demo-camera">
          {cameraGranted ? <video ref={videoRef} muted playsInline aria-label="Live camera preview" /> : <div className="camera-placeholder"><Video size={22} /><span>Camera preview</span><small>Permission stays in your browser</small></div>}
          <div className="camera-status"><i /> {cameraGranted ? 'CAMERA ACTIVE' : 'READY TO CONNECT'}</div>
        </div>
        <div className="demo-output">
          <div className="output-top"><span>DETECTED GESTURE</span><b>{running ? `${phrase.confidence}%` : '—'}</b></div>
          <div className="gesture-line"><span className="gesture-dot" />{running ? phrase.gesture : 'Waiting for a gesture'}</div>
          <div className="translation" aria-live="polite"><span>{language === 'english' ? 'ENGLISH' : 'हिन्दी'}</span><strong>{running ? (language === 'english' ? phrase.english : phrase.hindi) : 'Start the demo to see a translation.'}</strong>{running && language === 'english' && <small>{phrase.hindi}</small>}</div>
          <div className="wave" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ height: `${8 + ((i * 13) % 24)}px` }} />)}</div>
          <div className="demo-actions">
            <button className="button button-coral" onClick={running ? () => setRunning(false) : requestCamera}>{running ? <><Pause size={14} /> Stop demo</> : <><Play size={14} /> Start demo</>}</button>
            <button className="button button-quiet" onClick={() => setLanguage(language === 'english' ? 'hindi' : 'english')} aria-label="Switch translation language"><ArrowRight size={14} /> {language === 'english' ? 'हिन्दी' : 'English'}</button>
            <button className={`icon-button ${speaking ? 'active' : ''}`} onClick={() => setSpeaking(!speaking)} disabled={!running} aria-label={speaking ? 'Stop speech' : 'Play speech'}>{speaking ? <Pause size={14} /> : <Volume2 size={14} />}</button>
          </div>
          <button className="phrase-next" onClick={() => setPhraseIndex((phraseIndex + 1) % phrases.length)} disabled={!running}>Try another phrase</button>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Silent Interpreter home"><Mark /><span>Silent Interpreter</span></a>
        <nav id="main-navigation" className={mobileOpen ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <a href="#observer" onClick={() => setMobileOpen(false)}>Observer</a>
          <a href="#demo" onClick={() => setMobileOpen(false)}>Live demo</a>
          <a href="#about" onClick={() => setMobileOpen(false)}>About</a>
        </nav>
        <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="main-navigation" aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </header>

      <section className="hero" id="observer" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> INDIAN SIGN LANGUAGE · 2026</div>
          <h1 id="hero-title">Communication should never need a <em>translator.</em></h1>
          <p>Silent Interpreter turns signed gestures into clear, spoken language — one calm moment at a time.</p>
          <a className="hero-link" href="#demo">Experience the demo <ArrowRight size={15} /></a>
        </div>
        <Observer />
      </section>

      <section className="status-strip" aria-label="Translation pipeline">
        {stages.map((stage, index) => <div className={index === 2 ? 'status-item active' : 'status-item'} key={stage.label}><span className={`status-dot ${stage.color}`} /> <b>0{index + 1}</b> {stage.label}</div>)}
      </section>

      <LiveDemo />

      <section className="about-section" id="about" aria-labelledby="about-title">
        <div className="section-kicker">WHY IT MATTERS</div>
        <h2 id="about-title">The technology stays quiet.<br /><em>The person stays heard.</em></h2>
        <p>Built as a research project for the spaces where understanding matters most: hospitals, classrooms, airports, and everyday conversations.</p>
        <div className="about-points"><span><Check size={14} /> Local-first demo</span><span><Check size={14} /> Indian Sign Language research</span><span><Check size={14} /> Designed for dignity</span></div>
      </section>

      <footer className="site-footer"><a className="brand" href="#top"><Mark /><span>Silent Interpreter</span></a><span>Built for the moments when being understood matters.</span><a href="#demo">Try the demo <ArrowRight size={13} /></a></footer>
    </main>
  )
}
