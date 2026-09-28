// En-têtes de sécurité communs aux fichiers statiques (dist/_headers) et aux réponses du Worker.

// HTTPS seulement pendant un an, sans sous-domaines ni préchargement, quasi irréversibles (ARCHITECTURE 16.1).
export const HSTS = 'max-age=31536000';
export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()';
