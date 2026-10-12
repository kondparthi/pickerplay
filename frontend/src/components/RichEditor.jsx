import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Youtube from '@tiptap/extension-youtube'
import CharacterCount from '@tiptap/extension-character-count'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import {
  Bold, Italic, Underline as UIcon, Strikethrough, Highlighter, Link2, Unlink, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Minus, ImagePlus, Youtube as YtIcon, Table as TableIcon, Undo2, Redo2, RemoveFormatting,
  FileCode2, Maximize2, Minimize2, Rows3, Columns3, Trash2, Baseline, Pilcrow, CornerDownLeft,
} from 'lucide-react'
import { uploadImage } from '../lib/api'
import { normalizeHtml } from '../lib/content'
import '../editor.css'

function Btn({ on, active, disabled, title, children }) {
  return (
    <button type="button" className={`re-btn ${active ? 'is-active' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={on} disabled={disabled} title={title} aria-label={title}>
      {children}
    </button>
  )
}
const Sep = () => <span className="re-sep" />

/**
 * WYSIWYG blog editor (TipTap). Paste from Word / Google Docs / websites keeps headings,
 * lists, links and tables. "HTML" switches to source mode.
 */
export default function RichEditor({ value, onChange, onError }) {
  const [source, setSource] = useState(false)
  const [html, setHtml] = useState('')
  const [full, setFull] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener' } }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: 'Start writing your article… Paste from Word or Google Docs – formatting is kept.' }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      CharacterCount,
    ],
    content: normalizeHtml(value),
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? '' : ed.getHTML()),
  })

  useEffect(() => {
    document.body.classList.toggle('re-noscroll', full)
    return () => document.body.classList.remove('re-noscroll')
  }, [full])

  if (!editor) return null
  const ch = () => editor.chain().focus()
  const block = editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : editor.isActive('heading', { level: 4 }) ? 'h4' : 'p'

  const setBlock = (v) => (v === 'p' ? ch().setParagraph().run() : ch().toggleHeading({ level: Number(v[1]) }).run())
  const setLink = () => {
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('Link URL (e.g. /team-picker or https://…)', prev)
    if (url === null) return
    if (!url.trim()) return ch().extendMarkRange('link').unsetLink().run()
    ch().extendMarkRange('link').setLink({ href: url.trim(), target: /^https?:/.test(url) ? '_blank' : null }).run()
  }
  const addImage = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const src = await uploadImage(file)
      ch().setImage({ src, alt: file.name.replace(/\.[^.]+$/, '') }).run()
    } catch (e) {
      onError?.(e.message)
    } finally {
      setBusy(false)
    }
  }
  const addImageUrl = () => {
    const src = window.prompt('Image URL (https://…)')
    if (src && /^https?:\/\/|^\//.test(src)) ch().setImage({ src }).run()
  }
  const addVideo = () => {
    const url = window.prompt('YouTube video URL')
    if (url) ch().setYoutubeVideo({ src: url }).run()
  }
  const toggleSource = () => {
    if (!source) {
      setHtml(editor.getHTML().replace(/></g, '>\n<'))
      setSource(true)
    } else {
      editor.commands.setContent(normalizeHtml(html), true)
      onChange(editor.getHTML())
      setSource(false)
    }
  }
  const tidy = () => {
    // turn pasted plain text into paragraphs/headings/lists
    const text = editor.getText({ blockSeparator: '\n\n' })
    editor.commands.setContent(normalizeHtml(text), true)
  }

  const words = editor.storage.characterCount.words()
  const inTable = editor.isActive('table')
  const dis = source

  return (
    <div className={`re-wrap ${full ? 'is-full' : ''}`}>
      <div className="re-toolbar">
        <div className="re-row">
          <Btn title="Undo" on={() => ch().undo().run()} disabled={dis || !editor.can().undo()}><Undo2 size={17} /></Btn>
          <Btn title="Redo" on={() => ch().redo().run()} disabled={dis || !editor.can().redo()}><Redo2 size={17} /></Btn>
          <Sep />
          <select className="re-select" value={block} onChange={(e) => setBlock(e.target.value)} disabled={dis} aria-label="Text style">
            <option value="p">Paragraph</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>
          <Sep />
          <Btn title="Bold (Ctrl+B)" active={editor.isActive('bold')} on={() => ch().toggleBold().run()} disabled={dis}><Bold size={17} /></Btn>
          <Btn title="Italic (Ctrl+I)" active={editor.isActive('italic')} on={() => ch().toggleItalic().run()} disabled={dis}><Italic size={17} /></Btn>
          <Btn title="Underline (Ctrl+U)" active={editor.isActive('underline')} on={() => ch().toggleUnderline().run()} disabled={dis}><UIcon size={17} /></Btn>
          <Btn title="Strikethrough" active={editor.isActive('strike')} on={() => ch().toggleStrike().run()} disabled={dis}><Strikethrough size={17} /></Btn>
          <Btn title="Highlight" active={editor.isActive('highlight')} on={() => ch().toggleHighlight().run()} disabled={dis}><Highlighter size={17} /></Btn>
          <label className={`re-btn re-color ${dis ? 'is-disabled' : ''}`} title="Text colour">
            <Baseline size={17} />
            <i style={{ background: editor.getAttributes('textStyle').color || '#1c1d2e' }} />
            <input type="color" disabled={dis} value={editor.getAttributes('textStyle').color || '#1c1d2e'} onChange={(e) => ch().setColor(e.target.value).run()} />
          </label>
          <Sep />
          <Btn title="Link" active={editor.isActive('link')} on={setLink} disabled={dis}><Link2 size={17} /></Btn>
          <Btn title="Remove link" on={() => ch().unsetLink().run()} disabled={dis || !editor.isActive('link')}><Unlink size={17} /></Btn>
          <Sep />
          <Btn title="Align left" active={editor.isActive({ textAlign: 'left' })} on={() => ch().setTextAlign('left').run()} disabled={dis}><AlignLeft size={17} /></Btn>
          <Btn title="Align centre" active={editor.isActive({ textAlign: 'center' })} on={() => ch().setTextAlign('center').run()} disabled={dis}><AlignCenter size={17} /></Btn>
          <Btn title="Align right" active={editor.isActive({ textAlign: 'right' })} on={() => ch().setTextAlign('right').run()} disabled={dis}><AlignRight size={17} /></Btn>
          <Btn title="Justify" active={editor.isActive({ textAlign: 'justify' })} on={() => ch().setTextAlign('justify').run()} disabled={dis}><AlignJustify size={17} /></Btn>
        </div>
        <div className="re-row">
          <Btn title="Bullet list" active={editor.isActive('bulletList')} on={() => ch().toggleBulletList().run()} disabled={dis}><List size={17} /></Btn>
          <Btn title="Numbered list" active={editor.isActive('orderedList')} on={() => ch().toggleOrderedList().run()} disabled={dis}><ListOrdered size={17} /></Btn>
          <Btn title="Quote" active={editor.isActive('blockquote')} on={() => ch().toggleBlockquote().run()} disabled={dis}><Quote size={17} /></Btn>
          <Btn title="Code block" active={editor.isActive('codeBlock')} on={() => ch().toggleCodeBlock().run()} disabled={dis}><Code size={17} /></Btn>
          <Btn title="Divider line" on={() => ch().setHorizontalRule().run()} disabled={dis}><Minus size={17} /></Btn>
          <Btn title="Line break (Shift+Enter)" on={() => ch().setHardBreak().run()} disabled={dis}><CornerDownLeft size={17} /></Btn>
          <Sep />
          <Btn title="Upload image" on={() => fileRef.current?.click()} disabled={dis || busy}><ImagePlus size={17} /></Btn>
          <button type="button" className="re-btn re-text" onClick={addImageUrl} disabled={dis} title="Image from URL">URL</button>
          <Btn title="YouTube video" on={addVideo} disabled={dis}><YtIcon size={17} /></Btn>
          <Btn title="Insert table" on={() => ch().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} disabled={dis}><TableIcon size={17} /></Btn>
          {inTable && !dis && (
            <span className="re-table-tools">
              <button type="button" className="re-btn re-text" onClick={() => ch().addRowAfter().run()} title="Add row"><Rows3 size={15} /> +Row</button>
              <button type="button" className="re-btn re-text" onClick={() => ch().addColumnAfter().run()} title="Add column"><Columns3 size={15} /> +Col</button>
              <button type="button" className="re-btn re-text" onClick={() => ch().deleteRow().run()} title="Delete row">−Row</button>
              <button type="button" className="re-btn re-text" onClick={() => ch().deleteColumn().run()} title="Delete column">−Col</button>
              <button type="button" className="re-btn re-text danger" onClick={() => ch().deleteTable().run()} title="Delete table"><Trash2 size={15} /></button>
            </span>
          )}
          <Sep />
          <Btn title="Clear formatting" on={() => ch().unsetAllMarks().clearNodes().run()} disabled={dis}><RemoveFormatting size={17} /></Btn>
          <Btn title="Fix pasted plain text (make paragraphs, headings and lists)" on={tidy} disabled={dis}><Pilcrow size={17} /></Btn>
          <span className="re-grow" />
          <span className="re-count">{words} words · {Math.max(1, Math.ceil(words / 200))} min read</span>
          <Btn title={source ? 'Back to visual editor' : 'Edit HTML source'} active={source} on={toggleSource}><FileCode2 size={17} /></Btn>
          <Btn title={full ? 'Exit full screen' : 'Full screen'} on={() => setFull((f) => !f)}>{full ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</Btn>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { addImage(e.target.files?.[0]); e.target.value = '' }} />
      {source ? (
        <textarea className="re-source" value={html} onChange={(e) => setHtml(e.target.value)} spellCheck={false} />
      ) : (
        <EditorContent editor={editor} className="re-content" />
      )}
    </div>
  )
}
