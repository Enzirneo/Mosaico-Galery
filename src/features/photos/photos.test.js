import { describe, expect, it } from 'vitest';
import { filterPhotos } from './filters';
import { distributeColumns } from './layout';
import { fromPexels, photoKey } from './model';

const photo = (id, width, height, extra = {}) => ({
  id,
  source: 'user',
  title: `Foto ${id}`,
  category: 'Natureza',
  width,
  height,
  ...extra,
});

describe('distributeColumns', () => {
  it('coloca cada foto na coluna mais baixa', () => {
    const [a, b] = distributeColumns([photo(1, 100, 300), photo(2, 100, 100), photo(3, 100, 100)], 2);
    expect(a.map((p) => p.id)).toEqual([1]);
    expect(b.map((p) => p.id)).toEqual([2, 3]);
  });

  it('é estável ao anexar fotos (as antigas não trocam de coluna)', () => {
    const base = [photo(1, 100, 200), photo(2, 100, 100), photo(3, 100, 150)];
    const before = distributeColumns(base, 3).map((c) => c.map((p) => p.id));
    const after = distributeColumns([...base, photo(4, 100, 100)], 3).map((c) => c.map((p) => p.id));
    before.forEach((ids, i) => expect(after[i].slice(0, ids.length)).toEqual(ids));
  });

  it('aguenta fotos sem dimensões', () => {
    expect(distributeColumns([{ id: 1 }, { id: 2 }], 2).flat()).toHaveLength(2);
  });
});

describe('filterPhotos', () => {
  const photos = [
    photo(1, 1, 1, { title: 'Praia ao entardecer', category: 'Natureza' }),
    photo(2, 1, 1, { title: 'Cidade à noite', category: 'Urbano' }),
  ];

  it('ignora acentos e maiúsculas', () => {
    expect(filterPhotos(photos, { query: 'CIDADE A NOITE' }).map((p) => p.id)).toEqual([2]);
  });

  it('combina busca e categoria', () => {
    expect(filterPhotos(photos, { query: 'praia', category: 'Urbano' })).toEqual([]);
    expect(filterPhotos(photos, { category: 'Natureza' }).map((p) => p.id)).toEqual([1]);
  });
});

describe('model', () => {
  it('converte fotos do Pexels e gera chave única por origem', () => {
    const raw = {
      id: 42,
      width: 400,
      height: 600,
      avg_color: '#abc',
      photographer: 'Ana',
      photographer_url: 'https://pexels.com/@ana',
      alt: '',
      src: { large2x: 'big.jpg', large: 'mid.jpg', medium: 'small.jpg' },
    };
    const p = fromPexels(raw, 'Natureza');
    expect(p).toMatchObject({ id: '42', source: 'pexels', title: 'Foto de Ana', url: 'big.jpg', thumb: 'mid.jpg' });
    expect(photoKey(p)).toBe('pexels:42');
  });
});
