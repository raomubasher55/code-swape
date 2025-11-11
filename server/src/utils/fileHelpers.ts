/**
 * Get file extension from filename
 */
export function getExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : ''
}

/**
 * Sort files and folders: folders first, then files, alphabetically
 */
export function sortFileNodes<T extends { type: 'file' | 'folder'; name: string }>(nodes: T[]): T[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}
