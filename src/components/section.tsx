import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  title?: string;
}

export default function Section({ children, title }: SectionProps) {
  return <div>{children}</div>;
}
