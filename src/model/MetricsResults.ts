export interface LineComplexity {
  line: number
  value: number
}

export interface FileComplexity {
  filename: string
  complexity: number // this should be the maximum complexity found in the file
  lineComplexities: LineComplexity[]
}
