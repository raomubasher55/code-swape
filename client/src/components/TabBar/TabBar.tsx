import { X } from 'lucide-react'
import { Flex, Text } from '@radix-ui/themes'
import type { EditorTab } from '../../types/tabs.types'
import { useState } from 'react'

interface TabBarProps {
  tabs: EditorTab[]
  activeTabId: string | null
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
}

export default function TabBar({ tabs, activeTabId, onTabClick, onTabClose }: TabBarProps) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  if (tabs.length === 0) {
    return null
  }

  return (
    <Flex
      style={{
        borderBottom: '2px solid #4c4f69',
        backgroundColor: '#11111b',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId
        const isHovered = hoveredTab === tab.id

        return (
          <Flex
            key={tab.id}
            align="center"
            gap="2"
            style={{
              padding: '10px 16px',
              borderRight: '1px solid #2a2a3a',
              cursor: 'pointer',
              backgroundColor: isActive ? '#1e1e2e' : isHovered ? '#181825' : 'transparent',
              borderBottom: isActive ? '2px solid #a855f7' : '2px solid transparent',
              minWidth: 'fit-content',
              maxWidth: '200px',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            onClick={() => onTabClick(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <Text
              size="2"
              style={{
                color: isActive ? '#e0e7ff' : '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontWeight: isActive ? 600 : 400,
                transition: 'color 0.2s ease',
              }}
            >
              {tab.fileName}
              {tab.hasChanges && (
                <span style={{ color: '#f59e0b', marginLeft: '6px', fontSize: '16px' }}>●</span>
              )}
            </Text>
            <X
              size={14}
              style={{
                color: isHovered ? '#e0e7ff' : '#64748b',
                flexShrink: 0,
                transition: 'color 0.2s ease',
              }}
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab.id)
              }}
            />
          </Flex>
        )
      })}
    </Flex>
  )
}
