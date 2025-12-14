import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Dar Al-Ilm';
    const description = searchParams.get('description') || 'Transform Your Learning Journey';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 60px',
              zIndex: 1,
            }}
          >
            {/* Icon/Emoji */}
            <div
              style={{
                fontSize: 120,
                marginBottom: 30,
              }}
            >
              📚
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: 24,
                textAlign: 'center',
                lineHeight: 1.1,
                textShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {title}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: 36,
                color: '#f3f4f6',
                textAlign: 'center',
                maxWidth: 1000,
                lineHeight: 1.4,
                fontWeight: 500,
              }}
            >
              {description}
            </div>

            {/* Features */}
            <div
              style={{
                display: 'flex',
                gap: 40,
                marginTop: 50,
                fontSize: 24,
                color: '#e0e7ff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🎯</span>
                <span>Expert Courses</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🏆</span>
                <span>Certificates</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡</span>
                <span>Flexible Learning</span>
              </div>
            </div>
          </div>

          {/* Bottom Text */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 20,
              color: '#ffffff',
              opacity: 0.9,
              fontWeight: 500,
            }}
          >
            dar-alilm.vercel.app
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

