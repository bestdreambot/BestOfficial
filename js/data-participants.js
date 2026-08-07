// Участники BEST — 15 живых людей, которых читает @best.show.official (30.07.2026); Виталий
// (Mostwanted_86) подтверждён Создателем 30.07.2026 как участник, не архивная запись.
// Кнопка появляется только на шаге Best — у остальных проектов цепочки своей команды нет.
var PARTICIPANTS = [
  { name:'Нина', nick:'Нина Воронеж', handle:'nina1990.12.26', role:'Участник', clips:'Клип: 102', photo:'nina' },
  { name:'Оксана', nick:'Ксения', handle:'oks7440', role:'Участник', photo:'oksana' },
  { name:'Алексей', nick:'Алексей', handle:'comtealex_23new', role:'Участник', photo:'aleksey' },
  { name:'Дима 💖', nick:'Bayb4if', handle:'momentonoriarti', role:'Участник', clips:'Клип: 91 (дуэт с Алиной)', photo:'dima' },
  { name:'Валя', nick:'Adrenalinka', handle:'izbalovannoe..chudo', role:'Участник', photo:'valya' },
  { name:'Марина', nick:'vredina_safronova', handle:'vredina_safronova2', role:'Участник', clips:'Клипы: 86, 95', photo:'marina' },
  { name:'Саша', nick:'19_Fenix_91', handle:'19._black_fenix_.91', role:'Участник', clips:'Клип: 93', photo:'sasha' },
  { name:'Ира', nick:'Ирина Ершова', handle:'26koroleva_ada', role:'Участник', photo:'ira' },
  { name:'Маша', nick:'Mashulya', handle:'mayshonok1994', role:'Участник', photo:'maria' },
  { name:'Виктория', nick:'Tori_fomi2383', handle:'tori_fomi2383', role:'Участник', clips:'Клип: 94', photo:'torri' },
  { name:'Алина 🎃', nick:'Alinka', handle:'im_your_asya', role:'Руководитель Aleorix', clips:'Клипы: 83, 90, 91, 97, 100, 101', photo:'alina' },
  { name:'Вива 🥰', nick:'Vika Anime', handle:'vikaviva5', role:'Участник', photo:'viva' },
  { name:'Мария', nick:'Demon', handle:'angelidemon22.07.88m', role:'Участник', clips:'Клипы: 87, 89, 96, 98', photo:'masha' },
  { name:'Галя ⭐', nick:'Galhunya', handle:'not_yours21.02', role:'Руководитель проекта Best', clips:'Клипы: 84, 92, 99', photo:'galia' },
  { name:'Виталий', nick:'Mostwanted_86', handle:'mostwanted_86', role:'Участник', photo:'vitali' }
];
// Живая цепочка участников — второй режим слова/тора, параллельный PROJECTS, включается кнопкой
// «Участники» (см. toggleParticipantsMode в app.js). Не модалка — тот же принцип enterWord(), что и
// у проектов: своё имя, свой цвет (world c префиксом p_, отдельно от WORLDS проектов), свой переход.
// Галя первой — руководитель. После Виталия — снова Галя (кольцевая, в отличие от одноразовой
// цепочки проектов). ringMode/wordFx — те же 5, что у проектов, по кругу.
var PARTICIPANT_RING_ORDER = ['portal','dissolve','wipe','burst','spiral'];
var PARTICIPANT_FX_ORDER = ['gold_enter','soft_only','flash_warm','no_fx','streak_only'];
// leads — реальные проекты, где человек руководитель (см. .agents/совет/РОЛИ-И-ПРОЕКТЫ.md, крупинки
// подтверждённые Создателем 01.08.2026). Только факты, ничего не выдумываем — у кого нет
// подтверждённого руководства, поля просто нет.
// 06.08.2026, Создатель: «поставь Алину после Гали» — порядок цепочки на порту 2000 намеренно
// отличается от live-прода (там Алина 4-я), только здесь, локально, git/Vercel не тронуты.
var PARTICIPANT_CHAIN = [
  // 07.08.2026, Создатель уточнил: не замена, а все три сразу — «руководитель бест / руководитель
  // news / руководитель jelly». badge даёт первую пилюлю (Best), leads — остальные по порядку.
  { word:'Галя',     aria:'Галя. Руководитель проекта Best.', world:'p_galya',    handle:'not_yours21.02',        photo:'galia', leader:true, badge:'Руководитель Best', leads:['News','Jelly'] },
  // 06.08.2026 — реальный факт из переписки «Руководство проекта Best» (05-06.08.2026): Галя
  // спросила себе заместителя, Маша отказалась, Алина согласилась «ради Гали». Андрей подтвердил.
  { word:'Алина',    aria:'Алина. Заместитель руководителя Best.', world:'p_alina',    handle:'im_your_asya', photo:'alina', badge:'Заместитель руководителя Best', leads:['Aleorix','Anibrox'] },
  { word:'Мария',    aria:'Мария. Участник BEST.',    world:'p_maria',    handle:'angelidemon22.07.88m',  photo:'masha', leads:['Dualis','Lunora','Finger Dance'] },
  { word:'Вива',     aria:'Вива. Участник BEST.',     world:'p_viva',     handle:'vikaviva5',             photo:'viva', leads:['Animix','Dualis'] },
  { word:'Дима',     aria:'Дима. Участник BEST.',     world:'p_dima',     handle:'momentonoriarti',       photo:'dima' },
  { word:'Маша',     aria:'Маша. Участник BEST.',     world:'p_masha',    handle:'mayshonok1994',        photo:'maria', leads:['Fovela'] },
  { word:'Виктория', aria:'Виктория. Участник BEST.', world:'p_viktoria', handle:'tori_fomi2383',        photo:'torri', leads:['hit.parad official'] },
  // 07.08.2026, Создатель: «Олеся вернулась на проект... добавь после Вика Торри». TikTok-адрес
  // подтверждён следующим сообщением: @schastie_moe_.
  { word:'Олеся',    aria:'Олеся. Участник BEST.',    world:'p_olesya',   handle:'schastie_moe_',         photo:'olesya', leads:['Valmont','Rock Party'] },
  { word:'Валя',     aria:'Валя. Участник BEST.',     world:'p_valya',    handle:'izbalovannoe..chudo',   photo:'valya' },
  { word:'Ира',      aria:'Ира. Участник BEST.',      world:'p_ira',      handle:'26koroleva_ada',       photo:'ira', leads:['Moon'] },
  { word:'Виталий',  aria:'Виталий. Участник BEST.',  world:'p_vitali',   handle:'mostwanted_86',        photo:'vitali' },
  { word:'Оксана',   aria:'Оксана. Участник BEST.',   world:'p_oksana',   handle:'oks7440',               photo:'oksana' },
  { word:'Саша',     aria:'Саша. Участник BEST.',     world:'p_sasha',    handle:'19._black_fenix_.91',  photo:'sasha' },
  { word:'Марина',   aria:'Марина. Участник BEST.',   world:'p_marina',   handle:'vredina_safronova2',   photo:'marina' },
  { word:'Алексей',  aria:'Алексей. Участник BEST.',  world:'p_aleksey',  handle:'comtealex_23new',       photo:'aleksey', leads:['Nerix'] },
  { word:'Нина',     aria:'Нина. Участник BEST.',     world:'p_nina',     handle:'nina1990.12.26',        photo:'nina' }
];
PARTICIPANT_CHAIN.forEach(function(p, i){
  p.ring = PARTICIPANT_RING_ORDER[i % PARTICIPANT_RING_ORDER.length];
  p.fx = PARTICIPANT_FX_ORDER[(i + 2) % PARTICIPANT_FX_ORDER.length];
  p.ringMs = 1000 + (i % 3) * 150;
});
// Фото участников — вынесены из base64 в HTML в отдельные файлы (аудит Grok 31.07.2026, «облегчить
// HTML»: 93% веса freexofficial.html было именно этими 15 фото). С релиза 1.4 (31.07.2026) — публичны
// и на bestofficial.vercel.app: все фото официальные, с TikTok, прятать нечего (прямое слово Создателя).
var PARTICIPANT_PHOTOS = {
  olesya:'photos/olesya.jpg',
  marina:'photos/marina.jpg',
  sasha:'photos/sasha.jpg',
  ira:'photos/ira.jpg',
  masha:'photos/masha.jpg',
  alina:'photos/alina.jpg',
  viva:'photos/viva.jpg',
  maria:'photos/maria.jpg',
  galia:'photos/galia.jpg',
  torri:'photos/torri.jpg',
  vitali:'photos/vitali.jpg',
  valya:'photos/valya.png',
  dima:'photos/dima.png',
  aleksey:'photos/aleksey.png',
  oksana:'photos/oksana.png',
  nina:'photos/nina.png'
};
