// Abstraction du fournisseur d'infolettre (brief 8.5, ARCHITECTURE 11.1) : abonner, confirmer, désabonner,
// étiqueter, lister. Le site et le Worker ne connaissent que cette interface : changer de fournisseur, c'est
// écrire un autre fichier d'adaptateur. En v1, la confirmation et le désabonnement passent par les liens du
// fournisseur et la liste par son export : ces méthodes le disent explicitement.

// Preuve de consentement, conservée chez le fournisseur avec l'abonné (ARCHITECTURE 11.2).
export type ConsentProof = {
  // Horodatage ISO 8601 de la demande.
  at: string;
  // Adresse de la page d'origine et emplacement du formulaire.
  source: string;
  // Empreinte courte du texte de consentement affiché (le texte se retrouve dans l'historique Git).
  textVersion: string;
  // Empreinte salée de l'adresse IP, jamais l'IP elle-même.
  ipHash: string;
};

export type Subscription = {
  email: string;
  // Identifiant de liste de config/newsletter.json.
  list: string;
  consent: ConsentProof;
  tags: string[];
};

export type Subscriber = { email: string; list: string; status: 'en-attente' | 'confirme' | 'desabonne'; tags: string[] };

// `retryable` : panne passagère du fournisseur (réessayer plus tard), sinon refus définitif.
export class ProviderError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

export class NotUsedError extends Error {
  constructor(operation: string, how: string) {
    super(`${operation} : non utilisé en v1 (${how}).`);
  }
}

export interface NewsletterProvider {
  // Crée l'abonné « en attente » avec sa preuve de consentement; le fournisseur envoie le courriel de
  // confirmation (double consentement). Une adresse déjà inscrite ne provoque pas d'erreur.
  subscribe(subscription: Subscription): Promise<void>;
  confirm(token: string): Promise<void>;
  unsubscribe(email: string, list: string): Promise<void>;
  tag(email: string, tags: string[]): Promise<void>;
  list(list: string): Promise<Subscriber[]>;
}
