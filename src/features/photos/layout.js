/**
 * Distribui as fotos em N colunas, sempre na mais baixa (masonry).
 * Diferente de CSS columns, anexar novas fotos não faz as antigas "pularem".
 */
export function distributeColumns(photos, count) {
  const columns = Array.from({ length: count }, () => []);
  const heights = new Array(count).fill(0);
  for (const photo of photos) {
    const ratio = photo.width && photo.height ? photo.height / photo.width : 1;
    const target = heights.indexOf(Math.min(...heights));
    columns[target].push(photo);
    heights[target] += ratio;
  }
  return columns;
}
