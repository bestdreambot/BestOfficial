// Цепочка слова — таблица PROJECTS[], не лес if/else (совет Grok, .agents/pablikgrok.md, ровно
// об этом пороге: «данные — таблица PROJECTS[], не лес if/else на 20 проектов»). Каждый шаг:
// слово, world (см. WORLDS/shades в data-worlds.js), tiktok-адрес (null — если Создатель не был уверен в
// адресе, по его прямому слову «если не уверен, не пишите», ссылка тогда просто не показывается),
// ringMode/ringMs/wordFx подобраны по кругу так, чтобы соседние шаги не повторяли друг друга.
// 06.08.2026, Создатель по факту переписки «Руководство проекта Best»: сейчас реально представлены
// (кем-то лично, на бесте) только два проекта — сам Best (Галя) и Aleorix (Алина, «мне надо
// представить алеорикс на бесте»). Остальные ещё не представлены — «потуши чуть все остальные
// торы... только Best яркий и Aleorix яркий, все остальные тусклые». bright:true — единственный
// маркер, который это включает (см. dimPalette() в best-app.js) — не удалять у остальных проектов
// молча, если кто-то представит свой проект, добавить ему bright:true явно, по прямому слову.
// 07.08.2026, Создатель: в карточке нужен статус проекта — сколько клипов, когда первый/последний,
// сколько участников; где данных нет — красный кружок с «?», не пусто и не выдумано. Источник —
// сам Создатель смотрит в TikTok / получает от каждого руководителя проекта, вписывает вручную (без
// автоматики), «по мере получения информации будем заполнять». Необязательные поля на любом объекте
// ниже (не заполнено — карточка сама покажет 🔴? вместо этой строки):
//   clipCount:   42           — всего клипов
//   firstClip:  '2026-01-15'  — дата первого клипа (YYYY-MM-DD)
//   lastClip:   '2026-08-03'  — дата последнего клипа (YYYY-MM-DD), из неё же считается кружок
//                                строки «Последний клип»: 🟢 ≤14 дней, 🟡 ≤30 дней, 🔴 больше месяца.
//   memberCount: 6            — сколько человек на проекте (только у проектов, не у звёзд)
// 08.08.2026, Андрей: два реальных TikTok-аккаунта сознательно НЕ в этой цепочке, пока не задан
// — не забыть, не путать с «упустили»: Arhiv (@best.arhiv.show, исключён ещё в Релизе 1.2 — «в
// официальной версии архив не интересует») и HitParad (@best.my.stars, пока пустой аккаунт без
// видео — «пока что не показывай», как и Arhiv). Не добавлять ни один без нового прямого слова.
var PROJECTS = [
  { word:'Best',            aria:'Best. Проект.',            world:'best',            tiktok:'best.show.official', ring:'portal',   ringMs:1000, fx:'gold_enter',  bright:true },
  { word:'Aleorix',         aria:'Aleorix. Проект.',         world:'aleorix',         tiktok:'aleorix0',           ring:'dissolve', ringMs:1300, fx:'soft_only',   bright:true },
  // 08.08.2026, Андрей прислал скриншот реального аккаунта — адрес был неполным (`best.anibrox`),
  // подтверждён полный: `best.anibrox.show`.
  { word:'Anibrox',         aria:'Anibrox. Проект.',         world:'anibrox',         tiktok:'best.anibrox.show',  ring:'portal',   ringMs:1000, fx:'soft_only'   },
  // 08.08.2026, Андрей: «Олеся настаивает на названии Rush вместо Valmont — да будет так». Название
  // (word/aria/world-палитра) переименовано полностью. TikTok-адрес (`best.valmont.man`) НЕ трогал —
  // это реальный внешний аккаунт, смена имени внутри продукта не значит автоматическую смену самого
  // TikTok-хэндла; если Олеся сменит и аккаунт, нужно отдельное прямое слово Андрея (правило про
  // якорные данные, см. CLAUDE.md).
  { word:'Rush',            aria:'Rush. Проект.',            world:'rush',            tiktok:'best.valmont.man',   ring:'burst',    ringMs:900,  fx:'no_fx'       },
  { word:'Jelly',           aria:'Jelly. Проект.',           world:'jelly',           tiktok:'jelly.show',         ring:'wipe',     ringMs:1100, fx:'flash_warm'  },
  { word:'Dualis',          aria:'Dualis. Проект.',          world:'dualis',          tiktok:'best.duet.show',     ring:'dissolve', ringMs:1300, fx:'flash_warm'  },
  { word:'Animix',          aria:'Animix. Проект.',          world:'animix',          tiktok:'best.anime.show',    ring:'spiral',   ringMs:1200, fx:'streak_only' },
  { word:'Fovela',          aria:'Fovela. Проект.',          world:'fovela',          tiktok:'best_fovela',        ring:'spiral',   ringMs:1200, fx:'gold_enter'  },
  { word:'Grand Show',      aria:'Grand Show. Проект.',      world:'grand_show',      tiktok:'best.grand.show',    ring:'portal',   ringMs:1000, fx:'soft_only'   },
  { word:'Exclusive Stars', aria:'Exclusive Stars. Проект.', world:'exclusive_stars', tiktok:'best.exclusive.stars', ring:'wipe',   ringMs:1100, fx:'no_fx'       },
  // 07.08.2026, Андрей нашёл ещё один проект: «бест ексклюзив мэн @best_exlusive.man, руководитель
  // была Марина Анирам, последний клип в 2021 — уже 5 лет тишины». Ставлю рядом с Exclusive Stars —
  // тот же смысловой ряд, разные миры/цвета, чтобы не путались при листании.
  // 08.08.2026, Андрей: ссылка не работала — в адресе была опечатка (`exlusive` вместо `exclusive`).
  // Подтверждён оригинальный адрес: `best_exclusive.man`.
  { word:'Exclusive Man',   aria:'Exclusive Man. Проект.',   world:'exclusive_man',   tiktok:'best_exclusive.man', ring:'spiral',   ringMs:1200, fx:'streak_only' },
  { word:'Moon',            aria:'Moon. Проект.',            world:'moon',            tiktok:'best.moon.show',     ring:'wipe',     ringMs:1100, fx:'no_fx'       },
  // 07.08.2026, Создатель: «рок парти после моон» — переставлен с самого конца цепочки.
  { word:'Rock Party',      aria:'Rock Party. Проект.',      world:'rock_party',      tiktok:'best.rock.party',    ring:'burst',    ringMs:900,  fx:'no_fx'       },
  { word:'Nerix',           aria:'Nerix. Проект.',           world:'nerix',           tiktok:'best.comedy.show',   ring:'burst',    ringMs:900,  fx:'streak_only' },
  { word:'News',            aria:'News. Проект.',            world:'news',            tiktok:'best.news.show',     ring:'spiral',   ringMs:1200, fx:'gold_enter'  },
  // 07.08.2026, Создатель: «есть ещё проект dances @best.dances.show была руководительница Нюта
  // она почему-то ушла примерно год назад, но тор проекта сделай, поставь его после новости ньюз».
  // TikTok-адрес подтверждён (совпадает с TIKTOK_ROSTER_2026-07-22.md). Нюта не добавлена в
  // PARTICIPANT_CHAIN — она больше не на проекте, добавлять ушедшего человека как активную звезду
  // не стал; если Создатель захочет её как историческую запись — отдельным явным словом.
  { word:'Dances',          aria:'Dances. Проект.',          world:'dances',          tiktok:'best.dances.show',   ring:'wipe',     ringMs:1100, fx:'no_fx'       },
  // 07.08.2026, Андрей подтвердил напрямую: `best.coffee.show`. Раньше в коде стояло `best.cofee.show`
  // (опечатка, ссылка мертва) — архив сам называл `best.coffee.show` «старым хэндлом», но правильный
  // адрес пришёл прямым словом, не из архива — см. правило про якорные данные в CLAUDE.md.
  { word:'Coffee',          aria:'Coffee. Проект.',          world:'coffee',          tiktok:'best.coffee.show',    ring:'dissolve', ringMs:1300, fx:'flash_warm'  },
  { word:'Detski',          aria:'Detski. Проект.',          world:'detski',          tiktok:'best.children.show', ring:'wipe',     ringMs:1100, fx:'no_fx'       },
  { word:'Dostar',          aria:'Dostar. Проект.',          world:'dostar',          tiktok:'best.dostar.show',  ring:'burst',    ringMs:900,  fx:'streak_only' },
  { word:'Finger Dance',    aria:'Finger Dance. Проект.',    world:'finger_dance',    tiktok:'best.finger.dance',  ring:'burst',    ringMs:900,  fx:'streak_only' },
  { word:'ISR',             aria:'ISR. Проект.',             world:'isr',             tiktok:'best.isr.show',      ring:'dissolve', ringMs:1300, fx:'flash_warm'  },
  { word:'Past Legends',    aria:'Past Legends. Проект.',    world:'past_legends',    tiktok:'best.past.legends',  ring:'dissolve', ringMs:1300, fx:'flash_warm'  },
  { word:'Tiretok',         aria:'Tiretok. Проект.',         world:'tiretok',         tiktok:'best.tiretok',       ring:'wipe',     ringMs:1100, fx:'no_fx'       },
  { word:'Tune',            aria:'Tune. Проект.',            world:'tune',            tiktok:'best.tune.show',     ring:'burst',    ringMs:900,  fx:'streak_only' },
  { word:'Vanila',          aria:'Vanila. Проект.',          world:'vanila',          tiktok:'best.vanila.show',   ring:'spiral',   ringMs:1200, fx:'gold_enter'  },
  { word:'Voice',           aria:'Voice. Проект.',           world:'voice',           tiktok:'best.voice.show',    ring:'portal',   ringMs:1000, fx:'soft_only'   },
  { word:'Dream',           aria:'Dream. Проект.',           world:'dream',           tiktok:'best.dream.show',    ring:'portal',   ringMs:1000, fx:'soft_only'   }
];
// 06.08.2026, Создатель, финально: «убери из бест лунора заруум ноира» — Lunora/Noira/Zaryum
// полностью убраны из линейной цепочки PROJECTS (не Best-проекты). Вход в них — только через свой
// отдельный mktor сверху слева (см. LUNORA_CHAIN + enterLunora()/showLunoraStep() в best-app.js),
// то же самое, что «Звёзды» — независимый режим, не шаг в цепочке кликов по слову.
// По слову Создателя («нужно разные») — у каждого шага цепочки свой почерк перехода: и в торе
// (ringMode), и в слове (wordFx) — см. таблицу PROJECTS выше. После последнего проекта клик по
// слову больше ничего не делает (цепочка кончилась).

