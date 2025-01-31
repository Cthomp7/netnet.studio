/* global Widget, JSZip, WIDGETS, utils, NNE, NNW */
class TutorialMaker2 extends Widget {
  constructor (opts) {
    super(opts)
    this.key = 'tutorial-maker-2'
    this.title = 'Tutorial Maker 2'
    this._innerHTML = '<div></div>'
    this.hidden = true

    this.loadPopout()
    this.addMessageListener()
  }

  async loadPopout () {
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
        if (!WIDGETS.loaded.includes('hyper-video-player')) {
          WIDGETS.load('hyper-video-player', () => {
            const player = WIDGETS.create({
              type: 'HyperVideoPlayer',
              key: 'recorded-video-player',
              video: data.blobUrl,
              mimeType: data.mimeType
            })
            player.title = 'Recorded Video'
            player.open()

            player.on('close', () => {
              URL.revokeObjectURL(data.blobUrl)
              const idx = WIDGETS.instantiated.indexOf('recorded-video-player')
              if (idx > -1) WIDGETS.instantiated.splice(idx, 1)
              delete WIDGETS['recorded-video-player']
            })
          })
        } else {
          const player = WIDGETS.create({
            type: 'HyperVideoPlayer',
            key: 'recorded-video-player',
            video: data.blobUrl,
            mimeType: data.mimeType
          })
          player.title = 'Recorded Video'
          player.open()

          player.on('close', () => {
            URL.revokeObjectURL(data.blobUrl)
            const idx = WIDGETS.instantiated.indexOf('recorded-video-player')
            if (idx > -1) WIDGETS.instantiated.splice(idx, 1)
            delete WIDGETS['recorded-video-player']
          })
        }
      }
    })
  }
}

window.TutorialMaker2 = TutorialMaker2
