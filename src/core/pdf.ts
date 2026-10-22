import { jsPDF } from 'jspdf';
import type { Stop } from './types';

/** Lista de endereços em PDF, uma parada por linha, para o "Import route manifest" do Spoke no iPhone. */
export function buildManifestPdf(stops: Stop[], dateBR: string): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const left = 16;
  const width = 178;
  const bottom = 282;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`Lista de entregas - ${dateBR} - ${stops.length} paradas`, left, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  for (const s of stops) {
    const addr = [s.line1, s.area, `${s.city} - ${s.state}`, s.zip, 'Brasil'].filter(Boolean).join(', ');
    const lines = doc.splitTextToSize(`${s.no}. ${addr}`, width) as string[];
    if (y + lines.length * 6 > bottom) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, left, y);
    y += lines.length * 6 + 3;
  }
  return doc.output('blob');
}
