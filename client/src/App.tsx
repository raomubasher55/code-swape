import Terminal from './components/Terminal'
import { Container, Heading, Box } from '@radix-ui/themes'

function App() {
  return (
    <Container size="4" className="min-h-screen bg-gray-900 p-4">
      <Box className="mb-6">
        <Heading size="8" className="text-center text-white mb-2">
          🚀 Web-Based VPS Terminal
        </Heading>
        <p className="text-center text-gray-400 text-lg">
          Execute real VPS commands directly from your browser
        </p>
      </Box>

      <Box className="h-96 md:h-[600px]">
        <Terminal />
      </Box>
    </Container>
  )
}

export default App
