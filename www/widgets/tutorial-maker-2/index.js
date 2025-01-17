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
  }

  addMessageListener () {
    window.addEventListener('message', event => {
      const { data, type } = event.data
      if (type === 'TM_METADATA_DOWNLOAD') {
        this.downloadZip(data)
      } else if (type === 'TM_METADATA_UPLOAD') {
        this.extractZip(data)
      }
    })
  }

  downloadZip (data) {
    try {
      const zip = new JSZip()
      zip.file('metadata.json', JSON.stringify(data, null, 2))

      zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(content)
        link.download = 'metadata.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
    } catch (error) {
      console.error('Error parsing JSON:', error)
    }
  }
}

window.TutorialMaker2 = TutorialMaker2
