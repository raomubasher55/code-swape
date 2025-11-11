import { useState } from 'react'
import Terminal from './components/Terminal'
import FileManager from './components/FileManager'
import CodeEditor from './components/CodeEditor'
import TabBar from './components/TabBar'
import { Container, Heading, Box, Tabs, Flex, Badge } from '@radix-ui/themes'
import type { EditorTab } from './types/tabs.types'

function App() {
  const [activeTab, setActiveTab] = useState('terminal')
  const [openTabs, setOpenTabs] = useState<EditorTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // Open a file in a new tab or switch to existing tab
  const openFile = (filePath: string) => {
    // Check if file is already open
    const existingTab = openTabs.find(tab => tab.filePath === filePath)

    if (existingTab) {
      // Switch to existing tab
      setActiveTabId(existingTab.id)
    } else {
      // Create new tab
      const fileName = filePath.split('/').pop() || 'untitled'
      const newTab: EditorTab = {
        id: `tab-${Date.now()}`,
        filePath,
        fileName,
        content: '',
        hasChanges: false,
        isActive: true
      }

      setOpenTabs(prev => [...prev, newTab])
      setActiveTabId(newTab.id)
    }
  }

  // Close a tab
  const closeTab = (tabId: string) => {
    setOpenTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId)

      // If closing active tab, switch to another
      if (tabId === activeTabId) {
        if (filtered.length > 0) {
          const index = prev.findIndex(tab => tab.id === tabId)
          const newActiveIndex = index > 0 ? index - 1 : 0
          setActiveTabId(filtered[newActiveIndex]?.id || null)
        } else {
          setActiveTabId(null)
        }
      }

      return filtered
    })
  }

  // Update tab content and changes status
  const updateTab = (tabId: string, updates: Partial<EditorTab>) => {
    setOpenTabs(prev =>
      prev.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    )
  }

  const activeTabData = openTabs.find(tab => tab.id === activeTabId) || null

  return (
    <Container
      size="4"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
        padding: '24px',
      }}
    >
      <Box
        style={{
          marginBottom: '32px',
          padding: '24px',
          background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
          borderRadius: '16px',
          border: '1px solid #4c4f69',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Flex justify="between" align="center" style={{ marginBottom: '12px' }}>
          <Flex align="center" gap="3">
            <div
              style={{
                fontSize: '48px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}
            >
              🚀
            </div>
            <Heading
              size="8"
              style={{
                background: 'linear-gradient(135deg, #e0e7ff 0%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
              }}
            >
              VPS Terminal & IDE
            </Heading>
          </Flex>
          <Badge
            size="2"
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: 600,
            }}
          >
            ● Online
          </Badge>
        </Flex>
        <p
          style={{
            color: '#94a3b8',
            fontSize: '16px',
            margin: 0,
            paddingLeft: '60px',
          }}
        >
          Execute commands and edit code directly from your browser
        </p>
      </Box>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List
          style={{
            backgroundColor: '#1e1e2e',
            border: '1px solid #4c4f69',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Tabs.Trigger
            value="terminal"
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              color: activeTab === 'terminal' ? '#e0e7ff' : '#94a3b8',
              backgroundColor: activeTab === 'terminal' ? '#a855f7' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Terminal
          </Tabs.Trigger>
          <Tabs.Trigger
            value="ide"
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              color: activeTab === 'ide' ? '#e0e7ff' : '#94a3b8',
              backgroundColor: activeTab === 'ide' ? '#a855f7' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            💻 IDE
          </Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          {/* Terminal Tab */}
          <Tabs.Content value="terminal">
            <Box
              className="h-96 md:h-[600px]"
              style={{
                backgroundColor: '#1e1e2e',
                border: '1px solid #4c4f69',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
              }}
            >
              <Terminal />
            </Box>
          </Tabs.Content>

          {/* IDE Tab */}
          <Tabs.Content value="ide">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ height: '600px' }}>
              {/* File Manager - Left Side (25%) */}
              <Box
                className="lg:col-span-3 rounded-lg overflow-hidden"
                style={{
                  backgroundColor: '#1e1e2e',
                  border: '1px solid #4c4f69',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Box style={{ height: '100%', overflow: 'auto' }}>
                  <FileManager
                    onFileClick={(file) => {
                      if (file.type === 'file') {
                        openFile(file.path)
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Code Editor with Tabs - Right Side (75%) */}
              <Box
                className="lg:col-span-9 rounded-lg overflow-hidden"
                style={{
                  backgroundColor: '#1e1e2e',
                  border: '1px solid #4c4f69',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <TabBar
                  tabs={openTabs}
                  activeTabId={activeTabId}
                  onTabClick={setActiveTabId}
                  onTabClose={closeTab}
                />
                <Box style={{ flex: 1, overflow: 'hidden' }}>
                  <CodeEditor
                    tab={activeTabData}
                    onContentChange={(content, hasChanges) => {
                      if (activeTabId) {
                        updateTab(activeTabId, { content, hasChanges })
                      }
                    }}
                  />
                </Box>
              </Box>
            </div>

            {/* Terminal at bottom */}
            <Box
              className="mt-4"
              style={{
                height: '200px',
                backgroundColor: '#1e1e2e',
                border: '1px solid #4c4f69',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
              }}
            >
              <Terminal />
            </Box>
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Container>
  )
}

export default App
