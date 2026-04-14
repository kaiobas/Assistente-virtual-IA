import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfessionalListItem } from '../components/ProfessionalListItem'
import { ProfessionalDetailPanel } from '../components/ProfessionalDetailPanel'
import { CreateProfessionalModal } from '../components/CreateProfessionalModal'
import { useProfessionals } from '../hooks/useProfessionals'
import type { Professional } from '@/services/professionals.service'

export default function ProfessionalsPage() {
  const [selected, setSelected] = useState<Professional | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const { data: professionals, isLoading } = useProfessionals()

  return (
    <PageWrapper
      title="Profissionais"
      description="Gerencie a equipe e as grades de horário"
      action={
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus size={15} />
          Novo profissional
        </Button>
      }
    >
      <div className="flex gap-5 h-[calc(100vh-180px)]">
        {/* Lista */}
        <div className="w-72 flex-shrink-0 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-3 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isLoading && (!professionals || professionals.length === 0) && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <Users size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum profissional cadastrado
                </p>
              </div>
            )}

            {!isLoading &&
              professionals?.map((p) => (
                <ProfessionalListItem
                  key={p.id}
                  professional={p}
                  selected={selected?.id === p.id}
                  onClick={() => setSelected(p)}
                />
              ))}
          </div>
        </div>

        {/* Detalhe */}
        <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden">
          {selected ? (
            <ProfessionalDetailPanel key={selected.id} professional={selected} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Users size={40} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">
                Selecione um profissional
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique para ver e editar dados e grade de horários
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateProfessionalModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </PageWrapper>
  )
}
