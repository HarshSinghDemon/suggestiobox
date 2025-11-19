import { AssignmentDetails } from '@/components/details/assignment-details';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

type AssignmentPageProps = {
  params: {
    id: string;
  };
};

export default function AssignmentPage({ params }: AssignmentPageProps) {
  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <AssignmentDetails assignmentId={params.id} />
      </div>
    </AuthWrapper>
  );
}
