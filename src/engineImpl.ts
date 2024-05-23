import { Codacyrc, Engine, ToolResult } from "codacy-seed"
// import fs from "fs"

//import { createEslintConfig } from "./configCreator"
import { convertResults } from "./convertResults"
import { debug } from "./logging"
import { toolName } from "./toolMetadata"
import { getLizardOptions } from "./configCreator"

export const engineImpl: Engine = async function (
  codacyrc?: Codacyrc,
): Promise<ToolResult[]> {
  debug("engine: starting")

  if (!codacyrc || codacyrc.tools?.[0]?.name !== toolName) {
    throw new Error("codacyrc is not defined")
  }

  const srcDirPath = "/src"
  const { files, ...options } = await getLizardOptions(srcDirPath, codacyrc)

  debug(
    `engine: list of ${files.length} files (or globs) to process in "${srcDirPath}" and options used`,
  )
  debug(files)
  debug(options)

  // Check if there are any glob patterns in the files array // DO WE NEED THIS?
  // const lintResults = files.some((file: string) => /\*|\?|\[/.test(file))
  //   ? await eslint.lintFiles(files)
  //   : await lintFilesInChunks(eslint, files)

  // await debugAndCountLintIssues(eslint, lintResults)

  const results = await runLizard(files, options)

  debug("engine: finished")
  return convertResults(results).map((r) => r.relativeTo(srcDirPath))
}

async function runLizard(files: string[], options: any): Promise<any> {
  throw new Error("Method not implemented.")
}
