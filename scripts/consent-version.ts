// npm run consent:version : version du texte de consentement de l'infolettre (CONSENT_TEXT_VERSION chez le
// fournisseur) et texte exact qu'elle désigne (src/lib/newsletter/consent.ts). Pour une version passée : lancer
// la commande sur le commit de l'époque.
import { getConfig } from '../src/lib/config/index.ts';
import { displayedConsent } from '../src/lib/newsletter/consent.ts';

const { newsletter, site } = getConfig();
const { text, version } = displayedConsent(newsletter.texts, site.name);
console.log(`Version ${version} du texte de consentement :\n${text} ${newsletter.texts.privacyLinkLabel}`);
