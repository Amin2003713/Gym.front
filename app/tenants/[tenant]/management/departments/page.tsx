import { readData } from '@/core/http-service'
import { Department } from '@/types/department.interface'
import { Problem } from '@/types/http-errors.interface'

import DepartmentList from './_components/department-list'

const getDepartments = async () => {
  return readData<Department[]>('department/get-departments')
    .then((data) => ({ data, error: null }))
    .catch((err: unknown) => {
      const error = err as Problem
      return {
        data: null,
        error,
      }
    })
}

export default async function departmentsManagement() {
  const { data: departments, error } = await getDepartments()

  return (
    <>
      {/*<DepartmentsKpi/>*/}
      <DepartmentList data={departments} error={error} />
    </>
  )
}
