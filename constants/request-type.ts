import { RequestTypeEnum } from '@/enums/request-type.enum'

export const REQUEST_TYPE: Record<RequestTypeEnum, string> = {
  [RequestTypeEnum.Leave]: 'درخواست مرخصی',
  [RequestTypeEnum.Mission]: 'تعیین ماموریت',
}
