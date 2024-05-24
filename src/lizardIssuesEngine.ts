import { Codacyrc, Engine, Issue, ToolResult } from "codacy-seed"

import { getLizardOptions, LizardOptions } from "./configCreator"
import { runLizardCommand } from "./lizard"
import { debug } from "./logging"

export const lizardIssuesEngine: Engine = async function (
  codacyrc?: Codacyrc,
): Promise<ToolResult[]> {
  debug("engine: starting")

  const lizardOptions = await getLizardOptions(codacyrc)
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
    const thresholds_nloc = ["nloc-critical", "nloc-medium", "nloc-minor"]

    for (const threshold of thresholds_nloc) {
      if (method.nloc > options.thresholds[threshold]) {
        results.push(
          new Issue(
            method.file,
            `Method ${method.name} has ${method.nloc} lines of code (limit is ${options.thresholds[threshold]})`,
            threshold,
            method.fromLine,
          ),
        )
        break
      }
    }

    // check CCN rules
    const thresholds_ccn = ["ccn-critical", "ccn-medium", "ccn-minor"]

    for (const threshold of thresholds_ccn) {
      if (method.ccn > options.thresholds[threshold]) {
        results.push(
          new Issue(
            method.file,
            `Method ${method.name} has a cyclomatic complexity of ${method.ccn} (limit is ${options.thresholds[threshold]})`,
            threshold,
            method.fromLine,
          ),
        )
        break
      }
    }

    // check parameters count rules
    const thresholds_parameter_count = [
      "parameter-count-critical",
      "parameter-count-medium",
      "parameter-count-minor",
    ]

    for (const threshold of thresholds_parameter_count) {
      if (method.params > options.thresholds[threshold]) {
        results.push(
          new Issue(
            method.file,
            `Method ${method.name} has ${method.params} parameters (limit is ${options.thresholds[threshold]})`,
            threshold,
            method.fromLine,
          ),
        )
        break
      }
    }
  })

  return results
}
