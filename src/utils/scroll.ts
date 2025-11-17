// Helper para desplazamiento común
export function scrollToTop() {
  try {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch {
    window.scrollTo(0, 0);
  }
}

export default scrollToTop;
