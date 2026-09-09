import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/status';

const sections: Record<string, { title: string; description: string }> = {
  patients: {
    title: 'Patients',
    description: 'Patient registration, search, and clinical history will arrive in Sprint 5.',
  },
  appointments: {
    title: 'Appointments',
    description: 'Scheduling and chamber queue operations will arrive in Sprint 6.',
  },
  queue: { title: 'Queue', description: 'Live queue controls will arrive in Sprint 6.' },
  consultations: {
    title: 'Consultations',
    description: 'The clinical workspace will arrive in Sprint 7.',
  },
  prescriptions: {
    title: 'Prescriptions',
    description: 'Digital prescription creation will arrive in Sprint 8.',
  },
  investigations: {
    title: 'Investigations',
    description: 'Investigation ordering and reports will arrive in later sprints.',
  },
  payments: {
    title: 'Payments',
    description: 'Billing and payment workflows will arrive in Sprint 9.',
  },
  chambers: { title: 'Chambers', description: 'Chamber management will arrive in Sprint 3.' },
  'ai-assistant': {
    title: 'AI Assistant',
    description: 'AI-assisted consultation tools will arrive in Sprint 10.',
  },
  communication: {
    title: 'Communication',
    description: 'Patient communication tools will arrive in Sprint 11.',
  },
  reports: {
    title: 'Reports',
    description: 'Reporting and notification tools will arrive in Sprint 11.',
  },
  settings: {
    title: 'Settings',
    description: 'Chamber, staff, and account settings will be connected in later sprints.',
  },
};

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = sections[section];
  if (!item) notFound();
  return (
    <>
      <PageHeader title={item.title} description={item.description} crumb={item.title} />
      <Card>
        <EmptyState
          title="Coming soon"
          description="This route is intentionally available now so the application shell and navigation remain stable as each feature is delivered."
        />
      </Card>
    </>
  );
}
