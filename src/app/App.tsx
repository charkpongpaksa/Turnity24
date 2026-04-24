import { RouterProvider } from "react-router";
import { Toaster } from "@/app/components/ui/sonner";
import { router } from "@/app/routes";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
