export interface JobRequirements {
  must_have: string[];
  nice_to_have: string[];
  responsibilities: string[];
}

export interface TailorDiff {
  key: string;
  section: string;
  label: string;
  original: string;
  proposed: string;
  status: "changed" | "original";
}

export interface TailorApplyUpdate {
  profile?: string;
  experiences?: Array<{ id?: string | number; details: string }>;
  skill?: string[];
  competency?: string[];
}
