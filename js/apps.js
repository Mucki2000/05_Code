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
  { src: L + 'constantin_film.jpg', alt: 'Constantin Film', xl: true },
  { src: L + 'mk2-films.png', alt: 'mk2 Films', dark: true },
  { src: L + 'FIFA.png', alt: 'FIFA' },
  { src: L + 'Kleine%20br%C3%BCder.jpg', alt: 'Kleine Brüder', large: true },
];

const TAGLINE = 'Lausebengel is a production and high-end editing studio built by and for a new generation of filmmakers. Rooted in a distinctly Gen&nbsp;Z sensibility, we champion original voices and ambitious stories built to travel.';
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

export const APPS = [
  {
    id: 'home', label: 'HOME', icon: 'house',
    render: () => `
      <div class="landing">
        <ul class="logos">${LOGOS.map((l) => `<li><img class="${[l.dark && 'is-dark', l.large && 'is-large', l.xl && 'is-xl'].filter(Boolean).join(' ')}" src="${l.src}" alt="${l.alt}" loading="lazy" /></li>`).join('')}</ul>
        <img class="landing__mark" src="${A}lausebengel-logo.png" alt="Lausebengel" />
        <p class="landing__kicker">${KICKER}</p>
        <p class="landing__body">${TAGLINE}</p>
      </div>`,
  },
  {
    id: 'filmtv', label: 'FILM/TV', icon: 'clapper',
    render: () => intro('Film campaigns and content for cinema and streaming.') + tiles(['ailiens', 'denoche', 'euphorie', 'prime', 'kleine', 'backrooms']),
  },
  {
    id: 'unternehmen', label: 'UNTERNEHMEN', icon: 'building',
    render: () => intro('Corporate content and brand films.') + tiles(['koechert', 'audi', 'fifa']),
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
    id: 'career', label: 'CAREER', icon: 'briefcase',
    render: () => `
      <div class="text">
        <p>We are a small crew and always curious about new people who love film, editing and social media.</p>
        <p>Write to us: <a href="mailto:${EMAIL}">${EMAIL}</a></p>
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
    render: () => '<div class="bricks"><div class="bricks__hud"><span id="bricks-score">SCORE 0</span><span id="bricks-lives">LIVES 3</span></div><canvas id="bricks-canvas" width="160" height="100"></canvas><p class="bricks__hint">MOVE THE MOUSE OR USE ← → · CLICK TO RESTART</p></div>',
  },
];

// Home desktop. x/y are percentages of the home area for the icon centre on
// desktop, mx/my the same for phones (max-width 720px). Deliberately uneven,
// like a lived-in desktop, but fixed so nothing overlaps.
export const DESKTOP = [
  { type: 'app',    id: 'home',    x: 12, y: 24, mx: 26, my: 12 },
  { type: 'folder', id: 'smp', label: 'SOCIAL MEDIA PRODUCTION', icon: 'folder',
    items: ['filmtv', 'unternehmen', 'musik'], x: 40, y: 50, mx: 70, my: 30 },
  { type: 'app',    id: 'current', x: 70, y: 18, mx: 28, my: 50 },
  { type: 'app',    id: 'career',  x: 86, y: 64, mx: 74, my: 74 },
  { type: 'app',    id: 'about',   x: 24, y: 76, mx: 30, my: 88 },
  { type: 'app',    id: 'bricks',  x: 58, y: 80, mx: 74, my: 12 },
];
