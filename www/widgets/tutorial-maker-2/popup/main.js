let metadata = {
  id: '', // folder name (lowercase, no spaces)
  title: '',
  subtitle: '',
  author: { name: '', preferred: '', url: '' },
  videofile: '',
  keylogs: false,
  description: '',
  keywords: [],
  checkpoints: {}, // TODO
  references: [] // TODO
}

let metadataHTML
let toolsHTML = ''
let innerHTML
let uploader
let video = {
  currentTime: null,
  duration: null
}
let keyframes = {}
let widgets = {}
let timecodes = []
let sid = null

tempHighlight = null
tempSpotlight = null

// post a message to the browser
const postMSG = (type, payload) => {
  window.opener.postMessage({ type, payload }, window.origin)
}

// post a message to the browser that has a response
const getMSG = (type, payload) => {
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      if (event.origin !== window.origin) return
      // check that this is the response to our request
      if (event.data?.replyTo === type) {
        window.removeEventListener('message', handler)
        resolve(event.data.payload)
      }
    }
    window.addEventListener('message', handler)

    window.opener.postMessage({ type, payload }, window.origin)

    setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Timed out waiting for response'))
    }, 5000);
  })
}

function upload () {
  uploader.click()
}

function download (type) {
  const obj = type === 'metadata' ? metadata : {}
  if (type === 'data') {
    const tcs = Object.keys(keyframes).sort((a, b) => a - b)
    obj.keyframes = {}
    tcs.forEach(tc => { obj.keyframes[tc] = keyframes[tc] })
    obj.widgets = widgets
  }
  const txt = JSON.stringify(obj, null, 2)
  const a = document.createElement('a')
  const filename = type === 'metadata' ? 'metadata.json' : 'data.json'
  a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(txt))
  a.setAttribute('download', filename)
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function createKeyframe () {
  const kfData = await getMSG('tut-mkr-kf-data')
  const { code, layout, netnet, scroll, widgets } = kfData
  const idx = video.currentTime
  const scrollTo = { x: scroll.left, y: scroll.top }
  keyframes[idx] = {
    video: {...video, ...kfData.video},
    widgets,
    code,
    highlight: tempHighlight,
    spotlight: tempSpotlight,
    layout,
    netnet,
    scrollTo,
    keylog: getKeylog()
  }
  if (keyframes[idx].keylog) {
    metadata.keylogs = true
    keyframes[idx].code = null
  }
  postMSG('tut-mkr-update-hvp', { action: ['load-keyframes'], keyframes })
  updateView()
}

function removeKeyframe () {
  const idx = video.currentTime
  delete keyframes[idx]
  postMSG('tut-mkr-update-hvp', { action: ['load-keyframes'], keyframes })
  updateView(true)
}

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.••.¸¸ html content methods

function createMetadataHTML () {
  const ele = document.createElement('section')
  ele.style.display = 'flex'
  ele.style.flexDirection = 'column'
  ele.innerHTML = `
    <button class="pill-btn pill-btn--secondary" name="load-metadata" style="margin-top: 5px">load metadata.json</button>
    <h1 style="text-align: center">Tutorial Metadata</h1>
    <input class="input input--lg" type="text" name="id" placeholder="id (folder name, lowercase, no spaces)"><br>
    <input class="input input--lg" type="text" name="title" placeholder="Tutorial Title"><br>
    <input class="input input--lg" type="text" name="subtitle" placeholder="Tutorial Subtitle"><br>
    <input class="input input--lg" type="text" name="author-name" placeholder="Author's Full Name"><br>
    <input class="input input--lg" type="text" name="author-preferred" placeholder="Author's Preferred Name"><br>
    <input class="input input--lg" type="text" name="author-url" placeholder="Author's Homepage"><br>
    <input class="input input--lg" type="text" name="description" placeholder="A description of what the tutorial is about..."><br>
    <input class="input input--lg" type="text" name="videofile" placeholder="video filename (without extention)"><br>
    <input class="input input--lg" type="text" name="keywords" placeholder="comma, seperated, keywords"><br><br>
    <button class="pill-btn pill-btn--secondary" name="update-metadata" style="margin: 5px 0px">enter</button>`

  ele.querySelector('button[name="update-metadata"]')
    .addEventListener('click', () => updateMetadata())

  ele.querySelector('button[name="load-metadata"]')
    .addEventListener('click', () => upload())

  return ele
}

