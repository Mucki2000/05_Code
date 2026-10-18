import { mapSvg } from './map.js';

const P = 'assets/projects/';
const A = 'assets/';
const L = 'Logos/';

// SHA-256 hex of the CURRENT password; set by the owner
export const CURRENT_PASSWORD_HASH = '2638b0b33909bd647264eb703f05ba6fe7953a59e216ead5976abdfb30f40bb8';

export const PROJECTS = {
  ailiens:   { title: 'Ailiens in Lebin', client: 'Constantin Film · Social Media Production', still: P + 'Ailiens%20in%20Lebin.jpg' },
  backrooms: { title: 'Backrooms', client: 'A24 · German Market Social Media Campaign', still: P + 'Backrooms.jpg', portrait: true },
  fifa:      { title: 'FIFA Opening Banquet', client: 'FIFA · Social Media', still: P + 'FIFA%20Opening%20Banquet.avif' },
  denoche:   { title: 'De Noche', client: 'mk2 Films · Social Media Production', still: P + 'mk2%20social%20media%20campaign.webp' },
  euphorie:  { title: 'Euphorie', client: 'RTL+ · Social Media and Content Production', still: P + 'Euphorie_RTL%2B.jpeg' },
  prime:     { title: 'Gerry Star', client: 'Amazon Prime · Social Media', video: P + 'Amazon_Prime_Website.mp4' },
  universal: { title: 'Universal Music', client: 'Music', still: P + 'Universal.jpeg' },
  koechert:  { title: 'A.E. Köchert', client: 'Brand', video: P + 'A.E.Koechert_Website.mp4' },
  boris:     { title: 'Boris Brejcha', client: 'Music', still: P + 'Boris.jpeg' },
  audi:      { title: 'Audi Sport', client: 'Social Media', video: P + 'Audi_Sport_Website.mp4' },
  kleine:    { title: 'Kleine Brüder', client: 'Short Form', video: P + 'Michael%20Short%20%28KF%29_KLEINE_DA.mp4' },
  piote:     { title: 'Café Lockenwickler', client: 'Pioté · Brand', video: P + 'Piote_Cafe_Lockenwickler_Website.mp4', portrait: true },
};

export const CREW = [
  { name: 'Damian Aschenbrenner', photo: A + 'Damian.jpeg', tag: A + 'projects/STICKERS/Damian_Tag_Neu.png' },
  { name: 'Mucki Trauttmansdorff', photo: A + 'photo_5846211468326538391_y.jpg', tag: A + 'projects/STICKERS/Mucki_Tag_NEU.png' },
  { name: 'Maksim Farkas', photo: A + 'Maksim%20Farkas.jpeg', tag: A + 'projects/STICKERS/Maksim_Tag.png' },
  { name: 'Eline Maret', photo: A + 'Eline%20Maret.jpeg', tag: A + 'projects/STICKERS/Eline_Tag.png' },
  { name: 'Arved Friese', photo: A + 'Arved%20Friese%20Neu.jpeg', tag: A + 'projects/STICKERS/Arved_Tag.png' },
  { name: 'Marie Fürstenberg', photo: A + 'Marie%20F%C3%BCrstenberg.jpeg', tag: A + 'projects/STICKERS/Marie.png' },
];

const LOGOS = [
  { src: L + 'Universal-Logo-1997.png', alt: 'Universal', dark: true, large: true },
  { src: L + 'prime-video-horizontal-logo-white-dec-2024.png', alt: 'Prime Video' },
  { src: L + 'constantin_film_trim.png', alt: 'Constantin Film', wide: true },
  { src: L + 'mk2-films.png', alt: 'mk2 Films', dark: true },
  { src: L + 'FIFA.png', alt: 'FIFA' },
  { src: L + 'Kleine%20br%C3%BCder.jpg', alt: 'Kleine Brüder', large: true },
  { src: L + 'piote.png', alt: 'Pioté', small: true },
  { src: L + 'high-view.png', alt: 'High View', thin: true },
];

// The logo row runs as a ticker: the set is rendered twice (the copy hidden
// from screen readers) and the strip slides by exactly one set, so it loops.
const logoItem = (l, hidden) => `<li${hidden ? ' aria-hidden="true"' : ''}><img class="${[l.dark && 'is-dark', l.large && 'is-large', l.wide && 'is-wide', l.thin && 'is-thin', l.small && 'is-small'].filter(Boolean).join(' ')}" src="${l.src}" alt="${hidden ? '' : l.alt}" /></li>`;