// Lunora — отдельная маленькая цепочка (тот же приём, что PARTICIPANT_CHAIN у звёзд): клик по
// слову внутри Lunora-режима листает Lunora → Noira → Zaryum → обратно на Lunora, каждый шаг —
// свой цвет и своё слово на ГЛАВНОМ Кторе (не мелкий текст сбоку). Ссылки Noira/Zaryum — реальные,
// из переписки «Руководство проекта Best» (Андрей сам скинул плейлист Zaryum 06.08.2026).
var LUNORA_CHAIN = [
  { word:'Lunora', aria:'Lunora. Проект.', world:'lunora', ring:'spiral',   ringMs:1200 },
  { word:'Noira',  aria:'Noira. Проект.',  world:'noira',  ring:'wipe',     ringMs:1100,
    link:{ url:'https://youtube.com/playlist?list=PLuaNqEUb7SmXUdZlHeY4HgbE29TWwfTiW&si=1K-pyHfJoyT9eOG5', label:'Noira на YouTube', aria:'Noira на YouTube' } },
  { word:'Zaryum', aria:'Zaryum. Проект.', world:'zaryum', ring:'dissolve', ringMs:1300,
    link:{ url:'https://youtube.com/playlist?list=PLuaNqEUb7SmVnWfr6seNIC_8uMPZSc-Xd&si=-vuaO4UCriYOpILv', label:'Zaryum на YouTube', aria:'Zaryum на YouTube' } }
];
