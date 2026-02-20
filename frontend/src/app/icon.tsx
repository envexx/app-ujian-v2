import { ImageResponse } from 'next/og'

// Required for static export
export const dynamic = 'force-static'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Icon component - will use logo from public/icon
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
        }}
      >
        {/* Simple icon - you can customize this */}
        <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>E</div>
      </div>
    ),
    {
      ...size,
    }
  )
}
