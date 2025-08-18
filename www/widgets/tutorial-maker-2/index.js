/* global Widget, JSZip, WIDGETS, utils, NNE, NNW */
class TutorialMaker2 extends Widget {
  constructor (opts) {
    super(opts)
    this.key = 'tutorial-maker-2'
    this.title = 'Tutorial Maker 2'
    this._innerHTML = '<div></div>'
    this.hidden = true
    
    Convo.load(this.key, () => { 
      this.convos = window.CONVOS[this.key](this)
      this._startConvo() 
    })

    this._onLoad()

    nn.on('message', e => {
      const { type, payload } = e.data
      if (e.origin !== window.location.origin) return // for security
      if (type === 'tut-mkr-update-hvp') {
        this._updateHVP(payload)
      } else if (type === 'tut-mkr-update-hvp-video') {
        this._updateHVPVideo(payload)
      } else if (type === 'tut-mkr-highlight') {
        this._highlight(payload)
      } else if (type === 'tut-mkr-spotlight') {
        this._spotlight(payload)
      } else if (type === 'tut-mkr-add-root') {
        NNE.addCustomRoot(payload.root)
      } else if (type === 'tut-mkr-open-wdgt-mkr') {
        WIDGETS.open('widget-maker')
      } else if (type === 'tut-mkr-kf-data') {
        const data = this._getKeyFrameData()
        e.source.postMessage({ replyTo: type, payload: data }, e.origin)
      } else if (type === 'tut-mkr-load-data-lggr') {
        this._loadNetitorLogger(payload.data)
      } else if (type === 'tut-mkr-create-wdgt') {
        this._createWidgets(payload.widgets)
      }
    })
  }

  _onLoad () {
    this._loadPopout()
    this.addMessageListener()
    this._loadHVP()
  }

  _loadPopout () {
    this.hidden = true
    this.popup = window.open(
      './widgets/tutorial-maker-2/popup/index.html',
      'tutorial-maker-popout',
      'width=564,height=960'
    )

    this.popup.addEventListener('load', () => {
      this.popoutReady = true
      // this.sendToPopout('SOME_MESSAGE_TYPE', { foo: 'bar' })
    })
  }

  _messagePopup (type, payload) {
    if (!this.popup) return
    this.popup.postMessage({ type, payload }, window.origin)
  }

  _startConvo () {
    window.convo = new Convo(this.convos, 'opened')
  }

  _loadHVP () {
    WIDGETS.open('hyper-video-player', () => {
      this.video = WIDGETS['hyper-video-player'].video
      const { currentTime, duration } = this.video
      this._messagePopup('tut-mkr-update-video', { currentTime, duration })
      this.video.addEventListener('timeupdate', () => {
        const ct = this.video.currentTime
        this._messagePopup('tut-mkr-time-update', { currentTime: ct })
      })
    })
    const time = utils.getVal('--menu-fades-time')
    this.update({ top: 20, left: 20 }, time)
  }

  _updateHVPVideo (metadata) {
    const { id, title, videofile } = metadata
    const hvp = WIDGETS['hyper-video-player']
    hvp.title = title
    hvp.video.addEventListener('loadedmetadata', () => {
      this.duration = Number(hvp.video.duration)
      this._messagePopup('tut-mkr-update-duration', { duration: Number(hvp.video.duration) })
    })
    if (videofile && videofile !== '') {
      hvp.updateVideo(videofile, id)
    } else {
      hvp.updateVideo('screen-saver')
    }
    this._messagePopup('tut-mkr-update-video', { currentTime, duration })
  }

  _updateHVP (data) {
    const { action, duration, keyframes } = data
    const HVP = WIDGETS['hyper-video-player']
    action.forEach(type => {
      if (type === 'pause') {
        HVP.pause()
      } else if (type === 'update-pause-clock') {
        HVP._updatePauseClock()
      } else if (type === 'reset-keyframes-status') {
        HVP._resetKeyframeStatus()
      } else if (type === 'render-keyframe') {
        HVP.renderKeyframe()
      } else if (type === 'duration') {
        HVP.duration = duration
      } else if (type === 'load-keyframes') {
        HVP.loadKeyframes(keyframes)
      }
    })
  }

