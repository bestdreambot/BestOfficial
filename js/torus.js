var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function seeded(i){ var x = Math.sin(i*12.9898)*43758.5453; return x - Math.floor(x); }

var canvas = document.getElementById('torCanvas');
var ctx = canvas.getContext('2d');
var w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
function resize(){
  w = canvas.parentElement.clientWidth; h = canvas.parentElement.clientHeight;
  canvas.width = w*dpr; canvas.height = h*dpr;
  canvas.style.width = w+'px'; canvas.style.height = h+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resize);
resize();

var GT_OUTER = 0.42, GT_INNER = 0.84;
var worldIdx = 0;
// Длительность/режим перехода задаются в момент клика (см. nextWorld/enterWord) — у тора и у входа
// по слову разный характер (Grok, .agents/pablikgrok.md, ответ «дыхание красиво; смена цветов грубовата»).
var transDurationMs = 1000;
var transMode = 'dissolve';
var curPalette = WORLDS.freex;
var transFrom = WORLDS.freex, transTo = WORLDS.freex, transStart = -1e9, lastT = 0;
// ЭКСПЕРИМЕНТ — «Spin-кик» из CapCut: короткий рывок вращения кольца в момент клика, гаснет за 700мс.
var spinKickStart = -1e9;
var SPIN_KICK_MS = 700, SPIN_KICK_AMOUNT = 0.9;
function lerpPalette(p1, p2, p){
  var out = [];
  for(var i=0;i<p1.length;i++){
    var a = p1[i], b = p2[i];
    out.push([a[0]+(b[0]-a[0])*p, a[1]+(b[1]-a[1])*p, a[2]+(b[2]-a[2])*p]);
  }
  return out;
}
function easeInOutCubic(x){ return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2; }
canvas.style.cursor = 'pointer';
function nextWorld(){
  worldIdx = (worldIdx+1) % WORLD_ORDER.length;
  transFrom = curPalette; transTo = WORLDS[WORLD_ORDER[worldIdx]];
  // Вариант 1 (Grok) — клик по тору: мягкое общее переливание цвета, не спеша.
  transMode = 'dissolve';
  transDurationMs = 1500;
  transStart = reduced ? (lastT - transDurationMs - 1) : lastT;
  // spin-кик на паузе — см. комментарий у «Zoom punch» выше.
  // spinKickStart = reduced ? -1e9 : lastT;
  if(reduced){ draw(lastT); }
}
canvas.addEventListener('click', nextWorld);

var P_N = reduced ? 260 : 2200;
var particles = [];
for(var pi=0; pi<P_N; pi++){
  var band = (seeded(pi*5+1) + seeded(pi*5+2) + seeded(pi*5+3) + seeded(pi*5+4))/4;
  particles.push({
    angle0: seeded(pi*5+11)*Math.PI*2,
    radiusU: band,
    speed: 0.00003 + seeded(pi*5+13)*0.00002,
    size: seeded(pi*5+17) > 0.92 ? (1.6+seeded(pi*5+19)*1.6) : (0.5+seeded(pi*5+19)*0.9),
    twPhase: seeded(pi*5+23)*Math.PI*2,
    twSpeed: 0.00042+seeded(pi*5+29)*0.00084,
    colorBias: seeded(pi*5+31),
    // C4 (пакет Grok) — ~2.5% частиц навсегда помечены «самоцветом», крупнее/ярче в золоте.
    gem: seeded(pi*5+37) > 0.975
  });
}
var LOAD_T = null;
// C5 (пакет Grok) — короткое «оседание» скорости после входа в Best.
var settleStart = -1e9, SETTLE_MS = 900;

