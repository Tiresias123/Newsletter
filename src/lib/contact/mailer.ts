// Envoi des messages du formulaire de contact (brief 8.6, ARCHITECTURE 12.1) : le Worker valide le message et
// le transmet par courriel transactionnel à l'auteur, sans rien conserver. Même principe que l'infolettre : le
// Worker ne connaît que cette interface.
import { t } from '../i18n.ts';

export const CONTACT_TOPICS = ['question', 'erreur', 'suggestion', 'autre'] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export type ContactMessage = { name: string; email: string; topic: ContactTopic; message: string; page: string };
export type OutgoingMail = { to: string; replyTo: { email: string; name: string }; subject: string; text: string };

export interface Mailer {
  send(mail: OutgoingMail): Promise<void>;
}

export class MemoryMailer implements Mailer {
  readonly sent: OutgoingMail[] = [];
  async send(mail: OutgoingMail): Promise<void> {
    this.sent.push(mail);
  }
}

// Courriel reçu par l'auteur : répondre au message répond directement au lecteur.
export function contactMail(message: ContactMessage, to: string, siteName: string): OutgoingMail {
  const topic = t(`contactForm.topics.${message.topic}`);
  const lines = [
    `${t('contactForm.name')} : ${message.name}`,
    `${t('contactForm.email')} : ${message.email}`,
    `${t('contactForm.topic')} : ${topic}`,
    ...(message.page ? [`${t('contactForm.page')} : ${message.page}`] : []),
    '',
    message.message,
  ];
  return {
    to,
    replyTo: { email: message.email, name: message.name },
    subject: t('contactForm.mailSubject', { site: siteName, topic, name: message.name }),
    text: `${lines.join('\n')}\n`,
  };
}
