var wordEl = document.getElementById('torCanvas').parentElement.querySelector('h1');
wordEl.style.cursor = 'pointer';
var tiktokEl = document.getElementById('tiktokLink');
var flashEl = document.getElementById('wordFlash');
var streakEl = document.getElementById('lightStreak');
var photoEl = document.getElementById('participantPhoto');
var participantNameEl = document.getElementById('participantName');
var badgeEl = document.getElementById('participantBadge');

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
  var linkInfo = { url:'https://www.tiktok.com/@'+p.handle, label:'@'+p.handle, aria:p.word+' в TikTok — @'+p.handle };
  function applyChange(){
    photoEl.src = PARTICIPANT_PHOTOS[p.photo];
    photoEl.classList.toggle('leader', !!p.leader);
    wordEl.setAttribute('aria-label', p.aria);
    participantNameEl.textContent = p.word;
    badgeEl.textContent = p.badge || '';
    if(fx.flash > 0){ flashPulse(flashEl, fx.flashMs, fx.flash); }
    if(fx.streakMs > 0){ streakSweep(streakEl, fx.streakMs); }
    tiktokEl.href = linkInfo.url;
    tiktokEl.textContent = linkInfo.label;
    tiktokEl.setAttribute('aria-label', linkInfo.aria);
  }
  if(fx.instant || reduced){ applyChange(); } else { crossfadeSwap(photoEl, applyChange, 400, fx.blur, fx.zoom); }
  setTimeout(function(){
    tiktokEl.classList.add('show');
    participantNameEl.classList.add('show');
    // У кого есть личный тег (сейчас — Галя, badge:'Руководитель') — показываем его вместо
    // «Участники»; у остальных тега нет, значит «Участники» остаётся на месте (Создатель, 31.07.2026).
    badgeEl.classList.toggle('show', !!p.badge);
    participantsBtn.classList.toggle('show', !p.badge);
  }, (reduced || fx.instant) ? 0 : 500);
  photoEl.classList.add('show');
  worldIdx = WORLD_ORDER.indexOf(p.world);
  transFrom = curPalette; transTo = WORLDS[p.world];
  transMode = p.ring;
  transDurationMs = p.ringMs;
  transStart = reduced ? (lastT - transDurationMs - 1) : lastT;
  settleStart = reduced ? -1e9 : lastT;
  if(reduced){ draw(lastT); }
}
function toggleParticipantsMode(){
  participantsMode = !participantsMode;
  participantsBtn.classList.toggle('active', participantsMode);
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
    wordEl.style.opacity = '1';
    var best = PROJECTS[0];
    var linkInfo = best.tiktok ? { url:'https://www.tiktok.com/@'+best.tiktok, label:'@'+best.tiktok, aria:best.word+' в TikTok — @'+best.tiktok } : null;
    enterWord(best.word, best.aria, best.world, linkInfo, best.ring, best.ringMs, best.fx);
    bestBtn.classList.remove('show');
    participantsBtn.classList.add('show');
  }
}
function activateProject(i){
  var proj = PROJECTS[i];
  wordState = i + 1;
  var linkInfo = proj.link ? proj.link
    : proj.tiktok ? { url:'https://www.tiktok.com/@'+proj.tiktok, label:'@'+proj.tiktok, aria:proj.word+' в TikTok — @'+proj.tiktok }
    : null;
  enterWord(proj.word, proj.aria, proj.world, linkInfo, proj.ring, proj.ringMs, proj.fx);
  if(proj.word === 'Best'){
    setTimeout(function(){ participantsBtn.classList.add('show'); }, reduced ? 0 : 500);
    bestBtn.classList.remove('show');
  } else {
    participantsBtn.classList.remove('show');
    closeParticipants();
    bestBtn.classList.add('show');
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
var participantsBtn = document.getElementById('participantsBtn');
var bestBtn = document.getElementById('bestBtn');
var participantsPanel = document.getElementById('participantsPanel');
function goHome(){
  if(participantsMode){ toggleParticipantsMode(); return; }
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
participantsBtn.addEventListener('click', toggleParticipantsMode);
bestBtn.addEventListener('click', goHome);
participantsPanel.querySelector('.participants-backdrop').addEventListener('click', closeParticipants);
participantsPanel.querySelector('.participants-close').addEventListener('click', closeParticipants);
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeParticipants(); });

function onWordActivate(){
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
