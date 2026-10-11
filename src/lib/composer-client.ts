/**
 * Browser behavior for the comment composer. Visitor text only ever goes into
 * form fields, `textContent` and `encodeURIComponent` — never innerHTML — and
 * is never sent anywhere by this site.
 */
import { buildPrompt, chatgptHandoff, claudeHandoff, type PromptCampaign, type VisitorInput } from './prompt';

export interface ComposerData {
  campaign: PromptCampaign;
  chatgpt: { baseUrl: string; prefill: boolean; maxUrlLength: number };
  claude: { baseUrl: string };
}

type Provider = 'chatgpt' | 'claude';

const PROVIDER_NAMES: Record<Provider, string> = { chatgpt: 'ChatGPT', claude: 'Claude' };

export function readInput(root: HTMLElement): VisitorInput {
  const activities = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="activity"]:checked')).map(
    (el) => el.value,
  );
  const value = (name: string) => root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value ?? '';
  return {
    activities,
    otherActivity: value('other_activity'),
    experience: value('experience'),
    concern: value('concern'),
  };
}

async function copyText(text: string, fallbackField: HTMLTextAreaElement | null): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the selection-based fallback
  }
  if (fallbackField) {
    try {
      fallbackField.focus();
      fallbackField.select();
      // Deprecated but still the only option in some browsers without clipboard permission.
      if (document.execCommand?.('copy')) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

export function initComposer(root: HTMLElement): void {
  const dataEl = root.querySelector<HTMLScriptElement>('script[data-composer-data]');
  if (!dataEl?.textContent) return;
  const data = JSON.parse(dataEl.textContent) as ComposerData;

  const ui = root.querySelector<HTMLElement>('[data-composer-ui]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const promptField = root.querySelector<HTMLTextAreaElement>('[data-prompt-text]');
  const promptDetails = root.querySelector<HTMLDetailsElement>('[data-prompt-details]');
  const pasteHelp = root.querySelector<HTMLElement>('[data-paste-help]');
  const pasteHelpProvider = root.querySelector<HTMLElement>('[data-paste-help-provider]');
  const links = {
    chatgpt: root.querySelector<HTMLAnchorElement>('[data-open="chatgpt"]'),
    claude: root.querySelector<HTMLAnchorElement>('[data-open="claude"]'),
  };

  ui?.removeAttribute('hidden');

  const say = (message: string) => {
    if (!status) return;
    // Clear first so repeated identical messages are re-announced.
    status.textContent = '';
    window.setTimeout(() => {
      status.textContent = message;
    }, 50);
  };

  const currentPrompt = () => buildPrompt(data.campaign, readInput(root));

  const refresh = () => {
    const prompt = currentPrompt();
    if (promptField) promptField.value = prompt;
    if (links.chatgpt) links.chatgpt.href = chatgptHandoff(prompt, data.chatgpt).url;
    if (links.claude) links.claude.href = claudeHandoff(prompt, data.claude).url;
  };

  const showManualCopy = () => {
    if (promptDetails) promptDetails.open = true;
    promptField?.focus();
    promptField?.select();
  };

  root.addEventListener('input', refresh);
  root.addEventListener('change', refresh);
  refresh();

  (Object.keys(links) as Provider[]).forEach((provider) => {
    const link = links[provider];
    if (!link) return;
    link.addEventListener('click', () => {
      // Let the link open normally (avoids popup blockers). Start the copy inside the same user gesture.
      const prompt = currentPrompt();
      const handoff =
        provider === 'chatgpt' ? chatgptHandoff(prompt, data.chatgpt) : claudeHandoff(prompt, data.claude);
      link.href = handoff.url;
      const name = PROVIDER_NAMES[provider];
      if (pasteHelpProvider) pasteHelpProvider.textContent = name;
      pasteHelp?.removeAttribute('hidden');
      void copyText(prompt, null).then((ok) => {
        if (ok) {
          say(
            handoff.mode === 'prefill'
              ? `Opening ${name} with your prompt. A copy is also on your clipboard if it doesn't appear.`
              : `Prompt copied. Paste it into the ${name} tab that just opened.`,
          );
        } else {
          say(`Couldn't copy automatically. Select the prompt below, copy it, then paste it into ${name}.`);
          showManualCopy();
        }
      });
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-copy-prompt]').forEach((button) => {
    button.addEventListener('click', async () => {
      refresh();
      const ok = await copyText(currentPrompt(), promptField);
      if (ok) {
        say('Prompt copied to your clipboard. Paste it into any chatbot.');
      } else {
        say("Couldn't copy automatically. The prompt is selected below. Copy it with your device's copy command.");
        showManualCopy();
      }
    });
  });
}

/** Copy buttons elsewhere on the page (share link, manual outline). */
export function initCopyButtons(doc: Document = document): void {
  doc.querySelectorAll<HTMLButtonElement>('[data-copy-target]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const target = doc.getElementById(button.dataset.copyTarget ?? '') as HTMLInputElement | HTMLTextAreaElement | null;
      const out = doc.getElementById(button.dataset.copyStatus ?? '');
      if (!target) return;
      const ok = await copyText(target.value, target as HTMLTextAreaElement);
      if (out) {
        out.textContent = ok ? 'Copied.' : 'Selected. Use your device’s copy command.';
      }
      if (!ok) target.select();
    });
  });
}

export function initShare(doc: Document = document): void {
  doc.querySelectorAll<HTMLButtonElement>('[data-share]').forEach((button) => {
    if (!('share' in navigator)) return;
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: button.dataset.shareTitle,
          text: button.dataset.shareText,
          url: button.dataset.shareUrl,
        });
      } catch {
        // User cancelled or sharing unavailable; the copy-link control remains.
      }
    });
  });
}
