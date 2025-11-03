import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface TerminalState {
  isConnected: boolean
  theme: 'dark' | 'light'
  fontSize: number
  output: string[]
  commandHistory: string[]
  currentCommand: string
  isLoading: boolean
}

const initialState: TerminalState = {
  isConnected: false,
  theme: 'dark',
  fontSize: 14,
  output: [],
  commandHistory: [],
  currentCommand: '',
  isLoading: false,
}

const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload
    },
    addOutput: (state, action: PayloadAction<string>) => {
      state.output.push(action.payload)
    },
    clearOutput: (state) => {
      state.output = []
    },
    addToHistory: (state, action: PayloadAction<string>) => {
      state.commandHistory.push(action.payload)
    },
    setCurrentCommand: (state, action: PayloadAction<string>) => {
      state.currentCommand = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
  },
})

export const {
  setConnected,
  setTheme,
  setFontSize,
  addOutput,
  clearOutput,
  addToHistory,
  setCurrentCommand,
  setLoading,
} = terminalSlice.actions

export default terminalSlice.reducer