  _loadNetitorLogger (data) {
    const nt = WIDGETS['netitor-logger']
    if (nt) WIDGETS['netitor-logger'].loadData(data)
    else WIDGETS.load('netitor-logger', (w) => w.loadData(data))
  }

  _createWidgets (widgets) {
    for (const key in widgets) {
      if (!WIDGETS.instantiated.includes(key)) {
        WIDGETS.create(widgets[key])
      }
    }
  }

  _highlight(h) {
    if (h)
      NNE.highlight(h ? h : NULL)
  }

  _spotlight(v) {
    if (v)
      NNE.spotlight(v ? v : NULL)
  }

  _getCurrentWidgets () {
    const ignore = [
      'tutorial-maker', 'widget-maker', 'hyper-video-player', 'netitor-logger'
    ]
    return WIDGETS.list()
      .filter(w => w.opened)
      .filter(w => !ignore.includes(w.key))
      .map(w => getWigDetails(w))
  }

  _getKeyFrameData () {
    const code = NNE.code
    const layout = NNW.layout
    const scroll = NNE.cm.getScrollInfo()
    const netnet = ['welcome', 'separate-window'].includes(NNW.layout) 
      ? this._getSizeAndPosition(NNW)
      : { }
    const video = this._getSizeAndPosition(WIDGETS['hyper-video-player'])
    const widgets = this._getCurrentWidgets()
    return { code, layout, netnet, scroll, widgets, video }
  }

  _getSizeAndPosition (w) {
    const data = (w !== NNW)
      ? { key: w.key, width: w.width, height: w.height } : {}

    if (w.left < w.right) data.left = w.left
    else data.right = w.right

    if (w.top < w.bottom) data.top = w.top
    else data.bottom = w.bottom

    if (w !== NNW) data.zIndex = w.zIndex
    if (w === NNW && NNW.layout === 'separate-window') {
      data.width = NNW.width
      data.height = NNW.height
    }
    return data
  }

  addMessageListener () {
    window.addEventListener('message', event => {
      const { data, type } = event.data
      if (type === 'CHANGE_NETNET_LAYOUT') {
        NNW.layout = data.layout
      } else if (type === 'RECORDED_VIDEO') {
        WIDGETS.load('hyper-video-player', (HVP) => {
          HVP.src = data.blobUrl 
          HVP.open()
        })
        // if (!WIDGETS.loaded.includes('hyper-video-player')) {
        //   WIDGETS.load('hyper-video-player', () => {
        //     const player = WIDGETS.create({
        //       type: 'HyperVideoPlayer',
        //       key: 'recorded-video-player',
        //       video: data.blobUrl,
        //       mimeType: data.mimeType
        //     })
        //     player.title = 'Recorded Video'
        //     player.open()

        //     player.on('close', () => {
        //       URL.revokeObjectURL(data.blobUrl)
        //       const idx = WIDGETS.instantiated.indexOf('recorded-video-player')
        //       if (idx > -1) WIDGETS.instantiated.splice(idx, 1)
        //       delete WIDGETS['recorded-video-player']
        //     })
        //   })
        // } else {
        //   const player = WIDGETS.create({
        //     type: 'HyperVideoPlayer',
        //     key: 'recorded-video-player',
        //     video: data.blobUrl,
        //     mimeType: data.mimeType
        //   })
        //   player.title = 'Recorded Video'
        //   player.open()

        //   player.on('close', () => {
        //     URL.revokeObjectURL(data.blobUrl)
        //     const idx = WIDGETS.instantiated.indexOf('recorded-video-player')
        //     if (idx > -1) WIDGETS.instantiated.splice(idx, 1)
        //     delete WIDGETS['recorded-video-player']
        //   })
        // }
      }
    })
  }
}

window.TutorialMaker2 = TutorialMaker2
