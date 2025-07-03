'use client';

import { useMemo } from 'react';
import { marked } from 'marked';
import { clsx } from 'clsx';

interface MarkdownPreviewProps {
  markdown: string;
  className?: string;
}

export function MarkdownPreview({ markdown, className }: MarkdownPreviewProps) {
  const htmlContent = useMemo(() => {
    if (!markdown.trim()) {
      return '<div class="text-gray-400 italic">No content to preview</div>';
    }

    // Configure marked for better PRD rendering
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
      mangle: false,
    });

    // Custom renderer for PRD-specific elements
    const renderer = new marked.Renderer();
    
    // Custom heading renderer with better styling
    renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
      const headingClass = depth === 1 ? 'text-3xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200' :
                          depth === 2 ? 'text-2xl font-semibold text-gray-800 mb-3 mt-6' :
                          depth === 3 ? 'text-xl font-medium text-gray-700 mb-2 mt-4' :
                          'text-lg font-medium text-gray-600 mb-2 mt-3';
      
      return `<h${depth} id="${escapedText}" class="${headingClass}">${text}</h${depth}>`;
    };

    // Custom blockquote renderer for requirements/notes
    renderer.blockquote = ({ text }: { text: string }) => {
      return `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">${text}</blockquote>`;
    };

    // Custom code block renderer
    renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      const langClass = lang ? `language-${lang}` : '';
      return `<pre class="bg-gray-100 rounded-lg p-4 overflow-x-auto my-4"><code class="${langClass} text-sm">${text}</code></pre>`;
    };

    // Custom inline code renderer
    renderer.codespan = ({ text }: { text: string }) => {
      return `<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">${text}</code>`;
    };

    // Custom table renderer
    renderer.table = ({ header, body }: { header: string; body: string }) => {
      return `<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300">${header}${body}</table></div>`;
    };

    renderer.tablerow = ({ text }: { text: string }) => {
      return `<tr class="border-b border-gray-200">${text}</tr>`;
    };

    renderer.tablecell = ({ text, flags }: { text: string; flags: { header?: boolean } }) => {
      const tag = flags.header ? 'th' : 'td';
      const className = flags.header ? 'bg-gray-50 font-semibold' : 'bg-white';
      return `<${tag} class="${className} px-4 py-2 border border-gray-300 text-left">${text}</${tag}>`;
    };

    // Custom list renderer
    renderer.list = ({ body, ordered }: { body: string; ordered: boolean }) => {
      const tag = ordered ? 'ol' : 'ul';
      const className = ordered ? 'list-decimal' : 'list-disc';
      return `<${tag} class="${className} ml-6 my-2 space-y-1">${body}</${tag}>`;
    };

    renderer.listitem = ({ text }: { text: string }) => {
      return `<li class="text-gray-700">${text}</li>`;
    };

    // Custom link renderer
    renderer.link = ({ href, title, text }: { href: string; title?: string; text: string }) => {
      const titleAttr = title ? `title="${title}"` : '';
      return `<a href="${href}" ${titleAttr} class="text-blue-600 hover:text-blue-800 underline">${text}</a>`;
    };

    // Custom paragraph renderer
    renderer.paragraph = ({ text }: { text: string }) => {
      return `<p class="text-gray-700 mb-4 leading-relaxed">${text}</p>`;
    };

    // Custom horizontal rule
    renderer.hr = () => {
      return `<hr class="my-6 border-t-2 border-gray-300">`;
    };

    // Custom emphasis
    renderer.em = ({ text }: { text: string }) => {
      return `<em class="italic text-gray-700">${text}</em>`;
    };

    renderer.strong = ({ text }: { text: string }) => {
      return `<strong class="font-semibold text-gray-900">${text}</strong>`;
    };

    marked.use({ renderer });

    try {
      return marked(markdown);
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return '<div class="text-red-500">Error rendering markdown preview</div>';
    }
  }, [markdown]);

  return (
    <div 
      className={clsx(
        'prose prose-gray max-w-none',
        'prose-headings:font-bold prose-headings:text-gray-900',
        'prose-p:text-gray-700 prose-p:leading-relaxed',
        'prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline',
        'prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
        'prose-pre:bg-gray-100 prose-pre:border prose-pre:border-gray-200',
        'prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50',
        'prose-li:text-gray-700',
        className
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}