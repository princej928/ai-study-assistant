import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'

export default async function Home() {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    redirect('/sign-in')
  }

  redirect('/dashboard')
}
