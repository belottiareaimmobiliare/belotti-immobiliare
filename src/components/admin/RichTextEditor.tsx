'use client'

import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeightClassName?: string
}

function ToolbarButton({
  active = false,
  label,
  onClick,
}: {
  active?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? 'theme-admin-chip-active'
          : 'theme-admin-button-secondary'
      }`}
    >
      {label}
    </button>
  )
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Scrivi il contenuto...',
  minHeightClassName = 'min-h-[220px]',
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `news-editor-content ${minHeightClassName} focus:outline-none px-4 py-4 text-[var(--site-text)]`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value !== current) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div className="theme-admin-card rounded-2xl p-4 text-sm text-[var(--site-text-muted)]">
        Caricamento editor...
      </div>
    )
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href || ''
    const url = window.prompt('Inserisci URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="theme-admin-card overflow-hidden rounded-2xl border">
      <div className="flex flex-wrap gap-2 border-b border-[var(--site-border)] p-3">
        <ToolbarButton
          label="B"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="U"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="Evidenzia"
          active={editor.isActive('highlight')}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        />
        <ToolbarButton
          label="• Lista"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. Lista"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Link"
          active={editor.isActive('link')}
          onClick={setLink}
        />
        <ToolbarButton
          label="Pulisci"
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
        />
      </div>

      <div className="relative">
        {!value && (
          <div className="pointer-events-none absolute left-4 top-4 text-sm text-[var(--site-text-faint)]">
            {placeholder}
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  )
}