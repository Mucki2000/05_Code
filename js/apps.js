import { mapSvg } from './map.js';
import { t } from './i18n.js';

const P = 'assets/projects/';
const A = 'assets/';
const L = 'Logos/';

// SHA-256 hex of the CURRENT password; set by the owner
export const CURRENT_PASSWORD_HASH = '2638b0b33909bd647264eb703f05ba6fe7953a59e216ead5976abdfb30f40bb8';

// client: the small pixel line above the title; role: what we did (credits).
// Texts are { de, en } and resolved once, so the rest of the code sees strings.
const ROLE_FULL = { de: 'Konzept, On-Set-Produktion & Schnitt', en: 'Concept, on-set production & editing' };
const MUSIC_VIDEO = { de: 'Musikvideo', en: 'Music video' };
const RAW_PROJECTS = {
  ailiens:   { title: 'Ailiens in Lebin', client: 'Constantin Film', still: P + 'Ailiens%20in%20Lebin.jpg',
    role: { de: 'In-Character Social Media · Konzeptberatung, Umsetzung & Schnitt', en: 'In-character social media · concept consulting, execution & editing' } },
  backrooms: { title: 'Backrooms', client: 'A24', still: P + 'Backrooms.jpg', portrait: true,
    role: { de: 'Social-Media-Kampagne für den deutschen Markt', en: 'German market social media campaign' } },
  fifa:      { title: 'FIFA Opening Banquet', client: { de: 'FIFA · Kampagnenfilm', en: 'FIFA · Campaign film' }, still: P + 'FIFA%20Opening%20Banquet.avif' },
  denoche:   { title: 'De Noche', client: 'mk2 Films', still: P + 'mk2%20social%20media%20campaign.webp',
    role: { de: 'Social Media Production · Konzept & On-Set-Produktion', en: 'Social media production · concept & on-set production' } },
  euphorie:  { title: 'Euphorie', client: 'RTL+', still: P + 'Euphorie_RTL%2B.jpeg', role: ROLE_FULL },
  prime:     { title: 'Gerry Star', client: 'Amazon Prime', video: P + 'Amazon_Prime_Website.mp4', role: ROLE_FULL },
  universal: { title: 'Universal Music', client: MUSIC_VIDEO, still: P + 'Universal.jpeg' },
  koechert:  { title: 'A.E. Köchert', client: { de: 'Imagefilm', en: 'Image film' }, video: P + 'A.E.Koechert_Website.mp4' },
  boris:     { title: 'Boris Brejcha', client: MUSIC_VIDEO, still: P + 'Boris.jpeg', link: 'https://www.youtube.com/watch?v=i3tfCXGuLhk' },
  philippa:  { title: 'Philippa Kinsky', client: MUSIC_VIDEO, video: P + 'Philippa_Kinsky_Unabh%C3%A4ngige%20K%C3%BCnstlerin.mp4', link: 'https://www.youtube.com/watch?v=ROt23bU_YTo' },
  audi:      { title: 'Audi Sport', client: { de: 'Kampagnenfilm', en: 'Campaign film' }, video: P + 'Audi_Sport_Website.mp4' },
  piote:     { title: 'Café Lockenwickler', client: 'Pioté', video: P + 'Piote_Cafe_Lockenwickler_Website.mp4', portrait: true,
    role: { de: 'Werbekampagne für Schmuck · Werbe-Reels', en: 'Jewellery ad campaign · ad reels' } },
};
export const PROJECTS = Object.fromEntries(Object.entries(RAW_PROJECTS).map(([id, p]) =>
  [id, { ...p, client: t(p.client), role: p.role ? t(p.role) : '' }]));

// Category pages: the apps inside SOCIAL MEDIA PRODUCTION and the sections of
// the scrollable "all work" page below the phone use the same lists.
export const CATEGORIES = [
  { id: 'filmtv', label: 'FILM/TV',
    intro: t({ de: 'Kampagnen und Content für Kino und Streaming.', en: 'Campaigns and content for cinema and streaming.' }),
    items: ['ailiens', 'denoche', 'euphorie', 'prime'] },
  { id: 'unternehmen', label: t({ de: 'UNTERNEHMEN', en: 'BRANDS' }),
    intro: t({ de: 'Wir drehen Social-Media-Werbekampagnen für Unternehmen: Sie kosten weniger als klassische Werbekampagnen und erreichen deutlich mehr Menschen.',
               en: 'We shoot social media ad campaigns for companies: they cost less than classic advertising and reach far more people.' }),
    items: ['piote', 'koechert', 'audi', 'fifa'] },
  { id: 'musik', label: t({ de: 'MUSIK', en: 'MUSIC' }),
    intro: t({ de: 'Musikvideos für Labels und Artists.', en: 'Music videos for labels and artists.' }),
    items: ['boris', 'philippa', 'universal'] },
];
const category = (id) => CATEGORIES.find((c) => c.id === id);

