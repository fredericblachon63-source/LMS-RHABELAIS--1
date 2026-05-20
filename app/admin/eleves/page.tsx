'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Formation {
  id: string
  numero: string
  titre: string
}

interface Enrollment {
  formation_id: string
}

export default function AdminEleves() {
  const [eleves, setEleves] = useState<Profile[]>([])
  const [formations, setFormations] = useState<Formation[]>([])
  const [enrollments, setEnrollments] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '' })
  const [message, setMessage] = useState('')
  const [selectedEleve, setSelectedEleve] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = async () => {
    const [{ data: profiles }, { data: forms }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'candidate').order('full_name'),
      supabase.from('formations').select('*').order('numero')
    ])
    setEleves(profiles || [])
    setFormations(forms || [])

    if (profiles && profiles.length > 0) {
      const { data: enr } = await supabase.from('enrollments').select('user_id, formation_id')
      const map: Record<string, string[]> = {}
      enr?.forEach(e => {
        if (!map[e.user_id]) map[e.user_id] = []
        map[e.user_id].push(e.formation_id)
      })
      setEnrollments(map)
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleCreateEleve = async () => {
    if (!form.email || !form.password) {
      setMessage('Email et mot de passe obligatoires')
      return
    }
    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.error) {
      setMessage('Erreur : ' + data.error)
    } else {
      setMessage('Eleve cree avec succes')
      setForm({ email: '', full_name: '', password: '' })
      setShowForm(false)
      fetchData()
    }
  }

  const toggleEnrollment = async (userId: string, formationId: string) => {
    const current = enrollments[userId] || []
    const isEnrolled = current.includes(formationId)
    if (isEnrolled) {
      await supabase.from('enrollments').delete().eq('user_id', userId).eq('formation_id', formationId)
    } else {
      await supabase.from('enrollments').insert({ user_id: userId, formation_id: formationId })
    }
    fetchData()
  }
return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">Retour Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Eleves</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium">
            + Nouvel eleve
          </button>
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
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="email@exemple.com" type="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Mot de passe" type="password" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreateEleve} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Creer</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg">Annuler</button>
            </div>
          </div>
        )}
        {loading ? <p>Chargement...</p> : eleves.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun eleve pour l instant</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eleves.map(eleve => (
              <div key={eleve.id} className="bg-white rounded-xl shadow-sm p-6 border">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{eleve.full_name || 'Sans nom'}</p>
                    <p className="text-gray-500 text-sm">{eleve.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedEleve(selectedEleve === eleve.id ? null : eleve.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {selectedEleve === eleve.id ? 'Masquer formations' : 'Gerer formations'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(enrollments[eleve.id] || []).map(fid => {
                    const f = formations.find(x => x.id === fid)
                    return f ? <span key={fid} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{f.numero} - {f.titre}</span> : null
                  })}
                  {(enrollments[eleve.id] || []).length === 0 && <span className="text-gray-400 text-sm">Aucune formation assignee</span>}
                </div>
                {selectedEleve === eleve.id && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Assigner des formations :</p>
                    <div className="flex flex-wrap gap-2">
                      {formations.map(f => {
                        const enrolled = (enrollments[eleve.id] || []).includes(f.id)
                        return (
                          <button
                            key={f.id}
                            onClick={() => toggleEnrollment(eleve.id, f.id)}
                            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${enrolled ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                          >
                            {enrolled ? 'Retirer' : 'Ajouter'} {f.numero}
                          </button>
                        )
                      })}
                    </div>
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