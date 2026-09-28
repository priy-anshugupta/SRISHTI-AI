import { permanentRedirect } from 'next/navigation';

// Preserve bookmarked links after retiring the duplicate planning dashboard.
export default function RetiredWellPlanningPage() {
  permanentRedirect('/map');
}
