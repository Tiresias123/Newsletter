// Version du texte de consentement affiché (ARCHITECTURE 11.2) : empreinte courte calculée au build, envoyée
// avec le formulaire et conservée chez le fournisseur. Le texte de chaque version se retrouve dans Git.
import { createHash } from 'node:crypto';

export const consentVersion = (text: string) => createHash('sha256').update(text.normalize('NFC')).digest('hex').slice(0, 12);
