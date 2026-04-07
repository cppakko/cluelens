export interface CaiyunResult {
  confidence: number;
  target: string[];
  rc: number;
};

export interface CaiyunRequestBody {
  source: string[];
  trans_type: string;
  detect?: boolean;
  media?: string;
  request_id?: string;
}

export interface CaiyunConfig {
  useCustomToken: boolean;
  token: string;
}

export const caiyunConfigDefault: CaiyunConfig = {
  useCustomToken: false,
  token: '',
}