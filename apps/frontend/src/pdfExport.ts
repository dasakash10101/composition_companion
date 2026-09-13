import type { jsPDF } from 'jspdf';
import type { Section } from './chartTypes';

const PAGE_MARGIN = 15; // mm
const COLUMNS = 4; // bars per row, matching the on-screen layout's rhythm
const BAR_GAP = 4;
const BAR_HEIGHT = 20;
const ROW_GAP = 4;
const SECTION_GAP = 6;

/**
 * Minimal shape of the `downloads` capability this page uses. Declared
 * locally rather than pulling in the platform's ambient types, since this
 * app also runs completely outside any Claude surface (the local dev
 * server, or the standalone single-file build) where `window.claude`
 * doesn't exist at all.
 */
interface DownloadsCapability {
  save(request: { filename: string; data: Blob }): Promise<{ status: 'saved' | 'delivered' }>;
}

declare global {
  interface Window {
    claude?: { use(name: 'downloads'): Promise<DownloadsCapability | null> };
  }
}

/**
 * Saves the finished PDF. When this page is running inside a Claude
 * Artifact viewer, a direct browser download (`doc.save()`) is silently
 * blocked by the sandbox - so it goes through the `downloads` capability
 * instead, which shows the viewer a confirmation. Everywhere else (the
 * local dev app, the standalone shared HTML file opened via file://, or
 * any other hosting), `window.claude` simply doesn't exist, and it falls
 * back to the normal direct download.
 */
async function savePdf(doc: jsPDF, fileName: string): Promise<void> {
  const downloads = await window.claude?.use('downloads').catch(() => null);
  if (downloads) {
    try {
      await downloads.save({ filename: fileName, data: doc.output('blob') });
      return;
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code;
      if (code === 'declined') return; // the viewer said no - not an error
      console.warn('downloads.save failed, falling back to a direct download:', err);
    }
  }
  doc.save(fileName);
}

/**
 * Renders the chart to a PDF and triggers a browser download. Pure
 * client-side - no server round trip - drawing each section's bars as the
 * same bordered-box grid used on screen, wrapping every `COLUMNS` bars onto
 * a new line and paging when a section runs off the bottom of the page.
 *
 * `jspdf` is dynamically imported so its ~500KB doesn't bloat the app's
 * initial load - it's only fetched the first time someone clicks "Download PDF".
 */
export async function downloadChartAsPdf(
  sections: Section[],
  songKey?: string,
  fileName = 'chord-chart.pdf'
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const barWidth = (contentWidth - BAR_GAP * (COLUMNS - 1)) / COLUMNS;

  let y = PAGE_MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text('Chord Progression', PAGE_MARGIN, y + 5);
  y += 10;

  if (songKey) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(110);
    doc.text(`Key: ${songKey}`, PAGE_MARGIN, y);
    y += 8;
  } else {
    y += 3;
  }

  if (sections.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(130);
    doc.text('No sections yet.', PAGE_MARGIN, y + 4);
    await savePdf(doc, fileName);
    return;
  }

  for (const section of sections) {
    ensureSpace(8 + BAR_HEIGHT);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20);
    doc.text(section.label, PAGE_MARGIN, y + 5);

    const labelWidth = doc.getTextWidth(section.label);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`${section.timeSignature}   ·   ${section.tempo} BPM`, PAGE_MARGIN + labelWidth + 6, y + 5);

    y += 10;

    if (section.bars.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(140);
      doc.text('(no bars)', PAGE_MARGIN, y);
      y += ROW_GAP + BAR_HEIGHT;
    } else {
      for (let i = 0; i < section.bars.length; i += COLUMNS) {
        const row = section.bars.slice(i, i + COLUMNS);
        ensureSpace(BAR_HEIGHT);

        row.forEach((bar, colIndex) => {
          const x = PAGE_MARGIN + colIndex * (barWidth + BAR_GAP);

          doc.setDrawColor(60);
          doc.setLineWidth(0.3);
          doc.rect(x, y, barWidth, BAR_HEIGHT);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(140);
          doc.text(String(i + colIndex + 1), x + 2, y + 5);

          const label = bar.chord?.label ?? '';
          if (label) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(20);
            const textWidth = doc.getTextWidth(label);
            doc.text(label, x + barWidth / 2 - textWidth / 2, y + BAR_HEIGHT / 2 + 3);
          }
        });

        y += BAR_HEIGHT + ROW_GAP;
      }
    }

    y += SECTION_GAP;
  }

  await savePdf(doc, fileName);
}
