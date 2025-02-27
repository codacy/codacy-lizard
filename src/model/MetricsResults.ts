export interface LineComplexity {
  "line": number;
  "value": number;
}

export interface FileComplexity {
  "filename": string;
  "complexity": number; // this should be the sum of method complexities found in a file
  "lineComplexities": LineComplexity[];
}
