import { useState } from 'react'
import { CalendarDays, List, Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppointmentsList } from '../components/AppointmentsList'
import { AppointmentsCalendar } from '../components/AppointmentsCalendar'
import { CreateAppointmentModal } from '../components/CreateAppointmentModal'

type View = 'list' | 'calendar'

export function AppointmentsPage() {
  const [view, setView] = useState<View>('list')
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <PageWrapper
        title="Agendamentos"
        description="Gerencie os agendamentos do seu negócio"
        action={
          <div className="flex items-center gap-3">
            {/* Seletor de visualização */}
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as View)}
            >
              <TabsList variant="default">
                <TabsTrigger value="list">
                  <List size={14} className="mr-1.5" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="calendar">
                  <CalendarDays size={14} className="mr-1.5" />
                  Calendário
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Botão novo agendamento */}
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Novo agendamento
            </Button>
          </div>
        }
      >
        {view === 'list' ? (
          <AppointmentsList />
        ) : (
          <AppointmentsCalendar />
        )}
      </PageWrapper>

      <CreateAppointmentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  )
}

export default AppointmentsPage

