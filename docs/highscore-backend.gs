// Lausebengel high-score service — Google Apps Script bound to a Google Sheet.
// Deploy as a web app (execute as me, access: anyone); see highscore-backend.md.
//
//   GET  ?game=bricks|flappy                 -> { scores: [{ name, score, at }] }
//   POST body: {"game":"bricks","name":"X","score":120}
//                                            -> { scores: [...], rank }
// Errors come back as { error: "..." } with HTTP 200 (Apps Script cannot set
// status codes); the site treats any `error` as a failed request.

var SHEET_NAME = 'scores';
var GAMES = ['bricks', 'flappy'];
var MAX_ENTRIES = 10;
var MAX_NAME = 12;
var MAX_SCORE = 1000000;
var KEEP_PER_GAME = 40;      // rows per game kept in the sheet; the weakest beyond that are deleted

function sheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['game', 'name', 'score', 'at']);
  }
  return sh;
}

// Same rules as cleanName() in js/scores.js.
function cleanName_(raw) {
  var s = String(raw == null ? '' : raw)
    .toUpperCase()
    .replace(/[^A-Z0-9 .\-_ÄÖÜ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME)
    .trim();
  return s || 'ANON';
}

function top_(game) {
  var rows = sheet_().getDataRange().getValues().slice(1);
  var list = [];
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) !== game) continue;
    list.push({ name: cleanName_(rows[i][1]), score: Math.floor(Number(rows[i][2]) || 0), at: Number(rows[i][3]) || 0 });
  }
  list.sort(function (a, b) { return (b.score - a.score) || (a.at - b.at); });
  return list.slice(0, MAX_ENTRIES);
}

// Keep only the best KEEP_PER_GAME rows of a game (ties: older stays).
function prune_(sh, game) {
  var values = sh.getDataRange().getValues();
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) !== game) continue;
    rows.push({ row: i + 1, score: Math.floor(Number(values[i][2]) || 0), at: Number(values[i][3]) || 0 });
  }
  if (rows.length <= KEEP_PER_GAME) return;
  rows.sort(function (a, b) { return (b.score - a.score) || (a.at - b.at); });
  var doomed = rows.slice(KEEP_PER_GAME).map(function (r) { return r.row; }).sort(function (a, b) { return b - a; });
  for (var j = 0; j < doomed.length; j++) sh.deleteRow(doomed[j]);   // bottom-up so row numbers stay valid
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var game = String((e && e.parameter && e.parameter.game) || '');
  if (GAMES.indexOf(game) < 0) return json_({ error: 'unknown game' });
  return json_({ scores: top_(game) });
}

function doPost(e) {
  var body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ error: 'bad json' }); }
  var game = String(body.game || '');
  if (GAMES.indexOf(game) < 0) return json_({ error: 'unknown game' });
  var name = cleanName_(body.name);
  var score = Math.max(0, Math.min(MAX_SCORE, Math.floor(Number(body.score) || 0)));
  var at = Date.now();
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sh = sheet_();
    sh.appendRow([game, name, score, at]);
    prune_(sh, game);
    var list = top_(game);
    var rank = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === name && list[i].score === score && list[i].at === at) { rank = i + 1; break; }
    }
    return json_({ scores: list, rank: rank });
  } finally {
    lock.releaseLock();
  }
}
