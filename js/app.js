// Открыт как Telegram Mini App (Создатель, 31.07.2026) — за пределами Telegram window.Telegram
// не существует, поэтому здесь ничего не ломается.
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
var wordEl = document.getElementById('torCanvas').parentElement.querySelector('h1');
wordEl.style.cursor = 'pointer';
var tiktokEl = document.getElementById('tiktokLink');
if (tg) {
  // Внутри Telegram (особенно iOS) обычный target="_blank" иногда просто съедается —
  // Mini App API просит открывать внешние ссылки через свой openLink.
  tiktokEl.addEventListener('click', function(e){
    e.preventDefault();
    tg.openLink(tiktokEl.href);
  });
}
var flashEl = document.getElementById('wordFlash');
var streakEl = document.getElementById('lightStreak');
var photoEl = document.getElementById('participantPhoto');
var participantNameEl = document.getElementById('participantName');
var badgeEl = document.getElementById('participantBadge');
// FOM2 в режиме звёзд показывает имя ТЕКУЩЕЙ звезды вместо общего «Звёзды» (Создатель + Grok,
// 01.08.2026, .agents/совет/FOM2-ЗВЁЗДЫ-ИМЕНА-И-СТРАНИЦЫ.md) — личная страница по клику пока не
// делается, ждём выбор эскиза A/B.
var fom2LabelEl = document.getElementById('fom2Label');

