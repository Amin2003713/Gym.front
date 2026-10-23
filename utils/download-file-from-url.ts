interface DownloadOptions {
  fileName: string
  mimeType?: string // Optional MIME type if known (e.g., 'application/pdf')
}

interface DownloadResult {
  success: boolean
  error?: string
}

/**
 * Utility function to convert a Blob to base64 string.
 * @param blob - The Blob to convert.
 * @returns Promise<string> - Resolves with the base64 string.
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Utility function to download a file from a given URL.
 * This handles cross-browser compatibility, including Safari on iOS.
 * It fetches the file as a Blob, creates a temporary URL, and simulates a click on a hidden anchor tag.
 *
 * @param url - The URL of the file to download.
 * @param options - Download options including file name and optional MIME type.
 * @returns Promise<DownloadResult> - Resolves with success status or error.
 */
export async function downloadFileFromUrl(
  url: string,
  options: DownloadOptions,
): Promise<DownloadResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    // Get the blob from the response
    const blob = await response.blob()

    // Detect iOS and related details ( !window.MSStream: it's safe to use for iOS detection as it's widely supported where needed. )
    // eslint-disable-next-line
    //@ts-ignore
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isChrome =
      navigator.userAgent.toLowerCase().indexOf('crios') > -1 ||
      navigator.vendor.toLowerCase().indexOf('google') > -1
    let iOSVersion: number[] = []
    if (iOS) {
      const match = navigator.userAgent.match(/OS [\d_]+/i)
      if (match) {
        iOSVersion = match[0]
          .substr(3)
          .split('_')
          .map((n) => parseInt(n) || 0) // Fallback to 0 if parse fails
      }
    }

    // Determine MIME type (default to octet-stream for general files to force download)
    const mimeType = options.mimeType || 'application/octet-stream'

    // Prepare the link element
    const linkElement = document.createElement('a')
    let hrefUrl = ''

    if (iOS && !isChrome && iOSVersion[0] <= 12) {
      // For older iOS Safari: Use data URL with base64 to handle preview issue
      // Warning: Avoid for very large files (>10MB) due to memory limits
      const base64 = await blobToBase64(blob)
      hrefUrl = `data:${mimeType};base64,${base64}`
      linkElement.setAttribute('href', hrefUrl)
      linkElement.setAttribute('target', '_blank')
      // No download attribute for this case as per suggestion
    } else {
      // For other cases: Use blob URL
      let contentType = mimeType
      if (iOS && !isChrome) {
        // Force download in iOS Safari by changing content type
        contentType = 'application/octet-stream'
      }
      const finalBlob = new Blob([blob], { type: contentType })
      hrefUrl = window.URL.createObjectURL(finalBlob)
      linkElement.setAttribute('href', hrefUrl)
      linkElement.setAttribute('target', '_blank')
      // Set download attribute if applicable
      if ((iOS && (iOSVersion[0] > 12 || isChrome)) || !iOS) {
        linkElement.setAttribute('download', options.fileName)
      }
    }

    // Dispatch click event
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: false,
    })
    linkElement.dispatchEvent(clickEvent)

    // Revoke URL if it's a blob URL to free memory (delayed to ensure download starts)
    if (!hrefUrl.startsWith('data:')) {
      setTimeout(() => URL.revokeObjectURL(hrefUrl), 0)
    }

    return { success: true }
  } catch (error) {
    console.error('Download error:', error)
    return { success: false, error: (error as Error).message }
  }
}
