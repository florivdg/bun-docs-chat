/**
 * Helper function to get file path from CLI arguments.
 */
function getFilePathFromArgs(): string {
  const args = process.argv.slice(2) // Remove first two elements (node and script path)

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-f' || args[i] === '--file') {
      const filePath = args[i + 1]
      if (!filePath) {
        throw new Error('File path is required after -f or --file flag')
      }
      return filePath
    }
  }

  throw new Error('Please provide a file path using -f or --file flag')
}

/**
 * Parses the CLI arguments and returns relevant information.
 */
export function parseArgs() {
  // Get and validate file path
  let filePath: string
  try {
    filePath = getFilePathFromArgs()
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error('An unknown error occurred')
    }
    process.exit(1)
  }

  return {
    filePath,
  }
}
