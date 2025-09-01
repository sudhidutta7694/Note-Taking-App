import { redirect } from 'next/navigation';

export default function HomePage() {
  // Server-side redirect - happens before page renders
  redirect('/auth/login');
}
