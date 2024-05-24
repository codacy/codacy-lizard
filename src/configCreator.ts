import { Codacyrc } from "codacy-seed"

import { debug } from "./logging"
import { toolName } from "./toolMetadata"

export interface LizardOptions {
  "files": string[];
  "thresholds": { [patternId: string]: number };
  "returnMetrics": boolean;
}

export const getLizardOptions = async function (
  codacyrc: Codacyrc
): Promise<LizardOptions> {
  debug("config: creating")

  if (!codacyrc || ![toolName, `metrics-${toolName}`].includes(codacyrc.tools?.[0]?.name))
    throw new Error("Error in codacyrc file")

  // get options for the tool from the codacyrc
  const patterns = codacyrc.tools[0].patterns || []
  const thresholds = Object.fromEntries(
    patterns.map((p) => [p.patternId, p.parameters[0]?.value])
  )

  debug(
    `engine: list of ${codacyrc.files.length} files (or globs) to process and options used`
  )
  debug(codacyrc.files)
  debug(thresholds)

  return {
    "files": codacyrc.files,
    thresholds,
    "returnMetrics": !!patterns
  }
}