async function createTutorialToolsHTML () {
  const ele = document.createElement('section')
  ele.className = 'tut-maker-tool-sect'

  const res = await fetch('./pages/tools.html')
  const html = await res.text()
  ele.innerHTML = html

  // ele.querySelector('button[name="edit-keyframe"]')
  //   .addEventListener('click', (e) => {
  //     if (e.target.textContent === 'create keyframe') createKeyframe()
  //     else removeKeyframe()
  //   })

  ele.querySelector('button[name="load-data"]')
    .addEventListener('click', () => upload())

  // const time = ele.querySelector('.tut-maker-row[name="t"]')
  // time.children[1].addEventListener('click', () => goTo('time', -1))
  // time.children[2].addEventListener('change', (e) => goTo('time', e))
  // time.children[3].addEventListener('click', () => goTo('time', 1))

  // const keyframe = ele.querySelector('.tut-maker-row[name="kf"]')
  // keyframe.children[1].addEventListener('click', () => goTo('keyframe', -1))
  // keyframe.children[2].addEventListener('change', (e) => goTo('keyframe', e))
  // keyframe.children[3].addEventListener('click', () => goTo('keyframe', 1))

  ele.querySelector('button[name="edit-widgets"]')
    .addEventListener('click', () => postMSG('tut-mkr-open-wdgt-mkr'))

  ele.querySelector('button[name="n-highlight"]')
    .addEventListener('click', () => {
      postMSG('tut-mkr-highlight', {})
      tempHighlight = null
      const obj = {}
      const ins = ele.querySelectorAll('.tut-maker-row.hl > input')
      const props = ['startLine', 'startCol', 'endLine', 'endCol']
      ins.forEach((inp, i) => {
        if (inp.value !== '' && !isNaN(Number(inp.value))) {
          obj[props[i]] = Number(inp.value)
        }
      })
      const clr = ele.querySelector('input[title="highlight color"]')
      if (clr.value !== '') obj.color = clr.value
      if (obj.startLine) {
        tempHighlight = obj
        postMSG('tut-mkr-highlight', obj)
        console.log("obj: ", obj)
      }
    })
  ele.querySelector('[name="clear-highlight"]')
    .addEventListener('click', () => {
      const ins = ele.querySelectorAll('.tut-maker-row.hl > input')
      ins.forEach((inp, i) => { inp.value = '' })
      ele.querySelector('input[title="highlight color"]').value = ''
      postMSG('tut-mkr-highlight', {})
      tempHighlight = null
    })

  ele.querySelector('button[name="n-spotlight"]')
    .addEventListener('click', () => {
      postMSG('tut-mkr-spotlight', {})
      tempSpotlight = null
      const q = 'input[placeholder="line numbers (comma separated)"]'
      const v = ele.querySelector(q).value.split(',').map((v) => Number(v))
      if (!isNaN(v[0]) && v[0] !== 0) {
        tempSpotlight = v
        postMSG('tut-mkr-spotlight', v)
      }
    })
  ele.querySelector('[name="clear-spotlight"]')
    .addEventListener('click', () => {
      postMSG('tut-mkr-spotlight', {})
      tempSpotlight = null
      const q = 'input[placeholder="line numbers (comma separated)"]'
      ele.querySelector(q).value = ''
    })

  ele.querySelector('button[name="netitor-logger"]')
    .addEventListener('click', () => { uploader.click() })

  ele.querySelector('button[name="download-data"]')
    .addEventListener('click', () => {
      download('metadata')
      download('data')
    })

  return ele
}

function createFileReader () {
  uploader = document.createElement('input')
  uploader.setAttribute('type', 'file')
  uploader.setAttribute('hidden', true)
  document.body.appendChild(uploader)
  uploader.addEventListener('change', (e) => {
    const file = uploader.files[0]
    const reader = new window.FileReader()
    reader.onload = (e) => {
      if (file.name === 'metadata.json') {
        const b64 = e.target.result.split('base64,')[1]
        loadMetadata(JSON.parse(utils.atob(b64)))
      } else if (file.name === 'data.json') {
        const b64 = e.target.result.split('base64,')[1]
        loadData(JSON.parse(utils.atob(b64)))
      } else if (file.name === 'keylogs.json') {
        const b64 = e.target.result.split('base64,')[1]
        const data = JSON.parse(utils.atob(b64))
        loadKeylog(data)
        postMSG('tut-mkr-load-data-lggr', { data })
      } else {
        console.error('TutorialMaker: seems you tried to open the wrong file')
      }
    }
    reader.readAsDataURL(file)
  })
}

