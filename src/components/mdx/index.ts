// Composants disponibles dans le corps MDX : blocs riches (brief 6.15), blocs de page (6.14), notes générées
// à la compilation, et remplacements d'éléments HTML (tableaux, liens). Contrat : src/lib/content/blocks.ts.
import BlocPartenaire from './BlocPartenaire.astro';
import Callout from './Callout.astro';
import CarteAuteur from './CarteAuteur.astro';
import Chronologie from './Chronologie.astro';
import Citation from './Citation.astro';
import Comparatif from './Comparatif.astro';
import Definition from './Definition.astro';
import ExempleChiffre from './ExempleChiffre.astro';
import FAQ from './FAQ.astro';
import FormulaireContact from './FormulaireContact.astro';
import Hero from './Hero.astro';
import Image from './Image.astro';
import InventaireDonnees from './InventaireDonnees.astro';
import ListeArticles from './ListeArticles.astro';
import ListeSources from './ListeSources.astro';
import MiseEnGarde from './MiseEnGarde.astro';
import Newsletter from './Newsletter.astro';
import Note from './Note.astro';
import NoteItem from './NoteItem.astro';
import NotesList from './NotesList.astro';
import ProseLink from './ProseLink.astro';
import ProseTable from './ProseTable.astro';
import ResponsableProtection from './ResponsableProtection.astro';
import StatutReglementaire from './StatutReglementaire.astro';
import Tableau from './Tableau.astro';
import TexteDeLoi from './TexteDeLoi.astro';
import Video from './Video.astro';

export const mdxComponents = {
  BlocPartenaire,
  Callout,
  CarteAuteur,
  Chronologie,
  Citation,
  Comparatif,
  Definition,
  ExempleChiffre,
  FAQ,
  FormulaireContact,
  Hero,
  Image,
  InventaireDonnees,
  ListeArticles,
  ListeSources,
  MiseEnGarde,
  Newsletter,
  Note,
  NoteItem,
  NotesList,
  ResponsableProtection,
  StatutReglementaire,
  Tableau,
  TexteDeLoi,
  Video,
  a: ProseLink,
  table: ProseTable,
};
