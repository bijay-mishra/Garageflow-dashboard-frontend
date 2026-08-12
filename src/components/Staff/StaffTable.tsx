import { useMemo } from 'react'
import { UsersIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge, { type BadgeTone } from '@/components/common/Badge'
import EntityActions from '@/components/common/buttons/EntityActions'
import { useDateFormat } from '@/hooks/useDateFormat'
import type { IStaff, UserRole } from './staff-schema'

/** Role → badge colour. The three dashboard roles share the blue end. */
export const roleTone: Record<UserRole, BadgeTone> = {
  Owner: 'violet',
  Manager: 'blue',
  Advisor: 'cyan',
  Mechanic: 'amber',
  Customer: 'gray',
}

interface StaffTableProps extends ServerTableProps {
  data: IStaff[]
  onEdit: (staff: IStaff) => void
  onDelete: (staff: IStaff) => void
}

export default function StaffTable({
  data,
  onEdit,
  onDelete,
  total,
  state,
  onStateChange,
  loading,
}: StaffTableProps) {
  const { date } = useDateFormat()

  const columns = useMemo<Column<IStaff>[]>(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortValue: (u) => u.name,
        render: (u) => <span className="text-ink-700">{u.name}</span>,
      },
      {
        key: 'email',
        header: 'Signs in with',
        sortValue: (u) => u.email,
        render: (u) => <span className="text-ink-600">{u.email}</span>,
      },
      {
        key: 'role',
        header: 'Role',
        sortValue: (u) => u.companyRoleName || u.role,
        // The workshop's own name for the role, coloured by the product role it
        // is based on — so a "CEO" backed by Owner reads with the same weight as
        // an owner, which is what it is.
        render: (u) => <Badge tone={roleTone[u.role]}>{u.companyRoleName || u.role}</Badge>,
      },
      {
        key: 'mechanicName',
        header: 'Assigned as',
        // The link between an account and the work it can see. Blank for staff,
        // and worth showing empty rather than hidden — a mechanic with nothing
        // here signs in fine and sees no jobs at all, which is hard to diagnose
        // from the app.
        render: (u) =>
          u.role === 'Mechanic' ? (
            u.mechanicName ? (
              <span className="text-ink-700">{u.mechanicName}</span>
            ) : (
              <span className="text-xs text-ink-700">Not set — sees no jobs</span>
            )
          ) : u.role === 'Customer' ? (
            <span className="text-ink-700">{u.customerName ?? u.customerId ?? '—'}</span>
          ) : (
            <span className="text-ink-700">—</span>
          ),
      },
      {
        key: 'lastLoginAt',
        header: 'Last signed in',
        sortValue: (u) => u.lastLoginAt,
        render: (u) =>
          u.lastLoginAt ? (
            <span className="text-ink-700">{date(u.lastLoginAt)}</span>
          ) : (
            <span className="text-xs text-ink-700">Never</span>
          ),
      },
      {
        key: 'isActive',
        header: 'Status',
        sortValue: (u) => (u.isActive ? 'Active' : 'Disabled'),
        render: (u) =>
          u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Disabled</Badge>,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (u) => (
          <EntityActions
            label={`${u.name} (${u.email})`}
            onEdit={() => onEdit(u)}
            onDelete={() => onDelete(u)}
            className="justify-end"
          />
        ),
      },
    ],
    [onEdit, onDelete, date],
  )

  return (
    <DataTable
      serverMode
      columns={columns}
      data={data}
      rowKey={(u) => u.id}
      itemLabel="accounts"
      total={total}
      state={state}
      onStateChange={onStateChange}
      loading={loading}
      empty={{
        icon: UsersIcon,
        title: 'No accounts yet',
        message: 'Add your mechanics so they can sign into the app and see the jobs assigned to them.',
      }}
    />
  )
}