async function createHTML () {
  createFileReader()
  metadataHTML = createMetadataHTML()
  toolsHTML = await createTutorialToolsHTML()
  updateHTML(toolsHTML)
}

function updateHTML (html) {
  // remove previous html and update
  nn.get('body').innerHTML = ''
  nn.get('body').appendChild(html)
}

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.• data && metadata methods

function loadData (data) {
  keyframes = data.keyframes
  widgets = data.widgets
  // NNE.addCustomRoot(`tutorials/${metadata.id}/`)
  postMSG('tut-mkr-update-hvp', { action: ['load-keyframes'], keyframes })
  if (metadata.duration) {
    postMSG('tut-mkr-update-hvp', { action: ['duration'], duration: Number(metadata.duration) })
  }
  postMSG('tut-mkr-create-wdgt', { widgets })
  if (metadata.jsfile) {
    const file = `tutorials/${metadata.id}/${metadata.jsfile}`
    utils.loadFile(file, () => window.TUTORIAL.init())
  }
  updateView()
}

function loadKeylog (data) {
  const sel = $('[title="keylog recordings"]')[0]
  sel.innerHTML = '<option value="NONE">NONE</option>'
  Object.keys(data).forEach(key => {
    const opt = document.createElement('option')
    opt.value = key
    opt.textContent = key
    sel.appendChild(opt)
  })
}

function loadMetadata (data) {
  metadata = data
  postMSG('tut-mkr-add-root', { root: `tutorials/${data.id}/` })
  metadataHTML.querySelectorAll('input').forEach(e => {
    const name = (e.name.includes('author')) ? e.name.split('-') : [e.name]
    if (e.name === 'keywords') e.value = metadata.keywords.join(', ')
    else if (name.length > 1) e.value = metadata[name[0]][name[1]]
    else e.value = metadata[name[0]]
  })
}

function updateMetadata () { // when "enter" pressed
  metadataHTML.querySelectorAll('input').forEach(e => {
    const name = (e.name.includes('author')) ? e.name.split('-') : [e.name]
    if (e.name === 'keywords') metadata.keywords = e.value.split(',').map(s => s.trim())
    else if (name.length > 1) metadata[name[0]][name[1]] = e.value
    else metadata[name[0]] = e.value
  })

  // update HVP
  const { id, title, videofile } = metadata
  postMSG('tut-mkr-update-hvp-video', { id, title, videofile })
  
  updateHTML(toolsHTML)
}

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.••.¸¸¸.•*• keyframe methods

function timeUpdate (ct) {
  video.currentTime = ct
  $('input[name="seconds"]')[0].value = Math.round(ct * 100) / 100
  updateView()
}

function updateView (skipRender) {
  const kf = keyframes[video.currentTime]

  // update keframe UI
  const kfUI = $('input[name="keyframes"]')[0]
  if (kf) {
    kfUI.style.backgroundColor = 'var(--netizen-tag)'
    const ts = video.currentTime.toString()
    kfUI.value = Object.keys(keyframes).sort((a, b) => a - b).indexOf(ts)
    $('button[name="edit-keyframe"]')[0].textContent = 'remove keyframe'
  } else if (kfUI.style.backgroundColor !== 'var(--netizen-meta)') {
    kfUI.style.backgroundColor = 'var(--netizen-meta)'
    kfUI.value = ''
    $('button[name="edit-keyframe"]')[0].textContent = 'create keyframe'
  }

  // update highlight UI
  const hlUI = $('[title="start line number"]')[0]
  if (kf && kf.highlight) {
    const h = kf.highlight
    const ins = $('.tut-maker-row.hl > input')[0]
    const props = ['startLine', 'startCol', 'endLine', 'endCol']
    ins.forEach((inp, i) => {
      if (h[props[i]]) inp.value = h[props[i]]
      else inp.value = ''
    })
    if (h.color) $('[title="highlight color"]')[0].value = h.color
    else $('[title="highlight color"]')[0].value = ''
  } else if (hlUI.value !== '') {
    $('[name="clear-highlight"]')[0].click()
  }

  // update spotlight UI
  const slUI = $('[placeholder="line numbers (comma separated)"]')[0]
  if (kf && kf.spotlight) {
    slUI.value = kf.spotlight.join(',')
  } else if (slUI.value !== '') {
    $('[name="clear-spotlight"]')[0].click()
  }

  // update keylog selection
  const klUI = $('[title="keylog recordings"]')[0]
  if (kf && kf.keylog) {
    klUI.value = kf.keylog
  } else if (klUI.value !== 'NONE') {
    klUI.value = 'NONE'
  }

  // update studio
  if (!skipRender) postMSG('tut-mkr-update-hvp', { action: ['render-keyframe'] })
}

