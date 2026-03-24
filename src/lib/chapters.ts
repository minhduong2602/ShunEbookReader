export interface ChapterMarker {
  id: string;
  title: string;
}

export function detectChapters(text: string, isHtml: boolean): { processedContent: string, chapters: ChapterMarker[] } {
  const chapters: ChapterMarker[] = [];
  
  if (isHtml) {
    // For HTML, we can parse h1, h2, h3 tags
    // This is a simple regex approach. A DOM parser would be better but this works for basic HTML.
    let chapterIndex = 0;
    const processedContent = text.replace(/<h([1-3])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, innerText) => {
      // Strip HTML tags from inner text for the title
      const cleanTitle = innerText.replace(/<[^>]+>/g, '').trim();
      if (!cleanTitle) return match;
      
      const id = `chapter-marker-${chapterIndex++}`;
      chapters.push({ id, title: cleanTitle });
      
      // Wrap innerText in a span with our id to avoid conflicting with existing ids
      return `<h${level}${attrs}><span id="${id}">${innerText}</span></h${level}>`;
    });
    
    return { processedContent, chapters };
  } else {
    // For plain text, split by lines and look for chapter patterns
    const lines = text.split('\n');
    // Matches:
    // - Chapter 1, Chương 1, Quyển 1, Phần 1, Bài 1
    // - 1. Title, 1 - Title
    // - I. Title, IX. Title
    const chapterRegex = /^(?:(?:chapter|chương|quyển|phần|bài)\s+[\dIVXLCDM]+|[\dIVXLCDM]+[\.\-:])[\s:\-.]*(.*)$/i;
    
    const processedLines = lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Escape HTML to prevent XSS and rendering issues
      const escapedLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
        
      if (trimmed.length === 0 || trimmed.length > 100) return escapedLine;
      
      if (chapterRegex.test(trimmed)) {
        const id = `chapter-marker-${index}`;
        chapters.push({ id, title: trimmed });
        return `<span id="${id}" class="font-bold text-xl mt-6 mb-2 block">${escapedLine}</span>`;
      }
      return escapedLine;
    });
    
    return { processedContent: processedLines.join('\n'), chapters };
  }
}

