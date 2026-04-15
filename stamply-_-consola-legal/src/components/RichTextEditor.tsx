import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleTransform = (type: 'uppercase' | 'lowercase' | 'capitalize') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const text = selection.toString();
    if (!text) return;

    let newText = text;
    if (type === 'uppercase') newText = text.toUpperCase();
    if (type === 'lowercase') newText = text.toLowerCase();
    if (type === 'capitalize') {
      newText = text.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
    }

    execCommand('insertText', newText);
  };

  const handleImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const content = readerEvent.target?.result;
          if (content && typeof content === 'string') {
            execCommand('insertImage', content);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full border border-outline bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-outline bg-surface-container/30">
        <button onClick={() => execCommand('bold')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant transition-all" title="Negrita"><Bold className="w-4 h-4" /></button>
        <button onClick={() => execCommand('italic')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant transition-all" title="Cursiva"><Italic className="w-4 h-4" /></button>
        <button onClick={() => execCommand('underline')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant transition-all" title="Subrayado"><Underline className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-outline mx-2" />
        <button onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant transition-all" title="Alinear Izquierda"><AlignLeft className="w-4 h-4" /></button>
        <button onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant transition-all" title="Centrar"><AlignCenter className="w-4 h-4" /></button>
        <button onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant transition-all" title="Alinear Derecha"><AlignRight className="w-4 h-4" /></button>
        <button onClick={() => execCommand('justifyFull')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant transition-all" title="Justificar"><AlignJustify className="w-4 h-4" /></button>
        <div className="w-px h-5 bg-outline mx-2" />
        <button onClick={() => handleTransform('uppercase')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant text-xs font-bold transition-all" title="Mayúsculas">AA</button>
        <button onClick={() => handleTransform('lowercase')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant text-xs font-bold transition-all" title="Minúsculas">aa</button>
        <button onClick={() => handleTransform('capitalize')} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant text-xs font-bold transition-all" title="Capitalizar">Aa</button>
        <div className="w-px h-5 bg-outline mx-2" />
        <select onChange={(e) => execCommand('fontSize', e.target.value)} defaultValue="3" className="text-xs font-bold border-none bg-transparent text-on-surface-variant outline-none cursor-pointer hover:text-primary transition-colors" title="Tamaño de texto">
          <option value="1">Pequeño</option>
          <option value="3">Normal</option>
          <option value="5">Grande</option>
          <option value="7">Enorme</option>
        </select>
        <div className="w-px h-5 bg-outline mx-2" />
        <button onClick={handleImage} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-on-surface-variant transition-all" title="Insertar Imagen"><ImageIcon className="w-4 h-4" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-8 outline-none overflow-y-auto prose prose-sm max-w-none text-on-surface bg-white"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}
