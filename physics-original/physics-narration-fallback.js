(function () {
  const NativeAudio = window.Audio
  const NativeFetch = window.fetch ? window.fetch.bind(window) : null
  const manifestPathPattern = /^\/audio\/narrations\/([^/]+)\/manifest\.json$/
  const speechPathPattern = /\/audio\/narrations\/[^/]+\/(?:xiaoxiao\/)?[^/?]+\.speech(?:\?|$)/

  if (NativeFetch) {
    window.fetch = function patchedFetch(input, init) {
      const rawUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input && typeof input.url === 'string'
              ? input.url
              : ''

      if (rawUrl) {
        try {
          const url = new URL(rawUrl, window.location.href)
          const match = url.pathname.match(manifestPathPattern)
          if (match) {
            const fallbackUrl = `/physics-original/narration-manifests/${match[1]}.json`
            return NativeFetch(fallbackUrl, init).then((response) => (response.ok ? response : NativeFetch(input, init)))
          }
        } catch {
          // Fall back to the runtime's original request.
        }
      }

      return NativeFetch(input, init)
    }
  }

  function getSpeechText(src) {
    try {
      const url = new URL(src, window.location.href)
      return url.searchParams.get('text') || ''
    } catch {
      return ''
    }
  }

  function estimateDuration(text) {
    return Math.max(2, Math.min(24, Array.from(text).length / 3.2))
  }

  function findChineseVoice() {
    if (!('speechSynthesis' in window)) return null
    return (
      window.speechSynthesis
        .getVoices()
        .find((voice) => /zh|chinese|xiaoxiao|yunxi|huihui|yaoyao/i.test(`${voice.lang} ${voice.name}`)) || null
    )
  }

  class SpeechAudio {
    constructor(src) {
      this.src = src
      this.currentSrc = src
      this.playbackRate = 1
      this.currentTime = 0
      this.paused = true
      this.text = getSpeechText(src)
      this.duration = estimateDuration(this.text)
      this._target = document.createDocumentFragment()
      this._timer = null
      this._finishTimer = null
      this._utterance = null
      this._startedAt = 0
    }

    addEventListener(type, listener, options) {
      this._target.addEventListener(type, listener, options)
    }

    removeEventListener(type, listener, options) {
      this._target.removeEventListener(type, listener, options)
    }

    dispatchEvent(event) {
      return this._target.dispatchEvent(event)
    }

    _emit(type) {
      this.dispatchEvent(new Event(type))
    }

    _clearTimer() {
      if (this._timer) {
        window.clearInterval(this._timer)
        this._timer = null
      }
      if (this._finishTimer) {
        window.clearTimeout(this._finishTimer)
        this._finishTimer = null
      }
    }

    _stopSpeech() {
      if (this._utterance && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      this._utterance = null
    }

    _finish() {
      if (this.paused) return
      this.currentTime = this.duration
      this.paused = true
      this._clearTimer()
      this._utterance = null
      this._emit('timeupdate')
      this._emit('ended')
    }

    play() {
      this.pause()
      this.paused = false
      this.currentTime = 0
      this._startedAt = performance.now()
      this._timer = window.setInterval(() => {
        if (this.paused) return
        this.currentTime = Math.min(this.duration, ((performance.now() - this._startedAt) / 1000) * this.playbackRate)
        this._emit('timeupdate')
      }, 200)
      this._finishTimer = window.setTimeout(() => this._finish(), (this.duration * 1000) / this.playbackRate)

      if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window && this.text) {
        const utterance = new SpeechSynthesisUtterance(this.text)
        utterance.lang = 'zh-CN'
        utterance.rate = Math.min(1.8, Math.max(0.6, this.playbackRate))
        utterance.voice = findChineseVoice()
        this._utterance = utterance
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
      } else {
        this._emit('timeupdate')
      }

      return Promise.resolve()
    }

    pause() {
      this.paused = true
      this._clearTimer()
      this._stopSpeech()
    }
  }

  function PatchedAudio(src) {
    if (src && speechPathPattern.test(String(src))) {
      return new SpeechAudio(src)
    }
    return new NativeAudio(src)
  }

  PatchedAudio.prototype = NativeAudio.prototype
  window.Audio = PatchedAudio
})()
