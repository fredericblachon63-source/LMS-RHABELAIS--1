'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Formation { id: string; numero: string; titre: string }
interface Quiz { id: string; formation_id: string; titre: string; seuil_reussite: number }
interface Question { id: string; quiz_id: string; ordre: number; type: string; texte: string; options: string[] | null; bonne_reponse: string | null; points: number }

export default function AdminQuiz() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null)
  const [showQuizForm, setShowQuizForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [message, setMessage] = useState('')
  const [quizForm, setQuizForm] = useState({ formation_id: '', titre: '', seuil_reussite: 70 })
  const [questionForm, setQuestionForm] = useState({ type: 'qcm', texte: '', options: ['', '', '', ''], bonne_reponse: '', points: 1 })
  const supabase = createClient()

  const fetchData = async () => {
    const [{ data: f }, { data: q }] = await Promise.all([
      supabase.from('formations').select('*').order('numero'),
      supabase.from('quizzes').select('*').order('titre')
    ])
    setFormations(f || [])
    setQuizzes(q || [])
    setLoading(false)
  }

  const fetchQuestions = async (quizId: string) => {
    const { data } = await supabase.from('questions').select('*').eq('quiz_id', quizId).order('ordre')
    setQuestions(data || [])
  }

  useEffect(() => { fetchData() }, [])

  const handleSelectQuiz = (quizId: string) => {
    setSelectedQuiz(quizId)
    fetchQuestions(quizId)
    setShowQuestionForm(false)
  }

  const handleCreateQuiz = async () => {
    if (!quizForm.formation_id || !quizForm.titre) { setMessage('Formation et titre obligatoires'); return }
    await supabase.from('quizzes').insert(quizForm)
    setMessage('Quiz cree')
    setShowQuizForm(false)
    setQuizForm({ formation_id: '', titre: '', seuil_reussite: 70 })
    fetchData()
  }

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Supprimer ce quiz et toutes ses questions ?')) return
    await supabase.from('quizzes').delete().eq('id', id)
    setSelectedQuiz(null)
    setQuestions([])
    setMessage('Quiz supprime')
    fetchData()
  }

  const handleAddQuestion = async () => {
    if (!questionForm.texte || !selectedQuiz) return
    const opts = questionForm.type === 'qcm' ? questionForm.options.filter(o => o.trim() !== '') : null
    await supabase.from('questions').insert({
      quiz_id: selectedQuiz,
      ordre: questions.length + 1,
      type: questionForm.type,
      texte: questionForm.texte,
      options: opts,
      bonne_reponse: questionForm.bonne_reponse,
      points: questionForm.points
    })
    setMessage('Question ajoutee')
    setShowQuestionForm(false)
    setQuestionForm({ type: 'qcm', texte: '', options: ['', '', '', ''], bonne_reponse: '', points: 1 })
    fetchQuestions(selectedQuiz)
  }

  const handleDeleteQuestion = async (id: string) => {
    await supabase.from('questions').delete().eq('id', id)
    if (selectedQuiz) fetchQuestions(selectedQuiz)
  }

  const getFormationTitre = (id: string) => {
    const f = formations.find(x => x.id === id)
    return f ? f.numero + ' - ' + f.titre : 'Inconnue'
  }
return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">Retour Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Quiz</h1>
          </div>
          <button onClick={() => setShowQuizForm(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium">+ Nouveau quiz</button>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
        {showQuizForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
            <h2 className="text-lg font-semibold mb-4">Nouveau quiz</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
                <select value={quizForm.formation_id} onChange={e => setQuizForm({...quizForm, formation_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Choisir une formation</option>
                  {formations.filter(f => !quizzes.find(q => q.formation_id === f.id)).map(f => (
                    <option key={f.id} value={f.id}>{f.numero} - {f.titre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du quiz</label>
                <input value={quizForm.titre} onChange={e => setQuizForm({...quizForm, titre: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Titre" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seuil de reussite (%)</label>
                <input type="number" value={quizForm.seuil_reussite} onChange={e => setQuizForm({...quizForm, seuil_reussite: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" min={0} max={100} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreateQuiz} className="bg-purple-600 text-white px-6 py-2 rounded-lg">Creer</button>
              <button onClick={() => setShowQuizForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg">Annuler</button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Liste des quiz</h2>
            {loading ? <p>Chargement...</p> : quizzes.length === 0 ? <p className="text-gray-400">Aucun quiz</p> : (
              <div className="space-y-2">
                {quizzes.map(q => (
                  <div key={q.id} onClick={() => handleSelectQuiz(q.id)} className={`bg-white rounded-xl p-4 border cursor-pointer hover:border-purple-400 transition-colors ${selectedQuiz === q.id ? 'border-purple-500 shadow-md' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{q.titre}</p>
                        <p className="text-gray-500 text-xs mt-1">{getFormationTitre(q.formation_id)}</p>
                        <p className="text-gray-400 text-xs">Seuil : {q.seuil_reussite}%</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeleteQuiz(q.id) }} className="text-red-400 hover:text-red-600 text-xs">Suppr</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            {selectedQuiz ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">Questions ({questions.length})</h2>
                  <button onClick={() => setShowQuestionForm(true)} className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700">+ Question</button>
                </div>
                {showQuestionForm && (
                  <div className="bg-white rounded-xl p-4 border mb-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select value={questionForm.type} onChange={e => setQuestionForm({...questionForm, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                          <option value="qcm">QCM (choix multiple)</option>
                          <option value="libre">Reponse libre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                        <textarea value={questionForm.texte} onChange={e => setQuestionForm({...questionForm, texte: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="Enoncé de la question" />
                      </div>
                      {questionForm.type === 'qcm' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Options de reponse</label>
                          {questionForm.options.map((opt, i) => (
                            <input key={i} value={opt} onChange={e => { const o = [...questionForm.options]; o[i] = e.target.value; setQuestionForm({...questionForm, options: o}) }} className="w-full px-3 py-2 border rounded-lg mb-2" placeholder={`Option ${i+1}`} />
                          ))}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bonne reponse</label>
                        <input value={questionForm.bonne_reponse} onChange={e => setQuestionForm({...questionForm, bonne_reponse: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Reponse correcte" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleAddQuestion} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">Ajouter</button>
                        <button onClick={() => setShowQuestionForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Annuler</button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={q.id} className="bg-white rounded-xl p-4 border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded mr-2">{q.type === 'qcm' ? 'QCM' : 'Libre'}</span>
                          <span className="text-xs text-gray-400">Q{i+1} • {q.points} pt</span>
                          <p className="font-medium text-gray-900 mt-1">{q.texte}</p>
                          {q.options && <p className="text-gray-500 text-xs mt-1">Options : {q.options.join(' | ')}</p>}
                          {q.bonne_reponse && <p className="text-green-600 text-xs mt-1">Reponse : {q.bonne_reponse}</p>}
                        </div>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-400 hover:text-red-600 text-xs ml-2">Suppr</button>
                      </div>
                    </div>
                  ))}
                  {questions.length === 0 && <p className="text-gray-400 text-center py-8">Aucune question — cliquez sur + Question</p>}
                </div>
              </div>
            ) : <p className="text-gray-400 text-center py-12">Selectionnez un quiz pour voir ses questions</p>}
          </div>
        </div>
      </div>
    </div>
  )
}