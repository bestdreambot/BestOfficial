// 05.08.2026 — фичи Best (проекты + участники) поверх новой сцены (порт 1000→2000, см. заголовочный
// комментарий в freexofficial.html и ai/GROK.md § «пара ласковых»). Один новый файл вместо
// torus.js+word-fx.js+app.js — тот же движок тора/слова, что и в canon freexofficial.html, но:
//   1) цвет тора берётся из ЛЮБОЙ палитры WORLDS (см. data-worlds.js), не только gold — сэмплинг
//      обобщён (см. sampleFrom ниже), а не жёстко зашит silver→gold, как в canon;
//   2) один переход на все смены (мягкий dissolve + facet-ignite-каскад, тот же почерк, что
//      понравился Создателю на слове/торе в canon) вместо старых пяти разных ring-режимов
//      (portal/wipe/burst/spiral) — сознательное упрощение: пять бесплатных «характеров» перехода
//      стоили большой отдельной системы ради разнообразия ради разнообразия, а не ради качества;
//      material-consistency (один и тот же «дорогой» переход везде) как раз то, что Grok хвалил в
//      каноне. Если Создатель заскучает по разным переходам — это отдельный, осознанный следующий
//      шаг, не сейчас.
(function(){
  // 06.08.2026 — Telegram Mini App, портировано с живого прода перед деплоем (origin Release
  // 1.7/1.8: tg.expand()/тактильный отклик/openLink для TikTok/safe-area). Порт 2000 до этого не
  // умел открываться как Mini App вообще — нашли при подготовке к деплою, чинили до, не после,
  // чтобы не унести регресс на живой сайт. За пределами Telegram window.Telegram не существует,
  // поэтому здесь ничего не ломается (tg остаётся null, tgHaptic() — no-op).
  var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  if (tg) {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor('#000000');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
    // iOS иногда схлопывает Mini App обратно — просим развернуть снова при каждом изменении вьюпорта.
    tg.onEvent('viewportChanged', function(){ tg.expand(); });
  }
  function tgHaptic(){ if(tg && tg.HapticFeedback){ tg.HapticFeedback.impactOccurred('light'); } }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('tor');
  var ctx = canvas.getContext('2d');
  var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function seeded(i){ var x = Math.sin(i*12.9898)*43758.5453; return x - Math.floor(x); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function smoothstep(x){ x=Math.min(1,Math.max(0,x)); return x*x*(3-2*x); }
  function easeInOutCubic(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2; }
  function lerpPalette(p1, p2, t){
    var out = [];
    for(var i=0;i<p1.length;i++){ var a=p1[i], b=p2[i]; out.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]); }
    return out;
  }
  // Сэмпл цвета из ЛЮБОЙ палитры (6-стоповые WORLDS или что угодно другой длины) по позиции
  // u ∈ [0,1] — тот же приём, что уже используют частицы в каноне, обобщённый на любые массивы.
  function sampleFrom(pal, u, whiteBoost){
    var idx = Math.max(0,Math.min(1,u)) * (pal.length-1);
    var i0 = Math.floor(idx), i1 = Math.min(pal.length-1, i0+1), fp = idx-i0;
    var a = pal[i0], b = pal[i1];
    var r = a[0]+(b[0]-a[0])*fp, g = a[1]+(b[1]-a[1])*fp, bl = a[2]+(b[2]-a[2])*fp;
    if(whiteBoost > 0){ r += (255-r)*whiteBoost; g += (255-g)*whiteBoost; bl += (255-bl)*whiteBoost; }
    return [Math.round(r), Math.round(g), Math.round(bl)];
  }
  // 06.08.2026, Создатель: «потуши чуть все остальные торы... только Best и Aleorix яркие, все
  // остальные тусклые» — реальный факт из переписки «Руководство проекта Best»: сейчас представлены
  // только эти два, остальные ждут своей очереди (проект PROJECTS[i].bright, см. data-projects.js).
  // Тушим не через прозрачность (стало бы просто бледнее), а тянем каждый стоп к серому — теряет
  // насыщенность и яркость, остаётся угадываемым, но явно «не в фокусе».
  function dimPalette(pal){
    return pal.map(function(c){
      var gray = (c[0]+c[1]+c[2])/3;
      return [
        Math.round(c[0]*0.42 + gray*0.16),
        Math.round(c[1]*0.42 + gray*0.16),
        Math.round(c[2]*0.42 + gray*0.16)
      ];
    });
  }
  // «Нити» и «искры» раньше были отдельными, вручную подобранными по 5-6 цветов на серебро/золото
  // (нечего было бы подбирать для ~40 миров вручную) — теперь берутся прямо из текущей палитры:
  // нити — несколько равномерно расставленных стопов, искры — самые светлые.
  function threadsFromPal(pal){
    var idxs = [0, 0.22, 0.45, 0.68, 0.9];
    return idxs.map(function(u){ var c = sampleFrom(pal, u, 0); return 'rgb('+c[0]+','+c[1]+','+c[2]+')'; });
  }

  function resize(){
    w = canvas.parentElement.clientWidth; h = canvas.parentElement.clientHeight;
    canvas.width = w*dpr; canvas.height = h*dpr;
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize); resize();

  var N = reduced ? 240 : 900, particles = [], pi;
  for(pi=0;pi<N;pi++){
    var band = (seeded(pi*5+1)+seeded(pi*5+2)+seeded(pi*5+3)+seeded(pi*5+4))/4;
    var isSpark = seeded(pi*5+41) > 0.96;
    particles.push({
      angle0: seeded(pi*5+11)*Math.PI*2, radiusU: band,
      speed: 0.0000039+seeded(pi*5+13)*0.0000030, size: seeded(pi*5+17)>0.92?(1.7+seeded(pi*5+19)*1.6):(0.65+seeded(pi*5+19)*1.0),
      twPhase: seeded(pi*5+23)*Math.PI*2, twSpeed: 0.000186+seeded(pi*5+29)*0.000343, colorBias: seeded(pi*5+31),
      isSpark: isSpark
    });
  }
  var LOAD_T = null, lastT = 0;

  var IGNITE_STAGGER = 1900, IGNITE_RAMP = 750;
  // Баг 06.08.2026 (Создатель: «нажимаю Best 1 раз, ничего не происходит, нажимаю второй — Aleorix,
  // а должен быть крутой эффект») — тор стартовал уже золотым (WORLDS.best), так что первый клик
  // (переход BestOfficial → Best) transFrom===transTo, менять нечего, портал-переход шёл вхолостую.
  // Сверился с историей origin (git show 3374029:js/torus.js): там по умолчанию серебро (WORLDS.
  // freex, Release 1.1: «мир по умолчанию стал серебряным... клик по слову превращает его в Best и
  // только тогда тор становится золотым»). Возвращаем этот же принцип — первый клик теперь реально
  // красит тор в золото, с портал-эффектом, как задумано.
  var transFrom = WORLDS.freex, transTo = WORLDS.freex, transStart = -1e9, transDurationMs = 1400;
  var curPalette = WORLDS.freex;
  var lastToggleT = null;
  // 05.08.2026, «смотри внимательно на github.com/bestdreambot/BestOfficial, логику ты уже близко» —
  // сверился с настоящим app.js/torus.js оттуда: у каждого шага цепочки свой почерк ПЕРЕХОДА ТОРА
  // (portal/dissolve/wipe/burst/spiral, PROJECTS[].ring/ringMs в data-projects.js), который я в
  // первом заходе Фазы 2 сплющил в один dissolve. Возвращено — та же логика выбора палитры по углу/
  // радиусу, что в настоящем torus.js, только применённая и к нашим гранями (не только к пыли), и с
  // сохранённым ignite-стаггером именно для dissolve (это наш плюс сверх оригинала, не замена).
  var transMode = 'dissolve';
  function enterWorld(pal, durationMs, mode){
    transFrom = curPalette; transTo = pal;
    transMode = mode || 'dissolve';
    transDurationMs = durationMs || 1400;
    transStart = reduced ? (lastT - transDurationMs - 1) : lastT;
    lastToggleT = reduced ? null : performance.now();
    if(reduced){ curPalette = pal; draw(lastT); }
  }

  function draw(t){
    lastT = t;
    if(LOAD_T===null) LOAD_T=t;
    var transP = Math.min(1, (t - transStart) / transDurationMs);
    var easedP = easeInOutCubic(transP);
    curPalette = transP >= 1 ? transTo : lerpPalette(transFrom, transTo, easedP);
    var THREADS_NOW = threadsFromPal(curPalette);

    // Пять почерков перехода (как в настоящем torus.js) — выбор палитры по углу/радиусу точки,
    // не единый глобальный лерп. pickPal() переиспользуется и гранями, и частицами ниже.
    var portalActive = transMode==='portal' && transP<1;
    var frontAngle = transP*Math.PI*2, FRONT_WIDTH=0.65;
    var globalDim = portalActive ? 1 - 0.13*Math.sin(transP*Math.PI) : 1;
    var wipeActive = transMode==='wipe' && transP<1;
    var wipeFrontAngle = easedP*Math.PI*2, WIPE_FEATHER=1.3;
    var burstActive = transMode==='burst' && transP<1;
    var burstBell = burstActive ? Math.sin(transP*Math.PI) : 0;
    var spiralActive = transMode==='spiral' && transP<1;
    var spiralFrontAngle = easedP*Math.PI*2, SPIRAL_FEATHER=1.1, SPIRAL_TWIST=1.4;
    function pickPal(ang, radiusU){
      if(portalActive){
        var a2=((ang+Math.PI/2)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
        return a2<=frontAngle ? transTo : transFrom;
      }
      if(wipeActive){
        var a2w=((ang+Math.PI/2)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
        var localPw=Math.max(0,Math.min(1,(wipeFrontAngle-a2w)/WIPE_FEATHER+1));
        return localPw>=1?transTo:(localPw<=0?transFrom:lerpPalette(transFrom,transTo,localPw));
      }
      if(burstActive){ return transP<0.5?transFrom:transTo; }
      if(spiralActive){
        var a2s=((ang+Math.PI/2)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
        var twisted=a2s+(radiusU-0.5)*SPIRAL_TWIST;
        var localPs=Math.max(0,Math.min(1,(spiralFrontAngle-twisted)/SPIRAL_FEATHER+1));
        return localPs>=1?transTo:(localPs<=0?transFrom:lerpPalette(transFrom,transTo,localPs));
      }
      return curPalette; // dissolve (facets add their own ignite-stagger on top, see below)
    }
    var clickGlow=0;
    if(lastToggleT!==null){
      var sinceT=(performance.now()-lastToggleT)/1400;
      if(sinceT>=0 && sinceT<=1) clickGlow=Math.sin(sinceT*Math.PI)*0.35;
    }
    ctx.clearRect(0,0,w,h);
    var cx=w/2, cy=h/2, minDim=Math.min(w,h);
    var outerR=minDim*0.42, innerR=outerR*0.84, bandHalf=(outerR-innerR)/2, ringR=innerR+bandHalf;
    ringR *= 1+0.035*Math.cos(((t-1200)/12000)*Math.PI*2);
    var revealMul = reduced?1:(1-Math.pow(1-Math.min(1,(t-LOAD_T)/1400),3));
    var spread=bandHalf*3.35;

    var ninePhase=(t%13000)/13000;
    var waveStrength=Math.pow(Math.max(0,1-ninePhase),4);
    if(waveStrength>.002){
      var wc = sampleFrom(curPalette, 0.15, 0.3);
      ctx.save();ctx.translate(cx,cy);ctx.scale(1,.985);ctx.globalCompositeOperation='lighter';
      var waveR=ringR-spread*.72+ninePhase*spread*1.44;
      var waveGradient=ctx.createLinearGradient(-waveR,0,waveR,0);
      waveGradient.addColorStop(0,'rgba('+wc[0]+','+wc[1]+','+wc[2]+',0)');
      waveGradient.addColorStop(.32,'rgba('+wc[0]+','+wc[1]+','+wc[2]+','+(waveStrength*.42).toFixed(3)+')');
      waveGradient.addColorStop(.55,'rgba(255,240,220,'+(waveStrength*.5).toFixed(3)+')');
      waveGradient.addColorStop(1,'rgba('+wc[0]+','+wc[1]+','+wc[2]+',0)');
      ctx.beginPath();ctx.arc(0,0,waveR,0,Math.PI*2);ctx.strokeStyle=waveGradient;
      ctx.lineWidth=1.2+waveStrength*3.2;ctx.shadowColor='#ffe8c2';ctx.shadowBlur=8+waveStrength*18;ctx.stroke();ctx.restore();
    }

    ctx.save(); ctx.translate(cx,cy); ctx.scale(1,.985); ctx.rotate(t*.0000043);
    var facetInner=ringR-spread*.82, facetOuter=ringR+spread*.82;
    var layers=4, segments=64;
    for(var layer=0;layer<layers;layer++){
      var fr0=facetInner+(facetOuter-facetInner)*layer/layers;
      var fr1=facetInner+(facetOuter-facetInner)*(layer+1)/layers;
      var offset=(layer%2)*Math.PI/segments;
      for(var s=0;s<segments;s++){
        var fa0=s*Math.PI*2/segments+offset, fa1=(s+1)*Math.PI*2/segments+offset;
        var mid=(fa0+fa1)*.5;
        var whiteReturn=Math.pow(Math.max(0,Math.cos(mid-t*.000157-layer*.31)),18);
        var fire=Math.pow(Math.max(0,Math.cos(mid+t*.000221+layer*1.47)),34);
        var blink=Math.max(0,Math.sin(t*.00157+s*1.91+layer*2.7)); blink*=blink*blink;
        // dissolve: каждая грань зажигается в свой чуть сдвинутый момент внутри окна перехода (наш
        // «ignite» приём поверх оригинала). portal/wipe/burst/spiral: те же формулы выбора палитры
        // по углу/радиусу, что и в настоящем torus.js (через pickPal), без стаггера — у них уже
        // есть свой характер (фронт/спираль/импульс).
        var fPal;
        if(transMode==='dissolve' && lastToggleT!==null){
          var fDelay=seeded(s*13+layer*29+7)*IGNITE_STAGGER;
          var fProg=smoothstep(((performance.now()-lastToggleT)-fDelay)/IGNITE_RAMP);
          fPal = lerpPalette(transFrom, transTo, fProg);
        } else {
          fPal = pickPal(mid, layer/Math.max(1,layers-1));
        }
        var contrast=((s+layer*3)%9===0 || (s+layer)%17===0);
        var fu = (seeded(s*13+layer*29+7)*0.4 + (mid/(Math.PI*2))*0.6);
        ctx.beginPath();
        ctx.moveTo(Math.cos(fa0)*fr0,Math.sin(fa0)*fr0);
        ctx.lineTo(Math.cos(fa1)*fr0,Math.sin(fa1)*fr0);
        ctx.lineTo(Math.cos(fa1)*fr1,Math.sin(fa1)*fr1);
        ctx.lineTo(Math.cos(fa0)*fr1,Math.sin(fa0)*fr1); ctx.closePath();
        if(contrast){
          ctx.fillStyle='rgba(8,16,32,'+(0.025+blink*.035).toFixed(3)+')';
        } else if(fire>.45){
          var fc = sampleFrom(fPal, fu, 0.5+0.4*fire);
          ctx.fillStyle='rgba('+fc[0]+','+fc[1]+','+fc[2]+','+((.04+.36*fire+.16*blink)*revealMul).toFixed(3)+')';
        } else {
          var wc2 = sampleFrom(fPal, fu, whiteReturn*0.6);
          ctx.fillStyle='rgba('+wc2[0]+','+wc2[1]+','+wc2[2]+','+((.035+.31*whiteReturn+.13*blink)*revealMul).toFixed(3)+')';
        }
        ctx.fill();
        var ec = sampleFrom(fPal, 0.05, 0.7);
        ctx.strokeStyle='rgba('+ec[0]+','+ec[1]+','+ec[2]+','+((.075+.2*whiteReturn)*revealMul).toFixed(3)+')';
        ctx.lineWidth=.65; ctx.stroke();
        ctx.beginPath();
        if((s+layer)%2===0){ ctx.moveTo(Math.cos(fa0)*fr0,Math.sin(fa0)*fr0); ctx.lineTo(Math.cos(fa1)*fr1,Math.sin(fa1)*fr1); }
        else { ctx.moveTo(Math.cos(fa1)*fr0,Math.sin(fa1)*fr0); ctx.lineTo(Math.cos(fa0)*fr1,Math.sin(fa0)*fr1); }
        var ec2 = sampleFrom(fPal, 0.02, 0.75);
        ctx.strokeStyle='rgba('+ec2[0]+','+ec2[1]+','+ec2[2]+','+((.055+.17*whiteReturn+.08*blink)*revealMul).toFixed(3)+')';
        ctx.lineWidth=.5; ctx.stroke();
      }
    }
    ctx.globalCompositeOperation='lighter';
    for(var beam=0;beam<3;beam++){
      var ba=t*.000136+beam*2.31;
      var grad=ctx.createLinearGradient(Math.cos(ba)*facetInner,Math.sin(ba)*facetInner,Math.cos(ba)*facetOuter,Math.sin(ba)*facetOuter);
      grad.addColorStop(0,'rgba(255,255,255,0)'); grad.addColorStop(.5,'rgba(255,255,255,.72)'); grad.addColorStop(1,'rgba(255,220,180,0)');
      ctx.beginPath(); ctx.strokeStyle=grad; ctx.lineWidth=1.2;
      ctx.moveTo(Math.cos(ba)*facetInner,Math.sin(ba)*facetInner);
      ctx.lineTo(Math.cos(ba)*facetOuter,Math.sin(ba)*facetOuter); ctx.stroke();
    }
    ctx.restore(); ctx.globalCompositeOperation='source-over';

    ctx.save();
    ctx.translate(cx,cy); ctx.scale(1,.985); ctx.rotate(t*0.0000129);
    ctx.globalCompositeOperation='lighter';
    THREADS_NOW.forEach(function(color,j){
      var pulse=.5+.5*Math.sin(t*.000393+j*1.37);
      var baseR=ringR+(j-2)*spread*.19;
      ctx.beginPath();
      for(var k=0;k<=150;k++){
        var a=k/150*Math.PI*2;
        var wave=Math.sin(a*(2+j%3)+t*.000229+j*1.7)*spread*.075;
        var rr=baseR+wave;
        var px=Math.cos(a)*rr, py=Math.sin(a)*rr;
        if(k===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath(); ctx.strokeStyle=color;
      ctx.globalAlpha=(.22+.18*pulse)*revealMul;
      ctx.lineWidth=Math.max(1,minDim*(.0014+.0005*pulse));
      ctx.shadowColor=color; ctx.shadowBlur=5+4*pulse; ctx.stroke();

      var travel=(t*.000025+j/THREADS_NOW.length)%1;
      var ta=travel*Math.PI*2;
      var tr=baseR+Math.sin(ta*(2+j%3)+t*.000229+j*1.7)*spread*.075;
      ctx.beginPath(); ctx.fillStyle=color; ctx.globalAlpha=(.7+.25*pulse)*revealMul;
      ctx.arc(Math.cos(ta)*tr,Math.sin(ta)*tr,1.5+1.1*pulse,0,Math.PI*2); ctx.fill();
    });
    ctx.shadowBlur=0; ctx.restore(); ctx.globalAlpha=1; ctx.globalCompositeOperation='lighter';
    particles.forEach(function(p){
      var r=ringR+(p.radiusU-0.5)*2*spread; if(r<innerR*0.15) return;
      if(burstActive){ r *= (1 + 0.3*burstBell); } // импульс: пыль расходится и возвращается на пике
      var ang=p.angle0+t*p.speed*(ringR/Math.max(r,ringR*0.3));
      var pal = pickPal(ang, p.radiusU);
      var alphaMul = 1;
      if(portalActive){
        var a2=((ang+Math.PI/2)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
        var trough=Math.max(0,1-Math.abs(a2-frontAngle)/FRONT_WIDTH);
        alphaMul = globalDim * (1 - 0.85*trough);
      }
      var x=cx+Math.cos(ang)*r, y=cy+Math.sin(ang)*r*0.985;
      var tw=0.5+0.5*Math.max(0,Math.sin(t*p.twSpeed+p.twPhase));
      var closeness=1-Math.min(1,Math.abs(r-ringR)/spread);
      var depthF=(Math.sin(ang)+1)/2;
      var u=(p.colorBias*0.4+(1-closeness)*0.6);
      var c = sampleFrom(pal, u, p.isSpark ? 0.55 : 0);
      var r0=c[0], g0=c[1], b0=c[2];
      var alpha=Math.min(1,(0.16+0.66*closeness)*(0.48+0.42*tw))*(0.76+0.3*depthF)*alphaMul*revealMul;
      if(p.isSpark) alpha*=0.9+0.4*tw;
      if(clickGlow>0){
        alpha=Math.min(1,alpha+clickGlow*0.35);
        r0=Math.round(r0+(255-r0)*clickGlow*0.4); g0=Math.round(g0+(238-g0)*clickGlow*0.4); b0=Math.round(b0+(196-b0)*clickGlow*0.4);
      }
      ctx.fillStyle='rgba('+r0+','+g0+','+b0+','+alpha.toFixed(3)+')';
      var ps=p.size*(0.85+0.3*depthF)*(p.isSpark?1.15:1);
      ctx.beginPath();
      if(p.isSpark || p.size>1.85){
        var rot=p.twPhase+t*0.0000286;
        var ca=Math.cos(rot), sa=Math.sin(rot), lng=ps*1.8, sht=ps*.62;
        ctx.moveTo(x+ca*lng,y+sa*lng);
        ctx.lineTo(x-sa*sht,y+ca*sht);
        ctx.lineTo(x-ca*lng,y-sa*lng);
        ctx.lineTo(x+sa*sht,y-ca*sht);
        ctx.closePath();
      } else ctx.arc(x,y,ps,0,Math.PI*2);
      ctx.fill();
    });
    ctx.globalCompositeOperation='source-over';
  }
  // mktor (LEFT/RIGHT) рисуются в том же rAF, что главный тор, но отдельным вызовом (drawNav, ниже
  // в файле, определяется после того как navLeftCanvas/mktorLeftPal объявлены) — сам draw(t) выше
  // не трогаем (Grok: «главный draw-loop не ломать»). Сам запуск rAF-цикла — в самом конце файла,
  // после того как mktor и вся логика приложения уже объявлены (см. "Запуск" в конце файла).

  // ---------- Слово: тот же dual-layer dissolve, что в каноне ----------
  var wordEl = document.querySelector('.word');
  var foBase = document.getElementById('foBase'), foOver = document.getElementById('foOver');
  var FO_FILTER = 'contrast(1.18) saturate(.24) drop-shadow(-1px -1px 0.5px rgba(255,255,255,.5)) drop-shadow(2px 3px 0 rgba(0,0,0,.5)) drop-shadow(3px 6px 5px rgba(0,0,0,.4)) drop-shadow(0 0 10px rgba(200,220,255,.12))';
  var wordBusy = false, WORD_DUR = 1400;
  function setWord(text, ariaLabel){
    if(wordBusy){ return; }
    wordEl.setAttribute('aria-label', ariaLabel || text);
    if(reduced){ foBase.textContent = text; return; }
    wordBusy = true;
    var prevText = foBase.textContent;
    var oldW = wordEl.getBoundingClientRect().width;
    foBase.textContent = text;
    var newW = wordEl.getBoundingClientRect().width;
    foBase.textContent = prevText;
    foOver.textContent = text;
    foOver.style.opacity = '0';
    var start = null;
    function tick(ts){
      if(start===null) start = ts;
      var el = ts - start;
      var p = smoothstep(el/WORD_DUR);
      wordEl.style.width = (oldW + (newW-oldW)*p) + 'px';
      foBase.style.opacity = String(1-p);
      foOver.style.opacity = String(p);
      var blurAmt = Math.sin(Math.min(1,p)*Math.PI) * 2.2;
      var f = blurAmt>0.03 ? (FO_FILTER+' blur('+blurAmt.toFixed(2)+'px)') : FO_FILTER;
      foBase.style.filter = f; foOver.style.filter = f;
      if(el < WORD_DUR) requestAnimationFrame(tick);
      else {
        foBase.textContent = text;
        foBase.style.opacity = '1'; foBase.style.filter = '';
        foOver.style.opacity = '0'; foOver.style.filter = '';
        wordEl.style.width = '';
        wordBusy = false;
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- Приложение: проекты / участники / карточка / TikTok / фото в дыре Ктора ----------
  // История mktor (для будущих правок, не терять): статичный downscale граней («ужасный статик-
  // Ктор») → CSS-самоцвет-кружок (Grok, план B) → Создатель отклонил кружок, попросил обратно
  // настоящие младшие торы → drawMktor() ниже (canvas-кольцо, живой, label внутри, см. «повторный
  // аудит 2000 · mktor вернуть» в ai/GROK.md). Лицо участника — в дыре ГЛАВНОГО Ктора (как в
  // старом FO), не в mktor.
  var tiktokEl = document.getElementById('tiktokLink');
  if (tg) {
    // Внутри Telegram (особенно iOS) обычный target="_blank" иногда просто съедается — Mini App
    // API просит открывать внешние ссылки через свой openLink (портировано с прода).
    tiktokEl.addEventListener('click', function(e){
      e.preventDefault();
      tg.openLink(tiktokEl.href);
    });
  }
  var navLeft = document.getElementById('navLeft'), navRight = document.getElementById('navRight');
  var navLeftCanvas = navLeft.querySelector('.nav-canvas'), navRightCanvas = navRight.querySelector('.nav-canvas');
  // Lunora (06.08.2026, Создатель: «лунору новый круг сверху слева, сделай мк тор») — третий mktor,
  // не часть линейной цепочки слева/справа, прямой вход в Lunora из любого места.
  var navLunora = document.getElementById('navLunora'), navLunoraCanvas = navLunora.querySelector('.nav-canvas');
  var stageEl = document.getElementById('stage'), holePhotoEl = document.getElementById('holePhoto');
  var cardEl = document.getElementById('card');
  var cardNameEl = document.getElementById('cardName'), cardRolesEl = document.getElementById('cardRoles'), cardFactsEl = document.getElementById('cardFacts');
  var cardPhotoEl = document.getElementById('cardPhoto');
  function showHolePhoto(p){
    holePhotoEl.src = PARTICIPANT_PHOTOS[p.photo] || '';
    holePhotoEl.classList.toggle('leader', !!p.leader);
    holePhotoEl.classList.add('show');
    stageEl.classList.add('photo-mode');
  }
  function hideHolePhoto(){
    holePhotoEl.classList.remove('show');
    stageEl.classList.remove('photo-mode');
  }

  // ---------- mktor: младшие торы LEFT/RIGHT (05.08.2026, повторный аудит Grok — «mktor вернуть»,
  // то же по духу, что FOM2 в BestOfficial.git, материалом порта 1000). Отдельная функция, главный
  // draw-loop выше не трогает и не вызывает её саму — рисуется отдельно, ниже, в общем rAF. LEFT
  // красится в mktorLeftPal (текущий мир/звезда, обновляется в activateProject/enterParticipant/
  // toggleParticipantsMode/goHome), RIGHT — всегда WORLDS.best. ----------
  // По умолчанию тоже серебро (freex), не золото — та же правка, что у главного тора выше; LEFT
  // сам не виден до первого клика (см. .nav-btn.show), но значение должно быть честным на всякий.
  var mktorLeftPal = WORLDS.freex;
  function setMktorLeft(pal){ mktorLeftPal = pal; drawMktor(navLeftCanvas, pal, 0); }
  var mktorLunoraPal = WORLDS.lunora;
  function setMktorLunora(pal){ mktorLunoraPal = pal; drawMktor(navLunoraCanvas, pal, 0); }
  // 05.08.2026 — Создатель: «мини космический тор статический у тебя состоит из 2 слоёв, внутренний
  // и наружный, сделай mktor статичным и оставь только наружный слой». Убрал внутренний facet-слой
  // (было mLayers=2, теперь один — только внешняя полоса), и mktor больше не рисуется каждый кадр
  // (см. вызовы ниже — теперь только при смене mktorLeftPal/при загрузке, не в rAF-цикле). Параметр
  // t остаётся (нужен для формулы whiteReturn — «откуда падает свет»), но приходит фиксированным,
  // не текущим временем — снимок, не движение.
  function drawMktor(canvasEl, pal, t){
    if(!canvasEl || !pal) return;
    var size = Math.round((canvasEl.clientWidth || 96) * dpr);
    if(canvasEl.width !== size){ canvasEl.width = size; canvasEl.height = size; }
    var mctx = canvasEl.getContext('2d');
    var cw = canvasEl.width, ch = canvasEl.height, cx=cw/2, cy=ch/2;
    mctx.clearRect(0,0,cw,ch);
    var outerR=cw*0.47, innerR=outerR*0.52, bandHalf=(outerR-innerR)/2, ringR=innerR+bandHalf;
    var spread=bandHalf*2.6;
    mctx.save(); mctx.translate(cx,cy);
    var facetInner=ringR-spread*.75, facetOuter=ringR+spread*.75;
    // Только наружный слой (та половина полосы, что была раньше layer=1) — внутренний убран.
    var fr0=facetInner+(facetOuter-facetInner)*0.5, fr1=facetOuter;
    var mSegments=28, offset=Math.PI/mSegments;
    for(var s=0;s<mSegments;s++){
      var fa0=s*Math.PI*2/mSegments+offset, fa1=(s+1)*Math.PI*2/mSegments+offset;
      var mid=(fa0+fa1)*.5;
      var whiteReturn=Math.pow(Math.max(0,Math.cos(mid-t*.000157-.31)),18);
      var u=(seeded(s*13+36)*0.4+(mid/(Math.PI*2))*0.6);
      var c=sampleFrom(pal,u,whiteReturn*0.5);
      mctx.beginPath();
      mctx.moveTo(Math.cos(fa0)*fr0,Math.sin(fa0)*fr0*0.985);
      mctx.lineTo(Math.cos(fa1)*fr0,Math.sin(fa1)*fr0*0.985);
      mctx.lineTo(Math.cos(fa1)*fr1,Math.sin(fa1)*fr1*0.985);
      mctx.lineTo(Math.cos(fa0)*fr1,Math.sin(fa0)*fr1*0.985); mctx.closePath();
      mctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.30+0.5*whiteReturn).toFixed(3)+')';
      mctx.fill();
      mctx.strokeStyle='rgba(255,255,255,'+(0.10+0.22*whiteReturn).toFixed(3)+')';
      mctx.lineWidth=.6; mctx.stroke();
    }
    mctx.restore();
    // Немного пыли для жизни (застывший узор, не 900 частиц главного и не движение).
    mctx.save(); mctx.translate(cx,cy);
    for(var i=0;i<16;i++){
      var a=seeded(i*11+3)*Math.PI*2;
      var r=ringR+(seeded(i*11+7)-0.5)*spread*1.7;
      var dc=sampleFrom(pal, seeded(i*11+9), 0.25);
      var tw=0.5+0.5*seeded(i*11+17); // застывшая «мерцалка» — фиксированный узор, не анимация
      mctx.beginPath();
      mctx.fillStyle='rgba('+dc[0]+','+dc[1]+','+dc[2]+','+(0.35+0.35*tw).toFixed(3)+')';
      mctx.arc(Math.cos(a)*r, Math.sin(a)*r*0.985, 0.9+seeded(i*11+13)*1.1, 0, Math.PI*2);
      mctx.fill();
    }
    mctx.restore();
  }

  function setTiktok(linkInfo){
    if(linkInfo){
      tiktokEl.href = linkInfo.url; tiktokEl.textContent = linkInfo.label || 'TikTok';
      tiktokEl.setAttribute('aria-label', linkInfo.aria || linkInfo.url);
      tiktokEl.classList.add('show');
    } else {
      tiktokEl.classList.remove('show');
    }
  }

  var wordState = 0; // индекс следующего непоказанного проекта (0 = ещё на первом экране/Best)
  var participantsMode = false, participantIdx = 0;
  var lunoraMode = false, lunoraIdx = 0;

  // Lunora-режим (06.08.2026, Создатель: «я хочу нажать на лунора в ктор и получить ноира и
  // заруум») — тот же приём, что у звёзд: клик по mktor входит в маленькую цепочку, клик по
  // главному слову листает её (Lunora → Noira → Zaryum → снова Lunora), каждый шаг — полноценный
  // цвет и слово ГЛАВНОГО Ктора, не мелкий текст сбоку (это уже пробовали, Создатель отклонил).
  function showLunoraStep(idx){
    lunoraIdx = idx;
    var step = LUNORA_CHAIN[idx];
    setWord(step.word, step.aria);
    var pal = dimPalette(WORLDS[step.world]); // Lunora/Noira/Zaryum пока не bright — см. dimPalette выше
    enterWorld(pal, step.ringMs, step.ring);
    setTiktok(step.link || null);
    setMktorLunora(pal);
    // 06.08.2026, Создатель: «звёзды только на бест» — LEFT показывает «Звёзды» и ведёт в звёзд
    // ТОЛЬКО когда мы на самом Best, как у любого обычного проекта. Внутри Lunora-цепочки LEFT
    // ведёт себя как у Voice/Jelly/любого другого проекта — показывает карточку ТЕКУЩЕГО шага
    // (Lunora/Noira/Zaryum), см. handleNavLeft ниже.
    navLeft.querySelector('.nav-label').textContent = step.word;
    navLeft.setAttribute('aria-label', 'Карточка ' + step.word);
    // Баг 06.08.2026 (Создатель: «ноира тор синий, мктор золотой, а должен быть тоже синий») —
    // подпись на LEFT обновлялась, а сам цвет канваса — нет (оставался от прошлого проекта/звезды).
    // Как и у обычных проектов — mktor LEFT красится в цвет ТЕКУЩЕГО состояния.
    setMktorLeft(pal);
  }
  function enterLunora(){
    closeCard();
    if(participantsMode){ participantsMode = false; navLeft.classList.remove('active'); }
    lunoraMode = true;
    navLunora.classList.add('active');
    showLunoraStep(0);
  }

  function activateProject(i){
    var proj = PROJECTS[i];
    wordState = i + 1;
    // 06.08.2026: Lunora больше не бывает в PROJECTS вообще (убрана из цепочки Best), так что
    // proj.word==='Lunora' здесь больше не встречается — но lunoraMode на всякий случай гасим
    // всегда, если вдруг сюда попали не через enterLunora() (например, клик по обычному слову).
    lunoraMode = false; navLunora.classList.remove('active');
    setWord(proj.word, proj.aria);
    // 06.08.2026: только проекты с bright:true (сейчас — Best и Aleorix, реальный факт из
    // переписки) идут полной палитрой, остальные — через dimPalette() (см. выше). Не трогает
    // сами данные WORLDS — только то, что реально уходит на экран для этого конкретного проекта.
    var pal = proj.bright ? WORLDS[proj.world] : dimPalette(WORLDS[proj.world]);
    enterWorld(pal, proj.ringMs, proj.ring);
    var linkInfo = proj.link ? proj.link : proj.tiktok ? { url:'https://www.tiktok.com/@'+proj.tiktok, label:'TikTok', aria:proj.word+' в TikTok — @'+proj.tiktok } : null;
    setTiktok(linkInfo);
    navLeft.querySelector('.nav-label').textContent = proj.word === 'Best' ? 'Звёзды' : proj.word;
    navLeft.setAttribute('aria-label', proj.word === 'Best' ? 'Звёзды — участники Best' : 'Карточка проекта ' + proj.word);
    setMktorLeft(pal);
    hideHolePhoto();
    // 06.08.2026, Создатель: «не хочу видеть mktor на главной странице BestOfficial». Сверился с
    // живым app.js: там кнопки FOM2 не появляются по таймеру от загрузки страницы вообще — они
    // прячутся, пока не кликнешь по слову ни разу (activateProject срабатывает только из
    // onWordActivate). Первый экран (до первого клика) — только Ктор + слово, без mktor, как и
    // просит Создатель. RIGHT показывается сразу, LEFT — с той же задержкой 500мс, что в оригинале.
    navRight.classList.add('show');
    // 06.08.2026, Создатель: «когда я нахожусь в Anibrox и других проектов я не вижу Lunora, вход
    // в Lunora только с Best тора» — mktor Lunora виден только на самом Best, на любом другом
    // проекте (Anibrox, Jelly, ...) прячется. Пока внутри Lunora-режима (клик уже случился, кнопка
    // была видна на Best) — эта ветка вообще не выполняется, showLunoraStep() её не трогает.
    setTimeout(function(){
      navLeft.classList.add('show');
      if(proj.word === 'Best'){ navLunora.classList.add('show'); } else { navLunora.classList.remove('show'); }
    }, reduced ? 0 : 500);
  }
  function enterParticipant(idx){
    var p = PARTICIPANT_CHAIN[idx];
    // 06.08.2026: имя больше НЕ показывается видимым словом под фото — на эталоне это убрано
    // Создателем 01.08.2026 («имя под фото убери, оно уже есть в FOM2»), у нас дублировалось с
    // подписью в mktor. Слово просто прячется (CSS .stage.photo-mode .word{opacity:0}), aria-label
    // остаётся для скринридеров.
    wordEl.setAttribute('aria-label', p.aria);
    enterWorld(WORLDS[p.world], p.ringMs, p.ring);
    showHolePhoto(p);
    // 07.08.2026: адрес не у всех подтверждён (Олеся — «если не уверен, не пишите», как и у
    // проектов) — раньше тут строился TikTok-URL из p.handle без проверки, при null получилось бы
    // "@null" рабочей на вид ссылкой. Теперь ссылка не показывается вовсе, если handle пуст.
    setTiktok(p.handle ? { url:'https://www.tiktok.com/@'+p.handle, label:'TikTok', aria:p.word+' в TikTok — @'+p.handle } : null);
    navLeft.querySelector('.nav-label').textContent = p.word;
    navLeft.setAttribute('aria-label', 'Карточка ' + p.word);
    setMktorLeft(WORLDS[p.world]);
  }
  function toggleParticipantsMode(){
    tgHaptic();
    participantsMode = !participantsMode;
    navLeft.classList.toggle('active', participantsMode);
    if(participantsMode){
      // 06.08.2026, Создатель: «у звёзд нет Луноры, когда мы смотрим звёзд Луноры нет. Лунора
      // только в Best торе» — прячем mktor Lunora на время звёзд (снова появится через
      // activateProject(0) в ветке else ниже, когда выходим обратно на Best/проекты).
      navLunora.classList.remove('show');
      participantIdx = 0;
      enterParticipant(0);
    } else {
      // Баг 06.08.2026 (Создатель: «нажимаю бест, нажимаю бест — нужно два раза, хочу один») —
      // тут стояло `wordState = 0`, а 0 означает «ещё вообще ничего не листали» (следующий клик по
      // слову снова покажет Best — тот же Best, значит без видимого эффекта, вхолостую). Правильно
      // (сверился с origin app.js: goHome там зовёт activateProject(0), которая ставит wordState=1,
      // никогда не 0 после первого запуска) — раз мы уже показываем Best, значит его слот уже
      // «пройден», следующий клик должен сразу вести к Aleorix. activateProject(0) делает это же
      // + ставит wordState=1 сама, заодно не дублирует остальную логику ниже.
      activateProject(0);
    }
  }
  function goHome(){
    closeCard();
    if(participantsMode){ toggleParticipantsMode(); return; }
    var wasLunora = lunoraMode;
    if(lunoraMode){ lunoraMode = false; navLunora.classList.remove('active'); }
    tgHaptic();
    if(wordState !== 1 || wasLunora){
      participantsMode = false;
      activateProject(0);
    }
  }
  function onWordActivate(){
    tgHaptic();
    // Lunora (06.08.2026): клик по главному слову листает Lunora → Noira → Zaryum → снова Lunora,
    // не задевая обычную цепочку проектов/звёзд.
    if(lunoraMode){
      showLunoraStep((lunoraIdx + 1) % LUNORA_CHAIN.length);
      return;
    }
    if(participantsMode){
      participantIdx = (participantIdx + 1) % PARTICIPANT_CHAIN.length;
      enterParticipant(participantIdx);
      return;
    }
    if(wordState >= PROJECTS.length) return;
    activateProject(wordState);
  }
  wordEl.addEventListener('click', onWordActivate);
  wordEl.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); onWordActivate(); } });
  // 06.08.2026: слово теперь прячется (pointer-events:none) на время фото-режима — эталон вешает
  // тот же клик-листалку и на фото (js/app.js: photoEl.addEventListener('click', onWordActivate)),
  // иначе нечем будет листать звёзды, пока видно фото.
  holePhotoEl.addEventListener('click', onWordActivate);

  function renderPills(el, labels){ el.innerHTML = labels.map(function(r){ return '<span class="card-pill">'+r+'</span>'; }).join(''); }
  // 07.08.2026: Олеся больше не «готовится» — она реальная звезда в PARTICIPANT_CHAIN с
  // leads:['Valmont'], карточка Valmont теперь находит её сама через обычный leaders-поиск ниже.
  var PROJECT_PENDING_LEADS = {};
  // 06.08.2026, Создатель: «запиши это всё в карточку Anibrox... почту не показывать, системный
  // аккаунт не показывать, что обсуждал — не показывать, пиши факты, презентацию проекта». Только
  // то, что можно показать всем — реальная история имени и кто ведёт, ничего внутреннего/приватного.
  var PROJECT_FACTS = {
    'Anibrox': ['Раньше назывался Friend — теперь Anibrox', 'Второй проект под руководством Алины, вместе с Aleorix']
  };
  function openCard(){ cardEl.classList.add('open'); cardEl.setAttribute('aria-hidden','false'); }
  function closeCard(){ cardEl.classList.remove('open'); cardEl.setAttribute('aria-hidden','true'); }
  function openStarCard(p){
    var extra = PARTICIPANTS.filter(function(x){ return x.handle === p.handle; })[0] || {};
    var photo = PARTICIPANT_PHOTOS[p.photo];
    if(photo){ cardPhotoEl.src = photo; cardPhotoEl.style.display = ''; } else { cardPhotoEl.style.display = 'none'; }
    cardNameEl.textContent = p.word;
    var roles = [p.badge || 'Звезда Best'].concat((p.leads||[]).map(function(l){ return 'Руководитель '+l; }));
    renderPills(cardRolesEl, roles);
    var facts = [];
    if(extra.nick && extra.nick !== p.word){ facts.push('В TikTok: '+extra.nick); }
    cardFactsEl.innerHTML = facts.map(function(f){ return '<p class="card-fact">✨ '+f+'</p>'; }).join('');
    openCard();
  }
  function openProjectCard(proj){
    cardPhotoEl.style.display = 'none'; // у проектов своего фото нет — «пустую голову» не открываем
    cardNameEl.textContent = proj.word;
    var leaders = proj.word === 'Best' ? ['Галя'] : PARTICIPANT_CHAIN.filter(function(p){ return p.leads && p.leads.indexOf(proj.word)!==-1; }).map(function(p){ return p.word; });
    if(!leaders.length && PROJECT_PENDING_LEADS[proj.word]){ leaders = [PROJECT_PENDING_LEADS[proj.word]]; }
    renderPills(cardRolesEl, leaders.length ? ['Руководит: '+leaders.join(', ')] : []);
    var facts = PROJECT_FACTS[proj.word] || [];
    cardFactsEl.innerHTML = facts.map(function(f){ return '<p class="card-fact">✨ '+f+'</p>'; }).join('');
    openCard();
  }
  // LEFT = «Звёзды» / контекст. Эталон app.js handleFom2Activate (репо BestOfficial):
  //   • уже в режиме звёзд → карточка ТЕКУЩЕЙ звезды
  //   • на проекте ПОСЛЕ Best (wordState >= 2) → карточка этого проекта
  //   • на главной / на Best (wordState 0 или 1) → ВОЙТИ в звёзды (Галя = PARTICIPANT_CHAIN[0])
  // Баг 06.08.2026: было `wordState >= 1` → после activateProject(0) Best wordState=1,
  // клик «Звёзды» открывал openProjectCard(Best) вместо toggleParticipantsMode → Галя.
  // Создатель: «нажимаю на звёзды и вижу карточку Best, хочу первую звезду — руководителя Галю».
  function handleNavLeft(){
    tgHaptic();
    // Lunora (06.08.2026, Создатель: «звёзды только на бест») — LEFT внутри Lunora ведёт себя как
    // у любого обычного проекта: показывает карточку ТЕКУЩЕГО шага (Lunora/Noira/Zaryum), не звёзд.
    // Режим Lunora не сбрасывается — карточка открывается поверх, как у Voice/Jelly/любого проекта.
    if(lunoraMode){
      openProjectCard(LUNORA_CHAIN[lunoraIdx]);
      return;
    }
    if(participantsMode){
      openStarCard(PARTICIPANT_CHAIN[participantIdx]);
    } else if(wordState >= 2 && wordState <= PROJECTS.length){
      openProjectCard(PROJECTS[wordState-1]);
    } else {
      // wordState 0 (ещё не листали) или 1 (стоим на Best) — вход в звёзды, первая = Галя
      toggleParticipantsMode();
    }
  }
  // RIGHT = Best-маяк. Карточка Best только когда УЖЕ на главной Best (wordState===1) и НЕ в
  // Lunora-режиме, как handleBestFom2 в app.js; wordState===0 тоже «дома» (слово с первого кадра).
  function handleNavRight(){
    if(!participantsMode && !lunoraMode && (wordState === 0 || wordState === 1)){
      tgHaptic();
      openProjectCard(PROJECTS[0]);
    } else {
      goHome();
    }
  }
  navLeft.addEventListener('click', handleNavLeft);
  navLeft.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); handleNavLeft(); } });
  navRight.addEventListener('click', handleNavRight);
  navRight.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); handleNavRight(); } });
  // Lunora mktor (06.08.2026) — прямой вход в Lunora из любого места (enterLunora() определена
  // выше, рядом с activateProject/showLunoraStep).
  function handleNavLunora(){ tgHaptic(); enterLunora(); }
  navLunora.addEventListener('click', handleNavLunora);
  navLunora.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); handleNavLunora(); } });
  cardEl.querySelector('.card-backdrop').addEventListener('click', closeCard);
  cardEl.querySelector('.card-close').addEventListener('click', closeCard);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeCard(); } });

  // 06.08.2026: убран безусловный таймер показа mktor от момента загрузки (было 2200мс всегда).
  // На главной BestOfficial (до первого клика по слову) mktor теперь не появляется вовсе — см.
  // navRight/navLeft.classList.add('show') внутри activateProject() выше, тот же принцип, что и в
  // живом app.js (кнопки FOM2 привязаны к первому клику, не к таймеру от загрузки).

  // mktor статичный (Создатель, 05.08.2026) — рисуется один раз при загрузке и заново только когда
  // meняется его палитра (см. drawMktor(navLeftCanvas, mktorLeftPal, ...) в activateProject/
  // enterParticipant/toggleParticipantsMode/goHome ниже), не в rAF-цикле главного тора.
  drawMktor(navLeftCanvas, mktorLeftPal, 0);
  drawMktor(navRightCanvas, WORLDS.best, 0);
  // Lunora mktor — статичный, тот же тусклый тон, что у самого проекта Lunora (она тоже без
  // bright:true, ждёт своей очереди, как и остальные — только вход в неё особый, напрямую).
  drawMktor(navLunoraCanvas, dimPalette(WORLDS.lunora), 0);

  // ---------- Запуск: главный тор в своём rAF-цикле (mktor в него не входит — статичный). Здесь, в
  // самом конце файла, потому что draw()/navLeftCanvas и т.д. объявлены выше в этом же файле. Сам
  // draw(t) (главный тор) не менялся ни строчкой ради mktor. ----------
  if(reduced){ draw(0); }
  else {
    var raf=null;
    function loop(t){ draw(t); raf=requestAnimationFrame(loop); }
    raf=requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
      else if(!raf) raf=requestAnimationFrame(loop);
    });
  }
})();
