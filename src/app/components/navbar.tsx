import { Link } from "react-router";
import { Button } from "./ui/button";
import { UtensilsCrossed } from "lucide-react";

interface NavbarProps {
  showAuthButtons?: boolean;
}

export function Navbar({ showAuthButtons = true }: NavbarProps) {
  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-2">
            <UtensilsCrossed className="size-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">Reservo</span>
        </Link>
        
        {showAuthButtons && (
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
