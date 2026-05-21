'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function FormationViewer() {
  const params = useParams()
  const router = useRouter()
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [slideUrl, setSlideUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchFormation = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: formation } = await supabase
        .from('formations')
        .select('slide_url')
        .eq('id', params.id)
        .single()

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('date_fin, date_debut')
        .eq('user_id', user.id)
        .eq('formation_id', params.id)
        .single()

      if (!enrollment) { router.push('/candidat/formations'); return }
      const now = new Date()
      if (enrollment.date_fin && new Date(enrollment.date_fin) < now) { router.push('/candidat/formations'); return }
      if (enrollment.date_debut && new Date(enrollment.date_debut) > now) { router.push('/candidat/formations'); return }

      setSlideUrl(formation?.slide_url || null)
      setLoading(false)
    }
    fetchFormation()
  }, [])
if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Chargement...</p>
    </div>
  )

  if (!slideUrl) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Aucun contenu disponible</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col select-none" onContextMenu={e => e.preventDefault()}>
      <div className="bg-gray-800 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <button onClick={() => router.push('/candidat/formations')} className="text-gray-300 hover:text-white text-sm">
          Retour aux formations
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="text-white bg-gray-600 px-3 py-1 rounded disabled:opacity-40 hover:bg-gray-500"
          >
            Precedent
          </button>
          <span className="text-white text-sm font-medium">{pageNumber} / {numPages}</span>
          <button
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="text-white bg-gray-600 px-3 py-1 rounded disabled:opacity-40 hover:bg-gray-500"
          >
            Suivant
          </button>
        </div>
        <div className="w-32"></div>
      </div>
      <div className="flex-1 flex items-start justify-center py-8 overflow-auto">
        <Document
          file={slideUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<p className="text-white mt-8">Chargement du PDF...</p>}
          error={<p className="text-red-400 mt-8">Erreur de chargement du PDF</p>}
        >
          <Page
            pageNumber={pageNumber}
            width={Math.min(typeof window !== 'undefined' ? window.innerWidth - 40 : 900, 900)}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  )
}