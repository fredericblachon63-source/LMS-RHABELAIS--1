'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Question {
  id: string
  ordre: number
  type: string
  texte: string
  options: string[] | null
  bonne_reponse: string | null
  points: number
}

interface Quiz {
  id: string
  titre: string
  seuil_reussite: number
  formation_id: string
}

export default function CandidatQuiz() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; total: number; reussi: boolean } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchQuiz = async () => {
      const [{ data: q }, { data: qs }] = await Promise.all([
        supabase.from('quizzes').select('*').eq('id', quizId).single(),
        supabase.from('questions').select('*').eq('quiz_id', quizId).order('ordre')
      ])
      setQuiz(q)
      setQuestions(qs || [])
      setLoading(false)
    }
    fetchQuiz()
  }, [quizId])

const handleSubmit = async () => {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !quiz) return

    let score = 0
    let total = 0
    questions.forEach(q => {
      total += q.points
      const rep = reponses[q.id] || ''
      if (q.bonne_reponse && rep.toLowerCase().trim() === q.bonne_reponse.toLowerCase().trim()) {
        score += q.points
      }
    })

    const pourcentage = total > 0 ? Math.round((score / total) * 100) : 0
    const reussi = pourcentage >= quiz.seuil_reussite

    await supabase.from('quiz_results').upsert({
      user_id: user.id,
      quiz_id: quizId,
      score: pourcentage,
      reponses,
      reussi
    })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const { data: formation } = await supabase
      .from('formations')
      .select('titre')
      .eq('id', quiz.formation_id)
      .single()

    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'recap_admin',
        candidatEmail: profile?.email || user.email,
        candidatNom: profile?.full_name || 'Candidat',
        formationTitre: formation?.titre || 'Formation',
        score: pourcentage,
        adminEmail: 'contact@rhabelais.fr'
      })
    })

    if (reussi) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'attestation',
          candidatEmail: profile?.email || user.email,
          candidatNom: profile?.full_name || 'Candidat',
          formationTitre: formation?.titre || 'Formation',
          score: pourcentage
        })
      })
    }

    setResult({ score: pourcentage, total, reussi })
    setSubmitting(false)
  }
    })

    const pourcentage = total > 0 ? Math.round((score / total) * 100) : 0
    const reussi = pourcentage >= quiz.seuil_reussite

    await supabase.from('quiz_results').upsert({
      user_id: user.id,
      quiz_id: quizId,
      score: pourcentage,
      reponses,
      reussi
    })

    setResult({ score: pourcentage, total, reussi })
    setSubmitting(false)
  }
if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Chargement...</p></div>

  if (result) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{result.reussi ? '' : ''}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {result.reussi ? 'Felicitations !' : 'Dommage...'}
        </h2>
        <p className="text-gray-500 mb-4">
          {result.reussi ? 'Vous avez reussi ce quiz !' : 'Vous n\'avez pas atteint le seuil de reussite.'}
        </p>
        <div className={`text-5xl font-bold mb-2 ${result.reussi ? 'text-green-600' : 'text-red-500'}`}>
          {result.score}%
        </div>
        <p className="text-gray-400 text-sm mb-6">Seuil requis : {quiz?.seuil_reussite}%</p>
        {result.reussi && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm font-medium">Une attestation de reussite vous sera envoyee par email.</p>
          </div>
        )}
        <Link href="/candidat/formations" className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium">
          Retour a mes formations
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/candidat/formations" className="text-gray-500 hover:text-gray-700">Retour</Link>
          <h1 className="text-lg font-bold text-gray-900">{quiz?.titre}</h1>
          <span className="text-gray-400 text-sm">{questions.length} questions</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">Q{i + 1}</span>
                <span className="text-xs text-gray-400">{q.type === 'qcm' ? 'Choix multiple' : 'Reponse libre'} • {q.points} pt</span>
              </div>
              <p className="font-medium text-gray-900 mb-4">{q.texte}</p>
              {q.type === 'qcm' && q.options ? (
                <div className="space-y-2">
                  {q.options.map((opt, j) => (
                    <button
                      key={j}
                      onClick={() => setReponses({...reponses, [q.id]: opt})}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${reponses[q.id] === opt ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={reponses[q.id] || ''}
                  onChange={e => setReponses({...reponses, [q.id]: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Votre reponse..."
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting || Object.keys(reponses).length === 0}
          className="w-full mt-8 bg-purple-600 text-white py-4 rounded-xl hover:bg-purple-700 disabled:opacity-50 font-semibold text-lg transition-colors"
        >
          {submitting ? 'Correction en cours...' : 'Soumettre mes reponses'}
        </button>
      </div>
    </div>
  )
}