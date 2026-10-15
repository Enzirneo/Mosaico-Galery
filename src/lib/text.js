/** Normaliza para comparação: minúsculas e sem acentos ("Praia" ≈ "práia"). */
export const normalize = (s = '') => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
