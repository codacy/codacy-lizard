import { exec } from "child_process"
import { LizardOptions } from "./configCreator"
import fs from "fs"

export interface LizardMethodResult {
  name: string
  fromLine: number
  toLine: number
  file: string
  nloc: number
  ccn: number
  params: number
  tokens: number
}

export interface LizardFileResult {
  file: string
  nloc: number
  maxCcn: number
  averageNloc: number
  averageCcn: number
  averageTokens: number
  methodsCount: number
}

export interface LizardResults {
  methods: LizardMethodResult[]
  files: LizardFileResult[]
}

export const runLizardCommand = (
  options: LizardOptions,
): Promise<LizardResults> => {
  // create a file with the list of files to analyze
  const filesList = options.files.join("\n")
  const filesListPath = "/filesList.txt"
  fs.writeFileSync(filesListPath, filesList)

  // run lizard command
  return new Promise((resolve, reject) => {
    exec(`lizard -f ${filesListPath}}`, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      if (stderr) {
        reject(stderr)
      }

      resolve(parseLizardResults(stdout))
    })
  })
}

const parseLizardResults = (output: string): LizardResults => {
  // NOTE: lizard supports generating the output in XML or CSV format, but both results lack some information
  // (files are not listed for the CSV output, and only starting line is included for the XML output); so the best
  // option is to parse the plain text output

  // parse the output in an array of lines
  const lines = output.split("\n")

  const results: LizardResults = {
    methods: [],
    files: [],
  }

  let idx = 0
  do {
    idx++
  } while (!lines[idx].includes("NLOC    CCN   token  PARAM  length  location"))

  // methods section found, now iterate until finding the totals line
  idx += 2

  while (idx < lines.length && !lines[idx].includes("file analyzed.")) {
    const [nloc, ccn, tokens, params, length, location] = lines[idx]
      .replaceAll(/\s+/g, " ")
      .split(" ")
    const [name, fromToLine, file] = location.split("@")
    const [fromLine, toLine] = fromToLine.split("-")

    results.methods.push({
      name,
      fromLine: parseInt(fromLine),
      toLine: parseInt(toLine),
      file,
      nloc: parseInt(nloc),
      ccn: parseInt(ccn),
      params: parseInt(params),
      tokens: parseInt(tokens),
    })

    idx++
  }

  // find the position of the files section header
  do {
    idx++
  } while (
    !lines[idx].includes(
      "NLOC    Avg.NLOC  AvgCCN  Avg.token  function_cnt    file",
    )
  )

  // files section found, now iterate until finding the totals line
  idx += 2

  while (idx < lines.length && lines[idx].trim() !== "") {
    const [nloc, avgNloc, avgCcn, avgTokens, methodsCount, file] = lines[idx]
      .replaceAll(/\s+/g, " ")
      .split(" ")

    results.files.push({
      file,
      nloc: parseInt(nloc),
      maxCcn: 0,
      averageNloc: parseFloat(avgNloc),
      averageCcn: parseFloat(avgCcn),
      averageTokens: parseFloat(avgTokens),
      methodsCount: parseInt(methodsCount),
    })

    idx++
  }

  return results
}
