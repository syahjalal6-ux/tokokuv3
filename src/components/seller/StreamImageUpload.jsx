import React, { useState, useRef } from 'react'
import { Image as ImageIcon, X, Loader } from 'lucide-react'
import { compressImage } from '../lib/utils.js'
import { streamApi } from '../lib/api/index.js'
import toast from 'react-hot-toast'

const MAX_PHOTOS = 2
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// value: array of URL strings
// onChange: (urls: string[]) => void
// tokenObj: { tokenSupabase, tokenGas } — dibutuhkan untuk panggil streamApi.uploadImage
export default function StreamImageUpload({ value = [], onChange, tokenObj, disabled }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()
  const canAddMore = value.length < MAX_PHOTOS

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_PHOTOS - value.length)
    if (!files.length) return

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} lebih dari 5MB`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} bukan file gambar`)
        continue
      }
    }

    const validFiles = files.filter(f => f.size <= MAX_SIZE && f.type.startsWith('image/'))
    if (!validFiles.length) return

    setUploading(true)
    try {
      const uploadedUrls = []
      for (const file of validFiles) {
        const compressed = await compressImage(file, 900, 0.82)
        const fileBase64 = await fileToBase64(compressed)
        const res = await streamApi.uploadImage(tokenObj, {
          fileBase64,
          fileName: file.name,
          contentType: compressed.type || file.type,
        })
        uploadedUrls.push(res.data.url)
      }
      onChange([...value, ...uploadedUrls])
      toast.success(`${uploadedUrls.length} foto berhasil diupload`)
    } catch (err) {
      toast.error('Gagal upload foto: ' + err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = (index) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          {value.length}/{MAX_PHOTOS} foto
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {value.map((url, index) => (
          <div key={url + index} style={{
            position: 'relative',
            width: 100, height: 100,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
          }}>
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 22, height: 22,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {canAddMore && !disabled && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{
              width: 100, height: 100,
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--glass-border)',
              background: 'var(--surface)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 6,
              cursor: uploading ? 'default' : 'pointer',
              color: 'var(--text-tertiary)',
            }}
          >
            {uploading ? (
              <Loader size={18} style={{ animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <>
                <ImageIcon size={18} />
                <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Tambah</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
      />

      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
        JPG, PNG, WEBP — maks 5MB per foto, maks {MAX_PHOTOS} foto per post
      </p>
    </div>
  )
}
