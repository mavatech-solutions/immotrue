import { jsPDF } from 'jspdf';
import { getPortalById } from '../../../shared/utils/portalDetector';
import type { SavedAnalysis } from '../../../shared/types/index';

const VERDICT_LABEL: Record<string, string> = {
  cheap: 'GÜNSTIG',
  fair: 'FAIR',
  expensive: 'TEUER',
  overpriced: 'ÜBERTEUERT',
};

function euro(value: number | null): string {
  if (value == null) return 'nicht verfügbar';
  return `${value.toLocaleString('de-DE')} €`;
}

export function generateAnalysisPdf(analysis: SavedAnalysis): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const marginX = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 20;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
  };

  const heading = (text: string, size = 13) => {
    ensureSpace(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    doc.text(text, marginX, y);
    y += size / 2 + 3;
  };

  const paragraph = (text: string, size = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, pageWidth - marginX * 2) as string[];
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, marginX, y);
      y += 5.5;
    }
    y += 2;
  };

  const row = (label: string, value: string) => {
    ensureSpace(7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(label, marginX, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - marginX, y, { align: 'right' });
    y += 6.5;
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(46, 91, 196); // accent
  doc.text('ImmoTrue', marginX, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Analyse-Report — erstellt am ${new Date().toLocaleDateString('de-DE')}`, marginX, y);
  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 10;

  // Address + meta
  heading(analysis.address ?? analysis.district ?? analysis.city ?? 'Adresse nicht verfügbar', 15);
  const portal = analysis.portal ? getPortalById(analysis.portal) : undefined;
  const metaParts = [
    analysis.size_sqm ? `${analysis.size_sqm}m²` : null,
    analysis.rooms ? `${analysis.rooms} Zimmer` : null,
    analysis.year_built ? `Baujahr ${analysis.year_built}` : null,
    portal?.name,
  ]
    .filter(Boolean)
    .join(' · ');
  if (metaParts) paragraph(metaParts);
  y += 2;

  // Price
  const verdict = analysis.price_verdict ?? 'fair';
  const price = analysis.current_price ?? analysis.price;
  heading(`${VERDICT_LABEL[verdict]} — ${euro(price)}`, 14);
  if (analysis.price_deviation != null) {
    paragraph(`${Math.abs(analysis.price_deviation)}% ${analysis.price_deviation >= 0 ? 'über' : 'unter'} Marktwert`);
  }
  if (analysis.suggested_offer_price != null) {
    paragraph(`Empfohlenes Angebot: ${euro(analysis.suggested_offer_price)}`);
  }
  y += 4;

  // Metrics
  heading('Kennzahlen', 12);
  row('Kaufpreis/m²', euro(analysis.price_per_sqm));
  row('Mietrendite', analysis.gross_yield != null ? `${analysis.gross_yield}%` : 'nicht verfügbar');
  row('Lage-Score', analysis.location_score != null ? `${analysis.location_score}/10` : 'nicht verfügbar');
  row('Tage inseriert', analysis.days_on_market != null ? `${analysis.days_on_market}` : 'nicht verfügbar');
  row('Kaufnebenkosten', euro(analysis.purchase_costs_total));
  row('Mietschätzung', analysis.estimated_rent != null ? `${euro(analysis.estimated_rent)}/Monat` : 'nicht verfügbar');
  y += 4;

  // AI report
  if (analysis.ai_summary) {
    heading('Preisbewertung', 12);
    paragraph(analysis.ai_summary);
  }

  if (analysis.ai_pros?.length) {
    heading('Vorteile', 12);
    for (const pro of analysis.ai_pros) paragraph(`+ ${pro}`);
  }

  if (analysis.ai_cons?.length) {
    heading('Nachteile', 12);
    for (const con of analysis.ai_cons) paragraph(`− ${con}`);
  }

  if (analysis.ai_risks?.length) {
    heading('Risiken', 12);
    for (const risk of analysis.ai_risks) paragraph(`• ${risk}`);
  }

  if (analysis.risk_breakdown) {
    heading('Risiko-Analyse', 12);
    const labels: Record<string, string> = {
      baujahrRisiko: 'Baujahr-Risiko',
      energieeffizienz: 'Energieeffizienz',
      sanierungsbedarf: 'Sanierungsbedarf',
      lageRisiko: 'Lage-Risiko',
      rechtliches: 'Rechtliches',
    };
    for (const [key, label] of Object.entries(labels)) {
      // Older saved analyses stored a plain number per category instead of
      // { value, reason } — handle both rather than printing "undefined".
      const entry = analysis.risk_breakdown[key as keyof typeof analysis.risk_breakdown] as
        | number
        | { value: number; reason: string };
      const value = typeof entry === 'number' ? entry : entry.value;
      const reason = typeof entry === 'number' ? null : entry.reason;
      row(label, `${value}/100`);
      if (reason) paragraph(reason);
    }
    y += 2;
  }

  if (analysis.ai_recommendation) {
    heading('Empfehlung', 12);
    paragraph(analysis.ai_recommendation);
  }

  if (analysis.ai_negotiation_tip) {
    paragraph(`Verhandlungstipp: ${analysis.ai_negotiation_tip}`);
  }

  if (analysis.ai_forecast_10y) {
    heading('10-Jahres-Prognose', 12);
    paragraph(analysis.ai_forecast_10y);
    if (analysis.ai_forecast_value_10y != null) {
      paragraph(`Geschätzter Wert in 10 Jahren: ${euro(analysis.ai_forecast_value_10y)}`);
    }
  }

  // Footer disclaimer
  ensureSpace(12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    'Automatisch erstellte KI-Analyse, keine Rechts- oder Anlageberatung. Quelle: ' + analysis.original_url,
    marginX,
    pageHeight - 10,
    { maxWidth: pageWidth - marginX * 2 },
  );

  const filename = `immotrue-analyse-${analysis.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}
