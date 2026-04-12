import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  useCreateAppointment,
  useProfessionals,
  useServices,
  useSearchClients,
} from '../hooks/useAppointments'

const schema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  professionalId: z.string().min(1, 'Selecione um profissional'),
  serviceId: z.string().min(1, 'Selecione um serviço'),
  date: z.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CreateAppointmentModalProps {
  open: boolean
  onClose: () => void
}

export function CreateAppointmentModal({ open, onClose }: CreateAppointmentModalProps) {
  const [clientSearch, setClientSearch] = useState('')
  const { data: professionals } = useProfessionals()
  const { data: services } = useServices()
  const { data: clients } = useSearchClients(clientSearch)
  const createMutation = useCreateAppointment()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { time: '09:00' },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedDate = watch('date')

  async function onSubmit(data: FormData) {
    const [hours, minutes] = data.time.split(':').map(Number)
    const scheduledAt = new Date(data.date)
    scheduledAt.setHours(hours ?? 9, minutes ?? 0, 0, 0)

    await createMutation.mutateAsync({
      client_id: data.clientId,
      professional_id: data.professionalId,
      service_id: data.serviceId,
      scheduled_at: scheduledAt.toISOString(),
      notes: data.notes,
    })

    reset()
    setClientSearch('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          className="space-y-4 py-2"
        >
          {/* Cliente — busca por nome ou telefone */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            {clients && clients.length > 0 && clientSearch.length >= 2 && (
              <div className="border rounded-md divide-y max-h-36 overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                      setValue('clientId', c.id)
                      setClientSearch(c.name ?? c.phone)
                    }}
                  >
                    <span className="font-medium">{c.name ?? 'Sem nome'}</span>
                    <span className="text-muted-foreground ml-2">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.clientId && (
              <p className="text-xs text-destructive">{errors.clientId.message}</p>
            )}
          </div>

          {/* Profissional */}
          <div className="space-y-1.5">
            <Label>Profissional</Label>
            <Select
              value={watch('professionalId') ?? ''}
              onValueChange={(v) => { if (v !== null) setValue('professionalId', v) }}
            >
              <SelectTrigger className="w-full">
                {watch('professionalId')
                  ? <span className="flex-1 text-left text-sm">{professionals?.find(p => p.id === watch('professionalId'))?.display_name ?? 'Selecione...'}</span>
                  : <SelectValue placeholder="Selecione..." />
                }
              </SelectTrigger>
              <SelectContent>
                {professionals?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.professionalId && (
              <p className="text-xs text-destructive">{errors.professionalId.message}</p>
            )}
          </div>

          {/* Serviço */}
          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select
              value={watch('serviceId') ?? ''}
              onValueChange={(v) => { if (v !== null) setValue('serviceId', v) }}
            >
              <SelectTrigger className="w-full">
                {watch('serviceId')
                  ? <span className="flex-1 text-left text-sm">{services?.find(s => s.id === watch('serviceId'))?.name ?? 'Selecione...'}</span>
                  : <SelectValue placeholder="Selecione..." />
                }
              </SelectTrigger>
              <SelectContent>
                {services?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.duration_min}min · R$ {Number(s.price).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-xs text-destructive">{errors.serviceId.message}</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon size={14} className="mr-2" />
                      {selectedDate
                        ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
                        : 'Selecionar'}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setValue('date', d)}
                    locale={ptBR}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Input type="time" {...register('time')} />
              {errors.time && (
                <p className="text-xs text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label>
              Observações{' '}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea {...register('notes')} placeholder="Alguma observação..." rows={2} />
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={(e) => void handleSubmit(onSubmit)(e)}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Criando...' : 'Criar agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