export const CREW = [
  { name: 'Damian Aschenbrenner', photo: A + 'Damian.jpeg', tag: A + 'projects/STICKERS/Damian_Tag_Neu.png' },
  { name: 'Mucki Trauttmansdorff', photo: A + 'photo_5846211468326538391_y.jpg', tag: A + 'projects/STICKERS/Mucki_Tag_NEU.png' },
  { name: 'Maksim Farkas', photo: A + 'Maksim%20Farkas.jpeg', tag: A + 'projects/STICKERS/Maksim_Tag.png' },
  { name: 'Eline Maret', photo: A + 'Eline%20Maret.jpeg', tag: A + 'projects/STICKERS/Eline_Tag.png' },
  { name: 'Arved Friese', photo: A + 'Arved%20Friese%20Neu.jpeg', tag: A + 'projects/STICKERS/Arved_Tag.png' },
  { name: 'Marie Fürstenberg', photo: A + 'Marie%20F%C3%BCrstenberg.jpeg', tag: A + 'projects/STICKERS/Marie.png' },
];

const LOGOS = [
  // goto: where a click on the logo scrolls to on the ALL WORK page.
  { src: L + 'Universal-Logo-1997.png', alt: 'Universal', dark: true, large: true, goto: 'p-universal' },
  { src: L + 'prime-video-horizontal-logo-white-dec-2024.png', alt: 'Prime Video', goto: 'p-prime' },
  { src: L + 'constantin_film_trim.png', alt: 'Constantin Film', wide: true, goto: 'p-ailiens' },
  { src: L + 'mk2-films.png', alt: 'mk2 Films', dark: true, goto: 'p-denoche' },
  { src: L + 'FIFA.png', alt: 'FIFA', goto: 'p-fifa' },
  { src: L + 'Kleine%20br%C3%BCder.jpg', alt: 'Kleine Brüder', large: true, goto: 'work-filmtv' },
  { src: L + 'piote.png', alt: 'Pioté', small: true, goto: 'p-piote' },
  { src: L + 'high-view.png', alt: 'High View', thin: true, goto: 'work-unternehmen' },
];

// The logo row runs as a ticker: the set is rendered twice (the copy hidden
// from screen readers and the tab order) and the strip slides by exactly one
// set, so it loops. Each logo is a button to its project on the ALL WORK page.
const logoItem = (l, hidden) => `<li${hidden ? ' aria-hidden="true"' : ''}><button class="logo-btn" type="button" data-goto="${l.goto}"${hidden ? ' tabindex="-1"' : ''}><img class="${[l.dark && 'is-dark', l.large && 'is-large', l.wide && 'is-wide', l.thin && 'is-thin', l.small && 'is-small'].filter(Boolean).join(' ')}" src="${l.src}" alt="${hidden ? '' : l.alt}" /></button></li>`;

const TAGLINE = t({
  de: 'Lausebengel ist ein Produktions- und High-End-Editing-Studio, von und für eine neue Generation von Filmemacher:innen. Wir bringen eine veränderte Welt ins Kino und zu euren Marken: Wir sprechen die Sprache unserer Zeit und halten sie in Bildern fest.',
  en: 'Lausebengel is a production and high-end editing studio built by and for a new generation of filmmakers. Here to bring a changed world to cinemas and to your brands, we speak the language of our time and capture it in pictures.',
});
const KICKER = t({ de: 'On-Set-Content-Produktion. Social-Media-Strategie. Schnitt.', en: 'On-Set Content Production. Social Media Strategy. Editing.' });
export const EMAIL = 'info@lausebengel.studio';
export const INSTAGRAM = 'https://www.instagram.com/lausebengalo/';
const igLink = (cls) => `<a${cls ? ` class="${cls}"` : ''} href="${INSTAGRAM}" target="_blank" rel="noopener">Instagram @lausebengalo</a>`;
export const IMPRESSUM_URL = 'impressum.html';
const IMPRESSUM = t({ de: 'Impressum', en: 'Legal notice' });

