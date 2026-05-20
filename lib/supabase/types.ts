export type Role = 'admin' | 'candidate'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: Role
  created_at: string
}

export interface Formation {
  id: string
  numero: string
  titre: string
  description: string | null
  slide_url: string | null
  created_at: string
}

export interface Quiz {
  id: string
  formation_id: string
  titre: string
  seuil_reussite: number
}

export interface Question {
  id: string
  quiz_id: string
  ordre: number
  type: 'qcm' | 'libre'
  texte: string
  options: string[] | null
  bonne_reponse: string | null
  points: number
}

export interface Enrollment {
  id: string
  user_id: string
  formation_id: string
}

export interface QuizResult {
  id: string
  user_id: string
  quiz_id: string
  score: number
  reponses: Record<string, string>
  reussi: boolean
  completed_at: string
}