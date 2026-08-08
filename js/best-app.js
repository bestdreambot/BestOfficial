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
  // 06.08.2026 default был золотым (WORLDS.best) → баг «жму Best — ничего не меняется, жми ещё раз».
  // Тогда вернули серебро по умолчанию (как origin, git show 3374029:js/torus.js). 08.08.2026,
  // Создатель сравнил с портом 1000 («я хочу как на 1000... на 2000 сейчас серебряно») и явно выбрал
  // золото по умолчанию, зная про возврат этого бага («сделать полностью золотым как на 1000») —
  // осознанный выбор, не забытый баг. Если «два клика на Best» снова всплывёт — это уже другое, не
  // то же самое старое диагностирование, честно предупреждён заранее.
  var transFrom = WORLDS.best, transTo = WORLDS.best, transStart = -1e9, transDurationMs = 1400;
  var curPalette = WORLDS.best;
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
  var cardStatsEl = document.getElementById('cardStats');
  var cardPhotoEl = document.getElementById('cardPhoto'), cardPhotoWrapEl = document.getElementById('cardPhotoWrap');
  var cardMiniTorusLabelEl = document.getElementById('cardMiniTorusLabel');
  // 08.08.2026, Создатель: «под тор кликабельная надпись — релиз, 3 зелёных/3 жёлтых/3 красных».
  // Отдельная маленькая карточка, не смешиваем с проектами/звёздами.
  // 08.08.2026, Андрей: «версию убери, работаем с релизом» — отдельная карточка «Версия»
  // (versionCard/VERSION_INFO) убрана целиком, два параллельных документа путали, откуда берутся
  // расхождения. Метка под тором теперь одна («Релиз»), растёт дробно (4.2 → 4.21 → 4.22…) с каждой
  // локальной правкой, вместо отдельного счётчика «Версия N» — при реальном деплое это же число
  // становится опубликованным номером релиза.
  var releaseLabelEl = document.getElementById('releaseLabel');
  var releaseCardEl = document.getElementById('releaseCard');
  var releaseCardTitleEl = document.getElementById('releaseCardTitle'), releaseCardBodyEl = document.getElementById('releaseCardBody');
  var releaseReadinessEl = document.getElementById('releaseReadiness');
  var releaseSessionSummaryEl = document.getElementById('releaseSessionSummary');
  // 08.08.2026, Создатель: «нажимаю релиз — сразу 2 карточки: слева презентация, справа рабочий
  // список» — презентация живёт в той же модалке releaseCard, вторая панель.
  var presentationBodyEl = document.getElementById('presentationBody');
  // 08.08.2026, Андрей (на примере Иры): «фото очень крупно вставил... должно быть видно голову
  // шею». Проверил — сама присланная фотография макро (только лицо, без шеи/плеч в кадре), обычный
  // cover обрезает ещё больше при вписывании в круг. photoFit — необязательное поле на любом
  // участнике (см. data-participants.js): 'contain' показывает фото целиком без обрезки (по
  // короткой стороне), вместо обрезки под квадрат/круг. По умолчанию (поле не задано) — как раньше.
  function showHolePhoto(p){
    holePhotoEl.src = PARTICIPANT_PHOTOS[p.photo] || '';
    holePhotoEl.style.objectFit = p.photoFit || '';
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
  // 08.08.2026: по умолчанию золото (WORLDS.best), та же правка, что у главного тора выше — LEFT
  // сам не виден до первого клика (см. .nav-btn.show), но значение должно быть честным на всякий.
  var mktorLeftPal = WORLDS.best;
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
    // 08.08.2026, Создатель: «релиз видна только на главной странице BestOfficial, при переходе
    // должна просто исчезать — чтобы вернуться, нужно перезагрузить страницу». activateProject —
    // общие ворота для ЛЮБОГО перехода (клик по слову, goHome, участники, Lunora идёт через Best),
    // поэтому одно место гасит кнопку навсегда до следующей полной перезагрузки страницы.
    releaseLabelEl.style.display = 'none';
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
  // 08.08.2026, Андрей: «меняю логику — стрелка назад возвращает на шаг назад, а не на предыдущий
  // medium-тор» — не движение по фиксированному порядку библиотеки, а настоящий стек «откуда
  // пришли» (как кнопка «назад» в браузере). cardHistory копит карточки, с которых реально ушли
  // кнопкой/центром-тора; goBackCard() снимает верхнюю и возвращает туда же, не кладя её обратно.
  var cardHistory = [];
  function currentCardIdentity(){
    if(lunoraMode) return null;
    if(participantsMode) return { kind:'p', name: PARTICIPANT_CHAIN[participantIdx].word };
    if(wordState >= 1 && wordState <= PROJECTS.length) return { kind:'j', name: PROJECTS[wordState-1].word };
    return null;
  }
  function pushCardHistory(){
    var cur = currentCardIdentity();
    if(cur) cardHistory.push(cur);
  }
  // gotoParticipant/gotoProject — сам переход, без записи в историю (ими пользуется и обычный
  // прыжок вперёд, и возврат назад — иначе «назад» само записывало бы себя в историю).
  function gotoParticipant(name){
    var idx = -1;
    for(var i=0;i<PARTICIPANT_CHAIN.length;i++){ if(PARTICIPANT_CHAIN[i].word === name){ idx = i; break; } }
    if(idx === -1) return;
    tgHaptic();
    closeCard();
    if(lunoraMode){ lunoraMode = false; navLunora.classList.remove('active'); }
    participantsMode = true;
    navLeft.classList.add('active');
    navLunora.classList.remove('show');
    participantIdx = idx;
    enterParticipant(idx);
    openStarCard(PARTICIPANT_CHAIN[idx]);
  }
  function gotoProject(name){
    var idx = -1;
    for(var i=0;i<PROJECTS.length;i++){ if(PROJECTS[i].word === name){ idx = i; break; } }
    if(idx === -1) return;
    tgHaptic();
    closeCard();
    if(lunoraMode){ lunoraMode = false; navLunora.classList.remove('active'); }
    participantsMode = false;
    navLeft.classList.remove('active');
    activateProject(idx);
    openProjectCard(PROJECTS[idx]);
  }
  // 08.08.2026, Андрей: «это действительно кнопка» — из карточки любого проекта (Moon, Anibrox, ...)
  // кнопка «Руководитель Ира» переключает главный тор прямо на Иру и открывает её собственную
  // карточку, тем же путём, что обычный вход в звёзд (participantsMode + enterParticipant), только
  // сразу на нужном имени, а не с Гали. Записывает текущую карточку в историю перед прыжком.
  function jumpToParticipant(name){ pushCardHistory(); gotoParticipant(name); }
  // 08.08.2026, Андрей: то же самое в обратную сторону — кнопка с названием проекта (бейдж
  // «Звезда Best» наверху карточки звезды, факт «Руководитель Animix» в презентации) сразу
  // переключает главный тор на этот проект и открывает его карточку.
  function jumpToProject(name){ pushCardHistory(); gotoProject(name); }
  // 08.08.2026, Андрей: кнопка «назад» — не «предыдущий по списку», а реальный откат: снимает
  // последнюю карточку из истории и открывает именно её.
  function goBackCard(){
    if(!cardHistory.length) return;
    var prev = cardHistory.pop();
    if(prev.kind === 'p'){ gotoParticipant(prev.name); } else { gotoProject(prev.name); }
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

  // 08.08.2026, Андрей: «это действительно кнопка» — та же идея, что renderPresentation ниже:
  // элемент labels[i] — либо обычная строка, либо {text, action} для настоящей кликабельной кнопки
  // (звезда Best наверху карточки участника — жмёшь, открывается Best).
  function renderPills(el, labels){
    el.innerHTML = labels.map(function(item, i){
      var isBtn = item && typeof item === 'object';
      var text = isBtn ? item.text : item;
      return '<span class="card-pill'+(isBtn?' card-pill-link':'')+'"'+(isBtn?' role="button" tabindex="0" data-idx="'+i+'"':'')+'>'+text+'</span>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.card-pill-link'), function(node){
      var action = labels[+node.getAttribute('data-idx')].action;
      node.addEventListener('click', action);
      node.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); action(); } });
    });
  }
  // 08.08.2026, Андрей: то же место, что «Руководитель Ира», но это настоящая кнопка — ведёт прямо
  // на тор и карточку этого человека (jumpToParticipant). Кнопка только если имя реально есть в
  // PARTICIPANT_CHAIN (найдена своя карточка) — «нет руководителя»/предварительное имя из
  // PROJECT_PENDING_LEADS остаются обычной, не кликабельной подписью, вести им пока некуда.
  function renderLeaderPills(el, leaders){
    if(!leaders.length){ el.innerHTML = '<span class="card-pill">🔴 Руководителя нет</span>'; return; }
    el.innerHTML = leaders.map(function(name){
      var known = PARTICIPANT_CHAIN.some(function(p){ return p.word === name; });
      return '<span class="card-pill'+(known?' card-pill-link':'')+'"'+(known?' role="button" tabindex="0" data-name="'+name+'"':'')+'>Руководитель '+name+'</span>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.card-pill-link'), function(pill){
      var name = pill.getAttribute('data-name');
      pill.addEventListener('click', function(){ jumpToParticipant(name); });
      pill.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); jumpToParticipant(name); } });
    });
  }
  // 08.08.2026, Создатель: «нажимаю релиз — 3 зелёных/3 жёлтых/3 красных... все карточки хочу
  // видеть в таком формате» — один общий рендер для Релиза, любого проекта и любой звезды:
  // 🟢 известно точно, 🟡 уточняется/неполно, 🔴 нужно узнать. Единый вид на весь сайт.
  function statusGroup(icon, title, items){
    if(!items || !items.length) return '';
    return '<div class="release-group"><div class="release-group-title">'+icon+' '+title+'</div>'
      + items.map(function(t){ return '<div class="release-item">'+t+'</div>'; }).join('') + '</div>';
  }
  // 08.08.2026, Создатель (на примере карточки Гали): «то, что известно и уже перешло в
  // презентацию, можешь не показывать [в процессе] — думай о новых задачах, планах, идеях и
  // записывай это в процесс». Значит «Процесс» больше не повторяет зелёное (оно уже слева, в
  // презентации) — только 🟡 в работе / 🔴 нужно узнать, чтобы не дублировать одно и то же дважды.
  function renderStatusCard(el, yellow, red){
    el.innerHTML = statusGroup('🟡','В работе', yellow) + statusGroup('🔴','Нужно узнать', red);
  }
  // 08.08.2026, Создатель: «слева то, как это должно быть — эталон, что уже сделано и что вау;
  // справа то, что происходит, чтобы презентация выглядела насыщеннее» — презентация везде (и в
  // Релизе, и на любой карточке проекта/звезды) рендерится этой функцией: только подтверждённое
  // (зелёное), звёздными иконками, без сухих заголовков групп.
  var PRESENTATION_ICONS = ['⭐','🌟','✨','💫','🌠'];
  // 08.08.2026, Андрей: «в презентации это тоже не просто список, а кнопки» — факт может быть либо
  // обычной строкой, либо объектом {text, action} — тогда он рендерится как настоящая кнопка
  // (курсор, стрелка, клик/Enter зовёт action()), например «Руководитель Animix» ведёт на карточку
  // Animix, «В TikTok: Vika Anime» открывает сам TikTok. Формат не ломает старые вызовы (строки
  // работают как раньше) — PRESENTATION_INFO, зелёные списки без ссылок и т.д. не трогать.
  function renderPresentation(el, items){
    if(!items || !items.length){
      el.innerHTML = '<div class="presentation-item">🌌 Пока нет ни одного подтверждённого факта — эталон появится, как только он будет</div>';
      return;
    }
    el.innerHTML = items.map(function(t, i){
      var isBtn = t && typeof t === 'object';
      var text = isBtn ? t.text : t;
      var icon = PRESENTATION_ICONS[i % PRESENTATION_ICONS.length];
      return '<div class="presentation-item'+(isBtn?' presentation-item-link':'')+'"'+(isBtn?' role="button" tabindex="0" data-idx="'+i+'"':'')+'>'+icon+' '+text+'</div>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.presentation-item-link'), function(node){
      var action = items[+node.getAttribute('data-idx')].action;
      node.addEventListener('click', action);
      node.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); action(); } });
    });
  }
  // 07.08.2026: Олеся больше не «готовится» — она реальная звезда в PARTICIPANT_CHAIN с
  // leads:['Rush'] (было 'Valmont', переименовано 08.08.2026), карточка Rush находит её сама через
  // обычный leaders-поиск ниже.
  var PROJECT_PENDING_LEADS = {};
  // 06.08.2026, Создатель: «запиши это всё в карточку Anibrox... почту не показывать, системный
  // аккаунт не показывать, что обсуждал — не показывать, пиши факты, презентацию проекта». Только
  // то, что можно показать всем — реальная история имени и кто ведёт, ничего внутреннего/приватного.
  // 08.08.2026, Создатель: «покажи это всё в карточках, чтобы все понимали и по возможности и
  // желанию участвовали» — архивный аудит (все .md кроме ODP/Freexi) по проектам без руководителя
  // теперь виден прямо в карточке, не только в чате. Только подтверждённые архивом факты — где
  // архив ничего не знает, показываем открытый вопрос как есть, не гадаем.
  var PROJECT_FACTS = {
    'Anibrox':          ['Раньше назывался Friend — теперь Anibrox', 'Второй проект под руководством Алины, вместе с Aleorix', 'Дима недавно присоединился к группе — активно помогает Алине, берётся за всё, что предлагают, цель — сделать проект лучше'],
    'Grand Show':       ['Раньше вела Таня — ушла, точная дата неизвестна'],
    'Exclusive Stars':  ['Один из самых первых проектов Best', 'Раньше вела Марика — ушла с роли'],
    'Exclusive Man':    ['Раньше вела Марина Анирам', 'Последний клип вышел в 2021 году — проект молчит уже около 5 лет'],
    'Dances':           ['Раньше вела Нюта — ушла примерно год назад'],
    'Vanila':           ['Раньше вели Катрин, затем пробовала Валя — не пошло', 'Последняя запись — 10.04.2026 («вдохновение не приходит»)'],
    'Tiretok':          ['Прошлый руководитель ушёл, точная дата неизвестна', 'Рекламный проект — название придумал Андрей'],
    'Voice':            ['Пока только идея — 0 клипов, ни одного факта, кроме названия'],
    'Dostar':           ['Раньше назывался Kazakh — переименован в Dostar'],
    'Rush':             ['Раньше назывался Valmont — переименован в Rush по настоянию Олеси, 08.08.2026'],
    'Coffee':           ['Само название пока «можно обдумать» — ещё не устоялось'],
    // 08.08.2026, Андрей: «Moon — арт-проект, где люди разукрашивают своё лицо». Руководитель Ира
    // прислала свою разукрашенную фотографию — тот же факт продублирован публично на её карточке
    // (см. facts у Иры в data-participants.js), здесь — про сам проект.
    'Moon':             ['Арт-проект — участники разукрашивают себе лицо', 'Руководитель Ира прислала свою разукрашенную фотографию']
  };
  function openCard(){ cardEl.classList.add('open'); cardEl.setAttribute('aria-hidden','false'); }
  function closeCard(){ cardEl.classList.remove('open'); cardEl.setAttribute('aria-hidden','true'); cardMiniTorusVisible = false; }
  // 07.08.2026, Создатель: «Клипов вышло [статус], когда первый, когда последний, сколько
  // участников — там где информации у тебя нет, ставишь красный кружок и вопросительный знак. По
  // мере получения информации от каждого руководителя проектов будем заполнять». 08.08.2026: те же
  // цифры теперь разложены по группам 🟢/🟡/🔴 (см. statusGroup выше), а не отдельным блоком —
  // единый формат карточки везде. Никогда не выдумываем значение — только то, что реально вписано
  // в PROJECTS/PARTICIPANT_CHAIN (clipCount / firstClip / lastClip / memberCount, см. комментарий в
  // data-projects.js).
  function clipStatus(lastClip){
    if(!lastClip) return null;
    var days = Math.floor((Date.now() - new Date(lastClip).getTime()) / 86400000);
    if(isNaN(days)) return null;
    if(days <= 14) return 'green';
    if(days <= 30) return 'yellow';
    return 'red';
  }
  function pushClipFacts(green, yellow, red, item, withMembers, memberCountOverride){
    if(item.clipCount){ green.push('Клипов: '+item.clipCount); } else { red.push('Количество клипов неизвестно'); }
    if(item.firstClip){ green.push('Первый клип: '+item.firstClip); } else { red.push('Дата первого клипа неизвестна'); }
    var status = clipStatus(item.lastClip);
    if(item.lastClip){
      if(status === 'green'){ green.push('Последний клип: '+item.lastClip+' — проект активен'); }
      else if(status === 'yellow'){ yellow.push('Последний клип: '+item.lastClip+' — активность замедлилась'); }
      else { red.push('Последний клип: '+item.lastClip+' — давно тишина'); }
    } else { red.push('Дата последнего клипа неизвестна'); }
    if(withMembers){
      var mc = (memberCountOverride !== undefined) ? memberCountOverride : item.memberCount;
      if(mc !== undefined){ green.push('Участников: '+mc); } else { red.push('Количество участников неизвестно'); }
    }
  }
  function openStarCard(p){
    var extra = PARTICIPANTS.filter(function(x){ return x.handle === p.handle; })[0] || {};
    var photo = PARTICIPANT_PHOTOS[p.photo];
    if(photo){
      cardPhotoEl.src = photo; cardPhotoEl.style.display = ''; cardPhotoEl.style.objectFit = p.photoFit || '';
      cardPhotoWrapEl.style.display = '';
      cardMiniTorusLabelEl.textContent = ''; // у звезды в центре фото — слово поверх не нужно
      // display был 'none' — clientWidth ещё 0, поэтому размер миниатюрного тора считаем ПОСЛЕ показа.
      resizeMiniTorus(); cardMiniTorusVisible = true;
    } else {
      cardPhotoWrapEl.style.display = 'none'; cardMiniTorusVisible = false;
    }
    cardNameEl.textContent = p.word; cardNameEl.style.display = ''; // у звезды имя над карточкой — так и должно быть
    // 08.08.2026, Создатель (на примере Гали): «после имени оставь только руководитель Best» —
    // верхняя пилюля больше не дублирует весь список leads, только сам статус/badge.
    // 08.08.2026, Андрей: «кнопка звезда Best тоже кликабельна — сразу открывает Best» — любой
    // вариант этого бейджа (Звезда Best / Руководитель Best / Заместитель руководителя Best)
    // всегда про один и тот же проект — Best, поэтому кнопка всегда ведёт туда, без доп. логики.
    renderPills(cardRolesEl, [{ text: p.badge || 'Звезда Best', action:function(){ jumpToProject('Best'); } }]);
    // «в презентации роль руководитель Best убери, оставь руководитель News и Jelly» — presentation
    // не повторяет badge (он уже наверху), только реальные leads-факты.
    // 08.08.2026, Андрей: «руководитель Animix кнопка кликабельна» — каждый leads-факт, если проект
    // реально есть в PROJECTS, ведёт на его карточку/тор. «В TikTok: Vika Anime» — то же самое,
    // открывает сам TikTok-профиль (только если handle реально есть, иначе ссылки нет и не будет).
    var green = [], yellow = [], red = [];
    (p.leads||[]).forEach(function(l){
      var known = PROJECTS.some(function(pr){ return pr.word === l; });
      green.push(known ? { text:'Руководитель '+l, action:function(){ jumpToProject(l); } } : 'Руководитель '+l);
    });
    if(extra.nick && extra.nick !== p.word){
      green.push(p.handle
        ? { text:'В TikTok: '+extra.nick, action:function(){ window.open('https://www.tiktok.com/@'+p.handle, '_blank', 'noopener'); } }
        : 'В TikTok: '+extra.nick);
    }
    // 08.08.2026, Андрей (на примере Димы): «помогает в проекте Aleorix кликабельна, помогает в
    // проекте Anibrox кликабельна» — не руководитель (leads), отдельный факт «помогает», та же
    // кнопка на карточку/тор проекта.
    (p.helps||[]).forEach(function(h){
      var known = PROJECTS.some(function(pr){ return pr.word === h; });
      green.push(known ? { text:'Помогает в проекте '+h, action:function(){ jumpToProject(h); } } : 'Помогает в проекте '+h);
    });
    // 08.08.2026, Андрей: «каждый раз, если мы о ком-то говорим — открываем карточку и сразу пишем
    // в презентацию факты». facts — свободные подтверждённые факты о самом человеке (не про
    // руководство/помощь — для этого свои поля выше), тот же принцип, что PROJECT_FACTS у проектов.
    (p.facts||[]).forEach(function(f){ green.push(f); });
    // 08.08.2026, Создатель: «отметить, у кого фото в торе уже своё, а у кого нет — нужно прислать
    // фото, каким хочешь видеть себя в своём торе». photoConfirmed:true — сама прислала именно это фото.
    // 08.08.2026, Создатель поправил: фото у остальных — тоже их собственное, просто старое или
    // взятое случайно из архива, не «чужое». Формулировка была неточной, честно исправлена.
    if(p.photoConfirmed){ green.push('Фото в торе — своё, прислала сама'); }
    else { red.push('Фото в торе — старое/случайное из архива, пришли более свежее, каким хочешь видеть себя в своём торе'); }
    // 08.08.2026, Андрей: «в процесс добавь — нужно больше информации в красном окне» — необязательное
    // поле red на любой звезде (пока используется только у Димы), появляется в Процессе (🔴).
    (p.red||[]).forEach(function(r){ red.push(r); });
    pushClipFacts(green, yellow, red, p, false);
    renderPresentation(cardFactsEl, green);
    renderStatusCard(cardStatsEl, yellow, red);
    openCard();
  }
  function openProjectCard(proj){
    // 08.08.2026, Создатель: «в карточке Aleorix и любого другого проекта тоже хочу видеть medium-
    // тор». У проекта своего фото нет — показываем сам тор без фото-вырезки: та же обёртка/канвас,
    // что и у звёзд, только <img> внутри скрыт, поэтому виден полный кружок тора, не кольцо вокруг
    // фото. Канвас копирует главный тор (см. copyMiniTorus) — он уже в цвете именно этого проекта.
    cardPhotoEl.style.display = 'none'; cardPhotoWrapEl.style.display = '';
    // 08.08.2026: «вставь название в medium-тор — Best и так же все проекты» — слово ложится прямо
    // на тор, тем же приёмом, что и главное слово на главном Кторе.
    cardMiniTorusLabelEl.textContent = proj.word;
    resizeMiniTorus(); cardMiniTorusVisible = true;
    // 08.08.2026, Создатель: «название под medium-тором в проектах можешь убрать» — оно теперь и так
    // видно прямо на торе (см. cardMiniTorusLabelEl выше), заголовок над карточкой стал повтором.
    cardNameEl.textContent = proj.word; cardNameEl.style.display = 'none';
    var leaders = proj.word === 'Best' ? ['Галя'] : PARTICIPANT_CHAIN.filter(function(p){ return p.leads && p.leads.indexOf(proj.word)!==-1; }).map(function(p){ return p.word; });
    if(!leaders.length && PROJECT_PENDING_LEADS[proj.word]){ leaders = [PROJECT_PENDING_LEADS[proj.word]]; }
    // 07.08.2026, Создатель: «надпись должна быть руководитель Галя» — тот же вид, что на карточке
    // самой звезды («Руководитель Best»), а не короткое «Руководит: …».
    // 08.08.2026: если руководителя нет вообще — красная пилюля вместо пустого места, видно сразу.
    // 08.08.2026, Андрей: «булька руководитель кликабельна, кидает на тор руководителя» —
    // renderLeaderPills вместо обычной renderPills, каждая известная звезда кликабельна.
    renderLeaderPills(cardRolesEl, leaders);
    // 08.08.2026: тот же принцип, что у звёзд — руководитель уже виден в пилюлях наверху,
    // презентация его не повторяет, только дополнительные факты.
    var green = [], yellow = [], red = [];
    if(!leaders.length){
      red.push('Руководителя нет — если хочешь взяться, дай знать Андрею!');
      red.push('Когда ушёл прошлый руководитель — неизвестно');
      red.push('Нужно ли новое название — не решено');
      red.push('Актуален ли текущий хэштег — не проверено');
    }
    (PROJECT_FACTS[proj.word] || []).forEach(function(f){ green.push(f); });
    // 07.08.2026, Создатель: «участников — это звёзды, сколько торов звёзд на Best?» — у Best
    // список звёзд реально есть в коде (PARTICIPANT_CHAIN), считаем сами, не ждём ручного числа.
    // У остальных проектов такого общего списка участников нет (только leads — руководители),
    // поэтому там пока вручную через memberCount, как раньше.
    pushClipFacts(green, yellow, red, proj, true, proj.word === 'Best' ? PARTICIPANT_CHAIN.length : undefined);
    renderPresentation(cardFactsEl, green);
    renderStatusCard(cardStatsEl, yellow, red);
    openCard();
  }
  // 08.08.2026, Создатель: «нажимаю релиз — 3 зелёных самых важных изменения, 3 жёлтых над чем
  // сейчас работает весь проект, 3 красных что ещё не сделано и нужно всем об этом подумать».
  // Только реальные факты этой сессии/аудита — ничего не выдумываем, как и везде в карточках.
  // 08.08.2026, Создатель: «вместо Релиз 4 напиши слово Процесс» — заголовок правой панели теперь
  // общий с любой карточкой проекта/звезды («Процесс»), не завязан на номер релиза. Кнопка под
  // тором («Релиз 4») не переименована — это отдельная внешняя метка входа, не заголовок панели.
  // 08.08.2026, Создатель, финальный формат «Релиз 4»: «пиши, что сделано для того чтобы выпустить
  // Релиз 4, что делается, какие планы на ближайшее будущее — всего 9 пунктов, и презентация того,
  // что уже подтверждено и является фактом» — 3 сделано / 3 в работе / 3 плана, ровно 9. Это ГЛОБАЛЬНАЯ
  // карточка (не отдельный проект/звезда) — здесь green не дублирует презентацию (PRESENTATION_INFO
  // ниже — про сам продукт для всех, green здесь — технические итоги релиза, разные вещи).
  // 08.08.2026, Создатель: «Марика и я — это пока личное, нигде не показывается, пока я не скажу
  // "покажи мой личный тор". И то, что ты называешь меня Создателем перед всеми — тоже личное, для
  // всех я Андрей». Убрал пункт про тор Марики/себя из публичного «Релиз 4» целиком (не просто
  // переименовал — его тут не должно быть вообще), заменил другим реальным планом.
  // 08.08.2026, Создатель: «"полный архивный аудит" непонятно о чём — это твои внутренние улучшения.
  // И не все факты ещё собраны, это ещё в работе» — убрал из «Сделано» (перехвалил), переписал
  // понятным языком и перенёс в «В работе», честно: сбор фактов не закончен.
  // 08.08.2026, Создатель: «Релиз 4 выпущен. Теперь локально Релиз 5 / Версия 1 — начинаем
  // подготовку к Релизу 5. Заполняем Версию тем, что нужно решить, и работаем только с Версией —
  // постепенно заполняешь, что уже сделано, из тех элементов, что были в Релизе 4, чтобы не
  // повторяться». Значит: RELEASE_INFO (публичный «Релиз 5») пока пуст — это следующий релиз, ещё
  // не готов к показу, его наполняем только когда реально решим «выпустить». Все текущие открытые
  // вопросы (то, что было в yellow/red Релиза 4) переехали в VERSION_INFO ниже — это теперь рабочий
  // документ подготовки. green у VERSION_INFO обнулён — старые пункты уже опубликованы в Релизе 4,
  // повторять их незачем; сюда пойдёт только НОВОЕ, сделанное уже в ходе подготовки к Релизу 5.
  // 07.08.2026, Андрей: «заполни карточку Релиз, там уже точно и честно ответь — мы готовы к
  // Релизу 5?» Прямой честный ответ ниже (`readiness`) + разбивка, почему. Обновлять при каждом
  // реальном сдвиге в готовности — не оставлять эту оценку протухать.
  // 07.08.2026, Андрей: «то, что сделано — в презентацию (см. PRESENTATION_INFO выше), процесс
  // пересобери» — RELEASE_INFO больше не хранит green, Процесс карточки Релиз показывает только
  // 🟡/🔴 (та же логика де-дупа, что и на всех остальных карточках — проектов/звёзд). Презентация
  // и так уже показывает подтверждённые факты, повторять их в Процессе незачем.
  // 07.08.2026, Андрей закрыл сразу два пункта своими словами: «медиум тор я проверял и на проектах,
  // и на людях — вроде всё ок, если увижу что где-то нет, сообщу, так что вопрос закрыт»; «архив —
  // не пойму, там есть что-то важное?» → нет, живая версия (projects/BEST/) уже полнее старой, ничего
  // не теряется; «фото — это по желанию, я им сказал, не нужно об этом вообще писать» → убрано
  // совсем, не задача проекта. «Аудит не важен, когда-нибудь вернусь к аудитам» — тоже убран из
  // активного списка, та же логика, что и ушедшие участники/руководители: не сейчас, не задача
  // этого релиза.
  // 08.08.2026, Андрей: «я не пойму, откуда ошибки... версию убери, работаем с релизом» — два
  // параллельных документа (Релиз + Версия) путали, откуда берутся расхождения. VERSION_INFO и вся
  // карточка «Версия» удалены целиком, всё живёт здесь, в одном месте. Метка под тором растёт
  // дробно (4.2 → 4.21 → 4.22…) с каждой правкой — вместо отдельного счётчика «Версия N», см.
  // стандарт в CLAUDE.md («Release-label standard»). `session` — короткий якорь «о чём был
  // разговор / что сделано», та же идея, что раньше была только в Версии, теперь здесь.
  var RELEASE_INFO = {
    title: 'Процесс',
    session: '08.08.2026 — презентация Релиза/BestOfficial реорганизована по темам (Что это / Как ' +
      'выглядит / Как пользоваться / Живые данные / Надёжность) вместо плоского списка по порядку ' +
      'добавления — Андрей: «то, что ты пишешь — хронология, нужна презентация». Готовим Релиз 5 — ' +
      'старые пункты уже опубликованы, здесь только новое.',
    readyStatus: 'not-ready',
    readiness: '🔴 Идёт подготовка к Релизу 5 — ждём одного открытого вопроса ниже.',
    yellow: [
      'По каждому проекту/звезде — какой у них уровень тора (0 / «Бест тор») и в каком цвете — разбираем по одному, не всё разом'
    ],
    red: [
      'Лучший световой элемент для тора BestOfficial — не найден (единственный открытый вопрос для полного Релиза 5)'
    ]
  };
  // 08.08.2026, Создатель: «без особых объяснений — сейчас мы говорим только про BestOfficial, это
  // заглавная страница всего проекта и сейчас в разработке. Разработан уникальный тор BestOfficial,
  // видно как он менялся от релиза к релизу. Единственная функция на данный момент — открыть тор
  // Best нажатием на слово BestOfficial». Презентация — не техническая (не про карточки/аудит,
  // это отдельный рабочий список справа), а про сам продукт: коротко, по делу, звёздными иконками.
  // 08.08.2026, Создатель поправил: «видно как тор менялся от релиза к релизу» — это нигде реально
  // не видно, убрал; презентация показывает только то, что действительно уже есть на экране.
  // 07.08.2026, Андрей (глядя на карточку Релиз 5): «движок можешь перенести в презентацию как
  // что-то стабильное и приближающееся к идеалу. С процессом постоянно нужно работать, именно он
  // будет задавать тон изменениям на проекте... всё это, что сделано, перенеси в презентацию,
  // пересобери процесс». Принцип: презентация = устоявшееся/близкое к идеалу, процесс = то, что
  // реально ещё в движении. Три пункта ниже — движок/адреса/medium-тор — переехали сюда из
  // RELEASE_INFO.green (раньше дублировались в Процессе, теперь только здесь).
  // 07.08.2026, Андрей: «нужно думать, как показать это действительно презентационно» — плоский
  // список фактов сам по себе не презентация.
  // 08.08.2026, Андрей (Релиз 4.4): «то, что ты пишешь в презентации — это хронология, тоже круто,
  // но нужна презентация — организуй и структурируй». Плоский список (пусть даже без дат) всё равно
  // читался как журнал событий по порядку добавления. Теперь — темы, не порядок появления: кто мы →
  // как выглядит → как им пользоваться → что внутри живого → насколько это надёжно. Внутри каждой
  // темы факты не имеют значения порядка (можно вставлять новые в любое место своей темы, не в
  // конец списка). «Идёт подготовка к Релизу 5» убрано отсюда — это статус процесса, не факт о
  // продукте, он и так виден в баннере готовности справа (releaseReadiness), дублировать незачем.
  // Числа звёзд/проектов — не захардкожены, считаются от PARTICIPANT_CHAIN/PROJECTS.length, чтобы
  // никогда не протухли молча.
  var PRESENTATION_GROUPS = [
    { title:'Что это', items:[
      'BestOfficial — заглавная страница всего проекта, живая витрина Best',
      'Единственная дверь внутрь — нажми на слово BestOfficial, откроется тор Best'
    ]},
    { title:'Как выглядит', items:[
      'Разработан уникальный тор BestOfficial',
      'Появился medium-тор — маленький живой тор светится в каждой карточке, у каждого проекта и у каждой звезды',
      'У каждого человека и проекта — свой цвет и свой переход, ни один не повторяет соседний'
    ]},
    { title:'Как пользоваться', items:[
      'Руководители, помощники, TikTok-ники на карточках — настоящие кнопки, сразу ведут на нужную карточку',
      'Клик по medium-тору внутри карточки листает все карточки подряд — целая библиотека по кругу',
      'Кнопка «назад» вверху карточки — настоящая история переходов, как в браузере, возвращает именно туда, откуда пришли'
    ]},
    { title:'Живые данные', items:[
      function(){ return 'Живая цепочка — '+PARTICIPANT_CHAIN.length+' звёзд и '+PROJECTS.length+' проектов, у каждого своя карточка'; },
      'Все адреса и ссылки — точные и живые, ни одной мёртвой'
    ]},
    { title:'Надёжность', items:[
      'Всё стало крепче и стабильнее — ближе к идеалу, чем когда-либо'
    ]}
  ];
  // 08.08.2026: группы рендерятся отдельной функцией (не renderPresentation) — только здесь, в
  // карточке Релиз/BestOfficial. Карточки проектов/звёзд остаются плоским списком (там и так мало
  // фактов на одну тему, группировать нечего, ломать привычный формат незачем).
  function renderPresentationGrouped(el, groups){
    if(!groups || !groups.length){
      el.innerHTML = '<div class="presentation-item">🌌 Пока нет ни одного подтверждённого факта — эталон появится, как только он будет</div>';
      return;
    }
    var iconIdx = 0;
    el.innerHTML = groups.map(function(group){
      var itemsHtml = group.items.map(function(t){
        var text = typeof t === 'function' ? t() : t;
        var icon = PRESENTATION_ICONS[iconIdx % PRESENTATION_ICONS.length]; iconIdx++;
        return '<div class="presentation-item">'+icon+' '+text+'</div>';
      }).join('');
      return '<div class="presentation-group"><div class="presentation-group-title">'+group.title+'</div>'+itemsHtml+'</div>';
    }).join('');
  }
  function openReleaseCard(){
    renderPresentationGrouped(presentationBodyEl, PRESENTATION_GROUPS);
    releaseCardTitleEl.textContent = RELEASE_INFO.title;
    if(releaseSessionSummaryEl){
      releaseSessionSummaryEl.textContent = RELEASE_INFO.session ? ('📍 ' + RELEASE_INFO.session) : '';
    }
    if(releaseReadinessEl){
      releaseReadinessEl.textContent = RELEASE_INFO.readiness || '';
      releaseReadinessEl.className = 'release-readiness ' + (RELEASE_INFO.readyStatus || 'not-ready');
    }
    releaseCardBodyEl.innerHTML =
      statusGroup('🟡','В работе', RELEASE_INFO.yellow) +
      statusGroup('🔴','Планы', RELEASE_INFO.red);
    releaseCardEl.classList.add('open'); releaseCardEl.setAttribute('aria-hidden','false');
  }
  function closeReleaseCard(){ releaseCardEl.classList.remove('open'); releaseCardEl.setAttribute('aria-hidden','true'); }
  releaseLabelEl.addEventListener('click', openReleaseCard);
  releaseLabelEl.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openReleaseCard(); } });
  releaseCardEl.querySelector('.card-backdrop').addEventListener('click', closeReleaseCard);
  releaseCardEl.querySelector('.card-close').addEventListener('click', closeReleaseCard);
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
  // 08.08.2026: настоящее закрытие (крестик/фон/Escape) обнуляет cardHistory — следующее открытие
  // карточки начинает историю заново, а не продолжает прошлую сессию просмотра.
  function closeCardReset(){ cardHistory.length = 0; closeCard(); }
  cardEl.querySelector('.card-backdrop').addEventListener('click', closeCardReset);
  // 08.08.2026, баг: кнопка «назад» тоже носит класс card-close (ради общего вида) — querySelector
  // без уточнения находил ЕЁ первой (она раньше в разметке), а не настоящий крестик. Крестик
  // оставался без обработчика, «назад» неожиданно ещё и закрывала карточку. :not(.card-back)
  // явно берёт только настоящую кнопку закрытия.
  cardEl.querySelector('.card-close:not(.card-back)').addEventListener('click', closeCardReset);
  // 08.08.2026, Андрей: «нажимаю в центр medium-тор — сразу переключаюсь на следующую звезду, потом
  // проекты, и всё что вообще есть — такая библиотека карточек по кругу». Единая последовательность:
  // сначала все звёзды (PARTICIPANT_CHAIN), потом все проекты (PROJECTS), после последнего — снова
  // первая звезда. Lunora — отдельный маленький режим (не в общей цепочке PROJECTS), в библиотеку не
  // входит, клик там просто ничего не делает. Каждый клик — запись в cardHistory, чтобы «назад» мог
  // реально откатить именно этот шаг.
  function cycleLibraryNext(){
    if(lunoraMode) return;
    var total = PARTICIPANT_CHAIN.length + PROJECTS.length;
    var idx;
    if(participantsMode){ idx = participantIdx; }
    else if(wordState >= 1 && wordState <= PROJECTS.length){ idx = PARTICIPANT_CHAIN.length + (wordState - 1); }
    else { return; }
    var next = (idx + 1) % total;
    if(next < PARTICIPANT_CHAIN.length){ jumpToParticipant(PARTICIPANT_CHAIN[next].word); }
    else { jumpToProject(PROJECTS[next - PARTICIPANT_CHAIN.length].word); }
  }
  cardPhotoWrapEl.addEventListener('click', cycleLibraryNext);
  cardPhotoWrapEl.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); cycleLibraryNext(); } });
  var cardBackEl = cardEl.querySelector('.card-back');
  if(cardBackEl){ cardBackEl.addEventListener('click', goBackCard); }
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ closeCardReset(); closeReleaseCard(); } });

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

  // 08.08.2026, Создатель: «медиум тор — возьми Ктор и сделай в 10 раз меньше, вокруг фото Гали в
  // карточке». Не отдельная копия системы частиц (дублировала бы всю физику ради одной картинки) —
  // прямой слепок УЖЕ отрисованного главного канваса через drawImage: тот же цвет/движение, что и
  // основной тор (он уже показывает палитру текущей звезды/проекта, см. setMktorLeft/enterWorld),
  // просто уменьшенный. cardMiniTorusVisible включается только когда открыта карточка звезды с
  // фото — на проектах (своего фото нет) и когда карточка закрыта эта отрисовка не идёт вообще.
  var cardMiniTorusCanvas = document.getElementById('cardMiniTorus');
  var cardMiniTorusCtx = cardMiniTorusCanvas ? cardMiniTorusCanvas.getContext('2d') : null;
  var cardMiniTorusVisible = false;
  function resizeMiniTorus(){
    if(!cardMiniTorusCanvas) return;
    var mw = cardMiniTorusCanvas.parentElement.clientWidth, mh = cardMiniTorusCanvas.parentElement.clientHeight;
    if(!mw || !mh) return;
    cardMiniTorusCanvas.width = mw*dpr; cardMiniTorusCanvas.height = mh*dpr;
    cardMiniTorusCanvas.style.width = mw+'px'; cardMiniTorusCanvas.style.height = mh+'px';
  }
  window.addEventListener('resize', resizeMiniTorus);
  function copyMiniTorus(){
    if(!cardMiniTorusVisible || !cardMiniTorusCtx) return;
    cardMiniTorusCtx.clearRect(0, 0, cardMiniTorusCanvas.width, cardMiniTorusCanvas.height);
    cardMiniTorusCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, cardMiniTorusCanvas.width, cardMiniTorusCanvas.height);
  }

  // ---------- Запуск: главный тор в своём rAF-цикле (mktor в него не входит — статичный). Здесь, в
  // самом конце файла, потому что draw()/navLeftCanvas и т.д. объявлены выше в этом же файле. Сам
  // draw(t) (главный тор) не менялся ни строчкой ради mktor. ----------
  if(reduced){ draw(0); copyMiniTorus(); }
  else {
    var raf=null;
    function loop(t){ draw(t); copyMiniTorus(); raf=requestAnimationFrame(loop); }
    raf=requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){ if(raf){ cancelAnimationFrame(raf); raf=null; } }
      else if(!raf) raf=requestAnimationFrame(loop);
    });
  }
})();
