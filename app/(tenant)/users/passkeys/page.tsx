import PasskeyManager from '@/app/(tenant)/users/passkeys/_components/passkey-manager'
import { Protected } from '@/components/auth/protected'

export default function PasskeysPage() {
  return (
    <Protected>
      <PasskeyManager />
    </Protected>
  )
}
