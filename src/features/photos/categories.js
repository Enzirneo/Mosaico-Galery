/** `query` é o termo em inglês enviado ao Pexels, que indexa melhor assim. */
export const CATEGORIES = [
  { label: 'Natureza', query: 'nature' },
  { label: 'Urbano', query: 'city street' },
  { label: 'Animais', query: 'animals' },
  { label: 'Tecnologia', query: 'technology' },
  { label: 'Pessoas', query: 'people portrait' },
  { label: 'Comida', query: 'food' },
  { label: 'Carros', query: 'cars' },
  { label: 'Cores', query: 'colorful abstract' },
  { label: 'Arquitetura', query: 'architecture' },
  { label: 'Viagem', query: 'travel' },
];

export const categoryByLabel = (label) => CATEGORIES.find((c) => c.label === label) ?? null;
