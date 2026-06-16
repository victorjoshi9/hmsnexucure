import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect to the setup wizard or dashboard
  // (In a real app, you'd check auth state here)
  redirect('/dashboard');
}
