'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/lib/auth-context';
import { API_URL } from '@/lib/auth-api';
import { FileText, Download, Loader2, Clock } from 'lucide-react';
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

  const downloadPDF = (docModel: DocumentModel) => {
    const doc = new jsPDF();
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(47, 109, 246); // Signal blue
    doc.text('SignBridge Document Translation', 20, 30);

    // Meta
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const dateStr = new Date(docModel.createdAt).toLocaleString();
    doc.text(`Generated on: ${dateStr}`, 20, 40);
    doc.line(20, 45, 190, 45);

    // Body
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);

    const lines = doc.splitTextToSize(docModel.content, 170);
    doc.text(lines, 20, 60);

    doc.save(`SignBridge_Translation_${docModel.id}.pdf`);
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Saved Documents"
        context="Your translated documents are securely saved here for 7 days. You can re-download them as PDFs at any time."
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
            <div key={doc.id} className="card p-6 flex flex-col hover:border-signal/50 transition cursor-default">
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
              <p className="text-sm text-muted line-clamp-3 mb-6 flex-1">
                {doc.content}
              </p>
              
              <button
                onClick={() => downloadPDF(doc)}
                className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-auto"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
