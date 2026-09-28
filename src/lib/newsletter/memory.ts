// Fournisseur d'infolettre en mémoire, pour les tests et l'essai local du Worker : il applique les mêmes règles
// qu'un vrai fournisseur (abonné en attente jusqu'à confirmation, aucune erreur pour une adresse déjà inscrite).
import type { NewsletterProvider, Subscriber, Subscription } from './provider.ts';

export class MemoryProvider implements NewsletterProvider {
  readonly subscribers = new Map<string, Subscriber & { consent: Subscription['consent'] }>();
  // Courriels de confirmation « envoyés » : un jeton par demande.
  readonly confirmations = new Map<string, string>();

  private key = (email: string, list: string) => `${list}:${email.toLowerCase()}`;

  async subscribe({ email, list, consent, tags }: Subscription): Promise<void> {
    const key = this.key(email, list);
    const existing = this.subscribers.get(key);
    if (existing?.status === 'confirme') return;
    this.subscribers.set(key, { email, list, status: 'en-attente', tags, consent });
    this.confirmations.set(`jeton-${this.confirmations.size + 1}`, key);
  }

  async confirm(token: string): Promise<void> {
    const key = this.confirmations.get(token);
    const subscriber = key ? this.subscribers.get(key) : undefined;
    if (!subscriber) throw new Error('jeton de confirmation inconnu');
    subscriber.status = 'confirme';
  }

  async unsubscribe(email: string, list: string): Promise<void> {
    const subscriber = this.subscribers.get(this.key(email, list));
    if (subscriber) subscriber.status = 'desabonne';
  }

  async tag(email: string, tags: string[]): Promise<void> {
    for (const subscriber of this.subscribers.values()) {
      if (subscriber.email.toLowerCase() === email.toLowerCase()) subscriber.tags = [...new Set([...subscriber.tags, ...tags])];
    }
  }

  async list(list: string): Promise<Subscriber[]> {
    return [...this.subscribers.values()].filter((s) => s.list === list).map(({ email, status, tags }) => ({ email, list, status, tags }));
  }
}
