import { useMemo } from 'react'
import { UsersIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import EntityActions from '@/components/common/buttons/EntityActions'
import { useDateFormat } from '@/hooks/useDateFormat'
import type { ICustomer } from './customer-schema'

interface CustomerTableProps extends ServerTableProps {
  data: ICustomer[]
  onEdit: (customer: ICustomer) => void
  onDelete: (customer: ICustomer) => void
}

/**
 * Customer list table. Column definitions live here, not in the page.
 *
 * Each column's `key` is sent to the API as `sortBy`, so it has to match a
 * property on the server's CustomerDto.
 */
export default function CustomerTable({
  data,
  onEdit,
  onDelete,
  total,
  state,
  onStateChange,
  loading,
}: CustomerTableProps) {
  const { date, rs } = useDateFormat()

  const columns = useMemo<Column<ICustomer>[]>(
    () => [
      {
        key: 'name',
        header: 'Customer',
        sortValue: (c) => c.name,
        render: (c) => <span className="font-semibold text-ink-900">{c.name}</span>,
      },
      {
        key: 'phone',
        header: 'Phone',
        sortValue: (c) => c.phone,
        render: (c) => <span className="text-ink-700">{c.phone}</span>,
      },
      {
        key: 'email',
        header: 'Email',
        sortValue: (c) => c.email,
        render: (c) => <span className="text-ink-600">{c.email}</span>,
      },
      {
        key: 'vehicleCount',
        header: 'Vehicles',
        align: 'center',
        sortValue: (c) => c.vehicleCount,
        render: (c) => <span className="font-semibold text-ink-700">{c.vehicleCount}</span>,
      },
      {
        key: 'totalSpent',
        header: 'Total spent',
        align: 'right',
        sortValue: (c) => c.totalSpent,
        render: (c) => <span className="font-semibold text-ink-900">{rs(c.totalSpent)}</span>,
      },
      {
        key: 'createdAt',
        header: 'Since',
        sortValue: (c) => c.createdAt,
        render: (c) => <span className="text-ink-500">{date(c.createdAt)}</span>,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (c) => (
          <EntityActions label={c.name} onEdit={() => onEdit(c)} onDelete={() => onDelete(c)} className="justify-end" />
        ),
      },
    ],
    [onEdit, onDelete, date, rs],
  )
  return (
    <DataTable
      serverMode
      columns={columns}
      data={data}
      rowKey={(c) => c.id}
      itemLabel="customers"
      total={total}
      state={state}
      onStateChange={onStateChange}
      loading={loading}
      empty={{
        icon: UsersIcon,
        title: 'No customers found',
        message: 'Try a different search, or add your first customer.',
      }}
    />
  )
}