// .............. jumping around via Tutorial Maker GUI

function goTo (type, d) {
  const n = (typeof d === 'object') ? Number(d.target.value) : d
  if (type === 'time') {
    if (isNaN(n)) {
      d.target.value = video.currentTime
      updateView()
    } else if (typeof d === 'object') goToTime(n)
    else goToTime(video.currentTime + n)
  } else if (type === 'keyframe') {
    const f = (d === 1) ? findKeyframe('next')
      : (d === -1) ? findKeyframe('prev')
        : confirmKeyframe(n)
    if (f === null) {
      updateView()
    } else goToKeyframe(f)
  }
}

function goToTime (v) {
  postMSG('tut-mkr-update-hvp', { action: ['pause'] })
  if (v < video.duration && v >= 0) video.currentTime = v
  else if (v < 0) video.currentTime = 0
  else video.currentTime = video.duration - 0.01
  $('input[name="seconds"]')[0].value = video.currentTime
  postMSG('tut-mkr-update-hvp', { action: ['update-pause-clock', 'reset-keyframes-status'] })
  updateView()
}

function goToKeyframe (frame) {
  if (!frame) return
  if (frame.index === -1) return window.alert('no keyframes yet')
  postMSG('tut-mkr-update-hvp', { action: ['pause'] })
  $('input[name="keyframes"]')[0].value = frame.index
  video.currentTime = frame.time
  postMSG('tut-mkr-update-hvp', { action: ['update-pause-clock', 'reset-keyframes-status'] })
  updateView()
}

function confirmKeyframe (num) {
  const secs = Object.keys(keyframes).sort((a, b) => a - b)
  if (num >= 0 && num < secs.length) {
    return { time: secs[num], index: num }
  } else return null
}

function findKeyframe (dir) {
  if (Object.keys(keyframes).length === 0) {
    window.alert('no keyframes yet')
    return
  }
  let found = false
  let secs = Object.keys(keyframes).sort((a, b) => a - b)
  if (dir === 'prev') secs = secs.reverse()
  for (var i = 0; i < secs.length; i++) {
    const s = secs[i]
    if (dir === 'next' && s > video.currentTime) {
      found = s; break
    } else if (dir === 'prev' && s < video.currentTime) {
      found = s; break
    }
  }

  if (!found) found = secs[secs.length - 1]
  const idx = Object.keys(keyframes)
    .sort((a, b) => a - b).indexOf(found.toString())
  return { time: found, index: idx }
}

function unserializeVideo(desc) {
  if (!desc || desc.__dom__ !== 'VIDEO') return null;

  // try to find an existing <video> element by ID
  let video = desc.id ? document.getElementById(desc.id) : null;

  // if none exists, create one
  if (!video) {
    video = document.createElement('video');
    if (desc.id) video.id = desc.id;
    if (desc.src) video.src = desc.src;
    document.body.appendChild(video);
  }

  // restore state if provided
  if (typeof desc.currentTime === 'number') {
    video.currentTime = desc.currentTime;
  }
  if (typeof desc.muted === 'boolean') {
    video.muted = desc.muted;
  }
  if (typeof desc.paused === 'boolean' && desc.paused === false) {
    video.play().catch(() => {
      /* handle autoplay restrictions */
    });
  }

  return video;
}

// ................. generate data for keyframe object

function getKeylog () {
  const kl = $('[title="keylog recordings"]')[0].value
  if (kl !== 'NONE') return kl
  else return null
}

// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*
// •.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.•*•.¸¸¸.• listeners

nn.on('message', (e) => {
  if (e.origin !== window.location.origin) return
  const { type, payload } = e.data
  if (type === 'tut-mkr-update-duration') {
    metadata.duration = payload.duration
  } else if (type === 'tut-mkr-time-update') {
    timeUpdate(payload.currentTime)
  } else if (type === 'tut-mkr-update-video') {
    video = payload
  }
})

nn.on('load', () => {
  postMSG('tut-mkr-opened')
  createHTML()
})