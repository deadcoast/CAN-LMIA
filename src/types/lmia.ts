export interface Employer {
  id: string;
  employer_name: string;
  address: string;
  province_territory: string;
  incorporate_status: string;
  latitude: number;
  longitude: number;
  city: string;
  postal_code: string;
}

export interface LMIAApproval {
  id: string;
  employer_id: string;
  year: number;
  quarter: string;
  program_stream: string;
  noc_code: string;
  occupation: string;
  approved_lmias: number;
  approved_positions: number;
}

export interface EmployerWithApprovals extends Employer {
  approvals: LMIAApproval[];
  total_positions: number;
  total_lmias: number;
  primary_program: string;
  primary_occupation: string;
}

export interface FilterState {
  year: number;
  quarter: string;
  program_stream: string[];
  province_territory: string[];
  noc_code: string;
  min_positions: number;
  search_query: string;
  radius_km: number;
  center_lat?: number;
  center_lng?: number;
}

export interface Statistics {
  total_employers: number;
  total_positions: number;
  total_lmias: number;
  top_occupations: { occupation: string; count: number }[];
  top_programs: { program: string; count: number }[];
  provinces_distribution: { province: string; count: number }[];
}