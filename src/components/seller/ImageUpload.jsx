import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, Loader, Plus, Lock } from 'lucide-react'
import { compressImage } from '../../lib/utils.js'
import toast from 'react-hot-toast'

const CLOUDINARY_CLOUD = 'dgplz1pd0'
const CLOUDINARY_PRESET = 'tokoku'

const MAX_PHOTOS = {
  free: 2,
  pro: 8,
}

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

// value: array of URL strings
// onChange: (urls: string[]) => void
// plan: 'free' | 'pro'
export default function ImageUpload({ value = [], onChange, disabled, plan = 'free' }) {
  const [uploadingIndex, setUploadingIndex] = useState(null)
  const maxPhotos = MAX_PHOTOS[plan] || MAX_PHOTOS.free
  const canAddMore = value.length < maxPhotos

  const onDrop = useCallback(async (acceptedFiles) => {
    const remaining = maxPhotos - value.length
    const filesToUpload = acceptedFiles.slice(0, remaining)
    if (!filesToUpload.length) return

    setUploadingIndex('new')
    try {
      const urls = await Promise.all(filesToUpload.map(f => uploadToCloudinary(f)))
      onChange([...value, ...urls])
      toast.success(`${urls.length} foto berhasil diupload`)
    } catch (err) {
      toast.error('Gagal upload foto: ' + err.message)
    } finally {
      setUploadingIndex(null)
    }
  }, [onChange, value, maxPhotos])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    disabled: disabled || uploadingIndex !== null || !canAddMore,
  })

  const handleRemove = (e, index) => {
    e.stopPropagation()
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleReplace = async (index, acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploadingIndex(index)
    try {
      const url = await uploadToCloudinary(file)
      const updated = [...value]
      updated[index] = url
      onChange(updated)
      toast.success('Foto berhasil diganti')
    } catch (err) {
      toast.error('Gagal ganti foto: ' + err.message)
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <div>
      {/* Label + quota */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          {value.length}/{maxPhotos} foto
        </span>
        {plan === 'free' && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: 'var(--warning)',
            background: 'rgba(251,191,36,0.1)',
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}>
            <Lock size={10} />
            Maks {maxPhotos} foto · <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Upgrade Pro</span> untuk lebih
          </span>
        )}
      </div>

      {/* Photo grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 10,
      }}>
        {/* Existing photos */}
        {value.map((url, index) => (
          <PhotoSlot
            key={url + index}
            url={url}
            index={index}
            isUploading={uploadingIndex === index}
            disabled={disabled}
            onRemove={(e) => handleRemove(e, index)}
            onReplace={(files) => handleReplace(index, files)}
          />
        ))}

        {/* Add more slot */}
        {canAddMore && !disabled && (
          <div
            {...getRootProps()}
            style={{
              aspectRatio: '4/3',
              border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--glass-border)'}`,
              borderRadius: 'var(--radius-lg)',
              background: isDragActive ? 'rgba(91,138,245,0.05)' : 'var(--surface)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6, cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              opacity: uploadingIndex !== null ? 0.5 : 1,
            }}
          >
            <input {...getInputProps()} />
            {uploadingIndex === 'new' ? (
              <Loader size={20} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: isDragActive ? 'rgba(91,138,245,0.15)' : 'var(--surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isDragActive ? 'var(--accent)' : 'var(--text-tertiary)',
                }}>
                  {isDragActive ? <Upload size={18} /> : <Plus size={18} />}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  {isDragActive ? 'Lepaskan' : 'Tambah foto'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Locked slot — show when free user hits limit */}
        {!canAddMore && plan === 'free' && (
          <div style={{
            aspectRatio: '4/3',
            border: '2px dashed rgba(251,191,36,0.3)',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(251,191,36,0.04)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6, opacity: 0.7,
          }}>
            <Lock size={18} color="var(--warning)" />
            <p style={{ fontSize: '0.7rem', color: 'var(--warning)', textAlign: 'center' }}>
              Upgrade Pro
            </p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {value.length === 0 && !canAddMore === false && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
          JPG, PNG, WEBP — maks 5MB per foto
        </p>
      )}
    </div>
  )
}

// Single photo slot with replace capability
function PhotoSlot({ url, index, isUploading, disabled, onRemove, onReplace }) {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: onReplace,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: disabled || isUploading,
    noClick: false,
  })

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/3' }}>
      <img
        src={url}
        alt={`Foto ${index + 1}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
      }} />

      {isUploading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader size={20} color="#fff" style={{ animation: 'spin 0.7s linear infinite' }} />
        </div>
      )}

      {!disabled && !isUploading && (
        <>
          {/* Remove */}
          <button
            type="button"
            onClick={onRemove}
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-full)',
              padding: '4px', cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
          >
            <X size={12} />
          </button>

          {/* Replace */}
          <div {...getRootProps()} style={{
            position: 'absolute', bottom: 6, left: 6,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-full)',
            padding: '3px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)',
            fontSize: '0.68rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <input {...getInputProps()} />
            <Upload size={10} />
            Ganti
          </div>

          {/* Index badge */}
          {index === 0 && (
            <div style={{
              position: 'absolute', top: 6, left: 6,
              background: 'rgba(91,138,245,0.85)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 7px',
              fontSize: '0.65rem', fontWeight: 700, color: '#fff',
            }}>
              Utama
            </div>
          )}
        </>
      )}
    </div>
  )
}
