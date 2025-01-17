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
        console.log('NNW.layout: ', NNW.layout)
        NNW.layout = data.layout
      }
    })
  }
}

window.TutorialMaker2 = TutorialMaker2
