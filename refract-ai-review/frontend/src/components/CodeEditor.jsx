import { forwardRef, useImperativeHandle, useRef } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = forwardRef(function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}, forwardedRef) {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  useImperativeHandle(forwardedRef, () => ({
    revealLine(line) {
      const editor = editorRef.current;
      if (!editor || !line) return;
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column: 1 });
      editor.focus();
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
        range: {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'review-line-highlight',
          glyphMarginClassName: 'review-line-glyph',
        },
      }]);
    },
    clearHighlight() {
      if (editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
    },
  }), []);

  return (
    <Editor
      height="100%"
      language={language === 'text' ? 'plaintext' : language}
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? '')}
      onMount={(editor) => { editorRef.current = editor; }}
      theme="refract-dark"
      beforeMount={(monaco) => {
        monaco.editor.defineTheme('refract-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '626d83', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'a5a6ff' },
            { token: 'string', foreground: '9bc9a7' },
            { token: 'number', foreground: 'e6b77b' },
          ],
          colors: {
            'editor.background': '#0e111a',
            'editor.foreground': '#d9dfeb',
            'editorLineNumber.foreground': '#3d465a',
            'editorLineNumber.activeForeground': '#9ca8bf',
            'editorCursor.foreground': '#a5a6ff',
            'editor.selectionBackground': '#6366f133',
            'editor.lineHighlightBackground': '#ffffff08',
            'editorIndentGuide.background1': '#252b3a',
            'editorIndentGuide.activeBackground1': '#424a60',
            'editorGutter.background': '#0e111a',
          },
        });
      }}
      options={{
        readOnly,
        automaticLayout: true,
        minimap: { enabled: false },
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12.5,
        lineHeight: 22,
        padding: { top: 18, bottom: 24 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        renderLineHighlight: 'all',
        wordWrap: 'off',
        tabSize: 2,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        overviewRulerLanes: 0,
        contextmenu: true,
        quickSuggestions: true,
      }}
    />
  );
});

export default CodeEditor;
