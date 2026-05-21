'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Formation { id: string; numero: string; titre: string; description: string | null; slide_url: string | null }
interface Quiz { id: string; formation_id: string; titre: string }
interface Enrollment { formation_id: string; date_debut: string | null; date_fin: string | null }

export default function CandidatFormations() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: enr } = await supabase.from('enrollments').select('formation_id, date_debut, date_fin').eq('user_id', user.id)
      setEnrollments(enr || [])
      const formationIds = (enr || []).map(e => e.formation_id)
      if (formationIds.length === 0) { setLoading(false); return }
      const [{ data: forms }, { data: quiz }, { data: res }] = await Promise.all([
        supabase.from('formations').select('*').in('id', formationIds).order('numero'),
        supabase.from('quizzes').select('*').in('formation_id', formationIds),
        supabase.from('quiz_results').select('quiz_id, reussi').eq('user_id', user.id)
      ])
      setFormations(forms || [])
      setQuizzes(quiz || [])
      const resMap: Record<string, boolean> = {}
      res?.forEach(r => { resMap[r.quiz_id] = r.reussi })
      setResults(resMap)
      setLoading(false)
    }
    fetchData()
  }, [])

  const getEnrollment = (fid: string) => enrollments.find(e => e.formation_id === fid)
  const getQuiz = (fid: string) => quizzes.find(q => q.formation_id === fid)
  const getStatus = (fid: string) => {
    const enr = getEnrollment(fid)
    if (!enr) return 'expire'
    const now = new Date()
    if (enr.date_debut && new Date(enr.date_debut) > now) return 'pas_encore'
    if (enr.date_fin && new Date(enr.date_fin) < now) return 'expire'
    return 'actif'
  }
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">LMS Rabelais</h1>
         <div className="flex items-center gap-4">
  <span className="text-gray-500 text-sm">Mes formations</span>
  <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }} className="text-red-500 hover:text-red-700 text-sm font-medium">Déconnexion</button>
</div>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes formations</h2>
        {loading ? <p>Chargement...</p> : formations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-gray-500">Aucune formation assignee pour l instant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formations.map(f => {
              const quiz = getQuiz(f.id)
              const reussi = quiz ? results[quiz.id] : null
              const status = getStatus(f.id)
              const enr = getEnrollment(f.id)
              return (
                <div key={f.id} className={`bg-white rounded-xl shadow-sm border p-6 ${status !== 'actif' ? 'opacity-75' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">{f.numero}</span>
                    <div className="flex gap-2">
                      {status === 'actif' && quiz && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${reussi === true ? 'bg-green-100 text-green-700' : reussi === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                          {reussi === true ? 'Reussi' : reussi === false ? 'Echec' : 'Quiz non fait'}
                        </span>
                      )}
                      {status === 'expire' && <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700">Acces expire</span>}
                      {status === 'pas_encore' && <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">Pas encore ouvert</span>}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{f.titre}</h3>
                  {f.description && <p className="text-gray-500 text-sm mb-2">{f.description}</p>}
                  {enr && <p className="text-xs text-gray-400 mb-4">{fmt(enr.date_debut) && `Du ${fmt(enr.date_debut)}`}{fmt(enr.date_fin) && ` au ${fmt(enr.date_fin)}`}</p>}
                  {status === 'actif' ? (
                    <div className="flex gap-3 mt-4">
                      {f.slide_url && (
                        <button onClick={() => router.push(`/candidat/formation/${f.id}`)} className="flex-1 text-center bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm font-medium">
                          Voir la formation
                        </button>
                      )}
                      {quiz && (
                        <Link href={`/candidat/quiz/${quiz.id}`} className="flex-1 text-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium">
                          {reussi !== null ? 'Refaire le quiz' : 'Passer le quiz'}
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <p className="text-red-600 text-sm font-medium">
                        {status === 'expire' ? 'Votre acces a cette formation a expire.' : `Votre acces ouvrira le ${fmt(enr?.date_debut || null)}`}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}