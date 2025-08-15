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
      console.log("message type: ", type)
      if (type === 'tut-mrk-update-hvp') {
        this._updateHVP(payload)
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
    this.popout = window.open(
      './widgets/tutorial-maker-2/popout/index.html',
      'tutorial-maker-popout',
      'width=600,height=400'
    )

    this.popout.addEventListener('load', () => {
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
      this.video.addEventListener('timeupdate', () => {
        const ct = this.video.currentTime
        this._messagePopup('tut-mkr-time-update', { currentTime: ct })
      })
    })
    const time = utils.getVal('--menu-fades-time')
    this.update({ top: 20, left: 20 }, time)
  }

  _updateHVP (metadata) {
    console.log("metadata: ", metadata)
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
  }

  sendToPopout (type, data) {
    if (!this.popout || this.popout.closed) {
      console.warn('Popout window is not available')
      return
    }

    this.popout.postMessage(
      {
        type,
        data
      },
      '*'
    )
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
