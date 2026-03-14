import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Availability {
  id: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
}

interface Booking {
  id: string;
  professional_id: string;
  client_id: string;
  project_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  client_name?: string;
  project_title?: string;
}

const ProCalendar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    start_time: '08:00',
    end_time: '17:00',
    is_available: true,
    notes: '',
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth?mode=login');
        return;
      }
      setUserId(session.user.id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();

      if (prof?.user_type !== 'professional') {
        navigate('/');
        return;
      }

      await fetchData(session.user.id);
      setLoading(false);
    })();
  }, [currentWeek]);

  const fetchData = async (uid: string) => {
    await Promise.all([
      fetchAvailabilities(uid),
      fetchBookings(uid),
    ]);
  };

  const fetchAvailabilities = async (uid: string) => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('professional_id', uid)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      setAvailabilities(data || []);
    } catch (e) {
      console.error('Error fetching availabilities:', e);
    }
  };

  const fetchBookings = async (uid: string) => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_client_id_fkey(full_name),
          projects(title)
        `)
        .eq('professional_id', uid)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const bookingsWithDetails = (data || []).map((b: any) => ({
        ...b,
        client_name: b.profiles?.full_name || 'Client',
        project_title: b.projects?.title || 'Sans titre',
      }));

      setBookings(bookingsWithDetails);
    } catch (e) {
      console.error('Error fetching bookings:', e);
    }
  };

  const handleSaveAvailability = async () => {
    if (!userId || !formData.date) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('professional_availability')
        .insert({
          professional_id: userId,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          is_available: formData.is_available,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast({
        title: 'Enregistré',
        description: 'Votre disponibilité a été ajoutée',
      });

      setDialogOpen(false);
      setFormData({
        date: '',
        start_time: '08:00',
        end_time: '17:00',
        is_available: true,
        notes: '',
      });

      if (userId) await fetchData(userId);
    } catch (e) {
      console.error('Error saving availability:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder la disponibilité',
      });
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('professional_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Supprimé',
        description: 'La disponibilité a été supprimée',
      });

      if (userId) await fetchData(userId);
    } catch (e) {
      console.error('Error deleting availability:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de supprimer la disponibilité',
      });
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Mis à jour',
        description: `Le statut a été changé à "${status}"`,
      });

      if (userId) await fetchData(userId);
    } catch (e) {
      console.error('Error updating booking:', e);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour la réservation',
      });
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  });

  const getAvailabilitiesForDate = (date: Date) => {
    return availabilities.filter((a) => isSameDay(parseISO(a.date), date));
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter((b) => isSameDay(parseISO(b.date), date));
  };

  const openDialogForDate = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      date: format(date, 'yyyy-MM-dd'),
    });
    setDialogOpen(true);
  };

  const bookingStatusConfig = {
    pending: { label: 'En attente', variant: 'secondary' as const },
    confirmed: { label: 'Confirmé', variant: 'default' as const },
    completed: { label: 'Terminé', variant: 'default' as const },
    cancelled: { label: 'Annulé', variant: 'destructive' as const },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
          <div>Chargement...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex-1">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Calendrier et Planification</h1>
              <p className="text-muted-foreground">
                Gérez vos disponibilités et rendez-vous
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter disponibilité
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une disponibilité</DialogTitle>
                  <DialogDescription>
                    Définissez vos heures de travail pour cette date
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Heure début *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">Heure fin *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="is_available">Statut</Label>
                    <Select
                      value={formData.is_available ? 'available' : 'unavailable'}
                      onValueChange={(value) =>
                        setFormData({ ...formData, is_available: value === 'available' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="unavailable">Non disponible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Notes optionnelles..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveAvailability}>Enregistrer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
          >
            ← Semaine précédente
          </Button>
          <h2 className="text-xl font-semibold">
            {format(weekDays[0], 'dd MMM', { locale: fr })} -{' '}
            {format(weekDays[6], 'dd MMM yyyy', { locale: fr })}
          </h2>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
          >
            Semaine suivante →
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayAvailabilities = getAvailabilitiesForDate(day);
            const dayBookings = getBookingsForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={day.toISOString()} className={isToday ? 'ring-2 ring-primary' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {format(day, 'EEEE', { locale: fr })}
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold">
                    {format(day, 'd')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Availabilities */}
                  {dayAvailabilities.map((avail) => (
                    <div
                      key={avail.id}
                      className={`p-2 rounded text-xs ${
                        avail.is_available
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleDeleteAvailability(avail.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {avail.notes && (
                        <p className="text-xs mt-1 opacity-75">{avail.notes}</p>
                      )}
                    </div>
                  ))}

                  {/* Bookings */}
                  {dayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-2 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        <span className="font-semibold">{booking.client_name}</span>
                      </div>
                      <div className="text-xs">
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </div>
                      <Badge
                        variant={bookingStatusConfig[booking.status].variant}
                        className="mt-1 text-xs h-5"
                      >
                        {bookingStatusConfig[booking.status].label}
                      </Badge>
                    </div>
                  ))}

                  {/* Add Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => openDialogForDate(day)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upcoming Bookings */}
        {bookings.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Rendez-vous à venir</CardTitle>
              <CardDescription>Gérez vos rendez-vous clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings
                  .filter((b) => b.status !== 'completed' && b.status !== 'cancelled')
                  .map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-semibold">{booking.client_name}</p>
                            <p className="text-sm text-muted-foreground">{booking.project_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            {format(parseISO(booking.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                          </span>
                          <span>
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </span>
                          <Badge variant={bookingStatusConfig[booking.status].variant}>
                            {bookingStatusConfig[booking.status].label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmer
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marquer terminé
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProCalendar;

