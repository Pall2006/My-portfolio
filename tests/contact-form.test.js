// Тесты формы обратной связи: настоящие index.html и js/contact-form.js в jsdom,
// подменяется только fetch, чтобы не слать настоящих писем
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js', 'contact-form.js'), 'utf8');

// Страница с формой; каждый вызов fetch записывается, сервис отвечает «принято»
function openPage() {
  const { window } = new JSDOM(html, { runScripts: 'outside-only' });
  const requests = [];
  window.fetch = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };
  window.eval(script);
  return { document: window.document, requests };
}

async function submit(document, message) {
  const form = document.getElementById('contact-form');
  form.elements.name.value = 'Анна';
  form.elements.email.value = 'anna@example.com';
  form.elements.message.value = message;
  form.querySelector('button[type="submit"]').click();
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

function isShown(document, id) {
  const el = document.getElementById(id);
  return el !== null && !el.hidden;
}

test('сообщение длиннее 1000 символов не отправляется и показывает ошибку длины', async () => {
  const { document, requests } = openPage();
  await submit(document, 'а'.repeat(1500));
  assert.strictEqual(requests.length, 0, 'запрос к Web3Forms не должен уходить');
  assert.ok(isShown(document, 'contact-too-long'), 'надпись о длине должна быть видна');
  assert.ok(!isShown(document, 'contact-error'), 'надпись «Не удалось отправить» не должна появляться');
  assert.ok(!document.getElementById('contact-box').classList.contains('sent'), '«Спасибо!» не должно показываться');
  assert.strictEqual(document.querySelector('textarea[name="message"]').value.length, 1500, 'текст должен остаться в поле');
});

test('1001 символ — уже слишком длинно', async () => {
  const { document, requests } = openPage();
  await submit(document, 'а'.repeat(1001));
  assert.strictEqual(requests.length, 0);
  assert.ok(isShown(document, 'contact-too-long'));
});

test('ровно 1000 символов отправляются', async () => {
  const { document, requests } = openPage();
  await submit(document, 'а'.repeat(1000));
  assert.strictEqual(requests.length, 1);
  assert.strictEqual(requests[0].body.message.length, 1000);
  assert.ok(!isShown(document, 'contact-too-long'));
  assert.ok(document.getElementById('contact-box').classList.contains('sent'));
});

test('обычное сообщение на 200 символов отправляется', async () => {
  const { document, requests } = openPage();
  await submit(document, 'а'.repeat(200));
  assert.strictEqual(requests.length, 1);
  assert.ok(!isShown(document, 'contact-too-long'));
  assert.ok(document.getElementById('contact-box').classList.contains('sent'));
});

test('после сокращения текста надпись о длине исчезает и сообщение уходит', async () => {
  const { document, requests } = openPage();
  await submit(document, 'а'.repeat(1500));
  await submit(document, 'а'.repeat(900));
  assert.strictEqual(requests.length, 1);
  assert.ok(!isShown(document, 'contact-too-long'));
  assert.ok(document.getElementById('contact-box').classList.contains('sent'));
});
