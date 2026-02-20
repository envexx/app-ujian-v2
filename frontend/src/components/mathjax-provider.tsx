"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export function MathJaxProvider() {
  const typesetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Debounced typeset function untuk menghindari terlalu banyak re-render
    const handleTypeset = () => {
      // Clear previous timeout
      if (typesetTimeoutRef.current) {
        clearTimeout(typesetTimeoutRef.current);
      }

      // Debounce typeset dengan delay 500ms untuk menghindari terlalu banyak call
      typesetTimeoutRef.current = setTimeout(() => {
        if (typeof window !== "undefined" && (window as any).MathJax?.typesetPromise) {
          (window as any).MathJax.typesetPromise().catch((err: any) => {
            console.debug("MathJax typeset error:", err);
          });
        }
      }, 500);
    };

    // Typeset on DOM mutations (hanya untuk elemen yang mengandung math)
    const observer = new MutationObserver((mutations) => {
      // Cek apakah ada perubahan yang relevan (menambahkan node baru atau mengubah text)
      const hasRelevantChange = mutations.some((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Cek apakah node baru mengandung delimiter math
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const text = element.textContent || '';
              // Hanya trigger jika ada delimiter math
              if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
                return true;
              }
            }
          }
        }
        if (mutation.type === 'characterData') {
          const text = mutation.target.textContent || '';
          if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
            return true;
          }
        }
        return false;
      });

      if (hasRelevantChange) {
        handleTypeset();
      }
    });

    // Observe hanya main content area, bukan seluruh body
    // Tunggu sampai DOM ready
    const initObserver = () => {
      const mainContent = document.querySelector('main') || document.body;
      observer.observe(mainContent, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false, // Tidak perlu observe attributes
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initObserver);
    } else {
      initObserver();
    }

    return () => {
      observer.disconnect();
      if (typesetTimeoutRef.current) {
        clearTimeout(typesetTimeoutRef.current);
      }
      document.removeEventListener('DOMContentLoaded', initObserver);
    };
  }, []);

  return (
    <>
      {/* MathJax Configuration - Load sebelum script */}
      <Script
        id="mathjax-config"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true
              },
              options: {
                ignoreHtmlClass: 'tex2jax_ignore',
                processHtmlClass: 'tex2jax_process',
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
              }
            };
          `,
        }}
      />
      
      {/* MathJax Script - Load dengan lazyOnload untuk tidak blocking initial render */}
      <Script
        id="MathJax-script"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        strategy="lazyOnload"
        onLoad={() => {
          // Typeset all math on page load
          if (typeof window !== "undefined" && (window as any).MathJax?.typesetPromise) {
            (window as any).MathJax.typesetPromise().catch((err: any) => {
              console.debug("MathJax initial typeset error:", err);
            });
          }
        }}
      />
    </>
  );
}
