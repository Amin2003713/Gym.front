import { PaymentReturn } from './_components/payment-return'

export const metadata = { title: 'نتیجه پرداخت' }

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ Authority?: string; Status?: string }>
}) {
  const { Authority, Status } = await searchParams

  return <PaymentReturn authority={Authority ?? null} gatewayStatus={Status ?? null} />
}
