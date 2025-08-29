import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { CodeBlock } from '@tiptap/extension-code-block';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CharacterCount } from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Eraser,
  Save,
  Eye,
  EyeOff,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Palette,
  Highlighter,
  Trash2,
  Plus,
  Minus,
  MoreHorizontal
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  showToolbar?: boolean;
  maxLength?: number;
  onSave?: () => void;
  onEnterPress?: () => void; // ENTER tuşu işleyicisi eklendi
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Metninizi buraya yazın...',
  readOnly = false,
  className = '',
  showToolbar = true,
  maxLength,
  onSave,
  onEnterPress
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // HTML etiketlerini temizleyen fonksiyon - boşlukları koruyarak
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    // textContent kullanarak boşlukları koruyoruz
    const text = tmp.textContent || tmp.innerText || '';
    // Sadece başındaki ve sonundaki boşlukları temizle, içerideki boşlukları koru
    return text.trim();
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside space-y-1'
          }
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-inside space-y-1'
          }
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300'
          }
        }
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg'
        }
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm'
        }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 dark:border-gray-600'
        }
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-600 px-4 py-2'
        }
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 font-bold'
        }
      }),
      CharacterCount.configure({
        limit: maxLength
      })
    ],
    content: value,
    editable: !readOnly && !isPreview,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // HTML etiketlerini temizle ve sadece metni al
      const cleanText = stripHtml(html);
      // Boşlukları koruyarak onChange'i çağır
      onChange(cleanText);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 whitespace-pre-wrap'
      },
      handleKeyDown: (view, event) => {
        // CTRL+ENTER ile mesaj gönder
        if (event.key === 'Enter' && event.ctrlKey && onEnterPress) {
          event.preventDefault();
          onEnterPress();
          return true;
        }
        // Sadece ENTER tuşu yeni satır ekler (varsayılan davranış)
        return false;
      }
    }
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Tablo menüsünün dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showTableMenu) {
        const target = event.target as Element;
        if (!target.closest('.table-menu-container')) {
          setShowTableMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTableMenu]);

  if (!editor) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>;
  }

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageModal(false);
    }
  };

  const addLink = () => {
    if (linkUrl) {
      // Seçili metin varsa onu link yap, yoksa URL'yi link olarak ekle
      if (editor.isActive('link')) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      } else if (linkText) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl('');
      setLinkText('');
      setShowLinkModal(false);
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const deleteTable = () => {
    editor.chain().focus().deleteTable().run();
  };

  const addTableRow = () => {
    editor.chain().focus().addRowAfter().run();
  };

  const deleteTableRow = () => {
    editor.chain().focus().deleteRow().run();
  };

  const addTableColumn = () => {
    editor.chain().focus().addColumnAfter().run();
  };

  const deleteTableColumn = () => {
    editor.chain().focus().deleteColumn().run();
  };

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };



  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    icon: Icon, 
    title, 
    disabled = false 
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: any;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <div className="border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-2">
          <div className="flex flex-wrap items-center gap-1">
            {/* Temel Formatlar */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                icon={Bold}
                title="Kalın"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                icon={Italic}
                title="İtalik"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                icon={UnderlineIcon}
                title="Altı Çizili"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                icon={Strikethrough}
                title="Üstü Çizili"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                isActive={editor.isActive('subscript')}
                icon={SubscriptIcon}
                title="Alt Simge"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                isActive={editor.isActive('superscript')}
                icon={SuperscriptIcon}
                title="Üst Simge"
              />
            </div>

            {/* Hizalama */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                icon={AlignLeft}
                title="Sola Hizala"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                icon={AlignCenter}
                title="Ortala"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                icon={AlignRight}
                title="Sağa Hizala"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                icon={AlignJustify}
                title="İki Yana Yasla"
              />
            </div>

            {/* Listeler */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                icon={List}
                title="Madde Listesi"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                icon={ListOrdered}
                title="Numaralı Liste"
              />
            </div>

            {/* Özel Formatlar */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                icon={Quote}
                title="Alıntı"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                isActive={editor.isActive('codeBlock')}
                icon={Code}
                title="Kod Bloğu"
              />
            </div>

            {/* Renk ve Vurgulama */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
              <div className="relative">
                <input
                  type="color"
                  value="#000000"
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  className="sr-only"
                  id="text-color"
                />
                <label
                  htmlFor="text-color"
                  className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-pointer"
                  title="Metin Rengi"
                >
                  <Palette className="w-4 h-4" />
                </label>
              </div>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                isActive={editor.isActive('highlight')}
                icon={Highlighter}
                title="Vurgula"
              />
            </div>

            {/* Medya */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
              <ToolbarButton
                onClick={() => {
                  // Seçili metni al
                  const { from, to } = editor.view.state.selection;
                  const selectedText = editor.view.state.doc.textBetween(from, to);
                  
                  if (selectedText) {
                    // Seçili metin varsa, link text alanını doldur
                    setLinkText(selectedText);
                  }
                  setShowLinkModal(true);
                }}
                isActive={editor.isActive('link')}
                icon={LinkIcon}
                title="Link Ekle"
              />
              <ToolbarButton
                onClick={() => setShowImageModal(true)}
                icon={ImageIcon}
                title="Resim Ekle"
              />
              <div className="relative table-menu-container">
                <ToolbarButton
                  onClick={() => setShowTableMenu(!showTableMenu)}
                  isActive={editor.isActive('table') || showTableMenu}
                  icon={TableIcon}
                  title="Tablo"
                />
                {showTableMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-[180px]">
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => {
                          insertTable();
                          setShowTableMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                      >
                        <TableIcon className="w-4 h-4" />
                        Tablo Ekle
                      </button>
                      {editor.isActive('table') && (
                        <>
                          <hr className="border-gray-300 dark:border-gray-600" />
                          <button
                            onClick={() => {
                              addTableRow();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Satır Ekle
                          </button>
                          <button
                            onClick={() => {
                              deleteTableRow();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          >
                            <Minus className="w-4 h-4" />
                            Satır Sil
                          </button>
                          <button
                            onClick={() => {
                              addTableColumn();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Sütun Ekle
                          </button>
                          <button
                            onClick={() => {
                              deleteTableColumn();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          >
                            <Minus className="w-4 h-4" />
                            Sütun Sil
                          </button>
                          <hr className="border-gray-300 dark:border-gray-600" />
                          <button
                            onClick={() => {
                              deleteTable();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Tabloyu Sil
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Düzenleme */}
            <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                icon={Undo}
                title="Geri Al"
              />
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                icon={Redo}
                title="Yinele"
              />
              <ToolbarButton
                onClick={clearFormatting}
                icon={Eraser}
                title="Formatı Temizle"
              />
            </div>

            {/* Görünüm */}
            <div className="flex items-center gap-1">
              <ToolbarButton
                onClick={() => setIsPreview(!isPreview)}
                isActive={isPreview}
                icon={isPreview ? EyeOff : Eye}
                title={isPreview ? 'Düzenleme Modu' : 'Önizleme Modu'}
              />
              {onSave && (
                <ToolbarButton
                  onClick={onSave}
                  icon={Save}
                  title="Kaydet"
                />
              )}
            </div>
          </div>

          {/* Karakter Sayacı */}
          {maxLength && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {editor.storage.characterCount?.characters() || 0} / {maxLength} karakter
            </div>
          )}
        </div>
      )}

      {/* Editör İçeriği */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className={`whitespace-pre-wrap ${isPreview ? 'bg-gray-50 dark:bg-gray-900' : ''}`}
        />
        
        {!editor.getText().trim() && !isPreview && (
          <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Resim Ekleme Modalı */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resim Ekle
            </h3>
            <input
              type="url"
              placeholder="Resim URL'si"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={addImage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Ekleme Modalı */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Link Ekle
            </h3>
            <input
              type="url"
              placeholder="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-2"
            />
            <input
              type="text"
              placeholder="Link Metni (opsiyonel)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={addLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ekle
              </button>
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
