// Builds the site under a repository subpath and at a domain root, then checks
// that every internal link and asset resolves inside each build.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const configs = [
  { name: 'GitHub Pages subpath', SITE_URL: 'https://ericdf.github.io', BASE_PATH: '/sfbay-access', OUT_DIR: '.build-check/subpath' },
  { name: 'custom domain root', SITE_URL: 'https://bayaccess.example.org', BASE_PATH: '/', OUT_DIR: '.build-check/root' },
];

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });

let failures = 0;
rmSync('.build-check', { recursive: true, force: true });

for (const cfg of configs) {
  const { name, ...env } = cfg;
  console.log(`\n▶ Building: ${name} (base ${env.BASE_PATH})`);
  execFileSync('npx', ['astro', 'build', '--silent'], { stdio: 'inherit', env: { ...process.env, ...env, ASTRO_TELEMETRY_DISABLED: '1' } });

  const base = env.BASE_PATH.replace(/\/?$/, '/');
  const files = htmlFiles(env.OUT_DIR);
  let checked = 0;
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#|data:)/.test(url)) continue;
      checked++;
      if (!url.startsWith(base)) {
        console.error(`  ✗ ${file}: "${url}" does not start with base ${base}`);
        failures++;
        continue;
      }
      const rel = url.slice(base.length).split(/[?#]/)[0];
      const target = join(env.OUT_DIR, rel);
      const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
      if (!ok) {
        console.error(`  ✗ ${file}: "${url}" not found in build`);
        failures++;
      }
    }
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
    for (const m of text.matchAll(/[A-Za-z0-9,.)'’]<(?:a|em|cite|strong)\b|<\/(?:a|em|cite|strong)>[A-Za-z(]/g)) {
      console.error(`  ✗ ${file}: missing space around inline element near "${text.slice(m.index - 20, m.index + 20)}"`);
      failures++;
    }
    const visible = text.replace(/<textarea[\s\S]*?<\/textarea>/g, '').replace(/<[^>]+>/g, '');
    for (const m of visible.matchAll(/\( | \)| ,(?! )/g)) {
      console.error(`  ✗ ${file}: stray space near "${visible.slice(m.index - 20, m.index + 10)}"`);
      failures++;
    }
    if (/<script[^>]*>[^<]*\binnerHTML\b/.test(html)) {
      console.error(`  ✗ ${file}: inline script uses innerHTML`);
      failures++;
    }
  }
  const canonical = readFileSync(join(env.OUT_DIR, 'index.html'), 'utf8').match(/rel="canonical" href="([^"]+)"/)?.[1];
  const expected = new URL(base, env.SITE_URL).href;
  if (canonical !== expected) {
    console.error(`  ✗ canonical URL ${canonical} != ${expected}`);
    failures++;
  }
  console.log(`  ✓ ${files.length} pages, ${checked} internal links checked`);
}

// The client bundle must not use innerHTML with visitor input.
for (const dir of configs.map((c) => join(c.OUT_DIR, '_astro'))) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    if (/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(readFileSync(join(dir, f), 'utf8'))) {
      console.error(`  ✗ ${dir}/${f} uses an HTML-injection API`);
      failures++;
    }
  }
}

rmSync('.build-check', { recursive: true, force: true });
if (failures) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log('\nBuild checks passed.');
