import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateService, useUpdateService } from '../hooks/useServices'
import type { Service } from '@/services/services.service'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  category: z.string().optional(),
  duration_min: z.number().min(5, 'Mínimo 5 minutos'),
  price: z.number().min(0, 'Preço inválido'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ServiceFormModalProps {
  open: boolean
  onClose: () => void
  service?: Service | null
}

export function ServiceFormModal({ open, onClose, service }: ServiceFormModalProps) {
  const isEdit = !!service
  const create = useCreateService()
  const update = useUpdateService()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: service
      ? {
          name: service.name,
          category: service.category ?? '',
          duration_min: service.duration_min,
          price: service.price,
          description: service.description ?? '',
        }
      : { duration_min: 30, price: 0 },
  })

  useEffect(() => {
    if (service) {
      reset({
        name: service.name,
        category: service.category ?? '',
        duration_min: service.duration_min,
        price: service.price,
        description: service.description ?? '',
      })
    } else {
      reset({ duration_min: 30, price: 0 })
    }
  }, [service, reset])

  const isPending = create.isPending || update.isPending

  function onSubmit(data: FormData) {
    if (isEdit && service) {
      void update.mutateAsync({ id: service.id, payload: data }).then(() => {
        reset()
        onClose()
      })
    } else {
      void create.mutateAsync(data).then(() => {
        reset()
        onClose()
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nome do serviço</Label>
            <Input {...register('name')} placeholder="Ex: Corte e Barba" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>
              Categoria{' '}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input {...register('category')} placeholder="Ex: Cortes e Combos" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duração (minutos)</Label>
              <Input type="number" min={5} step={5} {...register('duration_min', { valueAsNumber: true })} />
              {errors.duration_min && (
                <p className="text-xs text-destructive">{errors.duration_min.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Preço (R$)</Label>
              <Input type="number" min={0} step={0.01} {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Descrição{' '}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Textarea {...register('description')} placeholder="Detalhes do serviço..." rows={2} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={() => { void handleSubmit(onSubmit)() }} disabled={isPending}>
            {isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar serviço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
