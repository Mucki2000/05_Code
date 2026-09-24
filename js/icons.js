// Pixel maps: one string per row, one character per pixel.
// '.' is transparent; other characters look up PALETTE.
export const PALETTE = {
  '#': '#1c2e5c', // navy
  'r': '#e0302a', // red
  'y': '#f2d21e', // yellow
  'g': '#8ec530', // bricks-game green
  'w': '#ffffff',
  'b': '#2e6fd6', // blue
  'o': '#f28a1e', // orange
  'k': '#000000',
  'p': '#e8368f', // pink
  's': '#9aa8b0', // grey
  'c': '#72add6', // case blue
};

export function pixelSvg(rows) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  let out = '';
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = PALETTE[ch];
      if (ch !== '.' && fill) out += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
    });
  });
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
}

const MAPS = {
  house: [
    '................',
    '.......##.......',
    '......#rr#......',
    '.....#rrrr#.....',
    '....#rrrrrr#....',
    '...#rrrrrrrr#...',
    '..#rrrrrrrrrr#..',
    '.##############.',
    '.#yyyyyyyyyyyy#.',
    '.#yybbyyyyybby#.',
    '.#yybbyyy##ybby#',
    '.#yyyyyyy##yyy#.',
    '.#yyyyyyy##yyy#.',
    '.#yyyyyyy##yyy#.',
    '.##############.',
    '................',
  ],
  clapper: [
    '................',
    '.##############.',
    '.#w#w#w#w#w#w##.',
    '.##w#w#w#w#w#w#.',
    '.##############.',
    '.#kkkkkkkkkkkk#.',
    '.#kkkkkkkkkkkk#.',
    '.#kkwwwwwwwwkk#.',
    '.#kkwkkkkkkwkk#.',
    '.#kkwkkkkkkwkk#.',
    '.#kkwwwwwwwwkk#.',
    '.#kkkkkkkkkkkk#.',
    '.#kkkkkkkkkkkk#.',
    '.##############.',
    '................',
    '................',
  ],
  building: [
    '................',
    '....########....',
    '....#ssssss#....',
    '....#sysyys#....',
    '....#ssssss#....',
    '....#sysyys#....',
    '....#ssssss#....',
    '.####sysyys####.',
    '.#ss#ssssss#ss#.',
    '.#ys#sysyys#ys#.',
    '.#ss#ssssss#ss#.',
    '.#ys#sysyys#ys#.',
    '.#ss#ss##ss#ss#.',
    '.#ss#ss##ss#ss#.',
    '.##############.',
    '................',
  ],
  reel: [
    '................',
    '.....######.....',
    '....##ssss##....',
    '...#ss#ww#ss#...',
    '..#ss##ww##ss#..',
    '..#s#s####s#s#..',
    '.#ss#ww##ww#ss#.',
    '.#s##ww##ww##s#.',
    '.#s##ww##ww##s#.',
    '.#ss#ww##ww#ss#.',
    '..#s#s####s#s#..',
    '..#ss##ww##ss#..',
    '...#ss#ww#ss#...',
    '....##ssss##....',
    '.....######.....',
    '................',
  ],
  briefcase: [
    '................',
    '................',
    '.....######.....',
    '.....#....#.....',
    '.##############.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.##############.',
    '.#oooooo##oooo#.',
    '.#oooooo##oooo#.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.##############.',
    '................',
    '................',
  ],
  face: [
    '................',
    '.....######.....',
    '...##yyyyyy##...',
    '..#yyyyyyyyyy#..',
    '.#yyyyyyyyyyyy#.',
    '.#yy##yyyy##yy#.',
    '.#yy##yyyy##yy#.',
    '.#yyyyyyyyyyyy#.',
    '.#yyyyyyyyyyyy#.',
    '.#yy#yyyyyy#yy#.',
    '.#yyy##yy##yyy#.',
    '..#yyyy####yy#..',
    '...##yyyyyy##...',
    '.....######.....',
    '................',
    '................',
  ],
  folder: [
    '................',
    '................',
    '..######........',
    '.#yyyyyy#.......',
    '.#yyyyyyy#######',
    '.#yyyyyyyyyyyyy#',
    '.#yyyyyyyyyyyyy#',
    '.##############.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.#oooooooooooo#.',
    '.##############.',
    '................',
    '................',
  ],
  note: [
    '................',
    '......#########.',
    '......#.......#.',
    '......#.......#.',
    '......#.......#.',
    '......#.......#.',
    '......#.......#.',
    '......#....####.',
    '......#...#####.',
    '..####....#####.',
    '.#####....#####.',
    '.#####.....###..',
    '..###...........',
    '................',
    '................',
    '................',
  ],
  bricks: [
    '................',
    '.rr.oo.yy.gg.bb.',
    '.rr.oo.yy.gg.bb.',
    '................',
    '.oo.yy.gg.bb.pp.',
    '.oo.yy.gg.bb.pp.',
    '................',
    '................',
    '........ww......',
    '........ww......',
    '................',
    '................',
    '................',
    '....######......',
    '....######......',
    '................',
  ],
};

export const ICONS = Object.fromEntries(
  Object.entries(MAPS).map(([k, rows]) => [k, pixelSvg(rows)])
);

export const POWER = pixelSvg([
  '................',
  '.......cc.......',
  '....c..cc..c....',
  '...c...cc...c...',
  '..c....cc....c..',
  '..c....cc....c..',
  '.c.....cc.....c.',
  '.c.....cc.....c.',
  '.c............c.',
  '.c............c.',
  '..c..........c..',
  '..c..........c..',
  '...c........c...',
  '....cc....cc....',
  '......cccc......',
  '................',
]);

export const SIGNAL =
  '<svg viewBox="0 0 9 6" shape-rendering="crispEdges" aria-hidden="true">' +
  '<rect x="0" y="4" width="1" height="2" fill="currentColor"/>' +
  '<rect x="2" y="3" width="1" height="3" fill="currentColor"/>' +
  '<rect x="4" y="2" width="1" height="4" fill="currentColor"/>' +
  '<rect x="6" y="1" width="1" height="5" fill="currentColor"/>' +
  '<rect x="8" y="0" width="1" height="6" fill="currentColor"/>' +
  '</svg>';
