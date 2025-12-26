import InstructorLayout from '@/app/components/InstructorLayout';

export default function InstructorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InstructorLayout>{children}</InstructorLayout>;
}

