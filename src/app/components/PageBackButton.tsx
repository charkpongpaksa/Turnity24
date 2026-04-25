import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

export function PageBackButton({
  to,
  label = "Back",
}: {
  to: string;
  label?: string;
}) {
  const navigate = useNavigate();

  return (
    <Button variant="ghost" className="mb-4" onClick={() => navigate(to)}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
