import EvalPageClient from './client';

// Required for static export with dynamic routes
// Generate a placeholder page - actual IDs come from localStorage at runtime
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function EvalPage() {
  return <EvalPageClient />;
}