function tile(id) {
  const p = PROJECTS[id];
  const media = p.video
    ? `<div class="tile__media${p.portrait ? ' is-portrait' : ''}" data-video="${p.video}"><span class="tile__placeholder">${p.title}</span></div>`
    : `<div class="tile__media${p.portrait ? ' is-portrait' : ''}"><img src="${p.still}" alt="${p.title}" loading="lazy" /></div>`;
  const role = p.role ? `<p class="tile__role">${p.role}</p>` : '';
  const link = p.link ? `<a class="tile__link" href="${p.link}" target="_blank" rel="noopener">${t({ de: 'Auf YouTube ansehen', en: 'Watch on YouTube' })} &#8599;</a>` : '';
  return `<li class="tile" id="p-${id}">${media}<p class="tile__client">${p.client}</p><h3 class="tile__title">${p.title}</h3>${role}${link}</li>`;
}
const tiles = (ids) => `<ul class="tiles">${ids.map(tile).join('')}</ul>`;

const intro = (text) => `<p class="intro">${text}</p>`;

// BRICKS and FLAPPY share one arcade panel (startArcade in main.js): HUD,
// canvas in a wrap that also holds the overlays, a hint line, and the
// high-score board. Only one panel is open at a time, so the ids are shared.
const arcade = (hint) => `
      <div class="bricks">
        <div class="bricks__game">
          <div class="bricks__hud"><span id="bricks-score">SCORE 0</span></div>
          <div class="bricks__wrap"><canvas id="bricks-canvas" width="160" height="100"></canvas></div>
          <p class="bricks__hint">${hint}</p>
        </div>
        <aside class="board" aria-label="High scores">
          <p class="board__title">HIGH SCORES</p>
          <ol class="board__list" id="board-list"></ol>
          <form class="board__form" id="board-form" hidden>
            <p class="board__prompt" id="board-prompt">GAME OVER · SCORE 0</p>
            <label class="board__label" for="board-name">YOUR NAME</label>
            <input class="board__input" id="board-name" type="text" maxlength="12" autocomplete="off" spellcheck="false" />
            <button class="board__save" type="submit">SAVE</button>
          </form>
          <p class="board__note" id="board-note" hidden></p>
        </aside>
      </div>`;

// Landing: the centre piece of the desktop (renderHome in main.js), logos on
// top, then the wordmark, the kicker and the tagline. No app of its own.
// The images load eagerly: the desktop is rendered while the boot screen is
// still up (display: none), where lazy images would not start, and they must
// be in place before the zoom shows the desktop.
export function landingHtml() {
  return `
      <div class="landing">
        <div class="marquee"><ul class="logos">${LOGOS.map((l) => logoItem(l, false)).join('')}${LOGOS.map((l) => logoItem(l, true)).join('')}</ul></div>
        <button class="landing__markbtn" type="button" data-goto="work" aria-label="${t({ de: 'Alle Arbeiten', en: 'All work' })}"><img class="landing__mark" src="${A}lausebengel-schriftzug.png" alt="Lausebengel" /></button>
        <p class="landing__kicker">${KICKER}</p>
      </div>`;
}

const categoryApp = (id, icon) => {
  const c = category(id);
  return { id, label: c.label, icon, render: () => intro(c.intro) + tiles(c.items) };
};

