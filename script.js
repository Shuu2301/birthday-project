// ---------- CONFIG ----------
const SLIDES = [
  'Image/photo1.jpg','Image/photo2.jpg','Image/photo3.jpg',
  'Image/photo4.jpg','Image/photo5.jpg','Image/photo6.jpg',
  'Image/photo7.jpg','Image/photo8.jpg','Image/photo9.jpg',
  'Image/photo10.jpg','Image/photo11.jpg','Image/photo12.jpg'
];
// optional low-res / LQIP counterparts (same length as SLIDES or empty array)
const LOW_RES_SLIDES = [
  // 'Image/lqip/photo1-small.jpg', ...
];

const LINES = [
  "Trước khi gặp em, cuộc sống của anh vẫn cứ thế trôi qua.",
  "Ngày qua ngày, chẳng có gì đặc biệt.",
  "Nhưng từ khi có em, mọi thứ dường như đổi khác.",
  "Mỗi buổi sáng thức dậy đều có thêm một lý do để mỉm cười.",
  "Những việc nhỏ nhặt nhất cũng trở nên ý nghĩa hơn.",
  "Đi dạo trên con đường quen, bỗng thấy nó đẹp hơn vì có em.",
  "Hay những quán ăn cũ, nay lại thành kỷ niệm mới của hai đứa.",
  "Kể cả những ngày mệt mỏi, chỉ cần nghĩ đến em là lại thấy nhẹ nhõm.",
  "Em làm cho những ngày bình thường của anh trở nên thật đáng nhớ.",
  "Em khiến anh học cách trân trọng từng khoảnh khắc nhỏ bé.",
  "Cảm ơn em đã bước vào cuộc sống vốn đơn điệu này của anh.",
  "Và biến nó thành một hành trình đầy niềm vui và yêu thương 💖",
];

// Timing & feature toggles
const SLIDE_DURATION = 3000;
const TEXT_SHOW_DELAY = 400;
const AFTER_SLIDES_DELAY = 400;
const FADE_DURATION = 400;
const VIDEO_SRC = 'video.mp4';
const VIDEO_AUTOPLAY = true;
const FINAL_TITLE = "Happy Birthday, Em Bé Bảo Hân! 🎂";
const FINAL_MESSAGE = [
  "Mừng tuổi mới của em – mong từng ngày của em đều rực rỡ, an yên và đầy điều kỳ diệu.",
  " Dù có chuyện gì xảy ra, anh vẫn luôn ở phía sau, là điểm tựa, là người yêu thương em nhất. ",
  "Anh yêu em hơn cả những gì anh có thể nói 💖"
];

// Performance / preload options
const PRELOAD_COUNT = 4; // how many images to preload before starting (0 = all)
const USE_LQIP = LOW_RES_SLIDES && LOW_RES_SLIDES.length === SLIDES.length; // automatically enable if LQIP array provided
const ENABLE_CONFETTI = true; // toggle confetti when reveal shows
const CONFETTI_DURATION = 6000; // ms

// ---------- ELEMENTS ----------
const landing = document.getElementById('landing');
const openBtn = document.getElementById('openBtn');
const gift = document.getElementById('gift');
const celebrate = document.getElementById('celebrate');
const slideshow = document.getElementById('slideshow');
const slides = slideshow.querySelectorAll('.slide');
const greetingLines = document.getElementById('greetingLines');
const revealCard = document.getElementById('revealCard');
const finalTitle = document.getElementById('finalTitle');
const finalMessage = document.getElementById('finalMessage');
const replayBtn = document.getElementById('replayBtn');
const birthdayVideo = document.getElementById('birthdayVideo');
const confettiCanvas = document.getElementById('confettiCanvas');

let sequenceAbort = false;
let heartsInterval = null;

// small in-memory cache for decoded Image objects
const imageCache = new Map();

