
import { AssignmentDetails } from '@/components/details/assignment-details';
import { AuthWrapper } from '@/components/auth/auth-wrapper';

type AssignmentPageProps = {
  params: {
    id: string;
  };
};

export default function AssignmentPage({ params }: AssignmentPageProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <AuthWrapper>
      <div className="container py-8 mx-auto">
        <AssignmentDetails 
          assignmentId={params.id} 
          supabaseUrl={supabaseUrl} 
          supabaseAnonKey={supabaseAnonKey} 
        />
      </div>
    </AuthWrapper>
  );
}