export const APPS = [
  categoryApp('filmtv', 'clapper'),
  categoryApp('unternehmen', 'building'),
  categoryApp('musik', 'note'),
  {
    id: 'current', label: t({ de: 'AKTUELL', en: 'CURRENT' }), icon: 'reel', locked: true,
    render: () => intro(t({ de: 'Aktuelle Projekte.', en: 'Current projects.' })) + tiles(['piote', 'ailiens', 'backrooms', 'fifa']),
  },
  {
    id: 'contact', label: t({ de: 'KONTAKT', en: 'CONTACT' }), icon: 'mail',
    render: () => `
      <div class="about">
        <div class="text">
          <p class="kicker">${t({ de: 'SCHREIB UNS', en: 'GET IN TOUCH' })}</p>
          <p><a href="mailto:${EMAIL}">${EMAIL}</a></p>
          <p>${igLink()}</p>
          <p>${t({ de: 'Wir sind eine kleine Crew und immer neugierig auf neue Leute, die Film, Schnitt und Social Media lieben.', en: 'We are a small crew and always curious about new people who love film, editing and social media.' })}</p>
          <p><a href="${IMPRESSUM_URL}">${IMPRESSUM}</a></p>
        </div>
      </div>`,
  },
  {
    id: 'about', label: t({ de: 'ÜBER UNS', en: 'ABOUT' }), icon: 'face',
    render: () => `
      <div class="about">
        <div class="text"><p>${TAGLINE}</p><p class="kicker">${KICKER}</p></div>
        <ul class="crew">${CREW.map((c) => `
          <li class="crew__member">
            <div class="crew__photo"><img src="${c.photo}" alt="${c.name}" loading="lazy" /></div>
            <img class="crew__tag" src="${c.tag}" alt="" />
            <span class="crew__name">${c.name}</span>
          </li>`).join('')}</ul>
        <section class="map">
          <p class="map__title">ON LOCATION</p>
          <div class="map__frame">${mapSvg()}</div>
          <p class="map__cities">${t({ de: 'Lissabon · Madrid · Paris · London · Nizza · Genf · Zürich · München · Berlin · Wien', en: 'Lisbon · Madrid · Paris · London · Nice · Geneva · Zurich · Munich · Berlin · Vienna' })}</p>
        </section>
        <div class="contact"><span class="contact__label">${t({ de: 'KONTAKT', en: 'CONTACT' })}</span><a class="contact__email" href="mailto:${EMAIL}">${EMAIL}</a>${igLink('contact__email')}</div>
      </div>`,
  },
  {
    id: 'bricks', label: 'BRICKS', icon: 'bricks',
    render: () => arcade(t({ de: 'MAUS ODER PFEILTASTEN · KLICK ZUM NEUSTART', en: 'MOVE THE MOUSE OR USE THE ARROW KEYS · CLICK TO RESTART' })),
  },
  {
    id: 'flappy', label: 'FLAPPY', icon: 'bird',
    render: () => arcade(t({ de: 'TIPPEN, KLICKEN ODER LEERTASTE · KLICK ZUM NEUSTART', en: 'TAP, CLICK OR PRESS SPACE TO FLAP · CLICK TO RESTART' })),
  },
];

// "All work": the page section below the phone (scroll down). Every public
// project with its credits, by category, then contact and the legal notice.
export function workHtml() {
  return `
    <div class="work__inner">
      <h2 class="work__title">${t({ de: 'ALLE ARBEITEN', en: 'ALL WORK' })}</h2>
      ${CATEGORIES.map((c) => `
      <section class="work__group" id="work-${c.id}">
        <h3 class="work__heading">${c.label}</h3>
        ${intro(c.intro)}
        ${tiles(c.items)}
      </section>`).join('')}
      <footer class="work__footer">
        <a href="mailto:${EMAIL}">${EMAIL}</a>
        ${igLink()}
        <a href="${IMPRESSUM_URL}">${IMPRESSUM}</a>
        <span class="lang-switch" data-lang-switch></span>
      </footer>
    </div>`;
}

// Home desktop. x/y are percentages of the home area for the icon centre on
// desktop, mx/my the same for phones (max-width 720px). The landing content
// sits in the centre (desktop) or the top part (phone), so the icons keep to
// the sides (desktop) or the bottom (phone). Fixed so nothing overlaps.
export const DESKTOP = [
  { type: 'folder', id: 'smp', label: 'SOCIAL MEDIA PRODUCTION', icon: 'folder',
    items: ['filmtv', 'unternehmen', 'musik'], x: 13, y: 74, mx: 20, my: 52 },
  { type: 'app',    id: 'current', x: 90, y: 58, mx: 80, my: 52 },
  { type: 'app',    id: 'contact', x: 70, y: 70, mx: 50, my: 76 },
  { type: 'app',    id: 'about',   x: 35, y: 60, mx: 20, my: 76 },
  { type: 'folder', id: 'games', label: 'GAMES', icon: 'joystick',
    items: ['bricks', 'flappy'], x: 50, y: 84, mx: 80, my: 76 },
  // External link (opens a new tab).
  { type: 'link', id: 'instagram', label: 'INSTAGRAM', icon: 'camera', href: INSTAGRAM,
    x: 88, y: 82, mx: 50, my: 52 },
];
