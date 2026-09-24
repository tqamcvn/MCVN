import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { initials, membersFromPresence } from './model.mjs';

test('initials and stable unique viewers across tabs', () => {
  assert.equal(initials('Nguyễn Yến Nhi'), 'NN');
  assert.equal(initials(''), '?');
  assert.deepEqual(membersFromPresence({ b: [{ id: 'b' }], a: [{ id: 'a', name: 'Old', updated_at: '1' }, { id: 'a', name: 'New', updated_at: '2' }] }).map(p => [p.id, p.name]), [['a', 'New'], ['b', undefined]]);
});

test('MUI geometry, fallback, overflow, themes and presence lifecycle', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://broken.example/**', route => route.abort());
    await page.setContent(`<html lang="vi"><style>:root{--white:#fff;--accent-light:#e8f0fe;--accent-text:#1a73e8;--gray-600:#6c757d} body{margin:20px;background:var(--white)} .dashboard-viewers{display:flex;align-items:center;gap:10px} #host{display:inline-block;overflow:visible;padding:4px}</style><div id="host"></div></html>`);
    await page.addScriptTag({ path: fileURLToPath(new URL('../../assets/dashboard-presence.js', import.meta.url)) });
    await page.evaluate(() => {
      window.channels = []; window.removed = [];
      window.sb = {
        async rpc(name, { target_id }) { return { data: [{ display_name: `Member ${target_id}`, role: 'QA', team: 'Team Chat' }], error: null }; },
        channel(name) {
          const c = { name, state: {}, tracks: [], on(type, filter, fn) { this.sync = fn; return this; },
            subscribe(fn) { this.status = fn; return this; }, presenceState() { return this.state; },
            async track(data) { this.tracks.push(data); return 'ok'; } };
          channels.push(c); return c;
        }, async removeChannel(c) { removed.push(c.name); }
      };
      window.user = { id: 'self', name: 'Yến Nhi' };
      window.populate = async n => {
        const c = channels.at(-1);
        c.state = Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i), [{ id: String(i), name: `Member ${i}`, picture: i === 0 ? 'https://broken.example/avatar.png' : '' }]]));
        await c.status('SUBSCRIBED'); c.sync();
      };
      TQAPresence.show(sb, user, 'cs-performance', document.getElementById('host'));
    });
    for (const [count, rendered, surplus] of [[0, 0, null], [1, 1, null], [5, 5, null], [8, 5, '+4']]) {
      await page.evaluate(n => populate(n), count);
      await page.waitForFunction(n => document.querySelectorAll('.MuiAvatar-root').length === n, rendered);
      assert.equal(await page.locator('.dashboard-viewers-label').textContent(), `${count} đang xem`);
      if (surplus) assert.equal(await page.locator('.MuiAvatar-root').first().textContent(), surplus);
    }
    await page.waitForFunction(() => document.querySelector('.MuiAvatar-root:last-child').textContent === 'M0');
    assert.equal(await page.locator('img').count(), 0);
    const metrics = await page.locator('.MuiAvatarGroup-root').evaluate(group => {
      const items = [...group.children].reverse();
      return { left: group.getBoundingClientRect().left, items: items.map(item => ({ left: item.getBoundingClientRect().left, width: item.getBoundingClientRect().width, margin: getComputedStyle(item).marginInlineStart, z: +getComputedStyle(item).zIndex, border: getComputedStyle(item).borderColor })) };
    });
    assert.equal(metrics.items[0].left, metrics.left);
    assert.equal(metrics.items[0].margin, '0px');
    assert.equal(metrics.items[1].left - metrics.items[0].left, 22);
    assert.ok(metrics.items[0].z > metrics.items[1].z);
    assert.equal(metrics.items.at(-1).z, 0);
    await page.locator('.MuiAvatarGroup-root button').last().focus();
    await page.keyboard.press('Enter');
    await page.getByRole('dialog').waitFor();
    await page.getByText('Vai trò: QA', { exact: true }).waitFor();
    assert.match(await page.getByRole('dialog').textContent(), /Team Chat/);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.locator('.MuiAvatarGroup-root button').first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Member 7', exact: true }).click();
    await page.getByRole('dialog').getByText('Member 7', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Đóng', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.evaluate(() => { sb.rpc = async () => { throw new Error('Unavailable'); }; });
    await page.locator('.MuiAvatarGroup-root button').last().click();
    await page.getByText('Chưa có thông tin hồ sơ bổ sung.', { exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.evaluate(() => document.documentElement.style.setProperty('--white', '#18212f'));
    assert.equal(await page.locator('.MuiAvatar-root').first().evaluate(el => getComputedStyle(el).borderColor), 'rgb(24, 33, 47)');
    await page.setViewportSize({ width: 360, height: 600 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(async () => {
      TQAPresence.show(sb, user, 'cqm', document.getElementById('host'));
      await channels[0].status('SUBSCRIBED'); channels[0].sync();
    });
    await page.waitForFunction(() => document.querySelectorAll('.MuiAvatar-root').length === 0);
    assert.deepEqual(await page.evaluate(() => removed), ['dashboard-viewers:cs-performance']);
    await page.evaluate(() => populate(2));
    await page.waitForFunction(() => document.querySelectorAll('.MuiAvatar-root').length === 2);
    await page.evaluate(() => channels.at(-1).status('CHANNEL_ERROR'));
    await page.waitForFunction(() => document.querySelectorAll('.MuiAvatar-root').length === 0);
    assert.match(await page.locator('.dashboard-viewers-label').textContent(), /Chưa kết nối/);
    await page.evaluate(() => populate(8));
    await page.waitForFunction(() => document.querySelectorAll('.MuiAvatar-root').length === 5);
    // Exercise the real dashboard styles and toolbar markup as well as the isolated component.
    const dashboard = readFileSync(new URL('../../dashboard.html', import.meta.url), 'utf8');
    const css = [...dashboard.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
    const toolbar = dashboard.match(/    <div class="tool-bar">[\s\S]*?(?=    <iframe)/)[0];
    await page.addStyleTag({ content: css + '\nbody{visibility:visible;display:block;margin:0}.tool-bar-title{flex-shrink:0}' });
    await page.evaluate(html => {
      document.body.insertAdjacentHTML('beforeend', html);
      document.getElementById('tool-title').textContent = 'CS Performance';
      document.getElementById('tool-viewers').append(document.getElementById('host'));
      document.documentElement.style.removeProperty('--white');
    }, toolbar);
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: 200 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      for (const dark of [false, true]) {
        await page.evaluate(dark => document.body.classList.toggle('theme-dark', dark), dark);
        const ringMatchesSurface = await page.locator('.MuiAvatar-root').first().evaluate(el => getComputedStyle(el).borderColor === getComputedStyle(document.querySelector('.tool-bar')).backgroundColor);
        assert.ok(ringMatchesSurface);
      }
    }
    await page.screenshot({ path: 'avatar-group-qa.png' });
    await page.evaluate(() => TQAPresence.stop());
    await page.waitForFunction(() => document.getElementById('host').children.length === 0);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});


