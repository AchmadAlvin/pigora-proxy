import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  
  // Ganti dengan URL Framer kamu
  const framerOrigin = 'https://porta.framer.ai';
  const targetUrl = `${framerOrigin}${url.pathname}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'host': 'porta.framer.ai',
      },
      redirect: 'manual',
    });

    let html = await response.text();

    // === BAGIAN HAPUS WATERMARK ===
    html = html.replace(/Made in Framer|Built with Framer/gi, '');
    html = html.replace(/__framer-badge-container|framer-badge|data-framer-badge/gi, '');
    
    html = html.replace(/<div[^>]*id=["']__framer-badge-container["'][^>]*>[\s\S]*?<\/div>/gi, '');
    html = html.replace(/<div[^>]*class=["'][^"']*framer-badge[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

    // Inject CSS tambahan biar badge benar-benar hilang
    const extraCSS = `
      <style>
        #__framer-badge-container, 
        [data-framer-badge], 
        .framer-badge,
        div[class*="framer-badge"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
        }
      </style>`;

    html = html.replace('</head>', extraCSS + '</head>');

    return new NextResponse(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.redirect('https://porta.framer.ai');
  }
}

// Middleware berjalan di semua halaman
export const config = {
  matcher: '/:path*',
};