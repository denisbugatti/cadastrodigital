/**
 * FormFlow — Home page
 * Renders the immersive conversational form experience.
 */

import { FormContainer } from "@/components/form/FormContainer";
import { demoForm } from "@/lib/formTypes";

export default function Home() {
  return <FormContainer form={demoForm} />;
}