// ---------- HELPERS ----------
function sleep(ms){return new Promise(res=>setTimeout(res,ms));}

// Inject a tiny CSS snippet to ensure slides are promoted to composite layers
(function injectPerformanceCSS(){
  const css = `
  .slideshow .slide{
    will-change: opacity, transform, background-image;
    backface-visibility: hidden;
    transform: translateZ(0);
  }
  `;
  const style = document.createElement('style');
  style.setAttribute('data-injected','perf');
  style.textContent = css;
  document.head.appendChild(style);
})();

// ---------- PRELOAD & DECODE ----------
/**
 * Preload and decode a list of URLs. resolves when finished for preloadCount items.
 * @param {string[]} urls
 * @param {number} preloadCount - how many first images to preload (0 => all)
 * @param {function} onProgress optional(progress, total)
 */
async function preloadImages(urls, preloadCount = PRELOAD_COUNT, onProgress = null){
  const total = (preloadCount <= 0) ? urls.length : Math.min(preloadCount, urls.length);
  for(let i=0;i<total;i++){
    const url = urls[i];
    if(!url) { if(onProgress) onProgress(i+1, total); continue; }
    if(imageCache.has(url)){
      if(onProgress) onProgress(i+1,total);
      continue;
    }
    try{
      const img = new Image();
      img.src = url;
      // start fetching, wait for decode if supported
      if(img.decode){
        await img.decode();
      } else {
        // fallback to load event
        await new Promise((res,reject)=>{ img.onload=res; img.onerror=res; });
      }
      imageCache.set(url,img);
      if(onProgress) onProgress(i+1,total);
    }catch(err){
      console.warn('Preload failed for',url,err);
      // still store a bare Image to avoid repeated attempts
      const img = new Image(); img.src = url; imageCache.set(url,img);
      if(onProgress) onProgress(i+1,total);
    }
  }
}

// If LQIP mode: preload low-res first (fast), then decode hi-res in background
async function preloadLQIPFirst(){
  if(!USE_LQIP) return;
  try{
    // preload low-res first (do not decode necessarily)
    for(let i=0;i<Math.min(PRELOAD_COUNT || SLIDES.length, LOW_RES_SLIDES.length); i++){
      const lq = LOW_RES_SLIDES[i];
      if(!lq) continue;
      if(!imageCache.has(lq)){
        const img = new Image(); img.src = lq; imageCache.set(lq,img);
      }
    }
    // then decode hi-res in background for the first PRELOAD_COUNT images
    await preloadImages(SLIDES, PRELOAD_COUNT);
  }catch(e){ console.warn('LQIP preload error', e); }
}

// ---------- SLIDES ----------
async function showSlideWithText(i){
  if(i<0 || i>=SLIDES.length) return;
  const current = slides[i % 2];
  const next = slides[(i + 1) % 2];

  const hiUrl = SLIDES[i];
  const lqUrl = (USE_LQIP && LOW_RES_SLIDES[i]) ? LOW_RES_SLIDES[i] : null;

  // If LQIP: set low-res immediately (if available), then swap to hi-res after decode
  if(lqUrl){
    next.style.backgroundImage = `url("${lqUrl}")`;
  }

  // Attempt to use cached decoded hi-res image or decode it now
  if(!imageCache.has(hiUrl)){
    try{
      const img = new Image(); img.src = hiUrl;
      if(img.decode){ await img.decode(); }
      else { await new Promise(res=>{ img.onload=res; img.onerror=res; }); }
      imageCache.set(hiUrl, img);
    }catch(e){
      console.warn('Decode failed for', hiUrl, e);
      const img = new Image(); img.src = hiUrl; imageCache.set(hiUrl, img);
    }
  }

  // Now set hi-res background (this should hit cache and be fast)
  const cached = imageCache.get(hiUrl);
  if(cached && cached.src){
    next.style.backgroundImage = `url("${cached.src}")`;
  } else {
    next.style.backgroundImage = `url("${hiUrl}")`;
  }

  // Force layout flush to avoid jank
  void next.offsetWidth;

  next.classList.add('show');
  current.classList.remove('show');

  // text logic
  greetingLines.innerHTML = '';
  const line = document.createElement('div');
  line.className = 'line';
  line.textContent = LINES[i] || '';
  if(Math.random() < 0.3){ const s = document.createElement('span'); s.className = 'sparkle'; s.textContent = '✨'; line.appendChild(s); }
  greetingLines.appendChild(line);
  await sleep(TEXT_SHOW_DELAY);
  line.classList.add('show');

  await sleep(Math.max(0, SLIDE_DURATION - TEXT_SHOW_DELAY));
  line.classList.remove('show');
  await sleep(300);
}

