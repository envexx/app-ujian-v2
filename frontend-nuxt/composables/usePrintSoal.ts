import type { TDocumentDefinitions, Content, ContentColumns } from 'pdfmake/interfaces'

function stripHtml(html: string): string {
  if (!html) return ''
  // Replace <br>, <br/>, </p>, </div>, </li> with newline
  let text = html.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/li>/gi, '\n')
  // Remove all remaining tags
  text = text.replace(/<[^>]*>/g, '')
  // Decode HTML entities
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&nbsp;/g, ' ')
  // Trim multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

function getTipeLabel(tipe: string): string {
  const labels: Record<string, string> = {
    PILIHAN_GANDA: 'Pilihan Ganda',
    ESSAY: 'Essay',
    ISIAN_SINGKAT: 'Isian Singkat',
    BENAR_SALAH: 'Benar/Salah',
    PENCOCOKAN: 'Pencocokan',
  }
  return labels[tipe] || tipe
}

export function usePrintSoal() {
  const isPrinting = ref(false)

  async function printSoal(examInfo: { judul: string; mapel?: string; kelas?: string[] }, soalList: any[]) {
    isPrinting.value = true

    try {
      // Dynamic import pdfmake (client-side only)
      const pdfMakeModule = await import('pdfmake/build/pdfmake') as any
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts') as any
      const pdfMake = pdfMakeModule.default || pdfMakeModule
      const vfs = pdfFontsModule?.pdfMake?.vfs || pdfFontsModule?.default?.pdfMake?.vfs || pdfFontsModule?.default
      if (vfs) pdfMake.vfs = vfs

      const content: Content[] = []

      // Header
      content.push({
        text: examInfo.judul || 'Ujian',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 4],
      })

      if (examInfo.mapel) {
        content.push({
          text: `Mata Pelajaran: ${examInfo.mapel}`,
          alignment: 'center',
          fontSize: 11,
          color: '#555',
          margin: [0, 0, 0, 2],
        })
      }

      if (examInfo.kelas && examInfo.kelas.length > 0) {
        content.push({
          text: `Kelas: ${examInfo.kelas.join(', ')}`,
          alignment: 'center',
          fontSize: 11,
          color: '#555',
          margin: [0, 0, 0, 2],
        })
      }

      // Info line
      content.push({
        text: `Jumlah Soal: ${soalList.length}`,
        alignment: 'center',
        fontSize: 10,
        color: '#777',
        margin: [0, 0, 0, 8],
      })

      // Separator
      content.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#333' }],
        margin: [0, 0, 0, 16],
      })

      // Group soal by type
      const typeOrder = ['PILIHAN_GANDA', 'BENAR_SALAH', 'ISIAN_SINGKAT', 'ESSAY', 'PENCOCOKAN']
      const soalByType: Record<string, any[]> = {}
      for (const s of soalList) {
        if (!soalByType[s.tipe]) soalByType[s.tipe] = []
        soalByType[s.tipe].push(s)
      }

      let globalNumber = 1

      for (const tipe of typeOrder) {
        const soals = soalByType[tipe]
        if (!soals || soals.length === 0) continue

        // Section header
        content.push({
          text: getTipeLabel(tipe).toUpperCase(),
          style: 'sectionHeader',
          margin: [0, 8, 0, 8],
        })

        for (const soal of soals) {
          const data = typeof soal.data === 'string' ? JSON.parse(soal.data) : (soal.data || {})
          const pertanyaan = stripHtml(soal.pertanyaan)

          // Question number + text
          content.push({
            text: [
              { text: `${globalNumber}. `, bold: true, fontSize: 11 },
              { text: pertanyaan || '(Pertanyaan kosong)', fontSize: 11 },
            ],
            margin: [0, 4, 0, 4],
          })

          // Type-specific content
          if (tipe === 'PILIHAN_GANDA') {
            const opsi = data.opsi || data.options || []
            const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
            for (let i = 0; i < opsi.length; i++) {
              const label = opsi[i].label || labels[i] || String(i + 1)
              const text = stripHtml(opsi[i].text || '')
              content.push({
                text: `     ${label}. ${text}`,
                fontSize: 10,
                margin: [16, 1, 0, 1],
              })
            }
          } else if (tipe === 'BENAR_SALAH') {
            content.push({
              text: '     A. Benar          B. Salah',
              fontSize: 10,
              margin: [16, 2, 0, 2],
            })
          } else if (tipe === 'ISIAN_SINGKAT') {
            content.push({
              text: 'Jawaban: ___________________________',
              fontSize: 10,
              margin: [16, 4, 0, 4],
              color: '#999',
            })
          } else if (tipe === 'ESSAY') {
            // Draw lines for writing
            const lines: Content[] = []
            for (let i = 0; i < 5; i++) {
              lines.push({
                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 480, y2: 0, lineWidth: 0.5, lineColor: '#ccc' }],
                margin: [16, 8, 0, 0],
              })
            }
            content.push(...lines)
            content.push({ text: '', margin: [0, 4, 0, 0] })
          } else if (tipe === 'PENCOCOKAN') {
            const itemKiri = data.itemKiri || []
            const itemKanan = data.itemKanan || []

            if (itemKiri.length > 0 && itemKanan.length > 0) {
              // Build matching table
              const tableBody: any[][] = [
                [
                  { text: 'Kolom Kiri', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f3f4f6' },
                  { text: '', fillColor: '#f3f4f6' },
                  { text: 'Kolom Kanan', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f3f4f6' },
                ],
              ]

              const maxRows = Math.max(itemKiri.length, itemKanan.length)
              for (let i = 0; i < maxRows; i++) {
                const leftText = i < itemKiri.length ? stripHtml(itemKiri[i].text || '') : ''
                const rightText = i < itemKanan.length ? stripHtml(itemKanan[i].text || '') : ''
                tableBody.push([
                  { text: `${i + 1}. ${leftText}`, fontSize: 9, margin: [2, 2, 2, 2] },
                  { text: '→', fontSize: 9, alignment: 'center', margin: [2, 2, 2, 2] },
                  { text: `${String.fromCharCode(65 + i)}. ${rightText}`, fontSize: 9, margin: [2, 2, 2, 2] },
                ])
              }

              content.push({
                table: {
                  widths: ['*', 20, '*'],
                  body: tableBody,
                },
                layout: 'lightHorizontalLines',
                margin: [16, 4, 16, 8],
              })
            }
          }

          // Add spacing between questions
          content.push({ text: '', margin: [0, 4, 0, 0] })
          globalNumber++
        }
      }

      // Footer separator
      content.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#999' }],
        margin: [0, 12, 0, 8],
      })

      content.push({
        text: '— Selamat Mengerjakan —',
        alignment: 'center',
        fontSize: 10,
        italics: true,
        color: '#666',
      })

      const docDefinition: TDocumentDefinitions = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content,
        styles: {
          header: {
            fontSize: 16,
            bold: true,
          },
          sectionHeader: {
            fontSize: 12,
            bold: true,
            color: '#333',
            decoration: 'underline',
          },
        },
        defaultStyle: {
          font: 'Roboto',
        },
        info: {
          title: examInfo.judul || 'Soal Ujian',
          author: 'Nilai Online - PT Core Solution Digital',
        },
      }

      pdfMake.createPdf(docDefinition).open()
    } catch (err) {
      console.error('Error generating PDF:', err)
      throw err
    } finally {
      isPrinting.value = false
    }
  }

  return { printSoal, isPrinting }
}
