import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, Loader } from 'lucide-react'
import { compressImage } from '../../lib/utils.js'
import toast from 'react-hot-toast'

const CLOUDINARY_CLOUD = 'dgplz1pd0'
const CLOUDINARY_PRESET = 'tokoku'

async function uploadToCloudinary(file) {
  const compressed = await compressImage(file, 900, 0.82)
  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', CLOUDINARY_PRESET)
  formData.append('folder', 'tokoku')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error('Upload ke Cloudinary gagal')
  const data = await res.json()
  return data.secure_url
}

export default function ImageUpload({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      console.log('[ImageUpload] Cloudinary URL:', url)
      onChange(url)
      console.log('[ImageUpload] onChange dipanggil dengan:', url)
      toast.success('Foto berhasil diupload')
    } catch (err) {
      toast.error('Gagal upload foto: ' + err.message)
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: disabled || uploading,
  })

  const handleRemove = (e) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div>
      {value ? (
        <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/3' }}>
          <img
            src={value}
            alt="Foto produk"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
          }} />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 'var(--radius-full)',
                padding: '6px', cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
            >
              <X size={14} />
            </button>
          )}
          {!disabled && (
            <div {...getRootProps()} style={{
              position: 'absolute', bottom: 8, left: 8,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-full)',
              padding: '5px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
              fontSize: '0.72rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <input {...getInputProps()} />
              <Upload size={11} />
              Ganti Foto
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          style={{
            aspectRatio: '4/3',
            border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--glass-border)'}`,
            borderRadius: 'var(--radius-lg)',
            background: isDragActive ? 'rgba(91,138,245,0.05)' : 'var(--surface)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '10px', cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all var(--transition-fast)',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <>
              <Loader size={28} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Mengupload...</p>
            </>
          ) : (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-lg)',
                background: isDragActive ? 'rgba(91,138,245,0.15)' : 'var(--surface-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDragActive ? 'var(--accent)' : 'var(--text-tertiary)',
              }}>
                {isDragActive ? <Upload size={22} /> : <Image size={22} />}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: isDragActive ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {isDragActive ? 'Lepaskan untuk upload' : 'Klik atau drag foto di sini'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 3 }}>
                  JPG, PNG, WEBP — maks 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}