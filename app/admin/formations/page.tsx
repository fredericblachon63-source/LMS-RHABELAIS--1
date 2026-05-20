'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Formation {
  id: string
  numero: string
  titre: string
  description: string | null
  slide_url: string | null
  created_at: string
}

export default function AdminFormations() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ numero: '', titre: '', description: '', slide_url: '' })
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const fetchFormations = async () => {
    const { data } = await supabase.from('formations').select('*').order('numero')
    setFormations(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchFormations() }, [])

  const handleSubmit = async () => {
    if (!form.numero || !form.titre) {
      setMessage('Le numero et le titre sont obligatoires')
      return
    }
    if (editingId) {
      await supabase.from('formations').update(form).eq('id', editingId)
      setMessage('Formation mise a jour')
    } else {
      await supabase.from('formations').insert(form)
      setMessage('Formation creee')
    }
    setForm({ numero: '', titre: '', description: '', slide_url: '' })
    setShowForm(false)
    setEditingId(null)
    fetchFormations()
  }

  const handleEdit = (f: Formation) => {
    setForm({
      numero: f.numero,
      titre: f.titre,
      description: f.description || '',
      slide_url: f.slide_url || ''
    })
    setEditingId(f.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return
    await supabase.from('formations').delete().eq('id', id)
    setMessage('Formation supprimee')
    fetchFormations()
  }
return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">Retour Dashboard</Link>
            <h1 className="text-xl font-bold text-gray-900">Formations</h1>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ numero: '', titre: '', description: '', slide_url: '' }) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Nouvelle formation
          </button>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">{message}</div>}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
            <h2 className="text-lg font-semibold mb-4">{editingId ? 'Modifier' : 'Nouvelle'} formation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Numero</label>
                <input value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="ex: F001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Titre de la formation" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={3} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL des slides PDF</label>
                <input value={form.slide_url} onChange={e => setForm({...form, slide_url: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">{editingId ? 'Mettre a jour' : 'Creer'}</button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg">Annuler</button>
            </div>
          </div>
        )}
        {loading ? <p>Chargement...</p> : formations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucune formation pour l instant</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formations.map(f => (
              <div key={f.id} className="bg-white rounded-xl shadow-sm p-6 border">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">{f.numero}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(f)} className="text-gray-400 hover:text-blue-600">Modifier</button>
                    <button onClick={() => handleDelete(f.id)} className="text-gray-400 hover:text-red-600">Suppr</button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.titre}</h3>
                {f.description && <p className="text-gray-500 text-sm">{f.description}</p>}
                {f.slide_url && <a href={f.slide_url} target="_blank" className="text-blue-600 text-sm hover:underline">Voir les slides</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}