var wordState = 0; // индекс следующего непоказанного проекта в PROJECTS
function enterWord(text, ariaLabel, world, linkInfo, mode, durationMs, fxName){
  var fx = WORD_FX[fxName] || WORD_FX.soft_only;
  function applyChange(){
    wordEl.textContent = text;
    wordEl.setAttribute('data-text', text);
    wordEl.setAttribute('aria-label', ariaLabel);
    wordEl.classList.add('is-best');
    if(fx.flash > 0){ flashPulse(flashEl, fx.flashMs, fx.flash); }
    if(fx.streakMs > 0){ streakSweep(streakEl, fx.streakMs); }
    if(linkInfo){
      tiktokEl.href = linkInfo.url;
      tiktokEl.textContent = linkInfo.label;
      tiktokEl.setAttribute('aria-label', linkInfo.aria);
    } else {
      // Адрес не подтверждён Создателем — ссылку не показываем, а не пишем наугад.
      tiktokEl.classList.remove('show');
    }
  }
  if(fx.instant || reduced){ applyChange(); } else { crossfadeSwap(wordEl, applyChange, 400, fx.blur, fx.zoom); }
  if(linkInfo){
    setTimeout(function(){ tiktokEl.classList.add('show'); }, (reduced || fx.instant) ? 0 : 500);
  }
  worldIdx = WORLD_ORDER.indexOf(world);
  transFrom = curPalette; transTo = WORLDS[world];
  fom2Target = WORLDS[world];
  transMode = mode;
  transDurationMs = durationMs;
  transStart = reduced ? (lastT - transDurationMs - 1) : lastT;
  settleStart = reduced ? -1e9 : lastT;
  if(reduced){ draw(lastT); }
}
var participantsMode = false, participantIdx = 0;
// В режиме участников слово-текст уступает место фото — тот же приём перехода (blur/zoom
// crossfadeSwap), но на photoEl вместо wordEl. Слово прячется (opacity 0), а не удаляется —
// так что при выходе из режима достаточно вернуть ему opacity 1 и снова отдать enterWord().
function enterParticipant(idx){
  var p = PARTICIPANT_CHAIN[idx];
  var fx = WORD_FX[p.fx] || WORD_FX.soft_only;
  var linkInfo = { url:'https://www.tiktok.com/@'+p.handle, label:'TikTok', aria:p.word+' в TikTok — @'+p.handle };
  function applyChange(){
    photoEl.src = PARTICIPANT_PHOTOS[p.photo];
    photoEl.classList.toggle('leader', !!p.leader);
    wordEl.setAttribute('aria-label', p.aria);
    participantNameEl.textContent = p.word;
    badgeEl.textContent = p.badge || '';
    // FOM2 у всех показывает имя, включая Галю — «Руководитель Best» остаётся только на
    // бейдже внизу (Создатель, 01.08.2026: «напиши там Галя»).
    fom2LabelEl.textContent = p.word;
    if(fx.flash > 0){ flashPulse(flashEl, fx.flashMs, fx.flash); }
    if(fx.streakMs > 0){ streakSweep(streakEl, fx.streakMs); }
    tiktokEl.href = linkInfo.url;
    tiktokEl.textContent = linkInfo.label;
    tiktokEl.setAttribute('aria-label', linkInfo.aria);
  }
  if(fx.instant || reduced){ applyChange(); } else { crossfadeSwap(photoEl, applyChange, 400, fx.blur, fx.zoom); }
  setTimeout(function(){
    tiktokEl.classList.add('show');
    // Имя по центру экрана под фото убрано у всех звёзд (Создатель, 01.08.2026 — «убери») —
    // оно уже есть в FOM2 и на странице звезды, здесь внизу больше не нужно никому.
    participantNameEl.classList.remove('show');
    participantsBtn.classList.add('show');
  }, (reduced || fx.instant) ? 0 : 500);
  photoEl.classList.add('show');
  worldIdx = WORLD_ORDER.indexOf(p.world);
  transFrom = curPalette; transTo = WORLDS[p.world];
  fom2Target = WORLDS[p.world];
  transMode = p.ring;
  transDurationMs = p.ringMs;
  transStart = reduced ? (lastT - transDurationMs - 1) : lastT;
  settleStart = reduced ? -1e9 : lastT;
  if(reduced){ draw(lastT); }
}
function toggleParticipantsMode(){
  tgHaptic();
  participantsMode = !participantsMode;
  participantsBtn.classList.toggle('active', participantsMode);
  participantsBtn.setAttribute('aria-pressed', String(participantsMode));
  if(participantsMode){
    wordEl.style.transition = reduced ? 'none' : 'opacity 0.4s ease';
    wordEl.style.opacity = '0';
    photoEl.style.pointerEvents = 'auto';
    participantIdx = 0;
    enterParticipant(0);
    bestBtn.classList.add('show');
  } else {
    photoEl.style.transition = reduced ? 'none' : 'opacity 0.4s ease';
    photoEl.style.opacity = '0';
    photoEl.style.pointerEvents = 'none';
    photoEl.classList.remove('show');
    participantNameEl.classList.remove('show');
    badgeEl.classList.remove('show');
    fom2LabelEl.textContent = 'Звёзды';
    wordEl.style.opacity = '1';
    var best = PROJECTS[0];
    var linkInfo = best.tiktok ? { url:'https://www.tiktok.com/@'+best.tiktok, label:'TikTok', aria:best.word+' в TikTok — @'+best.tiktok } : null;
    enterWord(best.word, best.aria, best.world, linkInfo, best.ring, best.ringMs, best.fx);
    bestBtn.classList.add('show');
    participantsBtn.classList.add('show');
  }
}
function activateProject(i){
  var proj = PROJECTS[i];
  wordState = i + 1;
  var linkInfo = proj.link ? proj.link
    : proj.tiktok ? { url:'https://www.tiktok.com/@'+proj.tiktok, label:'TikTok', aria:proj.word+' в TikTok — @'+proj.tiktok }
    : null;
  enterWord(proj.word, proj.aria, proj.world, linkInfo, proj.ring, proj.ringMs, proj.fx);
  // FOM2-справа («Best» — маяк домой) теперь виден всегда, зеркально FOM2-слева, даже когда мы
  // уже на самом Best (Создатель, 01.08.2026: «поставь справа точно так же, как и Галя»).
  bestBtn.classList.add('show');
  if(proj.word === 'Best'){
    fom2LabelEl.textContent = 'Звёзды';
    setTimeout(function(){ participantsBtn.classList.add('show'); }, reduced ? 0 : 500);
  } else {
    // Каждый проект тоже получает FOM2 слева — его имя и своя карточка (Создатель, 01.08.2026:
    // «такие же фом2 слева внизу каждому проекту»), не только у Best/звёзд.
    closeParticipants();
    fom2LabelEl.textContent = proj.word;
    setTimeout(function(){ participantsBtn.classList.add('show'); }, reduced ? 0 : 500);
  }
}
(function buildParticipants(){
  var grid = document.getElementById('participantsGrid');
  PARTICIPANTS.forEach(function(p){
    var card = document.createElement('div');
    card.className = 'p-card' + (p.unconfirmed ? ' unconfirmed' : '');
    var initial = p.unconfirmed ? '?' : p.name.trim().charAt(0);
    var ringInner = p.photo
      ? '<img src="'+PARTICIPANT_PHOTOS[p.photo]+'" alt="" loading="lazy">'
      : initial;
    card.innerHTML =
      '<div class="p-ring"><div class="p-ring-inner">'+ringInner+'</div></div>' +
      '<div class="p-name">'+p.name+'</div>' +
      '<div class="p-nick">'+p.nick+'</div>' +
      '<div class="p-role">'+p.role+'</div>' +
      '<a class="p-handle" href="https://www.tiktok.com/@'+p.handle+'" target="_blank" rel="noopener">@'+p.handle+'</a>' +
      (p.clips ? '<div class="p-clips">'+p.clips+'</div>' : '');
    grid.appendChild(card);
  });
})();
// FOM2 «Звёзды» — тот же живой режим цепочки участников, что раньше жил в pill-кнопке
// «Участники»; внутреннее имя participantsBtn/participantsMode осталось (не ломаем логику),
// экран показывает FOM2 + подпись «Звёзды» (см. .agents/совет/FOM2-STATIC-TOR.md).
var participantsBtn = document.getElementById('fom2Tor');
// «Best» — тоже FOM2 теперь, зеркально справа (Создатель, 01.08.2026); внутреннее имя bestBtn
// осталось, чтобы не трогать goHome()/остальную логику.
var bestBtn = document.getElementById('fom2TorRight');
var participantsPanel = document.getElementById('participantsPanel');
function goHome(){
  closeStarPage();
  if(participantsMode){ toggleParticipantsMode(); return; }
  tgHaptic();
  if(wordState !== 1){ activateProject(0); }
}
function openParticipants(){
  participantsPanel.classList.add('open');
  participantsPanel.setAttribute('aria-hidden', 'false');
}
function closeParticipants(){
  participantsPanel.classList.remove('open');
  participantsPanel.setAttribute('aria-hidden', 'true');
}

