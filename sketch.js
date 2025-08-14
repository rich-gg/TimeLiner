// === p5.js sketch: full set of video controls ===
let playing = false;
let fingers;                                           // p5.MediaElement (<video>)
let button;

/* sliders + labels ---------------------------------------------------------------- */
let speedSlider, speedLabel;
let zoomSlider,  zoomLabel;
let pxSlider,    pxLabel;
let rSlider, gSlider, bSlider, rLabel, gLabel, bLabel;
let graySlider, invertSlider, sepiaSlider, blurSlider;
let grayLabel,  invertLabel,  sepiaLabel,  blurLabel;

/* effect state -------------------------------------------------------------------- */
let zoom  = 1;                                         // 1 → 10
let px    = 1;                                         // 1 → 20  (pixel size)
let rFac  = 1, gFac = 1, bFac = 1;                     // 1 → 0
let vidW = 0, vidH = 0;                                // natural video size
let ready = false;                                     // true after metadata loads

/* off-screen buffer for pixelation ------------------------------------------------- */
let pg;                                                // p5.Graphics
let lastPx = 1;

/* canvas reference (needed for CSS filters) --------------------------------------- */
let cnv;                                               // p5.Renderer

function setup() {
  /* canvas ------------------------------------------------------------------------ */
  cnv = createCanvas(windowWidth, windowHeight);
  noSmooth();                                          // keep blocky pixels when up-scaled

  /* video ------------------------------------------------------------------------- */
  fingers = createVideo(['assets/fingers.mov', 'assets/fingers.webm']);
  fingers.elt.addEventListener('loadedmetadata', () => {
    vidW  = fingers.elt.videoWidth;
    vidH  = fingers.elt.videoHeight;
    fingers.hide();                                    // hide DOM element after it’s ready
    ready = true;
  });

  /* floating UI container --------------------------------------------------------- */
  const ui = createDiv();
  ui.style('position', 'absolute');
  ui.style('top', '10px');
  ui.style('left', '10px');
  ui.style('color', 'white');
  ui.style('font-size', '16px');

  /* — play / pause — */
  button = createButton('play').parent(ui);
  button.mousePressed(toggleVid);
  
  createElement('br').parent(ui);
  createElement('br').parent(ui);

  /* — speed slider — */
  createSpan('  speed: ').parent(ui);
  speedSlider = createSlider(0.1, 2, 1, 0.1).parent(ui);
  speedSlider.input(updateSpeed);
  speedLabel = createSpan('1.0×').parent(ui);

  createElement('br').parent(ui);

  /* — zoom slider — */
  createSpan('  zoom: ').parent(ui);
  zoomSlider = createSlider(1, 10, 1, 0.1).parent(ui);
  zoomSlider.input(updateZoom);
  zoomLabel = createSpan('1.0×').parent(ui);

  createElement('br').parent(ui);

  /* — pixelate slider — */
  createSpan('  pixelate: ').parent(ui);
  pxSlider = createSlider(1, 80, 1, 1).parent(ui);
  pxSlider.input(updatePixelate);
  pxLabel = createSpan('1').parent(ui);

  createElement('br').parent(ui);
  createElement('br').parent(ui);

  /* — RGB kill sliders — */
  createSpan('  R: ').parent(ui);
  rSlider = createSlider(0, 100, 100, 1).parent(ui);
  rSlider.input(updateRGB);
  rLabel  = createSpan('100 %').parent(ui);

  createElement('br').parent(ui);

  createSpan('  G: ').parent(ui);
  gSlider = createSlider(0, 100, 100, 1).parent(ui);
  gSlider.input(updateRGB);
  gLabel  = createSpan('100 %').parent(ui);

  createElement('br').parent(ui);
 

  createSpan('  B: ').parent(ui);
  bSlider = createSlider(0, 100, 100, 1).parent(ui);
  bSlider.input(updateRGB);
  bLabel  = createSpan('100 %').parent(ui);

  createElement('br').parent(ui);
  createElement('br').parent(ui);

  /* — grayscale / invert / sepia / blur sliders — */
  createSpan('  grayscale: ').parent(ui);
  graySlider = createSlider(0, 100, 0, 1).parent(ui);
  graySlider.input(updateFilters);
  grayLabel = createSpan('0 %').parent(ui);

  createElement('br').parent(ui);
 

  createSpan('  invert: ').parent(ui);
  invertSlider = createSlider(0, 100, 0, 1).parent(ui);
  invertSlider.input(updateFilters);
  invertLabel = createSpan('0 %').parent(ui);

  createElement('br').parent(ui);
 

  createSpan('  sepia: ').parent(ui);
  sepiaSlider = createSlider(0, 100, 0, 1).parent(ui);
  sepiaSlider.input(updateFilters);
  sepiaLabel = createSpan('0 %').parent(ui);

  createElement('br').parent(ui);

  createSpan('  blur: ').parent(ui);
  blurSlider = createSlider(0, 100, 0, 0.5).parent(ui);          // 0 px → 10 px
  blurSlider.input(updateFilters);
  blurLabel = createSpan('0 px').parent(ui);

  /* apply initial CSS filter (all zeros) */
  updateFilters();
}

function draw() {
  background(0);
  if (!ready) return;

  /* rebuild pixel-buffer if needed ---------------------------------------------- */
  if (px !== lastPx) {
    if (pg) pg.remove();
    const smallW = max(1, floor(vidW / px));
    const smallH = max(1, floor(vidH / px));
    pg = createGraphics(smallW, smallH);
    pg.noSmooth();
    lastPx = px;
  }

  /* draw current frame ---------------------------------------------------------- */
  if (px === 1) {
    drawFrame(fingers);                    // full-resolution
  } else {
    pg.image(fingers, 0, 0, pg.width, pg.height);
    drawFrame(pg);                         // up-scaled low-res buffer
  }
}

function drawFrame(src) {
  const w = vidW * zoom;
  const h = vidH * zoom;
  const x = (width  - w) / 2;
  const y = (height - h) / 2;

  push();
  tint(255 * rFac, 255 * gFac, 255 * bFac);      // RGB kill factors
  image(src, x, y, w, h);
  pop();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

/* ---------- UI callbacks -------------------------------------------------------- */
function toggleVid() {
  if (playing) { fingers.pause(); button.html('play'); }
  else          { fingers.loop();  button.html('pause'); }
  playing = !playing;
}

function updateSpeed() {
  const r = speedSlider.value();
  fingers.speed(r);
  speedLabel.html(r.toFixed(1) + '×');
}

function updateZoom() {
  zoom = zoomSlider.value();
  zoomLabel.html(zoom.toFixed(1) + '×');
}

function updatePixelate() {
  px = pxSlider.value();
  pxLabel.html(px);
}

function updateRGB() {
  rFac = rSlider.value() / 100;
  gFac = gSlider.value() / 100;
  bFac = bSlider.value() / 100;
  rLabel.html(rSlider.value() + ' %');
  gLabel.html(gSlider.value() + ' %');
  bLabel.html(bSlider.value() + ' %');
}

/* ---------- CSS filter sliders -------------------------------------------------- */
function updateFilters() {
  const g  = graySlider.value();            grayLabel.html(g  + ' %');
  const inv = invertSlider.value();         invertLabel.html(inv + ' %');
  const sep = sepiaSlider.value();          sepiaLabel.html(sep + ' %');
  const bl  = blurSlider.value();           blurLabel.html(bl  + ' px');

  /* apply CSS filter chain to the canvas element */
  cnv.canvas.style.filter =
    `grayscale(${g}%) invert(${inv}%) sepia(${sep}%) blur(${bl}px)`;
}