function draw(t){
  lastT = t;
  if(LOAD_T === null){ LOAD_T = t; }
  var transP = Math.min(1, (t - transStart) / transDurationMs);
  var easedP = easeInOutCubic(transP);
  curPalette = transP >= 1 ? transTo : lerpPalette(transFrom, transTo, easedP);
  ctx.clearRect(0,0,w,h);
  var cx=w/2, cy=h/2, minDim = Math.min(w,h);
  var outerR = minDim*GT_OUTER, innerR = outerR*GT_INNER;
  var bandHalf = (outerR-innerR)/2;
  var ringR = innerR + bandHalf;
  // C1 — дыхание радиуса кольца, период ~7.6с (замедлено по слову Создателя — «никуда не торопимся»),
  // в такт glow-pulse слова (там же период 7.6с, старт с задержкой 1.75с — см. CSS h1{animation}).
  var breathePhase = ((t - 1750 - 3800) / 7600) * Math.PI * 2;
  ringR = ringR * (1 + 0.04*Math.cos(breathePhase));
  // C3 — первые ~1.1с после загрузки кольцо тихо «проявляется», а не появляется рывком.
  // При reduced motion кадр всего один (t=0) — проявление пропускаем, иначе кольцо будет невидимым.
  var revealP = Math.min(1, (t - LOAD_T) / 1100);
  var revealMul = reduced ? 1 : (1 - Math.pow(1 - revealP, 3));
  // C5 — после входа в Best скорость частиц на 0.6с чуть выше, потом плавно оседает к обычной.
  var settleP = Math.min(1, (t - settleStart) / SETTLE_MS);
  var speedMul = settleP < 1 ? (1.08 - 0.08*settleP) : 1;
  var spread = bandHalf*3.4;

  // Разные переходы — по слову Создателя («нужно разные»), один почерк на шаг цепочки:
  // portal (GPT, →Best), dissolve (Grok, клик по тору и →Aleorix), wipe (→Jelly), burst (→Valmont),
  // spiral (→Animix).
  var portalActive = transMode === 'portal' && transP < 1;
  var frontAngle = transP * Math.PI * 2;
  var FRONT_WIDTH = 0.65;
  var globalDim = portalActive ? 1 - 0.13*Math.sin(transP*Math.PI) : 1;
  var dissolveActive = transMode === 'dissolve' && transP < 1;
  var dissolvePal = dissolveActive ? lerpPalette(transFrom, transTo, easedP) : null;
  // «Wipe» — мягкая занавесь: широкая перистая кромка, без гашения и без притяжения (→Jelly).
  var wipeActive = transMode === 'wipe' && transP < 1;
  var wipeFrontAngle = easedP * Math.PI * 2;
  var WIPE_FEATHER = 1.3;
  // «Burst» — частицы на пике перехода расходятся от кольца и возвращаются, цвет щёлкает в момент
  // максимального разлёта, как импульс энергии (→Valmont).
  var burstActive = transMode === 'burst' && transP < 1;
  var burstBell = burstActive ? Math.sin(transP*Math.PI) : 0;
  // «Spiral» — фронт цвета зависит и от угла, и от радиуса (twist по ширине кольца), поэтому
  // граница цветов идёт не прямой чертой, а винтом — читается как спираль, а не как wipe (→Animix).
  var spiralActive = transMode === 'spiral' && transP < 1;
  var spiralFrontAngle = easedP * Math.PI * 2;
  var SPIRAL_FEATHER = 1.1;
  var SPIRAL_TWIST = 1.4;
  ctx.save();
  particles.forEach(function(p){
    var r = ringR + (p.radiusU-0.5)*2*spread;
    if (r < innerR*0.15) return;
    if(burstActive){ r *= (1 + 0.3*burstBell); }
    var angSpeed = p.speed * speedMul * (ringR/Math.max(r, ringR*0.3));
    var ang = p.angle0 + t*angSpeed;
    var pal, alphaMul = 1, angPull = 0, sizeMul = 1;
    if(portalActive){
      var a2 = ((ang + Math.PI/2) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
      var dist = Math.abs(a2 - frontAngle);
      var trough = Math.max(0, 1 - dist/FRONT_WIDTH);
      alphaMul = globalDim * (1 - 0.85*trough);
      angPull = (a2 > frontAngle ? -1 : 1) * 0.05 * trough;
      // B3 — искра только у ~1-2% частиц (через p.colorBias), не у всех в зоне фронта.
      if(transP > 0.75 && trough > 0.9 && p.colorBias > 0.985){
        sizeMul = 1 + 1.6*trough; alphaMul = 1;
      }
      pal = a2 <= frontAngle ? transTo : transFrom;
    } else if(dissolveActive){
      pal = dissolvePal;
    } else if(wipeActive){
      var a2w = ((ang + Math.PI/2) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
      var localPw = Math.max(0, Math.min(1, (wipeFrontAngle - a2w)/WIPE_FEATHER + 1));
      pal = localPw >= 1 ? transTo : (localPw <= 0 ? transFrom : lerpPalette(transFrom, transTo, localPw));
    } else if(burstActive){
      pal = transP < 0.5 ? transFrom : transTo;
    } else if(spiralActive){
      var a2s = ((ang + Math.PI/2) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
      var twisted = a2s + (p.radiusU - 0.5) * SPIRAL_TWIST;
      var localPs = Math.max(0, Math.min(1, (spiralFrontAngle - twisted)/SPIRAL_FEATHER + 1));
      pal = localPs >= 1 ? transTo : (localPs <= 0 ? transFrom : lerpPalette(transFrom, transTo, localPs));
    } else {
      pal = transTo;
    }
    ang += angPull;
    var x = cx + Math.cos(ang)*r, y = cy + Math.sin(ang)*r*0.985;
    var tw = 0.5 + 0.5*Math.max(0, Math.sin(t*p.twSpeed + p.twPhase));
    var closeness = 1 - Math.min(1, Math.abs(r-ringR)/spread);
    // C2 — глубина: нижняя дуга (ближе к зрителю) чуть крупнее/ярче, верхняя — чуть мельче/тусклее.
    var depthF = (Math.sin(ang)+1)/2;
    sizeMul *= (0.85 + 0.3*depthF);
    alphaMul *= (0.8 + 0.35*depthF);
    // C4 — редкие самоцветы: крупнее и ярче, только пока цвет — золото (best).
    if(p.gem && transTo === WORLDS.best){ sizeMul *= 1.9; alphaMul = Math.min(1, alphaMul*1.4); }
    var idx = (p.colorBias*0.4 + (1-closeness)*0.6) * (pal.length-1);
    var i0 = Math.floor(idx), i1 = Math.min(pal.length-1, i0+1), fp = idx-i0;
    var a = pal[i0], b = pal[i1];
    var r0 = Math.round(a[0]+(b[0]-a[0])*fp);
    var g0 = Math.round(a[1]+(b[1]-a[1])*fp);
    var b0 = Math.round(a[2]+(b[2]-a[2])*fp);
    var alpha = Math.min(1, (0.22 + 0.85*closeness) * (0.55+0.45*tw)) * alphaMul * revealMul;
    ctx.fillStyle = 'rgba('+r0+','+g0+','+b0+','+alpha.toFixed(3)+')';
    ctx.beginPath(); ctx.arc(x,y,p.size*sizeMul,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

if(reduced){
  draw(0);
} else {
  var rafId = null;
  function loop(t){ draw(t); rafId = requestAnimationFrame(loop); }
  rafId = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ if(rafId){ cancelAnimationFrame(rafId); rafId = null; } }
    else if(!rafId){ rafId = requestAnimationFrame(loop); }
  });
}
