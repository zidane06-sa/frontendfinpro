import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Home, UtensilsCrossed } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-primary/10 rounded-full size-24 flex items-center justify-center mx-auto mb-6">
          <UtensilsCrossed className="size-12 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for. The table you're searching for might have been moved or doesn't exist.
        </p>
        <Link to="/">
          <Button size="lg">
            <Home className="size-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
