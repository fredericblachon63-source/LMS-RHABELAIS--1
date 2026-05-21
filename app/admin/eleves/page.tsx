'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Profile { id: string; email: string; full_name: string | null; role: string }
interface Formation { id: string; numero: string; titre: string }
interface Enrollment { formation_id: string; date_debut: string | null; date_fin: string | null }

export default function AdminEleves() {
  const [eleves, setEleves] = useState<Profile[]>([])
  const [formations, setFormations] = useState<Formation[]>([])
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '' })
  const [message, setMessage] = useState('')
  const [selectedEleve, setSelectedEleve] = useState<string | null>(null)
  const [dateForm, setDateForm] = useState<Record<string, { date_debut: string; date_fin: string }>>({})
  const supabase = createClient()

  const fetchData = async () => {
    const [{ data: profiles }, { data: forms }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'candidate').order('full_name'),
      supabase.from('formations').select('*').order('numero')
    ])
    setEleves(profiles || [])
    setFormations(forms || [])
    if (profiles && profiles.length > 0) {
      const { data: enr } = await supabase.from('enrollments').select('user_id, formation_id, date_debut, date_fin')
      const map: Record<string, Enrollment[]> = {}
      enr?.forEach(e => {
        if (!map[e.user_id]) map[e.user_id] = []
        map[e.user_id].push({ formation_id: e.formation_id, date_debut: e.date_debut, date_fin: e.date_fin })
      })
      setEnrollments(map)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreateEleve = async () => {
    if (!form.email || !form.password) { setMessage('Email et mot de passe obligatoires'); return }
    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.error) { setMessage('Erreur : ' + data.error) } 
    else { setMessage('Eleve cree avec succes'); setForm({ email: '', full_name: '', password: '' }); setShowForm(false); fetchData() }
  }

  const isEnrolled = (userId: string, formationId: string) => {
    return (enrollments[userId] || []).some(e => e.formation_id === formationId)
  }

  const getEnrollment = (userId: string, formationId: string) => {
    return (enrollments[userId] || []).find(e => e.formation_id === formationId)
  }

  const toggleEnrollment = async (userId: string, formationId: string) => {
    if (isEnrolled(userId, formationId)) {
      await supabase.from('enrollments').delete().eq('user_id', userId).eq('formation_id', formationId)
      setMessage('Formation retiree')
    } else {
      const dates = dateForm[formationId] || {}
      await supabase.from('enrollments').insert({
        user_id: userId,
        formation_id: formationId,
        date_debut: dates.date_debut || new Date().toISOString(),
        date_fin: dates.date_fin || null
      })
      setMessage('Formation assignee')
    }
    fetchData()
  }

  const updateDates = async (userId: string, formationId: string, date_debut: string, date_fin: string) => {
    await supabase.from('enrollments')
      .update({ date_debut: date_debut || null, date_fin: date_fin || null })
      .eq('user_id', userId).eq('formation_id', formationId)
    setMessage('Dates mises a jour')
    fetchData()
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : 'Non definie'
return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">Retour Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Eleves</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium">+ Nouvel eleve</button>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
            <h2 className="text-lg font-semibold mb-4">Nouvel eleve</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Prenom Nom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" type="password" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreateEleve} className="bg-green-600 text-white px-6 py-2 rounded-lg">Creer</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg">Annuler</button>
            </div>
          </div>
        )}
        {loading ? <p>Chargement...</p> : eleves.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-500">Aucun eleve pour l instant</p></div>
        ) : (
          <div className="space-y-4">
            {eleves.map(eleve => (
              <div key={eleve.id} className="bg-white rounded-xl shadow-sm p-6 border">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{eleve.full_name || 'Sans nom'}</p>
                    <p className="text-gray-500 text-sm">{eleve.email}</p>
                  </div>
                  <button onClick={() => setSelectedEleve(selectedEleve === eleve.id ? null : eleve.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    {selectedEleve === eleve.id ? 'Masquer' : 'Gerer formations'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(enrollments[eleve.id] || []).map(enr => {
                    const f = formations.find(x => x.id === enr.formation_id)
                    const expire = enr.date_fin && new Date(enr.date_fin) < new Date()
                    return f ? (
                      <span key={enr.formation_id} className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${expire ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {f.numero} {expire ? '(expire)' : ''} · {formatDate(enr.date_debut)} → {formatDate(enr.date_fin)}
                      </span>
                    ) : null
                  })}
                  {(enrollments[eleve.id] || []).length === 0 && <span className="text-gray-400 text-sm">Aucune formation assignee</span>}
                </div>
                {selectedEleve === eleve.id && (
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <p className="text-sm font-medium text-gray-700">Formations disponibles :</p>
                    {formations.map(f => {
                      const enrolled = isEnrolled(eleve.id, f.id)
                      const enr = getEnrollment(eleve.id, f.id)
                      const key = f.id
                      return (
                        <div key={f.id} className={`p-3 rounded-lg border ${enrolled ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">{f.numero} - {f.titre}</span>
                            <button
                              onClick={() => toggleEnrollment(eleve.id, f.id)}
                              className={`text-xs px-3 py-1 rounded-full font-medium ${enrolled ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                              {enrolled ? 'Retirer' : 'Assigner'}
                            </button>
                          </div>
                          {!enrolled && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Date debut</label>
                                <input type="date" className="w-full px-2 py-1 border rounded text-xs"
                                  onChange={e => setDateForm({...dateForm, [key]: {...(dateForm[key]||{}), date_debut: e.target.value}})} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Date fin</label>
                                <input type="date" className="w-full px-2 py-1 border rounded text-xs"
                                  onChange={e => setDateForm({...dateForm, [key]: {...(dateForm[key]||{}), date_fin: e.target.value}})} />
                              </div>
                            </div>
                          )}
                          {enrolled && enr && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Date debut</label>
                                <input type="date" defaultValue={enr.date_debut?.split('T')[0] || ''} className="w-full px-2 py-1 border rounded text-xs"
                                  onBlur={e => updateDates(eleve.id, f.id, e.target.value, (document.getElementById('fin_'+f.id+eleve.id) as HTMLInputElement)?.value || '')}
                                  id={'deb_'+f.id+eleve.id} />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Date fin</label>
                                <input type="date" defaultValue={enr.date_fin?.split('T')[0] || ''} className="w-full px-2 py-1 border rounded text-xs"
                                  onBlur={e => updateDates(eleve.id, f.id, (document.getElementById('deb_'+f.id+eleve.id) as HTMLInputElement)?.value || '', e.target.value)}
                                  id={'fin_'+f.id+eleve.id} />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}