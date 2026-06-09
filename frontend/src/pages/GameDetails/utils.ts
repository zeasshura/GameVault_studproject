export const ratingColor = (r: number) => {
  if (r >= 8) return '#6dc849';
  if (r >= 6) return '#f5c518';
  if (r > 0)  return '#ff6347';
  return 'var(--text-dim)';
};
