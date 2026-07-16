import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@/styles/prototype.css";
import "@/styles/app-overrides.css";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/layout/Layout";
import { StoreProvider } from "@/store/StoreContext";
import { PageChromeProvider } from "@/store/PageChromeContext";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { ServiceFormPage } from "@/pages/ServiceFormPage";
import { SetupsPage } from "@/pages/SetupsPage";
import { SetupFormPage } from "@/pages/SetupFormPage";
import { PatientsPage } from "@/pages/PatientsPage";
import { PatientFormPage } from "@/pages/PatientFormPage";
import { QueuePage } from "@/pages/QueuePage";
import { RequestIntakePage } from "@/pages/RequestIntakePage";
import { RequestCancelPage } from "@/pages/RequestCancelPage";
import { AssignSlotPage } from "@/pages/AssignSlotPage";
import { ScheduleDayPage } from "@/pages/ScheduleDayPage";
import { ScheduleRangePage } from "@/pages/ScheduleRangePage";
import { BedsDayPage } from "@/pages/BedsDayPage";
import { BedsRangePage } from "@/pages/BedsRangePage";
import { BedsMasterPage } from "@/pages/BedsMasterPage";
import { BedFormPage } from "@/pages/BedFormPage";
import { BookingDetailPage } from "@/pages/BookingDetailPage";
import { BookingCancelPage } from "@/pages/BookingCancelPage";
import { EventsLogPage } from "@/pages/EventsLogPage";
import { EventDetailPage } from "@/pages/EventDetailPage";
import { DeclareEventPage } from "@/pages/DeclareEventPage";
import { ReschedulePlanPage } from "@/pages/ReschedulePlanPage";
import { RescheduleMoveEditPage } from "@/pages/RescheduleMoveEditPage";
import { RescheduleRejectPage } from "@/pages/RescheduleRejectPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 5,
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401 || status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 401 || status === 403) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications position="top-right" />
        <AuthProvider>
          <StoreProvider>
            <PageChromeProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  <Route
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/new" element={<ServiceFormPage />} />
                    <Route
                      path="/services/:id/edit"
                      element={<ServiceFormPage />}
                    />
                    <Route path="/setups" element={<SetupsPage />} />
                    <Route path="/setups/new" element={<SetupFormPage />} />
                    <Route path="/setups/:id/edit" element={<SetupFormPage />} />
                    <Route path="/patients" element={<PatientsPage />} />
                    <Route path="/patients/new" element={<PatientFormPage />} />
                    <Route
                      path="/patients/:id/edit"
                      element={<PatientFormPage />}
                    />
                    <Route path="/queue" element={<QueuePage />} />
                    <Route path="/requests/new" element={<RequestIntakePage />} />
                    <Route
                      path="/requests/:id/cancel"
                      element={<RequestCancelPage />}
                    />
                    <Route path="/assign-slot" element={<AssignSlotPage />} />
                    <Route path="/schedule" element={<ScheduleDayPage />} />
                    <Route
                      path="/schedule/range"
                      element={<ScheduleRangePage />}
                    />
                    <Route path="/beds" element={<BedsDayPage />} />
                    <Route path="/beds/range" element={<BedsRangePage />} />
                    <Route path="/bed-master" element={<Outlet />}>
                      <Route index element={<BedsMasterPage />} />
                      <Route path="new" element={<BedFormPage />} />
                      <Route path="edit/:bedId" element={<BedFormPage />} />
                    </Route>
                    <Route path="/bookings/:id" element={<BookingDetailPage />} />
                    <Route
                      path="/bookings/:id/cancel"
                      element={<BookingCancelPage />}
                    />
                    <Route path="/events" element={<EventsLogPage />} />
                    <Route path="/events/declare" element={<DeclareEventPage />} />
                    <Route path="/events/:id" element={<EventDetailPage />} />
                    <Route
                      path="/reschedule/:planId"
                      element={<ReschedulePlanPage />}
                    />
                    <Route
                      path="/reschedule/:planId/moves/:moveId"
                      element={<RescheduleMoveEditPage />}
                    />
                    <Route
                      path="/reschedule/:planId/reject"
                      element={<RescheduleRejectPage />}
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </PageChromeProvider>
          </StoreProvider>
        </AuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
