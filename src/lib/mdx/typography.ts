// Typographie québécoise dans le corps MDX (point 8.10 du brief) : les espaces insécables sont posées
// à la compilation. Les citations littérales (TexteDeLoi, Citation) et le code restent intacts.
import { defineMdastPlugin, type MdastTarget, type MdastVisitorContext } from 'satteri';
import { frenchTypography } from '../typo.ts';

const VERBATIM = new Set(['TexteDeLoi', 'Citation']);

function insideVerbatim(node: Readonly<MdastTarget>, ctx: MdastVisitorContext): boolean {
  for (let current = ctx.parent(node); current; current = ctx.parent(current)) {
    const parent = current as { type: string; name?: string | null };
    if ((parent.type === 'mdxJsxFlowElement' || parent.type === 'mdxJsxTextElement') && VERBATIM.has(parent.name ?? '')) return true;
  }
  return false;
}

export const typographyPlugin = defineMdastPlugin({
  name: 'typographie-quebecoise',
  text(node, ctx) {
    if (insideVerbatim(node, ctx)) return;
    const value = frenchTypography(node.value);
    if (value !== node.value) ctx.setProperty(node, 'value', value);
  },
});
