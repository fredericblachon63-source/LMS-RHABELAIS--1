'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Result {
  id: string
  score: number
  reussi: boolean
  completed_at: string
  user_id: string
  quiz_id: string
}

interface Profile { id: string; email: string; full_name: string | null }
interface Quiz { id: string; titre: string; formation_id: string; seuil_reussite: number }
interface Formation { id: string; numero: string; titre: string }

export default function AdminResultats() {
  const [results, setResults] = useState<Result[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({})
  const [formations, setFormations] = useState<Record<string, Formation>>({})
  const [loading, setLoading] = useState(true)
  const [filterFormation, setFilterFormation] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: res }, { data: prof }, { data: quiz }, { data: form }] = await Promise.all([
        supabase.from('quiz_results').select('*').order('completed_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'candidate'),
        supabase.from('quizzes').select('*'),
        supabase.from('formations').select('*')
      ])

      setResults(res || [])

      const profMap: Record<string, Profile> = {}
      prof?.forEach(p => { profMap[p.id] = p })
      setProfiles(profMap)

      const quizMap: Record<string, Quiz> = {}
      quiz?.forEach(q => { quizMap[q.id] = q })
      setQuizzes(quizMap)

      const formMap: Record<string, Formation> = {}
      form?.forEach(f => { formMap[f.id] = f })
      setFormations(formMap)

      setLoading(false)
    }
    fetchData()
  }, [])

  const allFormations = Object.values(formations)
  const filtered = filterFormation === 'all' ? results : results.filter(r => {
    const q = quizzes[r.quiz_id]
    return q?.formation_id === filterFormation
  })

  const totalReussi = filtered.filter(r => r.reussi).length
  const tauxReussite = filtered.length > 0 ? Math.round((totalReussi / filtered.length) * 100) : 0
  const scoreMoyen = filtered.length > 0 ? Math.round(filtered.reduce((acc, r) => acc + r.score, 0) / filtered.length) : 0
return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">Retour Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Resultats</h1>
          </div>
          <select value={filterFormation} onChange={e => setFilterFormation(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">Toutes les formations</option>
            {allFormations.map(f => <option key={f.id} value={f.id}>{f.numero} - {f.titre}</option>)}
          </select>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
            <p className="text-3xl font-bold text-gray-900">{filtered.length}</p>
            <p className="text-gray-500 text-sm mt-1">Quiz passes</p>
          </div>
          <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">{totalReussi}</p>
            <p className="text-gray-500 text-sm mt-1">Reussis</p>
          </div>
          <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
            <p className="text-3xl font-bold text-blue-600">{tauxReussite}%</p>
            <p className="text-gray-500 text-sm mt-1">Taux de reussite</p>
          </div>
          <div className="bg-white rounded-xl p-6 border shadow-sm text-center">
            <p className="text-3xl font-bold text-purple-600">{scoreMoyen}%</p>
            <p className="text-gray-500 text-sm mt-1">Score moyen</p>
          </div>
        </div>

        {loading ? <p>Chargement...</p> : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun resultat pour le moment</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Candidat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Formation</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Resultat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(r => {
                  const profile = profiles[r.user_id]
                  const quiz = quizzes[r.quiz_id]
                  const formation = quiz ? formations[quiz.formation_id] : null
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm">{profile?.full_name || 'Inconnu'}</p>
                        <p className="text-gray-400 text-xs">{profile?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">
                          {formation?.numero}
                        </span>
                        <p className="text-gray-600 text-xs mt-1">{formation?.titre}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-lg font-bold ${r.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                          {r.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.reussi ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.reussi ? 'REUSSI' : 'ECHEC'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(r.completed_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}