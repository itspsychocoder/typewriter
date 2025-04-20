import { useState, useEffect } from "react"
import { PlusCircle, FileText, Folder, ChevronDown, ChevronRight, Save, Trash2, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"


export default function NotesApp() {
  

  // Sidebar resizing
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)
  const minWidth = 180
  const maxWidth = 500

  // Initial state with some example data
  const [sections, setSections] = useState([
    {
      id: "section-1",
      name: "Work",
      isOpen: true,
      notes: [
        {
          id: "note-1",
          title: "Project Ideas",
          content: "1. Create a new dashboard\n2. Implement dark mode\n3. Add analytics",
          lastEdited: new Date(),
        },
        {
          id: "note-2",
          title: "Meeting Notes",
          content: "Discussed timeline for Q3 projects and assigned tasks to team members.",
          lastEdited: new Date(),
        },
      ],
    },
    {
      id: "section-2",
      name: "Personal",
      isOpen: false,
      notes: [
        {
          id: "note-3",
          title: "Shopping List",
          content: "- Milk\n- Eggs\n- Bread\n- Apples",
          lastEdited: new Date(),
        },
      ],
    },
  ])

  const [activeNote, setActiveNote] = useState(null)
  const [newSectionName, setNewSectionName] = useState("")
  const [isAddingSection, setIsAddingSection] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(null)

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

  const saveNotes = async () => {
    const filePath = await window.electron.saveNotes(sections);
    if (filePath) {
      console.log('Notes saved at:', filePath);
    }
  }

  // Function to toggle section collapse
  const toggleSection = (sectionId) => {
    setSections(
      sections.map((section) => (section.id === sectionId ? { ...section, isOpen: !section.isOpen } : section)),
    )
  }

  // Function to add a new section
  const addSection = () => {
    if (newSectionName.trim()) {
      const newSection = {
        id: `section-${Date.now()}`,
        name: newSectionName,
        isOpen: true,
        notes: [],
      }
      setSections([...sections, newSection])
      setNewSectionName("")
      setIsAddingSection(false)
    }
  }

  // Function to add a new note to a section
  const addNote = (sectionId) => {
    if (newNoteTitle.trim()) {
      const newNote = {
        id: `note-${Date.now()}`,
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

  // Function to update note content
  const updateNoteContent = (content) => {
    if (activeNote) {
      const updatedNote = { ...activeNote, content, lastEdited: new Date() }
      setActiveNote(updatedNote)

      setSections(
        sections.map((section) => ({
          ...section,
          notes: section.notes.map((note) => (note.id === activeNote.id ? updatedNote : note)),
        })),
      )
    }
  }

  // Function to delete a note
  const deleteNote = (noteId) => {
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

  // Function to delete a section
  const deleteSection = (sectionId) => {
    setSections(sections.filter((section) => section.id !== sectionId))

    // If active note was in this section, clear it
    const sectionToDelete = sections.find((s) => s.id === sectionId)
    if (sectionToDelete && activeNote && sectionToDelete.notes.some((n) => n.id === activeNote.id)) {
      setActiveNote(null)
    }
  }

  // Calculate stats for the active note
  const characterCount = activeNote?.content.length || 0
  const wordCount = activeNote?.content.trim() ? activeNote.content.trim().split(/\s+/).length : 0

  return (
    <div className="flex h-screen bg-background">
      {/* Left sidebar with sections and notes */}
      <div className="border-r flex flex-col h-full bg-background" style={{ width: `${sidebarWidth}px` }}>
        

        <div className="p-2">
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
                      className="p-1 h-auto text-destructive"
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
                        onClick={() => setActiveNote(note)}
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

      {/* Resizer */}
      <div
        className="w-1 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary/90 transition-colors"
        onMouseDown={startResizing}
      />

      {/* Right panel with note editor */}
      <div className="flex-1 flex flex-col h-full">
        {activeNote ? (
          <>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{activeNote.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Last edited: {activeNote.lastEdited.toLocaleString()}
                </span>
                <Button onClick={saveNotes} size="sm" variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto">
              <Textarea
                value={activeNote.content}
                onChange={(e) => updateNoteContent(e.target.value)}
                className="w-full h-full min-h-[calc(100vh-200px)] resize-none border-0 focus-visible:ring-0 p-0 bg-background"
                placeholder="Start writing..."
              />
            </div>

            <div className="p-2 border-t text-sm text-muted-foreground flex justify-between">
              <div>Characters: {characterCount}</div>
              <div>Words: {wordCount}</div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">No note selected</h3>
              <p className="text-sm">Select a note from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
