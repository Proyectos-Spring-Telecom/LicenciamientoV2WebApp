export function nombreArrendador(arrendador?: Record<string, unknown>): string {
  if (!arrendador) return '—';
  const compuesto = [
    arrendador['nombre'],
    arrendador['apellidoPaterno'],
    arrendador['apellidoMaterno'],
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  return compuesto || String(arrendador['razonSocial'] ?? '—');
}

export function esImagenUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url ?? '');
}

export function esImagenArchivo(url?: string, nombre?: string): boolean {
  const ref = `${url ?? ''} ${nombre ?? ''}`;
  return (
    esImagenUrl(ref) ||
    /\.(png|jpe?g|gif|webp|jfif)(\?|$|#)/i.test(ref) ||
    /\.(png|jpe?g|gif|webp|jfif)/i.test(ref)
  );
}

export function esPdfArchivo(url?: string, nombre?: string): boolean {
  if (!url?.trim()) return false;
  const ref = `${url} ${nombre ?? ''}`.toLowerCase();
  return /\.pdf(\?|$|#)/i.test(ref) || ref.includes('pdf');
}

/** URL del PDF sin barra de herramientas, para miniatura en card */
export function urlPdfMiniatura(url: string): string {
  const base = url.trim().split('#')[0];
  return `${base}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
}
