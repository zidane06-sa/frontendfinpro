import { useState } from "react";
import { useNavigate } from "react-router";
import { Navbar } from "../components/navbar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Search, MapPin, Clock, Users, Star } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/customer-dashboard?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/customer-dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-24 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1758648207365-df458d3e83f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwaW50ZXJpb3IlMjBlbGVnYW50JTIwZGluaW5nfGVufDF8fHx8MTc3ODgzODA2MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Find Your Perfect Table</h1>
            <p className="text-xl mb-8 text-gray-300">
              Discover and reserve tables at the finest restaurants in your city
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-2xl p-2 flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-4">
                <Search className="size-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for restaurants, cuisines, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button onClick={handleSearch} size="lg" className="px-8">
                Find a Table
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Why Choose Reservo?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 rounded-full size-12 flex items-center justify-center mb-4 mx-auto">
                  <MapPin className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Find Nearby</h3>
                <p className="text-center text-muted-foreground">
                  Discover great restaurants in your area with our easy-to-use search system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 rounded-full size-12 flex items-center justify-center mb-4 mx-auto">
                  <Clock className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Instant Booking</h3>
                <p className="text-center text-muted-foreground">
                  Book your table in seconds with real-time availability
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="bg-primary/10 rounded-full size-12 flex items-center justify-center mb-4 mx-auto">
                  <Users className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Group Reservations</h3>
                <p className="text-center text-muted-foreground">
                  Perfect for any occasion, from intimate dinners to large gatherings
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">About Reservo</h2>
              <p className="text-muted-foreground mb-4">
                Reservo is your premier destination for restaurant reservations. We connect diners 
                with the best dining experiences across the city, making it easy to discover and 
                book tables at your favorite restaurants.
              </p>
              <p className="text-muted-foreground mb-6">
                Whether you're planning a romantic dinner, a business lunch, or a celebration with 
                friends and family, Reservo helps you find the perfect spot and secure your reservation 
                instantly.
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Restaurants</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">50K+</div>
                  <div className="text-sm text-muted-foreground">Reservations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">4.8</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Star className="size-4 fill-primary text-primary" />
                    Rating
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZXN0YXVyYW50JTIwdGFibGUlMjBzZXR0aW5nfGVufDF8fHx8MTc3ODkzOTE1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Restaurant interior"
                className="rounded-lg w-full h-48 object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwZGluaW5nJTIwZXhwZXJpZW5jZXxlbnwxfHx8fDE3Nzg5MzkxNTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Fine dining"
                className="rounded-lg w-full h-48 object-cover mt-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Dine?</h2>
          <p className="text-lg mb-8 opacity-90">
            Start exploring amazing restaurants and make your reservation today
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate("/customer-dashboard")}
            className="px-8"
          >
            Browse Restaurants
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2026 Reservo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