const TAGLINE = 'Lausebengel is a production and high-end editing studio built by and for a new generation of filmmakers. Here to bring a changed world to cinemas and to your brands, we speak the language of our time and capture it in pictures.';
const KICKER = 'On-Set Content Production. Social Media Strategy. Editing.';
const EMAIL = 'info@lausebengel.studio';

function tile(id) {
  const p = PROJECTS[id];
  const media = p.video
    ? `<div class="tile__media${p.portrait ? ' is-portrait' : ''}" data-video="${p.video}"><span class="tile__placeholder">${p.title}</span></div>`
    : `<div class="tile__media${p.portrait ? ' is-portrait' : ''}"><img src="${p.still}" alt="${p.title}" loading="lazy" /></div>`;
  return `<li class="tile" id="p-${id}">${media}<p class="tile__client">${p.client}</p><h3 class="tile__title">${p.title}</h3></li>`;
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
        <img class="landing__mark" src="${A}lausebengel-schriftzug.png" alt="Lausebengel" />
        <p class="landing__kicker">${KICKER}</p>
      </div>`;
}

export const APPS = [
  {
    id: 'filmtv', label: 'FILM/TV', icon: 'clapper',
    render: () => intro('Film campaigns and content for cinema and streaming.') + tiles(['ailiens', 'denoche', 'euphorie', 'prime', 'kleine']),
  },
  {
    id: 'unternehmen', label: 'UNTERNEHMEN', icon: 'building',
    render: () => intro('Corporate content and brand films.') + tiles(['piote', 'koechert', 'audi', 'fifa']),
  },
  {
    id: 'musik', label: 'MUSIK', icon: 'note',
    render: () => intro('Content for labels and artists.') + tiles(['universal', 'boris']),
  },
  {
    id: 'current', label: 'CURRENT', icon: 'reel', locked: true,
    render: () => intro('Current projects.') + tiles(['ailiens', 'backrooms', 'fifa']),
  },
  {
    id: 'contact', label: 'CONTACT', icon: 'mail',
    render: () => `
      <div class="about">
        <div class="text">
          <p class="kicker">GET IN TOUCH</p>
          <p><a href="mailto:${EMAIL}">${EMAIL}</a></p>
          <p>We are a small crew and always curious about new people who love film, editing and social media.</p>
        </div>
      </div>`,
  },
  {
    id: 'about', label: 'ABOUT', icon: 'face',
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
          <p class="map__cities">Lissabon · Madrid · Paris · London · Nizza · Genf · Zürich · München · Berlin · Wien</p>
        </section>
        <div class="contact"><span class="contact__label">CONTACT</span><a class="contact__email" href="mailto:${EMAIL}">${EMAIL}</a></div>
      </div>`,
  },
  {
    id: 'bricks', label: 'BRICKS', icon: 'bricks',
    render: () => arcade('MOVE THE MOUSE OR USE THE ARROW KEYS · CLICK TO RESTART'),
  },
  {
    id: 'flappy', label: 'FLAPPY', icon: 'bird',
    render: () => arcade('TAP, CLICK OR PRESS SPACE TO FLAP · CLICK TO RESTART'),
  },
];

// Home desktop. x/y are percentages of the home area for the icon centre on
// desktop, mx/my the same for phones (max-width 720px). The landing content
// sits in the centre (desktop) or the top part (phone), so the icons keep to
// the sides (desktop) or the bottom (phone). Fixed so nothing overlaps.
export const DESKTOP = [
  { type: 'folder', id: 'smp', label: 'SOCIAL MEDIA PRODUCTION', icon: 'folder',
    items: ['filmtv', 'unternehmen', 'musik'], x: 13, y: 74, mx: 30, my: 52 },
  { type: 'app',    id: 'current', x: 90, y: 58, mx: 74, my: 52 },
  { type: 'app',    id: 'contact', x: 70, y: 70, mx: 50, my: 76 },
  { type: 'app',    id: 'about',   x: 35, y: 60, mx: 22, my: 76 },
  { type: 'folder', id: 'games', label: 'GAMES', icon: 'joystick',
    items: ['bricks', 'flappy'], x: 50, y: 84, mx: 80, my: 76 },
];
