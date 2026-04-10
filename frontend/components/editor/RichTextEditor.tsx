"use client"

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { createLowlight } from 'lowlight'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  CodeSquare,
  Minus,
  MoreHorizontal,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// Import common languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'

// Create lowlight instance and register languages
const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('java', java)
lowlight.register('css', css)
lowlight.register('html', html)
lowlight.register('json', json)
lowlight.register('bash', bash)
lowlight.register('sql', sql)

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  onSave?: () => void
}

interface MenuBarProps {
  editor: Editor | null
}

const MenuBar = ({ editor }: MenuBarProps) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [imageTab, setImageTab] = useState<'url' | 'upload' | 'unsplash'>('unsplash')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [unsplashResults, setUnsplashResults] = useState<any[]>([])
  const [unsplashLoading, setUnsplashLoading] = useState(false)
  const [selectedUnsplashImage, setSelectedUnsplashImage] = useState<any>(null)

  const addLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    setLinkDialogOpen(true)
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl, target: '_blank' })
        .run()
    }
    setLinkDialogOpen(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const uploadImage = useCallback(async () => {
    if (!uploadedFile || !editor) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      const token = localStorage.getItem('accessToken')

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()

      // Insert the uploaded image into the editor
      editor.chain().focus().setImage({ src: data.url, alt: imageAlt || uploadedFile.name }).run()

      // Reset state
      setImageDialogOpen(false)
      setUploadedFile(null)
      setPreviewUrl('')
      setImageAlt('')
      setUploadProgress(0)
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [editor, uploadedFile, imageAlt])

  const searchUnsplash = useCallback(async () => {
    if (!unsplashQuery.trim()) return

    setUnsplashLoading(true)
    try {
      const response = await fetch(
        `/api/images/search?query=${encodeURIComponent(unsplashQuery)}&per_page=12`
      )
      const data = await response.json()

      if (data.success) {
        setUnsplashResults(data.data.images)
      } else {
        alert(data.error || 'Failed to search images')
      }
    } catch (error: any) {
      console.error('Unsplash search error:', error)
      alert('Failed to search images')
    } finally {
      setUnsplashLoading(false)
    }
  }, [unsplashQuery])

  const addImage = useCallback(() => {
    if (!editor) return
    if (imageTab === 'url' && imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt }).run()
      setImageDialogOpen(false)
      setImageUrl('')
      setImageAlt('')
    } else if (imageTab === 'upload' && uploadedFile) {
      uploadImage()
    } else if (imageTab === 'unsplash' && selectedUnsplashImage) {
      editor.chain().focus().setImage({
        src: selectedUnsplashImage.url,
        alt: selectedUnsplashImage.alt
      }).run()
      setImageDialogOpen(false)
      setSelectedUnsplashImage(null)
      setUnsplashQuery('')
      setUnsplashResults([])
    }
  }, [editor, imageTab, imageUrl, imageAlt, uploadedFile, uploadImage, selectedUnsplashImage])

  const addTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ]

  return (
    <>
      <div className="border-b border-gray-200 bg-gray-50 p-3 rounded-t-xl sticky top-0 z-10">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-gray-200' : ''}
              title="Bold (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-gray-200' : ''}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? 'bg-gray-200' : ''}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'bg-gray-200' : ''}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'bg-gray-200' : ''}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className={editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''}
              title="Justify"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          {/* Insert */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addLink}
              className={editor.isActive('link') ? 'bg-gray-200' : ''}
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setImageDialogOpen(true)}
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addTable}
              title="Insert Table"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'bg-gray-200' : ''}
              title="Code Block"
            >
              <CodeSquare className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          {/* Styling */}
          <div className="flex gap-1 border-r border-gray-300 pr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? 'bg-gray-200' : ''}
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <div className="relative group">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </Button>
              <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20">
                <div className="grid grid-cols-5 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => editor.chain().focus().setColor(color).run()}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table controls when table is active */}
        {editor.isActive('table') && (
          <div className="flex gap-1 mt-2 pt-2 border-t border-gray-300">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add Column Before"
            >
              Col Before
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column After"
            >
              Col After
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete Column"
            >
              Delete Col
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add Row Before"
            >
              Row Before
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row After"
            >
              Row After
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete Row"
            >
              Delete Row
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Table"
            >
              Delete Table
            </Button>
          </div>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setLink()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={setLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>

          {/* Tab Buttons */}
          <div className="flex gap-2 border-b">
            <button
              type="button"
              className={`px-4 py-2 font-medium transition-colors ${
                imageTab === 'unsplash'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setImageTab('unsplash')}
            >
              Free Images (Unsplash)
            </button>
            <button
              type="button"
              className={`px-4 py-2 font-medium transition-colors ${
                imageTab === 'url'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setImageTab('url')}
            >
              From URL
            </button>
            <button
              type="button"
              className={`px-4 py-2 font-medium transition-colors ${
                imageTab === 'upload'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setImageTab('upload')}
            >
              Upload File
            </button>
          </div>

          <div className="space-y-4 py-4">
            {imageTab === 'unsplash' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="unsplash-search">Search Free Images</Label>
                  <div className="flex gap-2">
                    <Input
                      id="unsplash-search"
                      placeholder="e.g., business, nature, technology..."
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          searchUnsplash()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={searchUnsplash}
                      disabled={unsplashLoading || !unsplashQuery.trim()}
                    >
                      {unsplashLoading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>

                {unsplashResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select an Image</Label>
                    <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                      {unsplashResults.map((image) => (
                        <button
                          key={image.id}
                          type="button"
                          className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                            selectedUnsplashImage?.id === image.id
                              ? 'border-emerald-600 ring-2 ring-emerald-200'
                              : 'border-transparent hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedUnsplashImage(image)}
                        >
                          <img
                            src={image.thumbnail || image.thumb}
                            alt={image.alt}
                            className="w-full h-32 object-cover"
                          />
                          {selectedUnsplashImage?.id === image.id && (
                            <div className="absolute inset-0 bg-emerald-600 bg-opacity-20 flex items-center justify-center">
                              <div className="bg-emerald-600 text-white rounded-full p-1">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Images by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Unsplash</a>
                    </p>
                  </div>
                )}

                {unsplashResults.length === 0 && !unsplashLoading && unsplashQuery && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No images found. Try a different search term.
                  </p>
                )}
              </>
            ) : imageTab === 'url' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-alt">Alt Text (Optional)</Label>
                  <Input
                    id="image-alt"
                    placeholder="Image description"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="image-file">Choose Image File</Label>
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                  </p>
                </div>

                {previewUrl && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border rounded-lg p-2 bg-gray-50">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full h-auto max-h-64 mx-auto rounded"
                      />
                    </div>
                  </div>
                )}

                {uploadedFile && (
                  <div className="space-y-2">
                    <Label htmlFor="image-alt-upload">Alt Text (Optional)</Label>
                    <Input
                      id="image-alt-upload"
                      placeholder="Image description"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      disabled={uploading}
                    />
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <Label>Uploading...</Label>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImageDialogOpen(false)
                setUploadedFile(null)
                setPreviewUrl('')
                setImageUrl('')
                setImageAlt('')
                setSelectedUnsplashImage(null)
                setUnsplashQuery('')
                setUnsplashResults([])
                setImageTab('unsplash')
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={addImage}
              disabled={
                uploading ||
                (imageTab === 'url' && !imageUrl) ||
                (imageTab === 'upload' && !uploadedFile) ||
                (imageTab === 'unsplash' && !selectedUnsplashImage)
              }
            >
              {uploading ? 'Uploading...' : 'Insert Image'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing your content...',
  editable = true,
  onSave,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We're using CodeBlockLowlight instead
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-600 underline hover:text-emerald-700',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-3 py-2',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-3 py-2 bg-gray-100 font-semibold',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-900 text-gray-100 rounded-lg p-4 my-4 overflow-x-auto',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    editable,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none px-6 py-4 min-h-[500px]',
      },
    },
  })

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (onSave) {
          onSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave])

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="prose-editor" />
    </div>
  )
}
