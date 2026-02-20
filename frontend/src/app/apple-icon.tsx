import { ImageResponse } from 'next/og'

// Required for static export
export const dynamic = 'force-static'
 
// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'
 
// Apple Icon
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 120,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20%',
        }}
      >
        <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>E</div>
      </div>
    ),
    {
      ...size,
    }
  )
}
