// Цепочка слова — таблица PROJECTS[], не лес if/else (совет Grok, .agents/pablikgrok.md, ровно
// об этом пороге: «данные — таблица PROJECTS[], не лес if/else на 20 проектов»). Каждый шаг:
// слово, world (см. WORLDS/shades в data-worlds.js), tiktok-адрес (null — если Создатель не был уверен в
// адресе, по его прямому слову «если не уверен, не пишите», ссылка тогда просто не показывается),
// ringMode/ringMs/wordFx подобраны по кругу так, чтобы соседние шаги не повторяли друг друга.
var PROJECTS = [
  { word:'Best',            aria:'Best. Проект.',            world:'best',            tiktok:'best.show.official', ring:'portal',   ringMs:1000, fx:'gold_enter'  },
  { word:'Aleorix',         aria:'Aleorix. Проект.',         world:'aleorix',         tiktok:'aleorix0',           ring:'dissolve', ringMs:1300, fx:'soft_only'   },
  { word:'Jelly',           aria:'Jelly. Проект.',           world:'jelly',           tiktok:'jelly.show',         ring:'wipe',     ringMs:1100, fx:'flash_warm'  },
  { word:'Valmont',         aria:'Valmont. Проект.',         world:'valmont',         tiktok:'best.valmont.man',   ring:'burst',    ringMs:900,  fx:'no_fx'       },
  { word:'Animix',          aria:'Animix. Проект.',          world:'animix',          tiktok:'best.anime.show',    ring:'spiral',   ringMs:1200, fx:'streak_only' },
  { word:'Anibrox',         aria:'Anibrox. Проект.',         world:'anibrox',         tiktok:'best.anibrox.show',  ring:'portal',   ringMs:1000, fx:'soft_only'   },
  { word:'Coffee',          aria:'Coffee. Проект.',          world:'coffee',          tiktok:'best.cofee.show',    ring:'dissolve', ringMs:1300, fx:'flash_warm'  },
  { word:'Detski',          aria:'Detski. Проект.',          world:'detski',          tiktok:'best.children.show', ring:'wipe',     ringMs:1100, fx:'no_fx'       },
  { word:'Dostar',          aria:'Dostar. Проект.',          world:'dostar',          tiktok:'best.dostar.show',  ring:'burst',    ringMs:900,  fx:'streak_only' },
  { word:'Dream',           aria:'Dream. Проект.',           world:'dream',           tiktok:'best.dream.show',    ring:'portal',   ringMs:1000, fx:'soft_only'   },
  { word:'Dualis',          aria:'Dualis. Проект.',          world:'dualis',          tiktok:'best.duet.show',     ring:'dissolve', ringMs:1300, fx:'flash_warm'  },
  { word:'Exclusive Stars', aria:'Exclusive Stars. Проект.', world:'exclusive_stars', tiktok:'best.exclusive.stars', ring:'wipe',   ringMs:1100, fx:'no_fx'       },
  { word:'Finger Dance',    aria:'Finger Dance. Проект.',    world:'finger_dance',    tiktok:'best.finger.dance',  ring:'burst',    ringMs:900,  fx:'streak_only' },
  { word:'Fovela',          aria:'Fovela. Проект.',          world:'fovela',          tiktok:'best_fovela',        ring:'spiral',   ringMs:1200, fx:'gold_enter'  },
  { word:'Grand Show',      aria:'Grand Show. Проект.',      world:'grand_show',      tiktok:'best.grand.show',    ring:'portal',   ringMs:1000, fx:'soft_only'   },
  { word:'ISR',             aria:'ISR. Проект.',             world:'isr',             tiktok:'best.isr.show',      ring:'dissolve', ringMs:1300, fx:'flash_warm'  },
  { word:'Moon',            aria:'Moon. Проект.',            world:'moon',            tiktok:'best.moon.show',     ring:'wipe',     ringMs:1100, fx:'no_fx'       },
  { word:'Nerix',           aria:'Nerix. Проект.',           world:'nerix',           tiktok:'best.comedy.show',   ring:'burst',    ringMs:900,  fx:'streak_only' },
  { word:'News',            aria:'News. Проект.',            world:'news',            tiktok:'best.news.show',     ring:'spiral',   ringMs:1200, fx:'gold_enter'  },
  { word:'Past Legends',    aria:'Past Legends. Проект.',    world:'past_legends',    tiktok:'best.past.legends',  ring:'dissolve', ringMs:1300, fx:'flash_warm'  },
  { word:'Tiretok',         aria:'Tiretok. Проект.',         world:'tiretok',         tiktok:'best.tiretok',       ring:'wipe',     ringMs:1100, fx:'no_fx'       },
  { word:'Tune',            aria:'Tune. Проект.',            world:'tune',            tiktok:'best.tune.show',     ring:'burst',    ringMs:900,  fx:'streak_only' },
  { word:'Vanila',          aria:'Vanila. Проект.',          world:'vanila',          tiktok:'best.vanila.show',   ring:'spiral',   ringMs:1200, fx:'gold_enter'  },
  { word:'Voice',           aria:'Voice. Проект.',           world:'voice',           tiktok:'best.voice.show',    ring:'portal',   ringMs:1000, fx:'soft_only'   },
  { word:'Noira',           aria:'Noira. Проект.',           world:'noira',           tiktok:null,                 ring:'wipe',     ringMs:1100, fx:'no_fx',
    link:{ url:'https://youtube.com/playlist?list=PLuaNqEUb7SmXUdZlHeY4HgbE29TWwfTiW&si=1K-pyHfJoyT9eOG5', label:'Noira на YouTube', aria:'Noira на YouTube' } },
  { word:'Zaryum',          aria:'Zaryum. Проект.',          world:'zaryum',          tiktok:null,                 ring:'dissolve', ringMs:1300, fx:'flash_warm',
    link:{ url:'https://youtube.com/playlist?list=PLuaNqEUb7SmVnWfr6seNIC_8uMPZSc-Xd&si=-vuaO4UCriYOpILv', label:'Zaryum на YouTube', aria:'Zaryum на YouTube' } }
];
// По слову Создателя («нужно разные») — у каждого шага цепочки свой почерк перехода: и в торе
// (ringMode), и в слове (wordFx) — см. таблицу PROJECTS выше. После последнего проекта клик по
// слову больше ничего не делает (цепочка кончилась).
