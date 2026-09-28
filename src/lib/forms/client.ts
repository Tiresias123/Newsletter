import { track, type AnalyticsEvent } from '../analytics/events.ts';

// Formulaires du site (infolettre, contact), côté navigateur : Turnstile chargé à la première interaction,
// envoi sans rechargement vers le Worker, messages lus dans les attributs du formulaire (textes de config/).
// Chaque succès est signalé à la mesure d'audience (analytics/events.ts), qui le relaie si elle est activée.

type Messages = Record<'sending' | 'success' | 'error' | 'verification' | 'challenge' | 'debit' | 'network' | 'invalide', string>;
type Turnstile = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  reset(widget: string): void;
  getResponse(widget: string): string | undefined;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
    onTurnstileReady?: () => void;
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileReady';
// Délais : chargement du script, jeton d'une vérification invisible, défi interactif résolu par le lecteur.
const LOAD_WAIT_MS = 15_000;
const TOKEN_WAIT_MS = 20_000;
const CHALLENGE_WAIT_MS = 120_000;
// Largeur minimale du widget en taille « flexible »; en deçà (petits écrans), taille compacte.
const FLEXIBLE_MIN_WIDTH = 300;
let loading: Promise<Turnstile> | undefined;

// Script chargé une seule fois; bloqué ou sans réponse, échec au bout de 15 secondes, et nouvel essai possible.
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const fail = () => {
      clearTimeout(timer);
      loading = undefined;
      reject(new Error('turnstile'));
    };
    const timer = setTimeout(fail, LOAD_WAIT_MS);
    window.onTurnstileReady = () => {
      clearTimeout(timer);
      if (window.turnstile) resolve(window.turnstile);
      else fail();
    };
    // Script déjà demandé par un essai trop lent : on attend encore sa réponse, sans le redemander.
    if (document.querySelector(`script[src="${SCRIPT}"]`)) return;
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onerror = () => {
      script.remove();
      fail();
    };
    document.head.append(script);
  });
  return loading;
}

// Chaque formulaire n'est équipé qu'une fois, même si plusieurs composants chargent ce script.
export function enhanceForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>('form[data-site-form]:not([data-enhanced])')) {
    form.dataset.enhanced = 'true';
    enhanceForm(form);
  }
}

class VerificationError extends Error {}

function enhanceForm(form: HTMLFormElement): void {
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const container = form.querySelector<HTMLElement>('[data-turnstile]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const messages = JSON.parse(form.dataset.messages ?? '{}') as Messages;
  const siteKey = form.dataset.sitekey ?? '';
  let widget: string | undefined;
  let token: string | undefined;
  let waiting: ((value: string) => void) | undefined;
  // Défi interactif à l'écran : le lecteur a besoin de temps pour le résoudre.
  let interactive = false;

  const say = (text: string, tone: 'info' | 'success' | 'error') => {
    if (!status) return;
    status.textContent = text;
    status.dataset.tone = tone;
  };

  const prepare = async () => {
    if (widget !== undefined || !siteKey || !container) return;
    const turnstile = await loadTurnstile();
    // Thème choisi sur le site, sinon celui du système.
    const theme = document.documentElement.dataset.theme;
    widget ??= turnstile.render(container, {
      sitekey: siteKey,
      action: form.dataset.action,
      // « fr-ca » n'existe pas chez Turnstile, qui basculerait vers l'anglais.
      language: 'fr',
      theme: theme === 'dark' || theme === 'light' ? theme : 'auto',
      appearance: 'interaction-only',
      size: container.clientWidth >= FLEXIBLE_MIN_WIDTH ? 'flexible' : 'compact',
      // Pas de formulaire de rétroaction envoyé à Cloudflare en cas d'échec.
      'feedback-enabled': false,
      callback: (value: string) => {
        token = value;
        waiting?.(value);
      },
      'before-interactive-callback': () => {
        interactive = true;
        say(messages.challenge, 'info');
      },
      'after-interactive-callback': () => (interactive = false),
      'expired-callback': () => (token = undefined),
      // Erreur prise en charge (message affiché) : rien de plus dans la console.
      'error-callback': () => {
        token = undefined;
        say(messages.verification, 'error');
        return true;
      },
    });
  };

  // Sans clé de site (Turnstile pas encore configuré), pas de jeton : le Worker refusera l'envoi. Sinon, attente
  // du jeton : 20 secondes, ou deux minutes si un défi interactif est à l'écran.
  const getToken = () =>
    token || !siteKey
      ? Promise.resolve(token ?? '')
      : new Promise<string>((resolve, reject) => {
          const started = Date.now();
          let timer: ReturnType<typeof setTimeout>;
          const check = () => {
            if (Date.now() - started < (interactive ? CHALLENGE_WAIT_MS : TOKEN_WAIT_MS)) timer = setTimeout(check, 1000);
            else reject(new VerificationError());
          };
          timer = setTimeout(check, 1000);
          waiting = (value) => {
            clearTimeout(timer);
            resolve(value);
          };
        });

  // Premier contact avec le formulaire : champ qui prend le focus (clic ou tabulation), ou clic direct sur le
  // bouton après un remplissage automatique (Safari ne donne pas le focus au bouton cliqué).
  const start = () => void prepare().catch(() => say(messages.verification, 'error'));
  form.addEventListener('focusin', start, { once: true });
  button?.addEventListener('pointerdown', start, { once: true });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity() || button?.disabled) return;
    if (button) button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    say(messages.sending, 'info');
    // Jeton transmis au Worker : consommé, qu'il soit accepté ou non.
    let used = false;
    try {
      await prepare().catch(() => {
        throw new VerificationError();
      });
      const data = new FormData(form);
      data.set('cf-turnstile-response', await getToken());
      used = true;
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { accept: 'application/json' } });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (result.ok) {
        say(messages.success, 'success');
        form.reset();
        if (form.dataset.event) track(form.dataset.event as AnalyticsEvent, form.dataset.placement ? { placement: form.dataset.placement } : {});
      } else {
        const key = result.error === 'verification' || result.error === 'debit' || result.error === 'invalide' ? result.error : 'error';
        say(messages[key], 'error');
      }
    } catch (error) {
      say(error instanceof VerificationError ? messages.verification : messages.network, 'error');
    } finally {
      // Un jeton ne sert qu'une fois : nouveau défi pour un nouvel envoi. Un défi encore en cours n'est pas relancé.
      if (used) {
        token = undefined;
        if (widget !== undefined) window.turnstile?.reset(widget);
      }
      if (button) button.disabled = false;
      form.removeAttribute('aria-busy');
    }
  });
}

// Formulaire de contact ouvert depuis « Signaler une erreur » : sujet et page concernée préremplis.
export function prefillContact(): void {
  const form = document.querySelector<HTMLFormElement>('form[data-contact-form]');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const topic = form.querySelector<HTMLSelectElement>('select[name="topic"]');
  const wanted = params.get('sujet');
  if (topic && wanted && [...topic.options].some((o) => o.value === wanted)) topic.value = wanted;
  const page = params.get('page') ?? '';
  const input = form.querySelector<HTMLInputElement>('input[name="page"]');
  const display = form.querySelector<HTMLElement>('[data-contact-page]');
  if (input && display && /^\/[\w\-./]{0,299}$/.test(page)) {
    input.value = page;
    const value = display.querySelector<HTMLElement>('[data-contact-page-value]');
    if (value) value.textContent = page;
    display.hidden = false;
    display.classList.remove('hidden');
  }
}
