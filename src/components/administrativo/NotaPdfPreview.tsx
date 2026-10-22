'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Minus, Plus, X } from 'lucide-react';
import { ClayButton } from '@/components/ui/ClayButton';
import { Spinner } from '@/components/ui/Spinner';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import styles from '@/app/atividades/processador-nf/processador-nf.module.css';

export function NotaPdfPreview({ file, onClose }: { file: File; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [rendered, setRendered] = useState(false);
  const [pageText, setPageText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    let active = true;
    let task: PDFDocumentLoadingTask | undefined;
    void (async () => {
      const pdfjs = await import('pdfjs-dist');
      if (!active) return;
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      const data = new Uint8Array(await file.arrayBuffer());
      if (!active) return;
      task = pdfjs.getDocument({ data, useSystemFonts: true });
      const document = await task.promise;
      if (active) setPdf(document);
    })().catch(() => {
      if (active)
        setError('Não foi possível exibir o PDF. Baixe o original para conferir o documento.');
    });
    return () => {
      active = false;
      void task?.destroy().catch(() => {});
    };
  }, [file]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resize = () => setWidth(Math.max(1, container.clientWidth - 24));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf || !width || !canvasRef.current) return;
    let active = true;
    let task: RenderTask | undefined;
    const canvas = canvasRef.current;
    setRendered(false);
    setPageText('');
    setError(null);
    void (async () => {
      const page = await pdf.getPage(pageNumber);
      if (!active) return;
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (width / original.width) * zoom });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      task = page.render({ canvas, viewport, transform: [outputScale, 0, 0, outputScale, 0, 0] });
      const [, text] = await Promise.all([task.promise, page.getTextContent()]);
      if (active) {
        setPageText(text.items.map((item) => ('str' in item ? item.str : '')).join(' '));
        setRendered(true);
      }
    })().catch(() => {
      if (active)
        setError('Não foi possível exibir esta página. Baixe o PDF original para conferir.');
    });
    return () => {
      active = false;
      task?.cancel();
    };
  }, [pdf, pageNumber, width, zoom]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.pdfDialog}
      aria-labelledby="nota-pdf-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.pdfHeader}>
        <div>
          <h2 id="nota-pdf-title">PDF original da nota</h2>
          <p>{file.name}</p>
        </div>
        <ClayButton variant="ghost" iconOnly aria-label="Fechar PDF" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </ClayButton>
      </div>
      <div className={styles.pdfToolbar} aria-label="Controles do PDF">
        <ClayButton
          variant="outline"
          size="sm"
          aria-label="Página anterior"
          disabled={!pdf || pageNumber <= 1}
          onClick={() => setPageNumber(pageNumber - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </ClayButton>
        <span aria-live="polite">
          {pdf ? `Página ${pageNumber} de ${pdf.numPages}` : 'Carregando PDF…'}
        </span>
        <ClayButton
          variant="outline"
          size="sm"
          aria-label="Próxima página"
          disabled={!pdf || pageNumber >= pdf.numPages}
          onClick={() => setPageNumber(pageNumber + 1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </ClayButton>
        <ClayButton
          variant="outline"
          size="sm"
          aria-label="Reduzir PDF"
          disabled={!pdf || zoom <= 0.75}
          onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
        >
          <Minus size={16} aria-hidden="true" />
        </ClayButton>
        <span>{Math.round(zoom * 100)}%</span>
        <ClayButton
          variant="outline"
          size="sm"
          aria-label="Ampliar PDF"
          disabled={!pdf || zoom >= 2}
          onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
        >
          <Plus size={16} aria-hidden="true" />
        </ClayButton>
      </div>
      {error && (
        <p role="alert" className={styles.fieldErrors}>
          {error}
        </p>
      )}
      {!rendered && !error && (
        <p role="status">
          <Spinner size={16} /> Preparando a página…
        </p>
      )}
      <div ref={containerRef} className={styles.pdfDocument} aria-busy={!rendered && !error}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Página ${pageNumber} do PDF original`}
          data-rendered={rendered}
        />
      </div>
      {pageText && (
        <details className={styles.pdfText}>
          <summary>Texto da página</summary>
          <p>{pageText}</p>
        </details>
      )}
      <div className={styles.pdfFooter}>
        {url && (
          <a href={url} download={file.name} className="btn btn--outline">
            <Download size={16} aria-hidden="true" /> Baixar PDF original
          </a>
        )}
        <ClayButton onClick={onClose}>Voltar à conferência</ClayButton>
      </div>
    </dialog>
  );
}
