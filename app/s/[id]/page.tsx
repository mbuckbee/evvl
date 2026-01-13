import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getShare } from '@/lib/share-storage';
import type { SharedEvaluation } from '@/lib/share-types';
import ShareView from './share-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const share = await getShare(id);

  if (!share) {
    return {
      title: 'Share Not Found - Evvl',
      description: 'This shared evaluation has expired or does not exist.',
    };
  }

  const title = share.title || share.prompt.name || 'Shared Evaluation';
  const description = share.description ||
    `Compare AI responses from ${share.responses.map(r => r.modelName || r.model).join(', ')}`;

  return {
    title: `${title} - Evvl`,
    description,
    openGraph: {
      title: `${title} - Evvl`,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${title} - Evvl`,
      description,
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const share = await getShare(id);

  if (!share) {
    notFound();
  }

  return <ShareView share={share} />;
}
