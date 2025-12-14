// src/components/Writing/PaginatedView.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

/**
 * PaginatedView - Display content in 8.5" x 11" pages
 * Props:
 *   html: string - HTML content to paginate
 *   title: string - Chapter title
 *   author: string - Author name
 *   pageWidth: number - Width in pixels (default 612 = 8.5" at 72dpi)
 *   pageHeight: number - Height in pixels (default 792 = 11" at 72dpi)
 */
export default function PaginatedView({
  html = "",
  title = "",
  author = "",
  chapterNumber = 1,
  onEdit,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pages, setPages] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  // Page dimensions (8.5" x 11" at 96dpi scale factor)
  const PAGE_WIDTH = 816; // 8.5 inches * 96 dpi
  const PAGE_HEIGHT = 1056; // 11 inches * 96 dpi
  const MARGIN = 72; // 0.75 inch margins
  const CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN * 2;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  // Split content into pages
  useEffect(() => {
    if (!html) {
      setPages([""]);
      setTotalPages(1);
      return;
    }

    // Create a hidden div to measure content
    const measureDiv = document.createElement("div");
    measureDiv.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${CONTENT_WIDTH}px;
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 12pt;
      line-height: 2;
      padding: 0;
    `;
    document.body.appendChild(measureDiv);

    // Parse HTML into elements
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const elements = Array.from(tempDiv.childNodes);

    const pageContent = [];
    let currentPageHtml = "";
    let currentHeight = 0;

    elements.forEach((node) => {
      // Clone node and measure
      const clone = node.cloneNode(true);
      measureDiv.innerHTML = "";
      measureDiv.appendChild(clone);
      const nodeHeight = measureDiv.offsetHeight;

      if (currentHeight + nodeHeight > CONTENT_HEIGHT && currentPageHtml) {
        // Start new page
        pageContent.push(currentPageHtml);
        currentPageHtml = node.outerHTML || node.textContent || "";
        currentHeight = nodeHeight;
      } else {
        // Add to current page
        currentPageHtml += node.outerHTML || node.textContent || "";
        currentHeight += nodeHeight;
      }
    });

    // Don't forget the last page
    if (currentPageHtml) {
      pageContent.push(currentPageHtml);
    }

    document.body.removeChild(measureDiv);

    setPages(pageContent.length > 0 ? pageContent : [""]);
    setTotalPages(pageContent.length || 1);
  }, [html]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goToPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        goToPage(totalPages);
      } else if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, isFullscreen]);

  const scale = isFullscreen ? 1 : 0.7; // Scale down for non-fullscreen view

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center ${
        isFullscreen ? "bg-slate-800 p-8" : "bg-slate-100 p-4"
      }`}
      style={{ minHeight: isFullscreen ? "100vh" : "auto" }}
    >
      {/* Controls */}
      <div className="flex items-center justify-between w-full max-w-3xl mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-300 rounded-md">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-12 text-center text-sm border-none focus:outline-none"
            />
            <span className="text-sm text-slate-500">of {totalPages}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Edit
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md bg-white border border-slate-300 hover:bg-slate-50"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Page */}
      <div
        className="bg-white shadow-2xl relative"
        style={{
          width: PAGE_WIDTH * scale,
          height: PAGE_HEIGHT * scale,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          marginBottom: isFullscreen ? 0 : -(PAGE_HEIGHT * (1 - scale)),
        }}
      >
        {/* Page content */}
        <div
          ref={contentRef}
          className="absolute"
          style={{
            top: MARGIN,
            left: MARGIN,
            right: MARGIN,
            bottom: MARGIN,
            fontFamily: "'Times New Roman', Georgia, serif",
            fontSize: "12pt",
            lineHeight: 2,
            overflow: "hidden",
          }}
        >
          {/* Header (chapter title on first page) */}
          {currentPage === 1 && title && (
            <div className="text-center mb-8">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                Chapter {chapterNumber}
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
              >
                {title}
              </h1>
            </div>
          )}

          {/* Content */}
          <div
            dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] || "" }}
            style={{
              textAlign: "justify",
              textIndent: "0.5in",
            }}
          />
        </div>

        {/* Page number */}
        <div
          className="absolute bottom-6 left-0 right-0 text-center text-sm text-slate-500"
          style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
        >
          {currentPage}
        </div>

        {/* Running header (author / title) */}
        {currentPage > 1 && (
          <div
            className="absolute top-6 left-0 right-0 text-center text-xs text-slate-400 uppercase tracking-wide"
            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
          >
            {author && `${author} / `}
            {title}
          </div>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="mt-4 text-xs text-slate-500">
        Use ← → arrow keys or Page Up/Down to navigate • Home/End for first/last
        page
        {!isFullscreen && " • Click fullscreen for larger view"}
      </div>
    </div>
  );
}

