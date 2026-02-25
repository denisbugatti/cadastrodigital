/**
 * FormFlow — Dark Futuristic Design
 * FormView page: renders the immersive conversational form experience.
 * Accepts a form ID via route param and loads the corresponding form.
 */

import { FormContainer } from "@/components/form/FormContainer";
import { demoForm } from "@/lib/formTypes";

export default function FormView() {
  // In a real app, we'd fetch the form by ID from the route params.
  // For now, we render the demo form for any route.
  return (
    <div className="h-screen w-screen overflow-hidden">
      <FormContainer form={demoForm} />
    </div>
  );
}
