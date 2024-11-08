/**
 * Retrieves the file path from command line arguments.
 * Looks for the -f or --file flag and returns the following argument as the file path.
 * Throws an error if the file flag or file path is not provided.
 */
function getFilePathFromArgs(): string {
  // Get command line arguments, ignoring the first two elements (node and script path)
  const args = process.argv.slice(2)

  const fileFlagIndex = args.findIndex((arg) => arg === '-f' || arg === '--file')

  if (fileFlagIndex !== -1 && args[fileFlagIndex + 1]) {
    return args[fileFlagIndex + 1]
  }

  throw new Error('Please provide a file path using -f or --file flag')
}

/**
 * Parses the command line arguments and returns relevant information.
 * Handles errors gracefully by logging an appropriate message and exiting the process.
 */
export function parseArgs() {
  try {
    return { filePath: getFilePathFromArgs() }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'An unknown error occurred')
    process.exit(1)
  }
}
