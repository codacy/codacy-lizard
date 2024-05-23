import { Codacyrc } from "codacy-seed"

import { debug } from "./logging"
import { toolName } from "./toolMetadata"
import { LizardOptions, getLizardOptions } from "./configCreator"
import { runLizardCommand } from "./lizard"
import { FileComplexity } from "./model/MetricsResults"

export const lizardMetricsEngine = async function (
  codacyrc?: Codacyrc,
): Promise<FileComplexity[]> {
  debug("engine: starting")

  if (!codacyrc || codacyrc.tools?.[0]?.name !== toolName) {
    throw new Error("codacyrc is not defined")
  }

  const srcDirPath = "/src"
  const lizardOptions = await getLizardOptions(codacyrc)
  const { files, ...options } = lizardOptions

  debug(
    `engine: list of ${files.length} files (or globs) to process in "${srcDirPath}" and options used`,
  )
  debug(files)
  debug(options)

  const results = await getLizardMetrics(lizardOptions)

  debug("engine: finished")

  return results
}

const getLizardMetrics = async (options: LizardOptions) => {
  const results: FileComplexity[] = []

  // get Lizard tool output parsed
  const data = await runLizardCommand({ ...options, returnMetrics: true })

  // iterate over the files
  data.files.forEach((file) => {
    results.push({
      filename: file.file,
      complexity: file.maxCcn,
      lineComplexities: data.methods
        .filter((m) => m.file === file.file)
        .map((m) => ({
          line: m.fromLine,
          value: m.ccn,
        })),
    })
  })

  return results
}
