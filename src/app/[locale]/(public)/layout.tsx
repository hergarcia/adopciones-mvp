import { AccountMenu } from '@/app/[locale]/_components/account-menu'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AccountMenu />
      {children}
    </>
  )
}
