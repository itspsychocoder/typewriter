import { useState } from "react"
import { Settings, Download, Palette, Type, Monitor, Sun, Moon, FileDown, FileText, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function SettingsModal({ 
  isOpen, 
  onOpenChange, 
  theme, 
  onThemeChange,
  fontSize,
  onFontSizeChange,
  sections,
  activeNote 
}) {
  const [exportFormat, setExportFormat] = useState("html")
  const [includeFormatting, setIncludeFormatting] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Theme options
  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  // Font size options
  const fontSizes = [
    { value: "small", label: "Small (14px)", size: "14px" },
    { value: "medium", label: "Medium (16px)", size: "16px" },
    { value: "large", label: "Large (18px)", size: "18px" },
    { value: "xl", label: "Extra Large (20px)", size: "20px" },
  ]

  // Export functions
  const exportCurrentNote = async () => {
    if (!activeNote) return

    setIsExporting(true)
    try {
      let content = activeNote.content
      let filename = `${activeNote.title}.${exportFormat}`

      if (exportFormat === "txt") {
        const titleDiv = document.createElement("div");
        titleDiv.innerHTML = activeNote.title;
        // Convert HTML to plain text
        const tempDiv = document.createElement("div")
        tempDiv.innerHTML = content
        
        content = `${titleDiv.innerText}
        ${tempDiv.innerText}`
      } else if (exportFormat === "html") {
        // Wrap in basic HTML structure
        content = `<!DOCTYPE html>
<html>
<head>
    <title>${activeNote.title}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1, h2, h3 { color: #333; }
        blockquote { border-left: 4px solid #ddd; padding-left: 1rem; margin: 1rem 0; font-style: italic; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>${activeNote.title}</h1>
    ${content}
</body>
</html>`
      }

      // Use Electron's dialog to save file
      if (window.electron?.saveFile) {
        await window.electron.saveFile(filename, content)
      } else {
        // Fallback: create download link
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAllNotes = async () => {
    setIsExporting(true)
    try {
      let allContent = ""
      
      sections.forEach(section => {
        allContent += `\n\n<h1>Section: ${section.name}</h1>\n\n`
        section.notes.forEach(note => {
          allContent += `<h2>Note title: ${note.title}</h2>\n\n`
          if (exportFormat === "txt") {
            const tempDiv = document.createElement("div")
            tempDiv.innerHTML = note.content
            allContent += (tempDiv.textContent || tempDiv.innerText || "") + "\n\n"
          } else {
            allContent += note.content + "\n\n"
          }
        })
      })

      const filename = `all-notes.${exportFormat}`
      
      if (exportFormat === "html") {
        allContent = `<!DOCTYPE html>
<html>
<head>
    <title>All Notes Export</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1, h2, h3 { color: #333; }
        blockquote { border-left: 4px solid #ddd; padding-left: 1rem; margin: 1rem 0; font-style: italic; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>All Notes Export</h1>
    ${allContent}
</body>
</html>`
      }

      if (window.electron?.saveFile) {
        await window.electron.saveFile(filename, allContent)
      } else {
        const blob = new Blob([allContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of TypeWriter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme Selection */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  {themes.map((themeOption) => {
                    const IconComponent = themeOption.icon
                    return (
                      <Button
                        key={themeOption.value}
                        variant={theme === themeOption.value ? "default" : "outline"}
                        className="h-auto p-3 flex flex-col gap-2"
                        onClick={() => onThemeChange(themeOption.value)}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-xs">{themeOption.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label>Editor Font Size</Label>
                <Select value={fontSize} onValueChange={onFontSizeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export & Backup
              </CardTitle>
              <CardDescription>
                Export your notes and create backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export Format */}
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML (.html)</SelectItem>
                    <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Options */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Formatting</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep bold, italic, and other formatting
                  </p>
                </div>
                <Switch
                  checked={includeFormatting}
                  onCheckedChange={setIncludeFormatting}
                />
              </div>

              <Separator />

              {/* Export Actions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Current Note</Label>
                    <p className="text-sm text-muted-foreground">
                      {activeNote ? activeNote.title : "No note selected"}
                    </p>
                  </div>
                  <Button
                    onClick={exportCurrentNote}
                    disabled={!activeNote || isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>All Notes</Label>
                    <p className="text-sm text-muted-foreground">
                      Export all notes in all sections
                    </p>
                  </div>
                  <Button
                    onClick={exportAllNotes}
                    disabled={sections.length === 0 || isExporting}
                    variant="outline"
                    size="sm"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Export All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{sections.length}</div>
                  <div className="text-sm text-muted-foreground">Sections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {sections.reduce((total, section) => total + section.notes.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Notes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
  <CardHeader>
    <CardTitle>About TypeWriter</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Version 1.0.0</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        A modern, distraction-free writing & notes application.
      </p>
      <p className="text-sm">
        <span className="font-medium">Developer:</span>{" "}
        <span className="text-muted-foreground">Psycho Coder</span>
      </p>
    </div>
  </CardContent>
</Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}