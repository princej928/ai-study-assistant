import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export default async function Home() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return <div>Welcome! You are logged in.</div>
}
