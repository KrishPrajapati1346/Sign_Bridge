'use client';

import { useEffect, useState, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/auth-api';
import { FileText, Download, Loader2, Clock, X, Copy, Check, Printer, Languages } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface DocumentModel {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const { authFetch } = useAuth();
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedDoc, setSelectedDoc] = useState<DocumentModel | null>(null);
  const [lang, setLang] = useState<'en' | 'hi' | 'gu'>('en');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [translating, setTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await authFetch(`${API_URL}/api/documents`);
        if (!res.ok) throw new Error('Failed to fetch documents');
        const data = await res.json();
        setDocuments(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Error loading documents');
      } finally {
        setLoading(false);
      }
    }
    void fetchDocs();
  }, [authFetch]);

  useEffect(() => {
    if (!selectedDoc) return;
    if (lang === 'en') {
      setTranslatedText(selectedDoc.content);
      return;
    }

    let isMounted = true;
    setTranslating(true);
    authFetch(`${API_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: selectedDoc.content, from: 'en', to: lang }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setTranslatedText(data.data.text);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setTranslating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lang, selectedDoc, authFetch]);

  const downloadEnglishPDF = (docModel: DocumentModel, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    const doc = new jsPDF();
    doc.setFont('helvetica');

    doc.setFontSize(22);
    doc.setTextColor(47, 109, 246);
    doc.text('SignBridge Document Translation', 20, 30);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const dateStr = new Date(docModel.createdAt).toLocaleString();
    doc.text(`Generated on: ${dateStr}`, 20, 40);
    doc.line(20, 45, 190, 45);

    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(docModel.content, 170);
    doc.text(lines, 20, 60);

    doc.save(`SignBridge_Translation_${docModel.id}.pdf`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const openModal = (doc: DocumentModel) => {
    setSelectedDoc(doc);
    setLang('en');
    setTranslatedText(doc.content);
  };

  const closeModal = () => {
    setSelectedDoc(null);
  };

  return (
    <div className="animate-fade-up">
      {/* Print-only View (Hidden on screen) */}
      {selectedDoc && (
        <div className="hidden print:block absolute inset-0 bg-white text-black p-8 z-[9999]">
          <h1 className="text-3xl font-bold mb-2">{selectedDoc.title}</h1>
          <p className="text-gray-500 mb-8 pb-4 border-b">
            Translated into {lang === 'hi' ? 'Hindi' : lang === 'gu' ? 'Gujarati' : 'English'} on{' '}
            {new Date(selectedDoc.createdAt).toLocaleString()}
          </p>
          <div className="text-lg whitespace-pre-wrap leading-relaxed">{translatedText}</div>
        </div>
      )}

      <div className="print:hidden">
        <PageHeader
          title="Saved Documents"
          context="Your translated documents are securely saved here for 7 days. You can view, translate, and print them."
        />

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-signal" />
          </div>
        ) : error ? (
          <div className="card p-8 text-center text-beacon bg-beacon/10">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-16 w-16 text-muted/30 mb-4" />
            <h3 className="text-xl font-display font-semibold text-ink">No documents found</h3>
            <p className="text-muted mt-2 max-w-sm">
              You haven't translated any videos into documents in the last 7 days. Head over to Document Translation to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => openModal(doc)}
                className="card p-6 flex flex-col hover:border-signal/50 hover:bg-canvas/50 transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal/10 text-signal">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex items-center text-xs text-muted font-medium bg-canvas px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <h3 className="font-semibold text-ink text-lg truncate mb-2">{doc.title}</h3>
                <p className="text-sm text-muted line-clamp-3 mb-6 flex-1">{doc.content}</p>

                <div className="flex gap-2 mt-auto">
                  <button className="btn-primary flex-1 py-2 text-sm">View & Translate</button>
                  <button
                    onClick={(e) => downloadEnglishPDF(doc, e)}
                    className="btn-secondary px-3"
                    title="Download original English PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View & Translate Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 pt-10 sm:pt-20 print:hidden">
          <div className="bg-surface border border-line rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 mb-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-line bg-canvas/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal/10 text-signal">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink">{selectedDoc.title}</h2>
                  <p className="text-xs text-muted">
                    {new Date(selectedDoc.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-muted hover:text-ink hover:bg-line/50 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="px-6 py-4 border-b border-line flex items-center gap-4 bg-canvas/30">
              <span className="text-sm font-medium text-ink">Translate to:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLang('en')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    lang === 'en' ? 'bg-signal text-white' : 'bg-canvas text-muted hover:bg-line/50'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLang('hi')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    lang === 'hi' ? 'bg-signal text-white' : 'bg-canvas text-muted hover:bg-line/50'
                  }`}
                >
                  Hindi
                </button>
                <button
                  onClick={() => setLang('gu')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    lang === 'gu' ? 'bg-signal text-white' : 'bg-canvas text-muted hover:bg-line/50'
                  }`}
                >
                  Gujarati
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-6 overflow-y-auto flex-1 min-h-[300px]">
              {translating ? (
                <div className="h-full flex flex-col items-center justify-center text-muted">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-signal" />
                  <p>Translating document...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap">
                  {translatedText}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-line bg-canvas/50 rounded-b-2xl flex justify-between">
              <button
                onClick={handlePrint}
                className="btn-secondary px-6 flex items-center gap-2"
                disabled={translating}
              >
                <Printer className="w-4 h-4" />
                Print PDF
              </button>
              
              <button
                onClick={handleCopy}
                className="btn-primary px-6 flex items-center gap-2"
                disabled={translating}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
