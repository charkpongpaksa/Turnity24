import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

export function PageBackButton({
  to,
  label = "Back",
}: {
  to: string;
  label?: string;
}) {
  return (
    <Button asChild variant="ghost" className="mb-4">
      <Link to={to}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
