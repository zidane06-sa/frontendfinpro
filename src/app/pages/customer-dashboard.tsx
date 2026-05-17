import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Calendar } from "../components/ui/calendar";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Search, MapPin, Clock, LogOut, Calendar as CalendarIcon, Users, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { api, clearAuth, getCurrentUser, Reservation, Restaurant } from "../lib/api";

const timeSlots = [
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];

function endTimeFrom(startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const end = new Date();
  end.setHours(hours + 2, minutes, 0, 0);
  return end.toTimeString().slice(0, 8);
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

export function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
  const [bookingTime, setBookingTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [specialRequest, setSpecialRequest] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "customer") {
      navigate("/login");
      return;
    }

    Promise.all([
      api.getRestaurants(),
      api.getCustomerReservations(currentUser.id),
    ])
      .then(([restaurantResponse, reservationResponse]) => {
        setRestaurants(restaurantResponse.restaurants);
        setReservations(reservationResponse.reservations);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load dashboard data"))
      .finally(() => setIsLoading(false));
  }, [currentUser, navigate]);

  const filteredRestaurants = useMemo(
    () =>
      restaurants.filter((restaurant) =>
        [restaurant.name, restaurant.cuisine, restaurant.city, restaurant.address]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    [restaurants, searchQuery],
  );

  const handleBooking = async () => {
    if (!currentUser || !selectedRestaurant || !bookingDate || !bookingTime) {
      toast.error("Please select date and time");
      return;
    }

    setIsSaving(true);

    try {
      const reservationDate = bookingDate.toISOString().split("T")[0];
      const startTime = `${bookingTime}:00`;
      const availableTables = await api.getAvailableTables(selectedRestaurant.id, Number(guestCount));
      const table = availableTables.tables[0];

      if (!table) {
        toast.error("No available table matches the selected guest count");
        return;
      }

      const response = await api.createReservation({
        customer_id: currentUser.id,
        restaurant_id: selectedRestaurant.id,
        table_id: table.id,
        reservation_date: reservationDate,
        start_time: startTime,
        end_time: endTimeFrom(bookingTime),
        guest_count: Number(guestCount),
        special_request: specialRequest,
      });

      const refreshed = await api.getCustomerReservations(currentUser.id);
      setReservations(refreshed.reservations.length ? refreshed.reservations : [response.reservation, ...reservations]);
      setIsDialogOpen(false);
      toast.success("Reservation request submitted");
      setBookingTime("");
      setSpecialRequest("");
      setBookingDate(new Date());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create reservation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      const response = await api.cancelReservation(id);
      setReservations((items) => items.map((item) => (item.id === id ? response.reservation : item)));
      toast.success("Reservation cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel reservation");
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 grid place-items-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <Users className="size-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Customer Dashboard</span>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="browse">Browse Restaurants</TabsTrigger>
            <TabsTrigger value="reservations">My Reservations</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-4 flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 border rounded-md">
                  <Search className="size-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search restaurants, cuisines, locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>

            {filteredRestaurants.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No restaurants found in the database.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-muted grid place-items-center">
                      <UtensilsCrossed className="size-12 text-muted-foreground" />
                    </div>
                    <CardHeader>
                      <CardTitle>{restaurant.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{restaurant.cuisine || "Restaurant"}</span>
                        <span>-</span>
                        <span>{restaurant.city}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="size-4" />
                        {restaurant.address}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        {formatTime(restaurant.opening_time)} - {formatTime(restaurant.closing_time)}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Dialog
                        open={isDialogOpen && selectedRestaurant?.id === restaurant.id}
                        onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (open) setSelectedRestaurant(restaurant);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button className="w-full" onClick={() => setSelectedRestaurant(restaurant)}>
                            Reserve Table
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Reserve a Table at {selectedRestaurant?.name}</DialogTitle>
                            <DialogDescription>Choose your preferred date, time, and number of guests</DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div>
                              <Label className="mb-2 block">Select Date</Label>
                              <Calendar
                                mode="single"
                                selected={bookingDate}
                                onSelect={setBookingDate}
                                disabled={(date) => date < new Date(new Date().toDateString())}
                                className="rounded-md border"
                              />
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="guests">Number of Guests</Label>
                                <Select value={guestCount} onValueChange={setGuestCount}>
                                  <SelectTrigger id="guests">
                                    <SelectValue placeholder="Select guests" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                      <SelectItem key={num} value={num.toString()}>
                                        {num} {num === 1 ? "Guest" : "Guests"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="mb-2 block">Available Time Slots</Label>
                                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                                  {timeSlots.map((time) => (
                                    <Button
                                      key={time}
                                      variant={bookingTime === time ? "default" : "outline"}
                                      className="w-full"
                                      onClick={() => setBookingTime(time)}
                                    >
                                      <Clock className="size-4 mr-2" />
                                      {time}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="special-request">Special Request</Label>
                                <Input
                                  id="special-request"
                                  value={specialRequest}
                                  onChange={(event) => setSpecialRequest(event.target.value)}
                                  placeholder="Optional"
                                />
                              </div>
                              <Button onClick={handleBooking} className="w-full" size="lg" disabled={isSaving}>
                                {isSaving ? "Submitting..." : "Confirm Reservation"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservations">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">My Reservations</h2>
              {reservations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CalendarIcon className="size-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No reservations yet</p>
                  </CardContent>
                </Card>
              ) : (
                reservations.map((reservation) => (
                  <Card key={reservation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle>{reservation.Restaurant?.name || "Restaurant"}</CardTitle>
                          <CardDescription className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="size-4" />
                              {new Date(reservation.reservation_date).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="size-4" />
                              {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="size-4" />
                              {reservation.guest_count} {reservation.guest_count === 1 ? "Guest" : "Guests"}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            reservation.status === "confirmed"
                              ? "default"
                              : reservation.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    {["pending", "confirmed"].includes(reservation.status) && (
                      <CardFooter>
                        <Button variant="destructive" onClick={() => handleCancelReservation(reservation.id)}>
                          Cancel Reservation
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
