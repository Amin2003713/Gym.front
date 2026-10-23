import { PublicUser } from '@/types/user.interface'

export interface Department {
  id: string
  title: string
  parentDepartment?: Department | null
  managers?: (Pick<PublicUser, 'id' | 'imageUrl'> & { name: string })[] | null
}
