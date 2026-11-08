import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { render, OUTPUTS, SITE } from '../tools/build-pages.mjs';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const template = read('index.html');

test('index.html, de/ and en/ are up to date (run npm run build after editing index.html)', () => {
  for (const [key, file] of Object.entries(OUTPUTS)) {
    assert.equal(read(file), render(template, key), `${file} is out of date`);
  }
});

test('each page has its own title, description, canonical, hreflang set and JSON-LD', () => {
  const titles = new Set();
  for (const [key, file] of Object.entries(OUTPUTS)) {
    const html = read(file);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title && title.includes('Lausebengel'), `${file} title`);
    titles.add(`${key}:${title}`);
    assert.match(html, /<meta name="description" content="[^"]{80,}"/, `${file} description`);
    const path = key === 'root' ? '/' : `/${key}/`;
    assert.ok(html.includes(`<link rel="canonical" href="${SITE}${path}" />`), `${file} canonical`);
    for (const l of ['de', 'en', 'x-default']) assert.ok(html.includes(`hreflang="${l}"`), `${file} hreflang ${l}`);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.+?)<\/script>/)[1]);
    assert.equal(ld['@type'], 'Organization');
    assert.match(html, /<h1 class="sr-only">[^<]+<\/h1>/, `${file} h1`);
  }
  assert.match(read('en/index.html'), /<html lang="en" data-lang="en">/);
  assert.match(read('de/index.html'), /<html lang="de" data-lang="de">/);
  assert.ok(read('en/index.html').includes('<base href="/" />'), 'sub-pages resolve assets from the root');
});
