'use client'

import { PlusCircleIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import AddUserDialog from '@/app/tenants/[tenant]/users/_components/add-user-dialog'
import { usersListColumns } from '@/app/tenants/[tenant]/users/_components/column'
import DataTable from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useDebouncedSearch } from '@/hooks/use-debounce-search'
import { useUserStore } from '@/store/user.store'
import { ApiResponse } from '@/types/api-response.interface'
import { PublicUser } from '@/types/user.interface'

type UsersListProps = ApiResponse<PublicUser[]>

export default function UsersList({ data: users, error }: UsersListProps) {
  const [addUser, setAddUser] = useState(false)

  const isAdmin = useUserStore((state) => state.isAdmin)
  const isSupervisor = useUserStore((state) => state.isSupervisor)

  useEffect(() => {
    if (!users && !!error) {
      toast.error('خطا در دریافت اطلاعات!', { description: error.detail })
    }
  }, [users, error])

  const { filteredData, handleChange } = useDebouncedSearch<PublicUser>({
    data: users ?? [],
    searchKeys: ['firstName', 'lastName', 'nationalCode', 'phoneNumber'],
    delay: 300,
  })

  const handleAddUser = () => {
    if (isAdmin || isSupervisor) {
      setAddUser(true)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col items-center gap-2 md:flex-row">
          <div className="flex w-full items-center justify-between">
            <CardTitle className="whitespace-nowrap">لیست کاربران</CardTitle>
            {(isAdmin || isSupervisor) && (
              <Button variant="outline" onClick={handleAddUser}>
                افزودن کاربر
                <PlusCircleIcon className="size-5" />
              </Button>
            )}
          </div>
          <div className="relative mr-auto w-full sm:w-fit">
            <Input
              className="pl-7 transition-all duration-300 sm:w-[200px] sm:focus:w-[320px]"
              placeholder="جستجوی پروژه"
              onChange={handleChange}
            />
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-destructive-foreground text-sm md:text-base">
                {error.detail}!
              </span>
            </div>
          ) : (
            <DataTable
              columns={usersListColumns}
              initialData={filteredData}
              enableColumnVisibility
              initialState={{ pagination: { pageSize: 10, pageIndex: 0 } }}
              fullHeight
            />
          )}
        </CardContent>
      </Card>
      {addUser && <AddUserDialog open={addUser} onOpenChange={setAddUser} />}
    </>
  )
}
