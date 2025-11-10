import { useState } from 'react'
import Terminal from './components/Terminal'
import FileManager from './components/FileManager'
import { Container, Heading, Box, Tabs, Flex, Badge, Text } from '@radix-ui/themes'

function App() {
  const [activeTab, setActiveTab] = useState('terminal')

  return (
    <Container size="4" className="min-h-screen bg-gray-900 p-4">
      <Box className="mb-6">
        <Flex justify="between" align="center" className="mb-2">
          <Heading size="8" className="text-white">
            🚀 Web-Based VPS Terminal
          </Heading>
          <Badge color="green" size="2">
            Online
          </Badge>
        </Flex>
        <p className="text-gray-400 text-lg">
          Execute real VPS commands directly from your browser
        </p>
      </Box>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="terminal">
            Terminal
          </Tabs.Trigger>
          <Tabs.Trigger value="ide">
            💻 IDE
          </Tabs.Trigger>
        </Tabs.List>

        <Box pt="4">
          {/* Terminal Tab */}
          <Tabs.Content value="terminal">
            <Box className="h-96 md:h-[600px]">
              <Terminal />
            </Box>
          </Tabs.Content>

          {/* IDE Tab */}
          <Tabs.Content value="ide">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ height: '600px' }}>
              {/* File Manager - Left Side (25%) */}
              <Box className="lg:col-span-3 border border-gray-700 rounded-lg overflow-hidden" style={{ backgroundColor: '#1a1b26' }}>
                <Box p="2" style={{ borderBottom: '1px solid #414868' }}>
                  <Text size="2" weight="bold" style={{ color: '#c0caf5' }}>Files</Text>
                </Box>
                <Box style={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
                  <FileManager />
                </Box>
              </Box>

              {/* Editor Placeholder - Right Side (75%) */}
              <Box className="lg:col-span-9 border border-gray-700 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1a1b26' }}>
                <Text size="3" color="gray">
                  Select a file from the tree to edit
                </Text>
              </Box>
            </div>

            {/* Terminal at bottom */}
            <Box className="mt-4" style={{ height: '200px' }}>
              <Terminal />
            </Box>
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Container>
  )
}

export default App
