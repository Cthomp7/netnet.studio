/* global Widget, JSZip, WIDGETS, utils, NNE, NNW */
class TutorialMaker2 extends Widget {
  constructor (opts) {
    super(opts)
    this.key = 'tutorial-maker-2'
    this.title = 'Tutorial Maker 2'
    this._innerHTML = '<div></div>'

    this._createHTML()
    this.addMessageListener()
  }

  async _loadPopout () {
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

  _createHTML () {
    this.innerHTML = `
      <div class="tut-mkr-com">
        <p class="tut-mkr-com-msg">
        Welcome to the <span>Tutorial Maker</span>! Here you can make interactive tutorials using all sorts of useful tools. Click open to get started!
        </p>
        <br/>
        <div class="tut-mkr-com-btns">
          <button class="pill-btn pill-btn--secondary open-btn">open</button>
          <button class="pill-btn pill-btn--secondary close-btn">close</button>
        </div>
      </div>
    `

    this.$('.open-btn').addEventListener('click', () => this._loadPopout())
    this.$('.close-btn').addEventListener('click', () => this.close())
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
