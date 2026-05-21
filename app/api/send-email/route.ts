import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { type, candidatEmail, candidatNom, formationTitre, score, adminEmail } = await request.json()

  try {
    if (type === 'attestation') {
      await resend.emails.send({
        from: 'LMS Rabelais <onboarding@resend.dev>',
        to: candidatEmail,
        subject: `Attestation de reussite - ${formationTitre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e40af; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">LMS Rabelais</h1>
            </div>
            <div style="padding: 30px; background: #f8fafc;">
              <h2 style="color: #1e40af;">Felicitations ${candidatNom} !</h2>
              <p style="color: #374151; font-size: 16px;">Vous avez reussi la formation :</p>
              <div style="background: white; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0; color: #111827;">${formationTitre}</h3>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 48px; font-weight: bold; color: #16a34a;">${score}%</span>
                <p style="color: #6b7280;">Score obtenu</p>
              </div>
              <p style="color: #374151;">Cette attestation confirme que vous avez suivi et valide cette formation avec succes.</p>
              <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 8px;">
                <p style="margin: 0; color: #166534; font-weight: bold;">Attestation de reussite delivree par RHabelais</p>
                <p style="margin: 5px 0 0; color: #166534;">Date : ${new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        `
      })
    }

    if (type === 'recap_admin') {
      await resend.emails.send({
        from: 'LMS Rabelais <onboarding@resend.dev>',
        to: adminEmail,
        subject: `Nouveau resultat quiz - ${candidatNom} - ${formationTitre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1e40af; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">LMS Rabelais - Notification</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #111827;">Nouveau resultat de quiz</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="background: #f3f4f6;">
                  <td style="padding: 10px; font-weight: bold;">Candidat</td>
                  <td style="padding: 10px;">${candidatNom}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Email</td>
                  <td style="padding: 10px;">${candidatEmail}</td>
                </tr>
                <tr style="background: #f3f4f6;">
                  <td style="padding: 10px; font-weight: bold;">Formation</td>
                  <td style="padding: 10px;">${formationTitre}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Score</td>
                  <td style="padding: 10px; font-size: 20px; font-weight: bold; color: ${score >= 70 ? '#16a34a' : '#dc2626'};">${score}%</td>
                </tr>
                <tr style="background: #f3f4f6;">
                  <td style="padding: 10px; font-weight: bold;">Resultat</td>
                  <td style="padding: 10px; color: ${score >= 70 ? '#16a34a' : '#dc2626'}; font-weight: bold;">${score >= 70 ? 'REUSSI' : 'ECHEC'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-weight: bold;">Date</td>
                  <td style="padding: 10px;">${new Date().toLocaleDateString('fr-FR')}</td>
                </tr>
              </table>
            </div>
          </div>
        `
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}