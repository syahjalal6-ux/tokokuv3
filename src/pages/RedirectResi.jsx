import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pesananApi } from '../lib/api/index.js'

export default function RedirectResi() {
  const { resi } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!resi) {
      navigate('/', { replace: true })
      return
    }

    pesananApi.getSlugByResi(resi)
      .then(res => {
        const slug = res.data?.slug
        if (slug) {
          navigate(`/toko/${slug}?resi=${resi}`, { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      })
      .catch(() => {
        navigate('/', { replace: true })
      })
  }, [resi])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: 12,
      color: 'var(--text-secondary)',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid var(--glass-border)',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: '0.875rem' }}>Mengalihkan pesanan...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
