import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import 'github-markdown-css/github-markdown.css';
import styles from '../styles/pages/DocsPreviewPage.module.css';

const DOC_LIST = [
  { filename: 'portfolio-intro.md', label: '📋 프로젝트 소개서' },
  { filename: 'README.md',          label: '📖 README' },
  { filename: 'api-reference.md',   label: '🔌 API 명세' },
  { filename: 'architecture.md',    label: '🏗 아키텍처' },
  { filename: 'erd.md',             label: '🗄 ERD' },
];

export default function DocsPreviewPage() {
  const [selected, setSelected] = useState(DOC_LIST[0].filename);
  const [rawContent, setRawContent] = useState('');
  const contentRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/docs/${selected}`)
      .then(res => res.ok ? res.text() : '')
      .then(text => { if (!cancelled) setRawContent(text); })
      .catch(() => { if (!cancelled) setRawContent(''); });
    return () => { cancelled = true; };
  }, [selected]);

  const html = rawContent
    ? marked.parse(rawContent, { gfm: true, breaks: false })
    : '';

  useEffect(() => {
    if (!contentRef.current) return;
    const mermaidDivs = contentRef.current.querySelectorAll('pre > code.language-mermaid');
    if (mermaidDivs.length === 0) return;

    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      mermaidDivs.forEach((codeEl) => {
        const pre = codeEl.parentElement;
        const definition = codeEl.textContent;
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.textContent = definition;
        pre.replaceWith(div);
      });
      mermaid.run({ nodes: contentRef.current.querySelectorAll('.mermaid') });
    });
  }, [html]);

  return (
    <div className={styles['docs-layout']}>
      <aside className={styles['docs-sidebar']}>
        <div className={styles['docs-sidebar-title']}>문서 목록</div>
        <nav>
          {DOC_LIST.map(({ filename, label }) => (
            <button
              key={filename}
              className={`${styles['docs-nav-item']} ${selected === filename ? styles['docs-nav-item--active'] : ''}`}
              onClick={() => setSelected(filename)}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className={styles['docs-main']}>
        <div
          ref={contentRef}
          className="markdown-body"
          style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </div>
  );
}
