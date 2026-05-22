export interface ScannerInput {
  symptoms: string[];
  description: string;
  bodyArea?: string;
  patientId?: string;
}

export interface ScannerOutput {
  findings: string[];
  suggestedSpecialist: string;
}
