/**
 * FormFlow — Home page
 * Renders the immersive conversational form experience.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { FormContainer } from "@/components/form/FormContainer";
import { demoForm } from "@/lib/formTypes";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  return <FormContainer form={demoForm} />;
}
