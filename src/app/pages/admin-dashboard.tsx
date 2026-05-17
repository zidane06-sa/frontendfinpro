import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { api, clearAuth, getCurrentUser, Reservation, Restaurant, RestaurantTable } from "../lib/api";

function formatTime(time?: string) {
  return time ? time.slice(0, 5) : "-";
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    cuisine: "",
    phone: "",
    opening_time: "08:00:00",
    closing_time: "22:00:00",
  });
  const [tableForm, setTableForm] = useState({
    restaurant_id: "",
    table_number: "",
    capacity: "4",
    status: "available" as RestaurantTable["status"],
    location: "",
  });

  const loadDashboard = async () => {
    const [tableResponse, reservationResponse, restaurantResponse] = await Promise.all([
      api.getTables(),
      api.getReservations(),
      api.getRestaurants(),
    ]);

    setTables(tableResponse.tables);
    setRequests(reservationResponse.reservations);
    setRestaurants(restaurantResponse.restaurants);
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login");
      return;
    }

    loadDashboard()
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load dashboard data"))
      .finally(() => setIsLoading(false));
  }, [currentUser, navigate]);

  const ownedRestaurants = useMemo(
    () => restaurants.filter((restaurant) => restaurant.owner_id === currentUser?.id),
    [restaurants, currentUser],
  );

  const adminRestaurantIds = new Set(ownedRestaurants.map((restaurant) => restaurant.id));
  const visibleTables = ownedRestaurants.length
    ? tables.filter((table) => adminRestaurantIds.has(table.restaurant_id))
    : tables;
  const visibleRequests = ownedRestaurants.length
    ? requests.filter((request) => adminRestaurantIds.has(request.restaurant_id))
    : requests;

  const handleApprove = async (id: string) => {
    try {
      const response = await api.confirmReservation(id);
      setRequests((items) => items.map((item) => (item.id === id ? response.reservation : item)));
      toast.success("Reservation approved");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve reservation");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await api.rejectReservation(id);
      setRequests((items) => items.map((item) => (item.id === id ? response.reservation : item)));
      toast.error("Reservation rejected");
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject reservation");
    }
  };

  const toggleTableStatus = async (table: RestaurantTable) => {
    const status = table.status === "available" ? "maintenance" : "available";

    try {
      const response = await api.updateTableStatus(table.id, status);
      setTables((items) => items.map((item) => (item.id === table.id ? response.table : item)));
      toast.success("Table status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update table");
    }
  };

  const handleCreateRestaurant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;

    try {
      const response = await api.createRestaurant({
        ...restaurantForm,
        owner_id: currentUser.id,
      });
      setRestaurants((items) => [response.restaurant, ...items]);
      setTableForm((form) => ({ ...form, restaurant_id: response.restaurant.id }));
      setRestaurantForm({
        name: "",
        description: "",
        address: "",
        city: "",
        cuisine: "",
        phone: "",
        opening_time: "08:00:00",
        closing_time: "22:00:00",
      });
      toast.success("Restaurant saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save restaurant");
    }
  };

  const handleCreateTable = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await api.createTable({
        restaurant_id: tableForm.restaurant_id,
        table_number: tableForm.table_number,
        capacity: Number(tableForm.capacity),
        status: tableForm.status,
        location: tableForm.location,
      });
      setTables((items) => [response.table, ...items]);
      setTableForm((form) => ({ ...form, table_number: "", capacity: "4", location: "" }));
      toast.success("Table saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save table");
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  const pendingCount = visibleRequests.filter((r) => r.status === "pending").length;
  const availableTablesCount = visibleTables.filter((t) => t.status === "available").length;
  const maintenanceTablesCount = visibleTables.filter((t) => t.status === "maintenance").length;
  const reservedTablesCount = visibleTables.filter((t) => t.status === "reserved").length;

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 grid place-items-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="bg-sidebar-primary rounded-lg p-2">
              <UtensilsCrossed className="size-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold">Reservo Admin</h2>
              <p className="text-xs text-sidebar-foreground/70">Restaurant Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            ["overview", LayoutDashboard, "Overview"],
            ["tables", UtensilsCrossed, "Tables Status"],
            ["requests", CalendarClock, "Requests"],
            ["settings", Settings, "Settings"],
          ].map(([key, Icon, label]) => (
            <Button
              key={key as string}
              variant={activeTab === key ? "secondary" : "ghost"}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => setActiveTab(key as string)}
            >
              <Icon className="size-4 mr-3" />
              {label as string}
              {key === "requests" && pendingCount > 0 && (
                <Badge className="ml-auto" variant="destructive">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={handleLogout}>
            <LogOut className="size-4 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === "overview" && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Tables" value={visibleTables.length} description="All restaurant tables" />
                <StatCard title="Available" value={availableTablesCount} description="Ready for guests" />
                <StatCard title="Reserved" value={reservedTablesCount} description="Upcoming reservations" />
                <StatCard title="Maintenance" value={maintenanceTablesCount} description="Unavailable tables" />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Requests</CardTitle>
                  <CardDescription>Reservation requests waiting for approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <RequestList
                    requests={visibleRequests.filter((r) => r.status === "pending").slice(0, 3)}
                    showActions
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "tables" && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Tables Status</h1>
              <Card>
                <CardHeader>
                  <CardTitle>All Tables</CardTitle>
                  <CardDescription>Manage table availability and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table Number</TableHead>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleTables.map((table) => (
                        <TableRow key={table.id}>
                          <TableCell className="font-semibold">{table.table_number}</TableCell>
                          <TableCell>{table.restaurant?.name || table.Restaurant?.name || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="size-4" />
                              {table.capacity}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={table.status === "available" ? "default" : table.status === "reserved" ? "secondary" : "destructive"}>
                              {table.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{table.location || "-"}</TableCell>
                          <TableCell>
                            {table.status !== "reserved" && (
                              <Button size="sm" variant="outline" onClick={() => toggleTableStatus(table)}>
                                Toggle Status
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "requests" && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Reservation Requests</h1>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                  <TabsTrigger value="pending">Pending {pendingCount > 0 && <Badge className="ml-2" variant="destructive">{pendingCount}</Badge>}</TabsTrigger>
                  <TabsTrigger value="confirmed">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
                {(["pending", "confirmed", "rejected"] as const).map((status) => (
                  <TabsContent key={status} value={status} className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{status.charAt(0).toUpperCase() + status.slice(1)} Requests</CardTitle>
                        <CardDescription>Reservations from your database</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RequestTable
                          requests={visibleRequests.filter((request) => request.status === status)}
                          showActions={status === "pending"}
                          onApprove={handleApprove}
                          onReject={handleReject}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Settings</h1>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Restaurant</CardTitle>
                    <CardDescription>Add restaurant data to the database</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleCreateRestaurant}>
                      <FormInput label="Name" value={restaurantForm.name} onChange={(value) => setRestaurantForm({ ...restaurantForm, name: value })} required />
                      <FormInput label="Description" value={restaurantForm.description} onChange={(value) => setRestaurantForm({ ...restaurantForm, description: value })} />
                      <FormInput label="Address" value={restaurantForm.address} onChange={(value) => setRestaurantForm({ ...restaurantForm, address: value })} required />
                      <FormInput label="City" value={restaurantForm.city} onChange={(value) => setRestaurantForm({ ...restaurantForm, city: value })} required />
                      <FormInput label="Cuisine" value={restaurantForm.cuisine} onChange={(value) => setRestaurantForm({ ...restaurantForm, cuisine: value })} />
                      <FormInput label="Phone" value={restaurantForm.phone} onChange={(value) => setRestaurantForm({ ...restaurantForm, phone: value })} />
                      <div className="grid grid-cols-2 gap-3">
                        <FormInput label="Opening Time" value={restaurantForm.opening_time} onChange={(value) => setRestaurantForm({ ...restaurantForm, opening_time: value })} required />
                        <FormInput label="Closing Time" value={restaurantForm.closing_time} onChange={(value) => setRestaurantForm({ ...restaurantForm, closing_time: value })} required />
                      </div>
                      <Button type="submit">Save Restaurant</Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Create Table</CardTitle>
                    <CardDescription>Add tables for an existing restaurant</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleCreateTable}>
                      <div className="space-y-2">
                        <Label>Restaurant</Label>
                        <Select value={tableForm.restaurant_id} onValueChange={(value) => setTableForm({ ...tableForm, restaurant_id: value })} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select restaurant" />
                          </SelectTrigger>
                          <SelectContent>
                            {(ownedRestaurants.length ? ownedRestaurants : restaurants).map((restaurant) => (
                              <SelectItem key={restaurant.id} value={restaurant.id}>
                                {restaurant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormInput label="Table Number" value={tableForm.table_number} onChange={(value) => setTableForm({ ...tableForm, table_number: value })} required />
                      <FormInput label="Capacity" type="number" value={tableForm.capacity} onChange={(value) => setTableForm({ ...tableForm, capacity: value })} required />
                      <FormInput label="Location" value={tableForm.location} onChange={(value) => setTableForm({ ...tableForm, location: value })} />
                      <Button type="submit" disabled={!tableForm.restaurant_id}>Save Table</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function RequestList({
  requests,
  showActions,
  onApprove,
  onReject,
}: {
  requests: Reservation[];
  showActions?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (requests.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No requests found</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-semibold">{request.User?.name || "Customer"}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(request.reservation_date).toLocaleDateString()} at {formatTime(request.start_time)} - {request.guest_count} guests
            </p>
          </div>
          {showActions && <RequestActions id={request.id} onApprove={onApprove} onReject={onReject} />}
        </div>
      ))}
    </div>
  );
}

function RequestTable({
  requests,
  showActions,
  onApprove,
  onReject,
}: {
  requests: Reservation[];
  showActions?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (requests.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No requests found</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Restaurant</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Guests</TableHead>
          <TableHead>Table</TableHead>
          {showActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-semibold">{request.User?.name || "Customer"}</TableCell>
            <TableCell>{request.User?.email || "-"}</TableCell>
            <TableCell>{request.Restaurant?.name || "-"}</TableCell>
            <TableCell>{new Date(request.reservation_date).toLocaleDateString()}</TableCell>
            <TableCell>{formatTime(request.start_time)}</TableCell>
            <TableCell>{request.guest_count}</TableCell>
            <TableCell>{request.Table?.table_number || "-"}</TableCell>
            {showActions && (
              <TableCell>
                <RequestActions id={request.id} onApprove={onApprove} onReject={onReject} />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RequestActions({
  id,
  onApprove,
  onReject,
}: {
  id: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => onApprove(id)}>
        <CheckCircle className="size-4 mr-1" />
        Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={() => onReject(id)}>
        <XCircle className="size-4 mr-1" />
        Reject
      </Button>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </div>
  );
}
