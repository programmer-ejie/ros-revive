import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [server, setServer] = useState('Philippines')
  const serverMenuRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'loading' | 'countdown' | 'enter' | 'playing' | 'error'>('loading')
  const [loaded, setLoaded] = useState(0)
  const [musicReady, setMusicReady] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [copyStatus, setCopyStatus] = useState('Copy number')

  const enterGame = async () => {
    const music = document.querySelector<HTMLAudioElement>('#background-music')
    if (!music) return
    try {
      await music.play()
      setPhase('playing')
    } catch {
      setPhase('enter')
    }
  }

  useEffect(() => {
    const music = document.querySelector<HTMLAudioElement>('#background-music')
    if (!music) return
    const controller = new AbortController()
    let active = true
    let audioUrl: string | undefined
    let launchTimer: number | undefined
    const base = `${import.meta.env.BASE_URL}images/`
    const complete = () => { if (active) setLoaded((count) => count + 1) }
    const timeout = window.setTimeout(() => {
      if (active) setPhase('error')
      controller.abort()
    }, 60000)
    const images = ['bg-scene.jpg', 'character-left.png', 'character-right.png', 'character-boy-4k.png', 'character-grenadier-4k.png', 'bg-mobile.jpg']
    const imageJobs = images.map(async (file) => {
      const image = new Image()
      image.src = `${base}${file}`
      await image.decode()
      complete()
    })
    const audioJob = async () => {
      const response = await fetch(`${base}game-background.mp3`, { signal: controller.signal })
      if (!response.ok) throw new Error('Music could not load')
      const blob = await response.blob()
      if (!active || controller.signal.aborted) return
      audioUrl = URL.createObjectURL(blob)
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          music.removeEventListener('canplay', ready)
          music.removeEventListener('error', failed)
          controller.signal.removeEventListener('abort', failed)
        }
        const ready = () => { cleanup(); resolve() }
        const failed = () => { cleanup(); reject(new Error('Music could not prepare')) }
        music.addEventListener('canplay', ready)
        music.addEventListener('error', failed)
        controller.signal.addEventListener('abort', failed)
        music.src = audioUrl!
        music.load()
      })
      complete()
      if (active) setMusicReady(true)
    }
    void Promise.all([...imageJobs, audioJob()]).then(() => {
      window.clearTimeout(timeout)
      if (!active || controller.signal.aborted) return
      setPhase('countdown')
      let remaining = 3
      launchTimer = window.setInterval(() => {
        remaining -= 1
        if (active) setCountdown(remaining)
        if (remaining > 0) return
        window.clearInterval(launchTimer)
        if (!active) return
        void music.play().then(() => {
          if (active) setPhase('playing')
        }).catch(() => {
          if (active) setPhase('enter')
        })
      }, 1000)
    }).catch(() => {
      window.clearTimeout(timeout)
      window.clearInterval(launchTimer)
      if (active) setPhase('error')
    })
    return () => {
      active = false
      window.clearTimeout(timeout)
      window.clearInterval(launchTimer)
      controller.abort()
      music.pause()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [])

  return (
    <>
      {phase !== 'playing' && <div className="loading-screen" aria-live="polite">
        <div className="loading-panel">
          <div className="loading-topline"><span>PC EDITION</span><span>PHILIPPINES / ASIA</span></div>
          <p className="loading-brand">RULES OF SURVIVAL</p>
          <div className="gunfire-animation" aria-hidden="true">
            <svg className="loading-gun" viewBox="0 0 220 100"><path d="M20 35h135v-7h28v10h25v15h-72l-15 13H89l-11 28H47l14-41H20z" fill="currentColor" /><path d="M94 56h22l-5 12H91z" fill="#142431" /></svg>
            <span className="muzzle-flash" /><span className="bullet-trail" />
          </div>
          <h1>{phase === 'error' ? 'Loading interrupted' : phase === 'countdown' ? `Deploying in ${countdown} seconds` : phase === 'enter' ? 'Ready for deployment' : 'Preparing the battlefield'}</h1>
          <p className="loading-message">{phase === 'error' ? 'An asset could not load. Please try again.' : phase === 'enter' ? 'Click to enter and start the music.' : 'Loading characters, scenery and background music…'}</p>
          <div className="loading-progress-label"><span>{phase === 'loading' ? 'PREPARING GAME ASSETS' : phase === 'error' ? 'PLEASE RETRY' : 'ALL ASSETS READY'}</span><strong>{Math.round(loaded / 7 * 100)}%</strong></div>
          <div className="loading-track" role="progressbar" aria-label="Loading game assets" aria-valuemin={0} aria-valuemax={7} aria-valuenow={loaded}><span style={{ width: `${loaded / 7 * 100}%` }} /></div>
          <div className="loading-checklist">
            <div><span>SCENERY & CHARACTERS</span><strong>{loaded - Number(musicReady)}/6 READY</strong></div>
            <div><span>BACKGROUND MUSIC</span><strong>{musicReady ? 'READY TO PLAY' : 'BUFFERING'}</strong></div>
          </div>
          <p className="loading-tip">{phase === 'countdown' ? 'Everything is ready. Music starts when you enter the game.' : 'Prepare for survival. Every second counts.'}</p>
          {phase === 'enter' && <button className="modal-dismiss" onClick={() => void enterGame()}>Click to enter</button>}
          {phase === 'error' && <button className="modal-dismiss" onClick={() => window.location.reload()}>Retry loading</button>}
        </div>
      </div>}
    <main className="game-background" aria-label="Game background" hidden={phase !== 'playing'}>
      <aside className="fun-notice">
        <strong>JUST FOR FUN</strong>
        <span>This project is for fun only! The payment section is also just for fun — no payment is needed.</span>
      </aside>
      <div className="mobile-title" aria-label="Rules of Survival, Battle Royale Game">
        <div className="mobile-title-first">RULES <span>OF</span></div>
        <div className="mobile-title-second">SURVIVAL</div>
        <p>BATTLE ROYALE GAME</p>
      </div>
      <div className="game-scene" aria-hidden="true">
        <img className="scene-layer scene-backdrop" src={`${import.meta.env.BASE_URL}images/bg-scene.jpg`} alt="" />
        <img className="scene-layer character-left" src={`${import.meta.env.BASE_URL}images/character-left.png`} alt="" />
        <img className="scene-layer character-right" src={`${import.meta.env.BASE_URL}images/character-right.png`} alt="" />
        <img className="character-boy" src={`${import.meta.env.BASE_URL}images/character-boy-4k.png`} alt="" />
        <img className="character-grenadier" src={`${import.meta.env.BASE_URL}images/character-grenadier-4k.png`} alt="" />
      </div>
      <div className="play-menu">
        <div className="server-bar">
          <span className="server-name"><span className="online-dot" aria-label="Online" />PC {server}</span>
          <button className="server-select" popoverTarget="server-menu" aria-label="Select server" onClick={(event) => {
            const strip = event.currentTarget.parentElement?.getBoundingClientRect()
            const menu = serverMenuRef.current
            if (!strip || !menu) return
            menu.style.left = `${strip.left}px`
            menu.style.width = `${strip.width}px`
            menu.style.top = `${strip.bottom + 200 > window.innerHeight ? Math.max(8, strip.top - 190) : strip.bottom + 6}px`
          }}>Select Server</button>
          <div id="server-menu" className="server-dropdown" popover="auto" ref={serverMenuRef}>
            <p className="server-dropdown-heading">SELECT SERVER <span>ASIA</span></p>
            {['Philippines', 'Singapore', 'Japan'].map((name) => (
              <button key={name} className="server-option" aria-pressed={server === name} onClick={() => {
                setServer(name)
                serverMenuRef.current?.hidePopover()
              }}>
                <span className="server-option-name"><span className="online-dot" />PC {name}</span>
                <span className="server-option-status">{server === name ? 'SELECTED' : 'SELECT'}</span>
              </button>
            ))}
          </div>
        </div>
        <button className="play-button" onClick={() => dialogRef.current?.showModal()}>
          PLAY
        </button>
      </div>
      <dialog ref={dialogRef} className="play-modal" aria-labelledby="play-modal-title" aria-describedby="play-modal-description" onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}>
        <div className="modal-content">
          <button className="modal-close" aria-label="Close" onClick={() => dialogRef.current?.close()}>×</button>
          <p className="modal-eyebrow">RULES OF SURVIVAL</p>
          <h1 id="play-modal-title">Ready to play?</h1>
          <div className="modal-server"><span className="online-dot" />PC {server}<span className="modal-region">ASIA</span></div>
          <p className="play-price">$99.45 <span>USD</span></p>
          <p id="play-modal-description" className="modal-description">The price to play on the {server} server in Asia is $99.45.</p>
          <div className="gcash-payment">
            <div className="gcash-heading"><img src={`${import.meta.env.BASE_URL}images/gcash-logo.avif`} alt="GCash" /><span>PAYMENT TO PLAY</span></div>
            <p>To play, send your payment to this GCash account:</p>
            <div className="gcash-account"><strong>09627905690</strong><button onClick={async () => {
              try {
                await navigator.clipboard.writeText('09627905690')
                setCopyStatus('Copied!')
              } catch {
                setCopyStatus('Select number to copy')
              }
            }}>{copyStatus}</button></div>
          </div>
          <button className="modal-dismiss" onClick={() => dialogRef.current?.close()}>Got it</button>
        </div>
      </dialog>
    </main>
    </>
  )
}

export default App
