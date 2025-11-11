import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { Save } from 'lucide-react'
import type { EditorTab } from '../../types/tabs.types'

interface CodeEditorProps {
  tab: EditorTab | null
  onContentChange: (content: string, hasChanges: boolean) => void
}

export default function CodeEditor({ tab, onContentChange }: CodeEditorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Load file content when tab changes
  useEffect(() => {
    if (!tab) {
      return
    }

    // Only load if content is empty (new tab)
    if (!tab.content) {
      loadFile(tab.filePath)
    }
  }, [tab?.id])

  const loadFile = async (path: string) => {
    try {
      setLoading(true)
      setError(null)

      // Convert full path to relative path
      const relativePath = path.replace('/root/projects', '')
      const url = `${API_URL}/files/content?path=${encodeURIComponent(relativePath || '/')}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`)
      }

      const result = await response.json()
      onContentChange(result.content, false)
    } catch (err: any) {
      console.error('Error loading file:', err)
      setError(err.message || 'Failed to load file')
    } finally {
      setLoading(false)
    }
  }

  const saveFile = async () => {
    if (!tab) return

    try {
      setSaving(true)
      setError(null)

      // Convert full path to relative path
      const relativePath = tab.filePath.replace('/root/projects', '')
      const url = `${API_URL}/files/content`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: relativePath || '/',
          content: tab.content,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`)
      }

      onContentChange(tab.content, false)
    } catch (err: any) {
      console.error('Error saving file:', err)
      setError(err.message || 'Failed to save file')
    } finally {
      setSaving(false)
    }
  }

  const handleEditorChange = (value: string | undefined) => {
    onContentChange(value || '', true)
  }

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (tab && tab.hasChanges) {
          saveFile()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tab])

  const getLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'js':
        return 'javascript'
      case 'ts':
        return 'typescript'
      case 'jsx':
        return 'javascript'
      case 'tsx':
        return 'typescript'
      case 'json':
        return 'json'
      case 'md':
        return 'markdown'
      case 'html':
        return 'html'
      case 'css':
        return 'css'
      case 'py':
        return 'python'
      case 'java':
        return 'java'
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'cpp'
      case 'c':
        return 'c'
      case 'go':
        return 'go'
      case 'rs':
        return 'rust'
      case 'php':
        return 'php'
      case 'rb':
        return 'ruby'
      case 'sh':
        return 'shell'
      case 'yml':
      case 'yaml':
        return 'yaml'
      case 'xml':
        return 'xml'
      case 'sql':
        return 'sql'
      default:
        return 'plaintext'
    }
  }

  if (!tab) {
    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size="3" color="gray">
          Select a file from the tree to edit
        </Text>
      </Box>
    )
  }

  if (loading) {
    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size="3" color="gray">
          Loading file...
        </Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size="3" color="red">
          {error}
        </Text>
      </Box>
    )
  }

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with save button and keyboard hint */}
      <Flex
        justify="between"
        align="center"
        p="3"
        style={{
          borderBottom: '1px solid #4c4f69',
          backgroundColor: '#181825',
        }}
      >
        <Flex align="center" gap="2">
          <Save size={14} color="#a855f7" />
          <Text size="1" style={{ color: '#94a3b8' }}>
            Press <kbd style={{ backgroundColor: '#2a2a3a', padding: '2px 6px', borderRadius: '4px', color: '#e0e7ff', fontWeight: 600 }}>Ctrl+S</kbd> to save
          </Text>
        </Flex>
        <Button
          size="1"
          onClick={saveFile}
          disabled={!tab.hasChanges || saving}
          style={{
            cursor: tab.hasChanges ? 'pointer' : 'not-allowed',
            backgroundColor: tab.hasChanges ? '#a855f7' : '#2a2a3a',
            color: '#e0e7ff',
            border: 'none',
          }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Flex>

      {/* Monaco Editor */}
      <Box style={{ flex: 1 }}>
        <Editor
          height="100%"
          language={getLanguage(tab.fileName)}
          value={tab.content}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </Box>
    </Box>
  )
}
