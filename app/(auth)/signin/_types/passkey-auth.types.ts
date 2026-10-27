
export interface PasskeyOptionsResponse {
  cid: string
  optionsJson: string
}

export interface PasskeyLoginRequest {
  cid: string
  assertion: string
}

export interface PasskeyLoginResponse {
  token?: string | null
  code?: string | null
}