async function playSlides(){
  sequenceAbort = false;
  greetingLines.style.display = 'block';
  for(let i=0;i<SLIDES.length;i++){
    if(sequenceAbort) break;
    await showSlideWithText(i);
  }
}

// ---------- VIDEO ----------
function playFullScreenVideo(src, autoplay=true){
  return new Promise(resolve=>{
    if(!birthdayVideo){resolve();return;}
    if(birthdayVideo.getAttribute('src')!==src) birthdayVideo.src=src;
    birthdayVideo.classList.remove('hidden'); birthdayVideo.style.display='block';
    birthdayVideo.setAttribute('playsinline',''); birthdayVideo.pause();
    if(autoplay){ const p=birthdayVideo.play(); if(p && p.catch) p.catch(()=>{}); }
    function onEnd(){ birthdayVideo.removeEventListener('ended',onEnd); birthdayVideo.classList.add('hidden'); birthdayVideo.style.display='none'; resolve(); }
    birthdayVideo.addEventListener('ended',onEnd);
  });
}

// ---------- HEARTS ----------
function createHeart(){
  const heart=document.createElement('div'); heart.className='heart-float'; heart.textContent='💖';
  heart.style.left=Math.random()*90+'vw';
  heart.style.fontSize=(Math.random()*20+16)+'px';
  heart.style.animationDuration=(Math.random()*2+2)+'s';
  document.body.appendChild(heart);
  setTimeout(()=>heart.remove(),3000);
}
function startHearts(){if(heartsInterval)return;heartsInterval=setInterval(createHeart,300);} 
function stopHearts(){if(heartsInterval){clearInterval(heartsInterval);heartsInterval=null;}document.querySelectorAll('.heart-float').forEach(h=>h.remove());}

// ---------- CONFETTI (simple, no lib) ----------
let confettiCtx=null, confettiParticles=[], confettiAnim=null;
function initConfetti(){
  if(!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth * devicePixelRatio;
  confettiCanvas.height = window.innerHeight * devicePixelRatio;
  confettiCanvas.style.width = window.innerWidth + 'px';
  confettiCanvas.style.height = window.innerHeight + 'px';
  confettiCtx = confettiCanvas.getContext('2d');
  confettiCtx.scale(devicePixelRatio, devicePixelRatio);
}

function spawnConfetti(count=80){
  if(!confettiCtx) initConfetti();
  const W = window.innerWidth, H = window.innerHeight;
  confettiParticles = [];
  for(let i=0;i<count;i++){
    confettiParticles.push({
      x: Math.random()*W, y: -20 - Math.random()*H*0.2,
      vx: (Math.random()-0.5)*2, vy: Math.random()*3+2,
      size: Math.random()*8+6, rot: Math.random()*360, vr: (Math.random()-0.5)*10,
      color: `hsl(${Math.random()*60+300},70%,60%)`, // pinky palette
      ttl: Math.random()*CONFETTI_DURATION
    });
  }
  if(confettiAnim) cancelAnimationFrame(confettiAnim);
  const start = performance.now();
  function frame(t){
    const dt = t - start;
    confettiCtx.clearRect(0,0,window.innerWidth, window.innerHeight);
    for(const p of confettiParticles){
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.rot += p.vr*0.1;
      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.rot * Math.PI/180);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
      confettiCtx.restore();
    }
    confettiAnim = requestAnimationFrame(frame);
  }
  confettiAnim = requestAnimationFrame(frame);
}

