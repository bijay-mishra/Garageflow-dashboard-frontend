import { useState } from 'react'
import StickyHeader from '@/components/common/headers/StickyHeader'
import TableFilterBar from '@/components/common/table/TableFilterBar'
import FilterDropdown, { ALL } from '@/components/common/table/FilterDropdown'
import { ErrorBlock } from '@/components/common/loaders/States'
import StaffTable from '@/components/Staff/StaffTable'
import StaffForm from '@/components/Staff/StaffForm'
import { useDeleteStaff, useGetStaffListPaged } from '@/components/Staff/staff-query'
import { USER_ROLES, type IStaff, type UserRole } from '@/components/Staff/staff-schema'
import { useSearchQuery } from '@/hooks/useSearchQuery'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'

/**
 * Who can sign in, and as what.
 *
 * This is how a mechanic gets into the mobile app: an account here with a role
 * of Mechanic and the name their job cards are assigned under. Until that
 * exists, nobody on the floor can see their work on a phone.
 *
 * Owners and Managers only — the API refuses the whole controller to anyone
 * else, so an advisor running the front desk cannot hand out credentials.
 */
export default function Staff() {
  const [query, setQuery] = useSearchQuery()
  const search = useDebouncedValue(query)
  const [role, setRole] = useState<UserRole | typeof ALL>('All')

  const roleParam = role === 'All' ? undefined : role

  const table = useTableState({ pageSize: 20 }, [search, roleParam])
  const { data, isFetching, isError } = useGetStaffListPaged(table.toQuery({ search, role: roleParam }))

  const deleteStaff = useDeleteStaff()
  const [modal, setModal] = useState<{ open: boolean; editing?: IStaff }>({ open: false })

  if (isError) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Staff">
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          Add staff
        </button>
      </StickyHeader>

      <div className="card overflow-hidden">
        <TableFilterBar
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search name, email…"
        >
          <FilterDropdown
            placeholder="All roles"
            options={USER_ROLES}
            value={role}
            onChange={setRole}
          />
        </TableFilterBar>

        <StaffTable
          data={data?.list ?? []}
          total={data?.count ?? 0}
          state={table.state}
          onStateChange={table.setState}
          loading={isFetching}
          onEdit={(staff) => setModal({ open: true, editing: staff })}
          onDelete={(staff) => deleteStaff.mutate(staff.id)}
        />
      </div>

      {modal.open && <StaffForm editing={modal.editing} onClose={() => setModal({ open: false })} />}
    </div>
  )
}
