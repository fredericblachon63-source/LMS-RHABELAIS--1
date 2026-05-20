'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    formations: 0,
    eleves: 0,
    quiz: 0,
    resultats: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      const [f, e, q, r] = await Promise.all([
        supabase.from('formations').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'candidate'),
        supabase.from('quizzes').select('id', { count: 'exact', head: true }),
        supabase.from('quiz_results').select('id', { count: 'exact', head: true })
      ])
      setStats({
        formations: f.count || 0,
        eleves: e.count || 0,
        quiz: q.count || 0,
        resultats: r.count || 0
      })
    }
    fetchStats()
  }, [])

  const cards = [
    { label: 'Formations', value: stats.formations, href: '/admin/formations', color: 'bg-blue-500', icon: '📚' },
    { label: 'Élèves', value: stats.eleves, href: '/admin/eleves', color: 'bg-green-500', icon: '👥' },
    { label: 'Quiz', value: stats.quiz, href: '/admin/quiz', color: 'bg-purple-500', icon: '📝' },
    { label: 'Résultats', value: stats.resultats, href: '/admin/resultats', color: 'bg-orange-500', icon: '📊' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">🎓 LMS Rabelais — Admin</h1>
          <div className="flex gap-4">
            <Link href="/admin/formations" className="text-gray-600 hover:text-blue-600 font-medium">Formations</Link>
            <Link href="/admin/quiz" className="text-gray-600 hover:text-blue-600 font-medium">Quiz</Link>
            <Link href="/admin/eleves" className="text-gray-600 hover:text-blue-600 font-medium">Élèves</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{card.icon}</span>
                  <span className={`${card.color} text-white text-xs font-medium px-2 py-1 rounded-full`}>
                    {card.label}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                <p className="text-gray-500 text-sm mt-1">{card.label} au total</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/formations">
            <div className="bg-blue-600 text-white rounded-xl p-6 hover:bg-blue-700 transition-colors cursor-pointer">
              <p className="text-lg font-semibold">+ Nouvelle formation</p>
              <p className="text-blue-100 text-sm mt-1">Ajouter une formation avec slides</p>
            </div>
          </Link>
          <Link href="/admin/eleves">
            <div className="bg-green-600 text-white rounded-xl p-6 hover:bg-green-700 transition-colors cursor-pointer">
              <p className="text-lg font-semibold">+ Nouvel élève</p>
              <p className="text-green-100 text-sm mt-1">Créer un compte candidat</p>
            </div>
          </Link>
          <Link href="/admin/quiz">
            <div className="bg-purple-600 text-white rounded-xl p-6 hover:bg-purple-700 transition-colors cursor-pointer">
              <p className="text-lg font-semibold">+ Nouveau quiz</p>
              <p className="text-purple-100 text-sm mt-1">Créer un quiz pour une formation</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}