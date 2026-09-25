// Notes de bas de page (bloc Note, ARCHITECTURE 7.15) : numérotées dans l'ordre du texte à la compilation,
// puis regroupées en fin de document dans un bloc NotesList, chaque note avec son lien de retour.
// Le texte de la note est repris de la source, avec sa mise en forme (liens, italique).
import { defineMdastPlugin, type MdastPluginDefinition, type MdastVisitorContext, type MdxJsxFlowElement, type MdxJsxTextElement } from 'satteri';

// Fabrique : appelée une fois par document compilé, elle repart d'une liste vide.
export function notesPlugin(): MdastPluginDefinition {
  const notes: string[] = [];
  const handle = (node: Readonly<MdxJsxTextElement | MdxJsxFlowElement>, ctx: MdastVisitorContext) => {
    if (node.name !== 'Note' || node.children.length === 0) return;
    const start = node.children[0]?.position?.start.offset;
    const end = node.children.at(-1)?.position?.end.offset;
    if (start === undefined || end === undefined) return;
    const text = ctx.source.slice(start, end).trim();
    notes.push(text);
    ctx.replaceNode(node, { raw: `<Note n="${notes.length}">${text}</Note>` });
  };
  return defineMdastPlugin({
    name: 'notes-numerotees',
    options: { position: true },
    mdxJsxTextElement: handle,
    mdxJsxFlowElement: handle,
    after(root, ctx) {
      if (notes.length === 0) return;
      const items = notes.map((text, i) => `<NoteItem n="${i + 1}">${text}</NoteItem>`).join('\n');
      ctx.appendChild(root, { raw: `<NotesList>\n${items}\n</NotesList>` });
    },
  });
}
