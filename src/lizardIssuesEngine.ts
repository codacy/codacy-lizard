import { Codacyrc, Engine, Issue, ToolResult } from "codacy-seed"

import { debug } from "./logging"
import { toolName } from "./toolMetadata"
import { LizardOptions, getLizardOptions } from "./configCreator"
import { runLizardCommand } from "./lizard"

export const lizardIssuesEngine: Engine = async function (
  codacyrc?: Codacyrc,
): Promise<ToolResult[]> {
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

  const results = await getLizardIssues(lizardOptions)

  debug("engine: finished")

  return results
}

const getLizardIssues = async (options: LizardOptions) => {
  const results: Issue[] = []

  // get Lizard tool output parsed
  const data = await runLizardCommand({ ...options, returnMetrics: false })

  // iterate over the methods
  data.methods.forEach((method) => {
    // check NLOC rules
    if (method.nloc > options.thresholds["nloc-critical"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has ${method.nloc} lines of code (limit is ${options.thresholds["nloc-critical"]})`,
          "nloc-critical",
          method.fromLine,
        ),
      )
    } else if (method.nloc > options.thresholds["nloc-medium"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has ${method.nloc} lines of code (limit is ${options.thresholds["nloc-medium"]})`,
          "nloc-medium",
          method.fromLine,
        ),
      )
    } else if (method.nloc > options.thresholds["nloc-minor"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has ${method.nloc} lines of code (limit is ${options.thresholds["nloc-minor"]})`,
          "nloc-minor",
          method.fromLine,
        ),
      )
    }

    // check CCN rules
    if (method.ccn > options.thresholds["ccn-critical"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has a cyclomatic complexity of ${method.ccn} (limit is ${options.thresholds["ccn-critical"]})`,
          "ccn-critical",
          method.fromLine,
        ),
      )
    } else if (method.ccn > options.thresholds["ccn-medium"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has a cyclomatic complexity of ${method.ccn} (limit is ${options.thresholds["ccn-medium"]})`,
          "ccn-medium",
          method.fromLine,
        ),
      )
    } else if (method.ccn > options.thresholds["ccn-minor"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has a cyclomatic complexity of ${method.ccn} (limit is ${options.thresholds["ccn-minor"]})`,
          "ccn-minor",
          method.fromLine,
        ),
      )
    }

    // check parameters count rules
    if (method.params > options.thresholds["parameter-count-critical"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has ${method.params} parameters (limit is ${options.thresholds["parameter-count-critical"]})`,
          "parameter-count-critical",
          method.fromLine,
        ),
      )
    } else if (method.params > options.thresholds["parameter-count-medium"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has ${method.params} parameters (limit is ${options.thresholds["parameter-count-medium"]})`,
          "parameter-count-medium",
          method.fromLine,
        ),
      )
    } else if (method.params > options.thresholds["parameter-count-minor"]) {
      results.push(
        new Issue(
          method.file,
          `Method ${method.name} has ${method.params} parameters (limit is ${options.thresholds["parameter-count-minor"]})`,
          "parameter-count-minor",
          method.fromLine,
        ),
      )
    }
  })

  return results
}
