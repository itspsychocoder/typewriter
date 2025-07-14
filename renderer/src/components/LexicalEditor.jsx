import { useEffect, useRef } from 'react';
import { $getRoot, $getSelection, $createParagraphNode, $createTextNode, $isRangeSelection } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

// Rich text nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';

// Format commands from correct packages
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';

import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';

// Toolbar
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Quote, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Editor configuration
const editorConfig = {
  namespace: 'TypeWriterEditor',
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
  ],
  onError(error) {
    console.error('Lexical error:', error);
  },
  theme: {
    root: 'lexical-editor',
    paragraph: 'lexical-paragraph',
    quote: 'lexical-quote',
    heading: {
      h1: 'lexical-heading-h1',
      h2: 'lexical-heading-h2',
      h3: 'lexical-heading-h3',
    },
    list: {
      nested: {
        listitem: 'lexical-nested-listitem',
      },
      ol: 'lexical-list-ol',
      ul: 'lexical-list-ul',
      listitem: 'lexical-listitem',
    },
    link: 'lexical-link',
    text: {
      bold: 'lexical-text-bold',
      italic: 'lexical-text-italic',
      underline: 'lexical-text-underline',
      strikethrough: 'lexical-text-strikethrough',
      code: 'lexical-text-code',
    },
    code: 'lexical-code',
  },
};

// Custom OnChange Plugin Component - FIXED
function OnChangePluginWithHtml({ onChange }) {
  const [editor] = useLexicalComposerContext();

  const handleEditorChange = (editorState) => {
    editorState.read(() => {
      try {
        // Generate HTML content using the editor instance
        const htmlContent = $generateHtmlFromNodes(editor, null);
        if (onChange) {
          onChange(htmlContent);
        }
      } catch (error) {
        console.error('Error generating HTML:', error);
        // Fallback to plain text
        const root = $getRoot();
        const textContent = root.getTextContent();
        if (onChange) {
          onChange(textContent);
        }
      }
    });
  };

  return <OnChangePlugin onChange={handleEditorChange} />;
}

// Toolbar Component
function Toolbar() {
  const [editor] = useLexicalComposerContext();

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingTag) => {
    editor.update(() => {
      const selection = $getSelection();
      
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        
        // Get the parent element (paragraph or existing heading)
        const parentNode = nodes[0]?.getParent();
        
        if (parentNode) {
          // Get the text content
          const textContent = parentNode.getTextContent();
          
          // Create new heading node
          const headingNode = $createHeadingNode(headingTag);
          headingNode.append($createTextNode(textContent));
          
          // Replace the parent node with the heading
          parentNode.replace(headingNode);
          
          // Set selection to the end of the heading
          headingNode.selectEnd();
        }
      }
    });
    editor.focus();
  };

  const insertList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const insertOrderedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const formatQuote = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'quote');
  };

  const formatCode = () => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'code');
  };

  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={undo}
        className="h-8 w-8 p-0"
        title="Undo (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={redo}
        className="h-8 w-8 p-0"
        title="Redo (Ctrl+Y)"
      >
        <Redo className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('bold')}
        className="h-8 w-8 p-0"
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('italic')}
        className="h-8 w-8 p-0"
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('underline')}
        className="h-8 w-8 p-0"
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('strikethrough')}
        className="h-8 w-8 p-0"
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('code')}
        className="h-8 w-8 p-0"
        title="Inline Code"
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h1')}
        className="h-8 w-8 p-0"
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h2')}
        className="h-8 w-8 p-0"
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h3')}
        className="h-8 w-8 p-0"
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={insertList}
        className="h-8 w-8 p-0"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={insertOrderedList}
        className="h-8 w-8 p-0"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={formatQuote}
        className="h-8 w-8 p-0"
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Content initialization plugin - UPDATED to handle HTML content
function InitializeContentPlugin({ content, noteId }) {
  const [editor] = useLexicalComposerContext();
  const isInitialized = useRef(false);
  const lastNoteId = useRef(null);

  useEffect(() => {
    // Only initialize when:
    // 1. This is the first time (not initialized)
    // 2. OR the note ID has changed (switching notes)
    if (!isInitialized.current || lastNoteId.current !== noteId) {
      if (content !== undefined) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          
          if (content === '' || !content) {
            // Empty content, create empty paragraph
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          } else {
            try {
              // Try to parse as HTML first (formatted content)
              if (content.includes('<')) {
                const parser = new DOMParser();
                const dom = parser.parseFromString(content, 'text/html');
                const nodes = $generateNodesFromDOM(editor, dom);
                root.append(...nodes);
              } else {
                // Fallback: treat as plain text
                const lines = content.split('\n');
                lines.forEach((line) => {
                  const paragraph = $createParagraphNode();
                  paragraph.append($createTextNode(line));
                  root.append(paragraph);
                });
              }
            } catch (error) {
              console.error('Error parsing content:', error);
              // Fallback to plain text
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode(content));
              root.append(paragraph);
            }
          }
        });
      }
      
      isInitialized.current = true;
      lastNoteId.current = noteId;
    }
  }, [editor, content, noteId]);

  return null;
}

// Simple Error Boundary Component
function ErrorBoundary({ children }) {
  return children;
}

// Main Lexical Editor Component - UPDATED to save HTML content
export default function LexicalEditor({ 
  initialContent = '', 
  onChange, 
  placeholder = "Start writing...",
  readOnly = false,
  noteId
}) {
  return (
    <LexicalComposer initialConfig={{...editorConfig, editable: !readOnly}}>
      <div className="lexical-editor-container flex flex-col h-full">
        {!readOnly && <Toolbar />}
        
        <div className="lexical-editor-wrapper flex-1 relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="lexical-content-editable h-full p-4 outline-none resize-none"
                style={{ minHeight: 'calc(100vh - 200px)' }}
              />
            }
            placeholder={
              <div className="lexical-placeholder absolute top-4 left-4 text-muted-foreground pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={ErrorBoundary}
          />
          
          <InitializeContentPlugin content={initialContent} noteId={noteId} />
          <OnChangePluginWithHtml onChange={onChange} />
          <HistoryPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>
  );
}