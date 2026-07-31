// CSS transition:opacity on this element конфликтует с background-clip:text + drop-shadow
// (WebKit иногда не перерисовывает и текст зависает невидимым) — гасим/зажигаем вручную по кадрам.
// ЭКСПЕРИМЕНТ (29.07.2026, идея из CapCut — «Blur cross-dissolve»: не чистый fade, а лёгкая
// расфокусировка на пике перехода). filter выставляется вручную по тем же причинам, что и opacity
// выше; после перехода очищается (''), чтобы CSS-анимация glow-pulse снова управляла фильтром.
// blurPeak/zoomPeak теперь параметры — каждый wordFx (см. WORD_FX ниже) даёт слову свой почерк
// входа, а не один и тот же blur+zoom для всех проектов подряд (жалоба Создателя — «гличь почти
// одинаковый везде»).
function crossfadeSwap(el, applyChange, ms, blurPeak, zoomPeak){
  blurPeak = blurPeak == null ? 3.5 : blurPeak;
  zoomPeak = zoomPeak == null ? 0.035 : zoomPeak;
  if(reduced){ applyChange(); return; }
  el.style.transition = 'none';
  var myToken = (el._cfToken = (el._cfToken || 0) + 1);
  var start = null, phase = 'out';
  function step(ts){
    if(el._cfToken !== myToken) return;
    if(start === null) start = ts;
    var p = Math.min(1, (ts - start) / ms);
    if(phase === 'out'){
      el.style.opacity = String(1 - p);
      el.style.filter = blurPeak ? ('blur('+(p*blurPeak).toFixed(2)+'px)') : '';
      if(p >= 1){ applyChange(); phase = 'in'; start = null; }
      requestAnimationFrame(step);
    } else {
      el.style.opacity = String(p);
      el.style.filter = blurPeak ? ('blur('+((1-p)*blurPeak).toFixed(2)+'px)') : '';
      el.style.transform = zoomPeak ? ('scale('+(1 + zoomPeak*Math.sin(p*Math.PI)).toFixed(4)+')') : '';
      if(p < 1){ requestAnimationFrame(step); } else { el.style.opacity = '1'; el.style.filter = ''; el.style.transform = ''; }
    }
  }
  requestAnimationFrame(step);
}
// ЭКСПЕРИМЕНТ — «Flash»-переход из CapCut: короткая вспышка света ровно в невидимой точке смены
// текста, вместо голой темноты. Треугольный импульс opacity (вверх-вниз) через тот же rAF-приём.
// peak (пакет Grok, A2) — вспышка не в полный белый экран, а мягче.
function flashPulse(el, ms, peak){
  if(reduced) return;
  var start = null;
  function step(ts){
    if(start === null) start = ts;
    var p = Math.min(1, (ts - start) / ms);
    var v = (p < 0.5 ? (p/0.5) : (1 - (p-0.5)/0.5)) * peak;
    el.style.opacity = String(v);
    if(p < 1){ requestAnimationFrame(step); } else { el.style.opacity = '0'; }
  }
  requestAnimationFrame(step);
}
// ЭКСПЕРИМЕНТ — «Light streak» из CapCut: широкий диагональный луч один раз проходит через всю
// сцену (шире и ярче обычного блика на слове), одновременно со вспышкой.
function streakSweep(el, ms){
  if(reduced) return;
  el.style.opacity = '1';
  var start = null;
  function step(ts){
    if(start === null) start = ts;
    var p = Math.min(1, (ts - start) / ms);
    var pos = (-100 + p*200).toFixed(2);
    el.style.backgroundPosition = pos+'% '+pos+'%';
    if(p < 1){ requestAnimationFrame(step); } else { el.style.opacity = '0'; }
  }
  requestAnimationFrame(step);
}
// Библиотека почерков входа слова (совет Grok, .agents/pablikgrok.md § «Уникальность слова»).
// Раньше все проекты входили одинаково (blur+flash+streak+zoom) — с ростом цепочки это читалось
// как «один и тот же гличь на весь экран, просто другой цвет» (прямая жалоба Создателя, 30.07).
// Теперь у каждого проекта свой набор: что горит, что нет, и на сколько.
var WORD_FX = {
  gold_enter:  { blur:3.5, zoom:0.035, flash:0.6, flashMs:300, streakMs:600 }, // Best — вход-«корона», самый богатый
  soft_only:   { blur:3.5, zoom:0,     flash:0,   flashMs:0,   streakMs:0   }, // Aleorix — тихое растворение, без вспышек
  flash_warm:  { blur:2.2, zoom:0.02,  flash:0.5, flashMs:220, streakMs:0   }, // Jelly — короткая тёплая вспышка, без луча
  no_fx:       { blur:0,   zoom:0,     flash:0,   flashMs:0,   streakMs:0, instant:true }, // Valmont — слово щёлкает мгновенно, играет только тор (burst)
  streak_only: { blur:2.2, zoom:0,     flash:0,   flashMs:0,   streakMs:650 } // Animix — один длинный луч, без вспышки
};
