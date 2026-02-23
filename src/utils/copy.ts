export async function copyToClip(content: string | undefined) {
  if (!content) return

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(content)
      return
    } catch {
      // Fall through to legacy method
    }
  }

  // Legacy fallback for older browsers
  const textarea = document.createElement('textarea')
  textarea.value = content
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}
