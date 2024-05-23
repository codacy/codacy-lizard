import { Codacyrc, Parameter, ParameterSpec, Pattern } from "codacy-seed"
import { debug } from "./logging"
import { toolName } from "./toolMetadata"
// import { ESLint, Linter } from "eslint"
// import { existsSync } from "fs-extra"
// import { cloneDeep, fromPairs, isEmpty, partition } from "lodash"
// import path from "path"

// import { isBlacklisted } from "./blacklist"
// import { DocGenerator } from "./docGenerator"
// import { defaultOptions } from "./eslintDefaultOptions"
// import { getAllRules, getPluginsName } from "./eslintPlugins"
// import { DEBUG, debug } from "./logging"
// import { patternIdToEslint } from "./model/patterns"

export interface LizardOptions {
  files: string[]
  thresholds: { [patternId: string]: number }
  returnMetrics: boolean
}

export const getLizardOptions = async function (
  // srcDirPath: string,
  codacyrc: Codacyrc,
): Promise<LizardOptions> {
  debug("config: creating")

  if (![toolName, `metrics-${toolName}`].includes(codacyrc.tools[0]?.name))
    throw new Error("Tool in codacyrc is not Lizard")

  // get options for the tool from the codacyrc
  const patterns = codacyrc.tools[0].patterns || []
  const thresholds = Object.fromEntries(
    patterns.map((p) => [p.patternId, p.parameters[0]?.value]),
  )

  return {
    files: codacyrc.files,
    thresholds,
    returnMetrics: !!codacyrc.tools[0].patterns,
  }
}
