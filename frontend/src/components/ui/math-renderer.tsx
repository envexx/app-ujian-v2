"use client";

import { useEffect, useRef } from "react";

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * MathRenderer - Sederhana dan cepat
 * Hanya menampilkan konten dan membiarkan MathJax yang merender LaTeX
 * Format yang didukung: $...$ untuk inline math, $$...$$ untuk display math
 */
export function MathRenderer({ content, className = "" }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Jika content sudah HTML (dari Lexical/KaTeX), render langsung
    // Cek apakah mengandung tag HTML seperti <img>, <p>, <div>, dll
    const isHTML = /<[a-z][\s\S]*>/i.test(content);
    
    if (isHTML) {
      // Render sebagai HTML (untuk image, formatting, dll)
      containerRef.current.innerHTML = content;
    } else {
      // Plain text - escape HTML untuk keamanan, MathJax akan merender LaTeX
      const textNode = document.createTextNode(content);
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(textNode);
    }

    // Trigger MathJax typeset untuk elemen ini saja (lebih cepat)
    if (typeof window !== "undefined" && (window as any).MathJax?.typesetPromise) {
      // Debounce untuk menghindari terlalu banyak call
      const timeoutId = setTimeout(() => {
        if (containerRef.current) {
          (window as any).MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
            console.debug("MathJax typeset error:", err);
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ lineHeight: '1.6' }}
    />
  );
}

