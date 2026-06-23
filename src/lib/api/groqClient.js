import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../config.js'

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

async function fetchWithFallback({ apiKey, groqMessages }) {
  const models = CONFIG.GROQ_MODELS || ['llama-3.1-8b-instant']
  let lastError
  for (const model of models) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model,
        messages: groqMessages,
        max_tokens: 512,
        temperature: 0.7,
      }),
    })
    const data = await res.json()
    if (!data.error) {
      const reply = data.choices?.[0]?.message?.content
      if (!reply) throw new Error('Reply kosong')
      return { success: true, reply }
    }
    lastError = data.error.message
  }
  throw new Error(lastError)
}

export const chatApi = {
  send: async ({ messages, produk, toko, semuaProduk }) => {
    if (!messages || !Array.isArray(messages)) throw new Error('messages tidak valid')

    let tokoInfoStr = ''
    if (toko && toko.id) {
      const { data: info } = await supabase
        .from('toko_info')
        .select('*')
        .eq('toko_id', toko.id)
        .single()

      if (info) {
        if (info.faq) tokoInfoStr += `\nFAQ Toko:\n${info.faq}`
        if (info.garansi) tokoInfoStr += `\nGaransi: ${info.garansi}`
        if (info.policy) tokoInfoStr += `\nKebijakan Toko: ${info.policy}`
        if (info.info_lain) tokoInfoStr += `\nInformasi Lain: ${info.info_lain}`
      }
    }

    let systemPrompt = ''
    if (produk && produk.nama) {
      systemPrompt = `Kamu adalah asisten toko "${toko ? toko.nama : 'ini'}".
${toko && toko.deskripsi ? 'Deskripsi toko: ' + toko.deskripsi : ''}

Kamu membantu calon pembeli yang bertanya tentang produk berikut:
- Nama: ${produk.nama}
- Harga: Rp ${Number(produk.harga).toLocaleString('id-ID')}${produk.hargaCoret ? ' (coret: Rp ' + Number(produk.hargaCoret).toLocaleString('id-ID') + ')' : ''}
- Stok: ${produk.stok === 0 ? 'Habis' : produk.stok ? produk.stok + ' tersedia' : 'Tersedia'}
${produk.kategori ? '- Kategori: ' + produk.kategori : ''}
${produk.berat ? '- Berat: ' + produk.berat + 'g' : ''}
${produk.deskripsi ? '- Deskripsi: ' + produk.deskripsi : ''}
${tokoInfoStr}

Jawab dengan ramah, singkat, dan dalam Bahasa Indonesia. Jika pembeli siap beli, arahkan untuk klik tombol "Beli Sekarang".`
    } else {
      let produkListStr = ''
      if (semuaProduk && Array.isArray(semuaProduk) && semuaProduk.length > 0) {
        produkListStr = '\n\nDaftar produk yang tersedia:\n' + semuaProduk.map((p, i) =>
          `${i + 1}. ${p.nama} — Rp ${Number(p.harga).toLocaleString('id-ID')}${p.stok === 0 ? ' (Habis)' : ''}`
        ).join('\n')
      }

      systemPrompt = `Kamu adalah asisten toko "${toko ? toko.nama : 'ini'}".
${toko && toko.deskripsi ? 'Deskripsi toko: ' + toko.deskripsi : ''}
${tokoInfoStr}
${produkListStr}

Bantu calon pembeli dengan pertanyaan tentang toko, produk, pengiriman, atau hal lainnya. Jawab dengan ramah, singkat, dan dalam Bahasa Indonesia. Jika pembeli ingin membeli produk tertentu, arahkan untuk klik produk tersebut lalu klik "Beli Sekarang".`
    }

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ]

    return fetchWithFallback({ apiKey: CONFIG.GROQ_PRODUK_KEY, groqMessages })
  }
}

export const showcaseChatApi = {
  send: async ({ messages, posts, produkList }) => {
    if (!messages || !Array.isArray(messages)) throw new Error('messages tidak valid')

    const postsStr = (posts || []).slice(0, 30).map((p, i) =>
      `${i + 1}. [${p.toko?.nama || 'Toko'}] ${p.teks?.slice(0, 200) || ''}${p.hashtags?.length ? ' ' + p.hashtags.join(' ') : ''}`
    ).join('\n')

    const produkStr = (produkList || []).slice(0, 50).map((p, i) =>
      `${i + 1}. ${p.nama} — Rp ${Number(p.harga).toLocaleString('id-ID')}${p.stok === 0 ? ' (Habis)' : ''}${p.kategori ? ' [' + p.kategori + ']' : ''} — Toko: ${p.tokoNama || ''}${p.tokoSlug ? ' (exorav2.vercel.app/' + p.tokoSlug + ')' : ''}`
    ).join('\n')

    const systemPrompt = `Kamu adalah asisten Showcase Exora — platform toko online.
Bantu buyer cari produk atau toko yang cocok berdasarkan data berikut.

Post terbaru di showcase:
${postsStr || 'Tidak ada post.'}

Daftar produk dari semua toko:
${produkStr || 'Tidak ada produk.'}

ATURAN WAJIB:
- Setiap kali kamu menyebut toko atau merekomendasikan produk, tulis NAMA TOKO PERSIS seperti di data atas (jangan disingkat/diubah).
- Sertakan link format: https://exorav2.vercel.app/[slug] menggunakan slug yang tertulis di data produk.
- Jika tidak yakin slugnya, cukup sebut nama tokonya saja TANPA mengarang link.

Jawab ramah, singkat, dalam Bahasa Indonesia.`

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ]

    return fetchWithFallback({ apiKey: CONFIG.GROQ_SHOWCASE_KEY, groqMessages })
  }
}
