import { AssignmentDetails } from '@/components/details/assignment-details';

type AssignmentPageProps = {
  params: {
    id: string;
  };
};

export default function AssignmentPage({ params }: AssignmentPageProps) {
  return (
    <div className="container py-8 mx-auto">
      <AssignmentDetails assignmentId={params.id} />
    </div>
  );
}
