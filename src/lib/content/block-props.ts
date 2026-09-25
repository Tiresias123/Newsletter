// Propriétés des blocs passées en expression ({[…]}) : validées au rendu, avec un message en français
// qui nomme le bloc. Le script check vérifie seulement leur présence (le contenu est du JavaScript).
import { z } from '../zod.ts';
import { formatProblems, problemsFromZod } from '../errors.ts';
import { calendarDate } from './fields.ts';

const cell = z.union([z.string(), z.number()]).transform(String);

export const blockSchemas = {
  exempleChiffre: z.strictObject({
    rows: z.array(z.strictObject({ label: z.string().min(1), amount: z.number() })).min(1),
    total: z.strictObject({ label: z.string().min(1), amount: z.number() }),
  }),
  chronologie: z.array(z.strictObject({ date: calendarDate(), title: z.string().min(1), description: z.string().default(''), url: z.string().optional() })).min(1),
  table: z.strictObject({ columns: z.array(z.string()).min(1), rows: z.array(z.array(cell)).min(1) }),
  faq: z.array(z.strictObject({ question: z.string().min(1), answer: z.string().min(1) })).min(1),
  ids: z.array(z.string().min(1)),
};

export function parseBlock<S extends z.ZodType>(block: string, schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(`Bloc ${block} mal formé :\n${formatProblems(problemsFromZod(block, result.error))}`);
  return result.data;
}
