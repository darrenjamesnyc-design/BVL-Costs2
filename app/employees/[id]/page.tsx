import { EmployeeDetailClient } from "./employee-detail-client"

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EmployeeDetailClient employeeId={id} />
}