function stopConfetti(){ if(confettiAnim) cancelAnimationFrame(confettiAnim); if(confettiCtx) confettiCtx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height); confettiParticles=[]; confettiAnim=null; }

// adjust canvas on resize
window.addEventListener('resize', ()=>{ if(confettiCanvas) initConfetti(); });

// ---------- REVEAL ----------
function showReveal(){
  startHearts();
  if(finalTitle) finalTitle.textContent = FINAL_TITLE;
  if(finalMessage) finalMessage.textContent = FINAL_MESSAGE;
  if(revealCard){ revealCard.classList.remove('hidden'); setTimeout(()=>revealCard.classList.add('show'),30); }
  if(ENABLE_CONFETTI) {
    initConfetti();
    spawnConfetti(120);
    setTimeout(()=>{ stopConfetti(); }, CONFETTI_DURATION);
  }
}

// ---------- CELEBRATE ----------
async function startCelebrateWithImmediateFade(){
  // preload LQIP low-res & hi-res for first N
  try{
    if(USE_LQIP){ await preloadLQIPFirst(); }
    await preloadImages(SLIDES, PRELOAD_COUNT, (done,total)=>{ console.log(`preload ${done}/${total}`); });
  }catch(e){ console.warn('Preload error',e); }

  gift.classList.add('open');
  if(landing) landing.classList.add('landing-fade-out');
  if(gift) gift.classList.add('fade-away');

  await sleep(FADE_DURATION);

  if(landing){ landing.classList.add('hidden'); landing.classList.remove('landing-fade-out'); gift.classList.remove('fade-away'); }
  celebrate.classList.remove('hidden');

  slideshow.classList.add('slideshow-fade-in');
  void slideshow.offsetWidth; slideshow.classList.add('show');

  await sleep(300);
  await playSlides();
  if(sequenceAbort) return;
  await sleep(AFTER_SLIDES_DELAY);
  if(sequenceAbort) return;

  if(VIDEO_SRC && VIDEO_SRC.trim()!=='' && birthdayVideo){
    await playFullScreenVideo(VIDEO_SRC, VIDEO_AUTOPLAY);
  }
  if(sequenceAbort) return;
  showReveal();
}

// ---------- BUTTONS ----------
openBtn.addEventListener('click', ()=>{ openBtn.disabled=true; startCelebrateWithImmediateFade(); });
replayBtn.addEventListener('click', async ()=>{
  stopHearts(); stopConfetti();
  if(revealCard) revealCard.classList.remove('show');
  setTimeout(()=>{ if(revealCard) revealCard.classList.add('hidden'); }, 420);
  sequenceAbort = true; await sleep(260); sequenceAbort = false;
  // clear greeting & reset slideshow DOM state
  greetingLines.innerHTML = '';
  slides.forEach(s=>{ s.classList.remove('show'); s.style.backgroundImage = ''; });
  startCelebrateWithImmediateFade();
});

window.addEventListener('beforeunload', ()=>{ sequenceAbort = true; stopHearts(); stopConfetti(); });

// Optional: auto-preload all after first view (warm cache)
window.addEventListener('load', ()=>{
  // fire-and-forget: preload remaining in background (non-blocking)
  setTimeout(()=>{ preloadImages(SLIDES, 0).catch(()=>{}); if(USE_LQIP) preloadImages(LOW_RES_SLIDES, 0).catch(()=>{}); }, 3000);
});

// Export for debugging if needed
window.__CARD_SCRIPT = { preloadImages, preloadLQIPFirst, showSlideWithText, playSlides };
