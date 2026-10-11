// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initComposer, readInput, type ComposerData } from '../src/lib/composer-client';
import { sampleCampaign } from './helpers';

const data: ComposerData = {
  campaign: sampleCampaign,
  chatgpt: { baseUrl: 'https://chatgpt.com/', prefill: false, maxUrlLength: 6000 },
  claude: { baseUrl: 'https://claude.ai/new' },
  gemini: { baseUrl: 'https://gemini.google.com/app' },
};

// Mirrors the data-* hooks in src/components/ActionComposer.astro.
function mount(): HTMLElement {
  document.body.innerHTML = `
    <div data-composer>
      <script type="application/json" data-composer-data></script>
      <div data-composer-ui hidden>
        <input type="checkbox" name="activity" value="swimming" />
        <input type="checkbox" name="activity" value="windsurfing" />
        <input type="text" name="other_activity" />
        <input type="radio" name="connection" value="use_now" />
        <input type="checkbox" name="factor" value="parking" />
        <input type="checkbox" name="factor" value="water_quality" />
        <textarea name="concern"></textarea>
        <a data-open="chatgpt" href="https://chatgpt.com/">ChatGPT</a>
        <a data-open="claude" href="https://claude.ai/new">Claude</a>
        <a data-open="gemini" href="https://gemini.google.com/app">Gemini</a>
        <button type="button" data-copy-prompt>Copy</button>
        <p role="status" data-status></p>
        <details data-prompt-details><textarea readonly data-prompt-text></textarea></details>
      </div>
    </div>`;
  const root = document.querySelector<HTMLElement>('[data-composer]')!;
  root.querySelector('script')!.textContent = JSON.stringify(data);
  return root;
}

const flush = () => new Promise((r) => setTimeout(r, 80));

describe('composer (browser)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reveals the UI and fills the prompt immediately, with the ask-first line when empty', () => {
    const root = mount();
    initComposer(root);
    expect(root.querySelector('[data-composer-ui]')!.hasAttribute('hidden')).toBe(false);
    const prompt = root.querySelector<HTMLTextAreaElement>('[data-prompt-text]')!.value;
    expect(prompt).toContain('Issue: Protect access to Example Beach');
    expect(prompt).toContain('I have not provided any personal details yet');
  });

  it('never inserts visitor text as HTML', () => {
    const root = mount();
    initComposer(root);
    const exp = root.querySelector<HTMLTextAreaElement>('[name="concern"]')!;
    exp.value = '<img src=x onerror="window.__pwned=1"><b>bold</b>';
    exp.dispatchEvent(new Event('input', { bubbles: true }));
    expect(root.querySelectorAll('img, b')).toHaveLength(0);
    expect(root.querySelector<HTMLTextAreaElement>('[data-prompt-text]')!.value).toContain('<img src=x onerror=');
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it('reads selected activities and free text', () => {
    const root = mount();
    root.querySelector<HTMLInputElement>('input[value="swimming"]')!.checked = true;
    root.querySelector<HTMLInputElement>('input[value="parking"]')!.checked = true;
    root.querySelector<HTMLInputElement>('input[value="use_now"]')!.checked = true;
    root.querySelector<HTMLInputElement>('[name="other_activity"]')!.value = 'snorkeling';
    expect(readInput(root)).toMatchObject({ activities: ['swimming'], factors: ['parking'], connection: 'use_now', otherActivity: 'snorkeling' });
  });

  it('Claude: copies the prompt and opens claude.ai without a prefill parameter', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const root = mount();
    initComposer(root);
    const link = root.querySelector<HTMLAnchorElement>('[data-open="claude"]')!;
    link.addEventListener('click', (e) => e.preventDefault()); // don't navigate in the test
    link.click();
    await flush();
    expect(link.getAttribute('href')).toBe('https://claude.ai/new');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Issue: Protect access to Example Beach'));
    expect(root.querySelector('[data-status]')!.textContent).toMatch(/Prompt copied.*Claude/);
  });

  it('Copy prompt button says what to do next', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const root = mount();
    initComposer(root);
    root.querySelector<HTMLButtonElement>('[data-copy-prompt]')!.click();
    await flush();
    expect(writeText).toHaveBeenCalledOnce();
    expect(root.querySelector('[data-status]')!.textContent).toMatch(/step 2/);
  });

  it('Gemini: copies the prompt and opens gemini.google.com without a prefill parameter', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const root = mount();
    initComposer(root);
    const link = root.querySelector<HTMLAnchorElement>('[data-open="gemini"]')!;
    link.addEventListener('click', (e) => e.preventDefault());
    link.click();
    await flush();
    expect(link.getAttribute('href')).toBe('https://gemini.google.com/app');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Issue: Protect access to Example Beach'));
    expect(root.querySelector('[data-status]')!.textContent).toMatch(/Gemini/);
  });

  it('when clipboard is denied, shows the prompt for manual copying', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const root = mount();
    initComposer(root);
    const link = root.querySelector<HTMLAnchorElement>('[data-open="claude"]')!;
    link.addEventListener('click', (e) => e.preventDefault());
    link.click();
    await flush();
    const details = root.querySelector<HTMLDetailsElement>('[data-prompt-details]')!;
    expect(details.open).toBe(true);
    expect(root.querySelector<HTMLTextAreaElement>('[data-prompt-text]')!.value).toContain('Issue:');
    expect(root.querySelector('[data-status]')!.textContent).toMatch(/Couldn't copy automatically/);
  });

  it('ChatGPT link stays a plain URL while prefill is disabled', () => {
    const root = mount();
    initComposer(root);
    const exp = root.querySelector<HTMLTextAreaElement>('[name="concern"]')!;
    exp.value = 'Something & more';
    exp.dispatchEvent(new Event('input', { bubbles: true }));
    expect(root.querySelector<HTMLAnchorElement>('[data-open="chatgpt"]')!.getAttribute('href')).toBe('https://chatgpt.com/');
  });
});
