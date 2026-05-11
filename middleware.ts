import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
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

    // === HAPUS WATERMARK LEBIH AGRESIF ===
    html = html.replace(/Made in Framer|Built with Framer|framer\.com/gi, '');
    
    html = html.replace(/__framer-badge-container|framer-badge|data-framer-badge/gi, 'removed');
    
    html = html.replace(/<div[^>]*id=["']__framer-badge-container["'][^>]*>[\s\S]*?<\/div>/gi, '');
    html = html.replace(/<div[^>]*class=["'][^"']*framer-badge[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');
    html = html.replace(/<div[^>]*class=["'][^"']*badge[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

    // Inject CSS kuat
    const extraCSS = `
      <style>
        #__framer-badge-container, 
        [data-framer-badge], 
        .framer-badge,
        div[class*="framer-badge"],
        a[href*="framer.com"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          position: absolute !important;
        }
      </style>`;

    if (html.includes('</head>')) {
      html = html.replace('</head>', extraCSS + '</head>');
    } else {
      html = html.replace('<body', extraCSS + '<body');
    }

    // Fix asset path (penting!)
    html = html.replace(/https:\/\/porta\.framer\.ai/g, '');

    return new NextResponse(html, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow', // sementara
      },
    });

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.redirect('https://porta.framer.ai');
  }
}

export const config = {
  matcher: '/:path*',
};