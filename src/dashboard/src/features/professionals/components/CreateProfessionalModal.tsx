import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateProfessional } from '../hooks/useProfessionals'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  display_name: z.string().min(2, 'Nome de exibição obrigatório'),
  specialty: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CreateProfessionalModalProps {
  open: boolean
  onClose: () => void
}

export function CreateProfessionalModal({
  open,
  onClose,
}: CreateProfessionalModalProps) {
  const create = useCreateProfessional()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  function onSubmit(data: FormData) {
    void create.mutateAsync(data).then(() => {
      reset()
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Novo profissional</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e)
          }}
          className="space-y-4 py-2"
        >
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input {...register('name')} placeholder="Ex: João da Silva" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>
              Nome de exibição{' '}
              <span className="text-muted-foreground text-xs">
                (usado no WhatsApp)
              </span>
            </Label>
            <Input {...register('display_name')} placeholder="Ex: João" />
            {errors.display_name && (
              <p className="text-xs text-destructive">
                {errors.display_name.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>
              Especialidade{' '}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input {...register('specialty')} placeholder="Ex: Barbeiro" />
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSubmit(onSubmit)()}
            disabled={create.isPending}
          >
            {create.isPending ? 'Criando...' : 'Criar profissional'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