// Страница звезды — «разворот сцены» (Создатель, 01.08.2026, эскиз A Grok в
// .agents/совет/FOM2-ЗВЁЗДЫ-ИМЕНА-И-СТРАНИЦЫ.md): клик по имени в FOM2, пока уже смотрим на
// звезду, открывает её личную презентацию поверх притемнённого тора/слова. Данные — только
// реальные, из PARTICIPANT_CHAIN + PARTICIPANTS (по handle), ничего не выдумываем.
var starPageEl = document.getElementById('starPage');
var starPhotoEl = document.getElementById('starPhoto');
var starNameEl = document.getElementById('starPageName');
var starRoleEl = document.getElementById('starRole');
var starFactsEl = document.getElementById('starFacts');
function showStarOverlay(){
  document.body.classList.add('star-open');
  starPageEl.classList.add('open');
  starPageEl.setAttribute('aria-hidden', 'false');
}
function renderRolePills(labels){
  starRoleEl.innerHTML = labels.map(function(r){ return '<span class="star-role-pill">' + r + '</span>'; }).join('');
}
function openStarPage(p){
  var extra = PARTICIPANTS.filter(function(x){ return x.handle === p.handle; })[0] || {};
  starPhotoEl.style.display = '';
  starPhotoEl.src = PARTICIPANT_PHOTOS[p.photo];
  starPhotoEl.classList.toggle('leader', !!p.leader);
  starNameEl.textContent = p.word;
  // Каждая роль — своя мк (мини-карточка), не одна строка списком (Создатель, 01.08.2026: «мк
  // руководитель Dualis», «мк руководитель FingerDance»…).
  var roles = [p.badge || 'Звезда Best'].concat((p.leads || []).map(function(l){ return 'Руководитель ' + l; }));
  renderRolePills(roles);
  // Адрес TikTok (@handle) в карточке больше не пишем (Создатель, 01.08.2026 — «не нужно») —
  // только то, что действительно интересно рассказать о звезде.
  var facts = [];
  if(extra.nick && extra.nick !== p.word){ facts.push('В TikTok: ' + extra.nick); }
  starFactsEl.innerHTML = facts.map(function(f){ return '<p class="star-fact">✨ ' + f + '</p>'; }).join('');
  showStarOverlay();
}
// Реальные руководители, которых Создатель уже назвал, но которых ещё нет как звезды в цепочке
// (Grok, надзор 01.08.2026 — «не врать никто, если руководитель есть, просто ещё не приглашён»).
var PROJECT_PENDING_LEADS = { 'Valmont': 'Олеся (готовится)' };
// Карточка проекта — та же витрина, что у звезды (Создатель, 01.08.2026: «такая же карточка как у
// звёзд»), только без фото (у проектов его нет) и с руководителем вместо личного бейджа.
function openProjectCard(proj){
  starPhotoEl.style.display = 'none';
  starNameEl.textContent = proj.word;
  var leaders = proj.word === 'Best' ? ['Галя'] : PARTICIPANT_CHAIN.filter(function(p){
    return p.leads && p.leads.indexOf(proj.word) !== -1;
  }).map(function(p){ return p.word; });
  if(!leaders.length && PROJECT_PENDING_LEADS[proj.word]){ leaders = [PROJECT_PENDING_LEADS[proj.word]]; }
  renderRolePills(leaders.length ? ['Руководит: ' + leaders.join(', ')] : []);
  // Адрес TikTok в карточке проекта тоже убран (Создатель, 01.08.2026), фактов пока нет —
  // не выдумываем лишнего.
  starFactsEl.innerHTML = '';
  showStarOverlay();
}
function closeStarPage(){
  document.body.classList.remove('star-open');
  starPageEl.classList.remove('open');
  starPageEl.setAttribute('aria-hidden', 'true');
}
function handleFom2Activate(){
  tgHaptic();
  if(participantsMode){
    openStarPage(PARTICIPANT_CHAIN[participantIdx]);
  } else if(wordState >= 2 && wordState <= PROJECTS.length){
    openProjectCard(PROJECTS[wordState - 1]);
  } else {
    toggleParticipantsMode();
  }
}
participantsBtn.addEventListener('click', handleFom2Activate);
participantsBtn.addEventListener('keydown', function(e){
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); handleFom2Activate(); }
});
// FOM2-справа: карточка Best — только когда мы уже реально на главной странице Best (Создатель,
// 01.08.2026: «только на главной страничке Best фом2 показывай как карточку»). С любого другого
// проекта (Aleorix и т.д.) клик просто возвращает домой на Best, без карточки.
function handleBestFom2(){
  if(wordState === 1 && !participantsMode){
    tgHaptic();
    openProjectCard(PROJECTS[0]);
  } else {
    goHome();
  }
}
bestBtn.addEventListener('click', handleBestFom2);
bestBtn.addEventListener('keydown', function(e){
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); handleBestFom2(); }
});
participantsPanel.querySelector('.participants-backdrop').addEventListener('click', closeParticipants);
participantsPanel.querySelector('.participants-close').addEventListener('click', closeParticipants);
starPageEl.querySelectorAll('[data-star-close]').forEach(function(el){
  el.addEventListener('click', closeStarPage);
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){ closeParticipants(); closeStarPage(); }
});

function onWordActivate(){
  tgHaptic();
  if(participantsMode){
    participantIdx = (participantIdx + 1) % PARTICIPANT_CHAIN.length;
    enterParticipant(participantIdx);
    return;
  }
  if(wordState >= PROJECTS.length) return;
  activateProject(wordState);
}
wordEl.addEventListener('click', onWordActivate);
wordEl.addEventListener('keydown', function(e){
  if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); onWordActivate(); }
});
// Фото шире фигурного текста слова — своя область клика поверх, пока идёт режим участников.
photoEl.addEventListener('click', onWordActivate);
