import { useState, useEffect } from "react"
import { PlusCircle, FileText, Folder, ChevronDown, ChevronRight, Save, Trash2, Maximize, Minimize, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import LexicalEditor from "./LexicalEditor"
import SettingsModal from "./SettingsModal"
import '../styles/lexical.css' // Import Lexical styles

export default function NotesApp() {
  // Sidebar resizing
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)
  const minWidth = 180
  const maxWidth = 500

  // Focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [theme, setTheme] = useState("system")
  const [fontSize, setFontSize] = useState("medium")

  // State
  const [sections, setSections] = useState([])
  const [activeNote, setActiveNote] = useState(null)
  const [newSectionName, setNewSectionName] = useState("")
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize database and load data
  useEffect(() => {
    initializeApp();
  }, []);

  // Check initial fullscreen state
  useEffect(() => {
    const checkFullscreen = async () => {
      if (window.electron?.isFullscreen) {
        const fullscreenState = await window.electron.isFullscreen();
        setIsFullscreen(fullscreenState);
      }
    };
    checkFullscreen();
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.toggle("dark", systemTheme === "dark")
    } else {
      root.classList.toggle("dark", theme === "dark")
    }
  }, [theme])

  // Font size effect
  useEffect(() => {
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
      xl: "20px"
    }
    
    const root = document.documentElement
    root.style.setProperty('--editor-font-size', fontSizeMap[fontSize])
  }, [fontSize])

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      // Initialize database
      const result = await window.electron.dbInitialize();
      console.log("Database initialization result:", result);
      if (result.success) {
        console.log("Database initialized successfully");
        // Load existing data
        await loadData();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const data = await window.electron.dbGetAllData();
      setSections(data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Handle sidebar resizing
  const startResizing = () => {
    setIsResizing(true)
  }

  const stopResizing = () => {
    setIsResizing(false)
  }

  const resize = (e) => {
    if (isResizing) {
      const newWidth = e.clientX
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth)
      }
    }
  }

  useEffect(() => {
    window.addEventListener("mousemove", resize)
    window.addEventListener("mouseup", stopResizing)
    return () => {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
    }
  }, [isResizing])

  // Toggle focus mode with true fullscreen
  const toggleFocusMode = async () => {
    if (!isFocusMode) {
      // Entering focus mode - go fullscreen
      if (window.electron?.toggleFullscreen) {
        const newFullscreenState = await window.electron.toggleFullscreen();
        setIsFullscreen(newFullscreenState);
        setIsFocusMode(true);
      } else {
        // Fallback for development or if API not available
        setIsFocusMode(true);
      }
    } else {
      // Exiting focus mode - exit fullscreen
      if (window.electron?.exitFullscreen) {
        await window.electron.exitFullscreen();
        setIsFullscreen(false);
        setIsFocusMode(false);
      } else {
        // Fallback
        setIsFocusMode(false);
      }
    }
  }

  // Handle ESC key to exit focus mode and fullscreen
  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.key === 'Escape' && (isFocusMode || isFullscreen)) {
        if (window.electron?.exitFullscreen) {
          await window.electron.exitFullscreen();
        }
        setIsFullscreen(false);
        setIsFocusMode(false);
      }
      // Handle F11 key for manual fullscreen toggle
      if (e.key === 'F11') {
        e.preventDefault();
        if (window.electron?.toggleFullscreen) {
          const newFullscreenState = await window.electron.toggleFullscreen();
          setIsFullscreen(newFullscreenState);
          // If we're in focus mode and exiting fullscreen, exit focus mode too
          if (!newFullscreenState && isFocusMode) {
            setIsFocusMode(false);
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode, isFullscreen])

  // Listen for fullscreen changes from the window controls
  useEffect(() => {
    const handleFullscreenChange = async () => {
      if (window.electron?.isFullscreen) {
        const fullscreenState = await window.electron.isFullscreen();
        setIsFullscreen(fullscreenState);
        // If exiting fullscreen while in focus mode, exit focus mode
        if (!fullscreenState && isFocusMode) {
          setIsFocusMode(false);
        }
      }
    };

    // Check periodically for fullscreen state changes
    const interval = setInterval(handleFullscreenChange, 1000);
    return () => clearInterval(interval);
  }, [isFocusMode]);

  // Function to toggle section collapse
  const toggleSection = async (sectionId) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      await window.electron.dbUpdateSection(sectionId, { is_open: !section.isOpen });
      setSections(
        sections.map((section) =>
          section.id === sectionId ? { ...section, isOpen: !section.isOpen } : section
        )
      )
    }
  }

  // Function to add a new section
  const addSection = async () => {
    if (newSectionName.trim()) {
      const newSectionId = `section-${Date.now()}`;
      const result = await window.electron.dbCreateSection(newSectionId, newSectionName);
      console.log("New section created:", result);
      if (result.success) {
        const newSection = {
          id: newSectionId,
          name: newSectionName,
          isOpen: true,
          notes: [],
        }
        setSections([...sections, newSection])
        setNewSectionName("")
        setIsAddingSection(false)
      }
    }
  }

  // Function to add a new note to a section
  const addNote = async (sectionId) => {
    if (newNoteTitle.trim()) {
      const newNoteId = `note-${Date.now()}`;
      const result = await window.electron.dbCreateNote(newNoteId, sectionId, newNoteTitle, "");

      if (result.success) {
        const newNote = {
          id: newNoteId,
          title: newNoteTitle,
          content: "",
          lastEdited: new Date(),
        }

        setSections(
          sections.map((section) =>
            section.id === sectionId ? { ...section, notes: [...section.notes, newNote] } : section,
          ),
        )

        setNewNoteTitle("")
        setIsAddingNote(null)
        setActiveNote(newNote)
      }
    }
  }

  // Function to update note content
  const updateNoteContent = async (content) => {
    if (activeNote) {
      const updatedNote = { ...activeNote, content, lastEdited: new Date() }
      setActiveNote(updatedNote)

      // Update in database with debouncing to avoid too many saves
      clearTimeout(updateNoteContent.timeout);
      updateNoteContent.timeout = setTimeout(async () => {
        await window.electron.dbUpdateNote(activeNote.id, { content });
      }, 500);

      setSections(
        sections.map((section) => ({
          ...section,
          notes: section.notes.map((note) => (note.id === activeNote.id ? updatedNote : note)),
        })),
      )
    }
  }

  // Function to delete a note
  const deleteNote = async (noteId) => {
    const result = await window.electron.dbDeleteNote(noteId);

    if (result.success) {
      setSections(
        sections.map((section) => ({
          ...section,
          notes: section.notes.filter((note) => note.id !== noteId),
        })),
      )

      if (activeNote?.id === noteId) {
        setActiveNote(null)
      }
    }
  }

  // Function to delete a section
  const deleteSection = async (sectionId) => {
    const result = await window.electron.dbDeleteSection(sectionId);

    if (result.success) {
      setSections(sections.filter((section) => section.id !== sectionId))

      // If active note was in this section, clear it
      const sectionToDelete = sections.find((s) => s.id === sectionId)
      if (sectionToDelete && activeNote && sectionToDelete.notes.some((n) => n.id === activeNote.id)) {
        setActiveNote(null)
      }
    }
  }

  // Calculate stats for the active note
  const characterCount = activeNote?.content.length || 0
  const wordCount = activeNote?.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading TypeWriter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen bg-background", (isFocusMode || isFullscreen) && "focus-mode")}>
      {/* Left sidebar with sections and notes - Hide in focus mode */}
      {!isFocusMode && (
        <>
          <div className="border-r flex flex-col h-full bg-background" style={{ width: `${sidebarWidth}px`, flexShrink: 0 }}>
            {/* Sidebar Header */}
            <div className="p-2 border-b">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">TypeWriter</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </div>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setIsAddingSection(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>

            {isAddingSection && (
              <div className="px-2 pb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="Section name"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    onKeyDown={(e) => e.key === "Enter" && addSection()}
                  />
                  <Button size="sm" onClick={addSection}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {sections.map((section) => (
                  <Collapsible
                    key={section.id}
                    open={section.isOpen}
                    onOpenChange={() => toggleSection(section.id)}
                    className="border rounded-md"
                  >
                    <div className="flex items-center justify-between p-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-1 h-auto">
                          {section.isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>

                      <div className="font-medium flex-1 flex items-center">
                        <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                        {section.name}
                      </div>

                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsAddingNote(section.id)
                          }}
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span className="sr-only">Add note</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-3 p-1 h-auto text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSection(section.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete section</span>
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      {isAddingNote === section.id && (
                        <div className="px-2 pb-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newNoteTitle}
                              onChange={(e) => setNewNoteTitle(e.target.value)}
                              placeholder="Note title"
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              onKeyDown={(e) => e.key === "Enter" && addNote(section.id)}
                            />
                            <Button size="sm" onClick={() => addNote(section.id)}>
                              Add
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 p-2">
                        {section.notes.map((note) => (
                          <div
                            key={note.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted group",
                              activeNote?.id === note.id && "bg-muted",
                            )}
                            onClick={() => {
                              setActiveNote(note)
                              console.log(note)
                            }}
                          >
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm">{note.title}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto opacity-0 group-hover:opacity-100 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNote(note.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete note</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Resizer - Hide in focus mode */}
          <div
            className="w-1 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary/90 transition-colors flex-shrink-0"
            onMouseDown={startResizing}
          />
        </>
      )}

      {/* Right panel with note editor - Full width in focus mode */}
      <div className={cn(
        "flex flex-col h-full min-w-0",
        isFocusMode ? "w-full" : "flex-1"
      )}>
        {activeNote ? (
          <>
            {/* Header - Show focus mode toggle and note title */}
            <div className={cn(
              "p-4 border-b flex justify-between items-center flex-shrink-0",
              isFocusMode && "bg-background/80 backdrop-blur-sm"
            )}>
              <div className="flex items-center gap-4">
                {isFocusMode && (
                  <div className="text-sm text-muted-foreground">
                    {activeNote.title}
                  </div>
                )}
                {!isFocusMode && (
                  <h2 className="text-xl font-semibold">{activeNote.title}</h2>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFocusMode}
                  className="gap-2"
                >
                  {isFocusMode ? (
                    <>
                      <Minimize className="h-4 w-4" />
                      Exit Focus (ESC)
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4" />
                      Focus Mode (F11)
                    </>
                  )}
                </Button>
                {!isFocusMode && (
                  <span className="text-sm text-muted-foreground">
                    Last edited: {activeNote.lastEdited.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0 w-full">
              <LexicalEditor
                key={activeNote.id}
                noteId={activeNote.id}
                initialContent={activeNote.content}
                onChange={updateNoteContent}
                placeholder="Start writing your note..."
              />
            </div>

            {/* Footer - Hide in focus mode */}
            {!isFocusMode && (
              <div className="p-2 border-t text-sm text-muted-foreground flex justify-between flex-shrink-0">
                <div>Characters: {characterCount}</div>
                <div>Words: {wordCount}</div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground w-[75vw]">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No note selected</h3>
              <p className="text-sm">Select a note from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        sections={sections}
        activeNote={activeNote}
      />
    </div>
  )
}