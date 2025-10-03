// ---------- CONFIG ----------
const SLIDES = [
    'Image/photo1.jpg','Image/photo2.jpg','Image/photo3.jpg',
    'Image/photo4.jpg','Image/photo5.jpg','Image/photo6.jpg',
    'Image/photo7.jpg','Image/photo8.jpg','Image/photo9.jpg',
    'Image/photo10.jpg','Image/photo11.jpg','Image/photo12.jpg'
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

  const SLIDE_DURATION = 3000;
  const TEXT_SHOW_DELAY = 400; 
  const AFTER_SLIDES_DELAY = 400; 
  const FADE_DURATION = 400; 
  const VIDEO_SRC = 'video.mp4';
  const VIDEO_AUTOPLAY = true;
  const FINAL_TITLE = "Happy Birthday, Em Bé Bảo Hân! 🎂";
  const FINAL_MESSAGE = "Chúc em bé tuổi mới luôn xinh, luôn vui vẻ và mọi điều tốt đẹp sẽ đến. Dù có chuyện gì xảy ra thì vẫn luôn có anh ở sau ủng hộ em. Anh yêu em bé của anh nhiềuuu 💖";
  // ---------- END CONFIG ----------
  
  /* elements */
  const landing=document.getElementById('landing');
  const openBtn=document.getElementById('openBtn');
  const gift=document.getElementById('gift');
  const celebrate=document.getElementById('celebrate');
  const slideshow=document.getElementById('slideshow');
  const slides=slideshow.querySelectorAll('.slide');
  const greetingLines=document.getElementById('greetingLines');
  const revealCard=document.getElementById('revealCard');
  const finalTitle=document.getElementById('finalTitle');
  const finalMessage=document.getElementById('finalMessage');
  const replayBtn=document.getElementById('replayBtn');
  const birthdayVideo=document.getElementById('birthdayVideo');
  
  let sequenceAbort=false;
  let heartsInterval=null;
  
  // sleep helper
  function sleep(ms){return new Promise(res=>setTimeout(res,ms));}
  
  // ---------- SLIDES ----------
  async function showSlideWithText(i){
    if(i<0 || i>=SLIDES.length) return;
    const current=slides[i%2];
    const next=slides[(i+1)%2];
    next.style.backgroundImage=`url("${SLIDES[i]}")`;
    next.classList.add('show');
    current.classList.remove('show');
  
    greetingLines.innerHTML='';
    const line=document.createElement('div');
    line.className='line';
    line.textContent=LINES[i]||'';
    if(Math.random()<0.3){ const s=document.createElement('span'); s.className='sparkle'; s.textContent='✨'; line.appendChild(s);}
    greetingLines.appendChild(line);
    await sleep(TEXT_SHOW_DELAY);
    line.classList.add('show');
  
    await sleep(Math.max(0,SLIDE_DURATION-TEXT_SHOW_DELAY));
    line.classList.remove('show');
    await sleep(300);
  }
  
  async function playSlides(){
    sequenceAbort=false;
    greetingLines.style.display='block';
    for(let i=0;i<SLIDES.length;i++){
      if(sequenceAbort) break;
      await showSlideWithText(i);
    }
  }
  
  // ---------- VIDEO ----------
  function playFullScreenVideo(src,autoplay=true){
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
  
  // ---------- REVEAL ----------
  function showReveal(){
    startHearts();
    if(finalTitle) finalTitle.textContent=FINAL_TITLE;
    if(finalMessage) finalMessage.textContent=FINAL_MESSAGE;
    if(revealCard){ revealCard.classList.remove('hidden'); setTimeout(()=>revealCard.classList.add('show'),30);}
  }
  
  // ---------- CELEBRATE ----------
  async function startCelebrateWithImmediateFade(){
    gift.classList.add('open');
    if(landing) landing.classList.add('landing-fade-out');
    if(gift) gift.classList.add('fade-away');
  
    await sleep(FADE_DURATION);
  
    if(landing){landing.classList.add('hidden'); landing.classList.remove('landing-fade-out'); gift.classList.remove('fade-away');}
    celebrate.classList.remove('hidden');
  
    slideshow.classList.add('slideshow-fade-in');
    void slideshow.offsetWidth; slideshow.classList.add('show');
  
    await sleep(300);
    await playSlides();
    if(sequenceAbort) return;
    await sleep(AFTER_SLIDES_DELAY);
    if(sequenceAbort) return;
  
    if(VIDEO_SRC && VIDEO_SRC.trim()!=='' && birthdayVideo){
      await playFullScreenVideo(VIDEO_SRC,VIDEO_AUTOPLAY);
    }
    if(sequenceAbort) return;
    showReveal();
  }
  
  // ---------- BUTTONS ----------
  openBtn.addEventListener('click',()=>{ openBtn.disabled=true; startCelebrateWithImmediateFade(); });
  replayBtn.addEventListener('click',async()=>{
    stopHearts();
    if(revealCard) revealCard.classList.remove('show');
    setTimeout(()=>{ if(revealCard) revealCard.classList.add('hidden'); },420);
    sequenceAbort=true; await sleep(260); sequenceAbort=false;
    startCelebrateWithImmediateFade();
  });
  window.addEventListener('beforeunload',()=>{ sequenceAbort=true; stopHearts(); });
  