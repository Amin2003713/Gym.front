import { redirect } from 'next/navigation'

/**
 * The coach progress view now lives inside Trainers/Overview. The old URL stays valid so bookmarks
 * and any surviving links land on the merged page instead of a 404.
 */
export const metadata = { title: 'پیشرفت شاگرد' }

export default function Page() {
  redirect('/trainers/overview')
}
