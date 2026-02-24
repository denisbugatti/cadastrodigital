/**
 * FormFlow — Dark Futuristic Design
 * Home page: renders the immersive conversational form experience.
 * Design: Dark premium, glassmorphism, neon accents, dramatic motion.
 */

import { FormContainer } from "@/components/form/FormContainer";
import { demoForm } from "@/lib/formTypes";

export default function Home() {
  return <FormContainer form={demoForm} />;
}
