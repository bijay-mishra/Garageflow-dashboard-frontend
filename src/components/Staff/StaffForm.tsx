import { useMemo } from 'react'
import { useFormik } from 'formik'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import FormikDropdown from '@/components/common/form/FormikDropdown'
import { Spinner } from '@/components/common/loaders/States'
import { useGetCustomerList } from '@/components/Customer/customer-query'
import { useGetMenuAccess } from '@/components/Menu/menu-query'
import { useAddStaff, useUpdateStaff } from './staff-query'
import {
  USER_ROLES,
  staffFormSchema,
  toStaffFormValues,
  type IStaff,
  type StaffFormType,
} from './staff-schema'

interface StaffFormProps {
  editing?: IStaff
  onClose: () => void
}

/**
 * Creates and edits an account.
 *
 * The field that matters and is easiest to get wrong is **Assigned as**. A
 * mechanic's app finds its work by matching that name against the mechanic
 * written on each job card — get it wrong and the account signs in perfectly
 * and shows an empty list, with nothing anywhere to explain why.
 */
export default function StaffForm({ editing, onClose }: StaffFormProps) {
  const addStaff = useAddStaff()
  const updateStaff = useUpdateStaff()

  // The company's own roles, from Role setup. Same query the roles screen uses,
  // so opening this form after that one costs nothing.
  const { data: matrix } = useGetMenuAccess()
  const companyRoles = useMemo(() => matrix?.roles ?? [], [matrix])

  const formik = useFormik<StaffFormType>({
    initialValues: toStaffFormValues(editing),
    validationSchema: staffFormSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // The dropdown holds a role *name*, which may be one this workshop
      // invented. What the account is authorised as is that role's base — and
      // only a role of the company's own is worth storing a name for, since a
      // built-in's name and its base are the same string.
      const chosen = companyRoles.find((r) => r.name === values.companyRoleName)

      const payload = {
        ...values,
        role: (chosen?.baseRole ?? values.companyRoleName) as StaffFormType['role'],
        companyRoleName: chosen && !chosen.isBuiltIn ? chosen.name : '',
      }

      try {
        if (editing) await updateStaff.mutateAsync({ id: editing.id, ...payload })
        else await addStaff.mutateAsync(payload)
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const selectedRole = formik.values.companyRoleName

  // What the server will authorise this account as, which is what the rest of
  // the form branches on — a "Parts runner" based on Mechanic still needs the
  // name their job cards are assigned under.
  const role =
    companyRoles.find((r) => r.name === selectedRole)?.baseRole ?? selectedRole

  // Only offered for a Customer login. The list is small and already cached by
  // the customers screen, so this costs nothing on most visits.
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomerList(role === 'Customer')

  const roleOptions = useMemo(() => {
    // A customer login is not a workshop role and never appears in Role setup —
    // it speaks for one customer and sees only their own cars.
    const named = companyRoles.map((r) => ({
      label: r.isBuiltIn ? r.name : `${r.name} (${r.baseRole})`,
      value: r.name,
    }))

    // Before the roles load, the four the product ships. The form is usable
    // immediately and gains the company's own the moment they arrive.
    const fallback = USER_ROLES.filter((r) => r !== 'Customer').map((r) => ({ label: r, value: r }))

    return [...(named.length > 0 ? named : fallback), { label: 'Customer', value: 'Customer' }]
  }, [companyRoles])

  const customerOptions = useMemo(
    () => customers.map((c) => ({ label: c.name, value: c.id })),
    [customers],
  )

  const busy = addStaff.isPending || updateStaff.isPending

  return (
    <Modal
      title={editing ? 'Edit account' : 'Add staff'}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary" onClick={() => formik.handleSubmit()} disabled={busy} type="button">
            {busy && <Spinner />} {editing ? 'Save changes' : 'Create account'}
          </button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Input name="name" label="Full name" formik={formik} placeholder="Suresh Lama" isRequired />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            name="email"
            label="Email"
            type="email"
            formik={formik}
            placeholder="suresh@yourshop.com"
            isRequired
            // The email is the username. Changing it after the fact locks the
            // person out of the app until they are told the new one.
            disabled={!!editing}
          />
          <Input name="phone" label="Phone" type="tel" formik={formik} placeholder="+977 98…" />
        </div>

        <FormikDropdown
          name="companyRoleName"
          label="Role"
          formik={formik}
          options={roleOptions}
          isClearable={false}
        />

        <p className="-mt-2 text-xs text-ink-400">
          {role === 'Mechanic'
            ? 'Signs into the mobile app and sees only the jobs assigned to them.'
            : role === 'Customer'
              ? 'Signs into the mobile app and sees only their own vehicles and bills.'
              : 'Signs into this dashboard.'}
        </p>

        {role === 'Mechanic' && (
          <div>
            <Input
              name="mechanicName"
              label="Assigned as"
              formik={formik}
              placeholder="Exactly as written on job cards"
              isRequired
            />
            <p className="mt-1 text-xs text-ink-400">
              Must match the mechanic name on their job cards, character for character. If it does
              not, they sign in fine and see an empty list.
            </p>
          </div>
        )}

        {role === 'Customer' && (
          <FormikDropdown
            name="customerId"
            label="Speaks for"
            formik={formik}
            options={customerOptions}
            isLoading={loadingCustomers}
            placeholder="Select customer…"
            isRequired
          />
        )}

        <div>
          <Input
            name="password"
            label={editing ? 'New password' : 'Password'}
            type="password"
            formik={formik}
            placeholder={editing ? 'Leave blank to keep the current one' : 'At least 8 characters'}
            isRequired={!editing}
          />
          <p className="mt-1 text-xs text-ink-400">
            {editing
              ? 'Only sent if you type something. Changing it signs them out of every device.'
              : 'Tell them this yourself — the app has no way to send it to them.'}
          </p>
        </div>

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
