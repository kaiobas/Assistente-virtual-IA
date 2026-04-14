import { useState } from 'react'
import { Plus, Pencil, Power, Clock, Tag, Layers } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ServiceFormModal } from '../components/ServiceFormModal'
import { useServices, useToggleServiceActive } from '../hooks/useServices'
import type { Service } from '@/services/services.service'
import { cn } from '@/lib/utils'

function formatPrice(value: number | string) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ServicesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const { data: services, isLoading } = useServices()
  const toggleActive = useToggleServiceActive()

  const grouped = new Map<string, Service[]>()
  for (const s of services ?? []) {
    const cat = s.category ?? 'Sem categoria'
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(s)
  }

  function handleEdit(service: Service) {
    setEditingService(service)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingService(null)
  }

  return (
    <PageWrapper
      title="Serviços"
      description="Catálogo de serviços oferecidos"
      action={
        <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5">
          <Plus size={15} />
          Novo serviço
        </Button>
      }
    >
      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-36 mb-4" />
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-[72px] w-full rounded-2xl" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && grouped.size === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Layers size={24} className="text-muted-foreground/50" />
          </div>
          <p className="font-medium">Nenhum serviço cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em <span className="font-medium text-foreground">+ Novo serviço</span> para começar
          </p>
        </div>
      )}

      {/* Categorias */}
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([category, categoryServices]) => (
          <div key={category}>
            {/* Cabeçalho da categoria */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {category}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground tabular-nums">
                {categoryServices.length} {categoryServices.length === 1 ? 'serviço' : 'serviços'}
              </span>
            </div>

            {/* Lista de serviços */}
            <div className="space-y-2">
              {categoryServices.map((service) => (
                <div
                  key={service.id}
                  className={cn(
                    'group flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 transition-colors hover:bg-muted/30',
                    !service.active && 'opacity-50',
                  )}
                >
                  {/* Indicador de status */}
                  <div
                    className={cn(
                      'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                      service.active ? 'bg-green-500' : 'bg-muted-foreground/30',
                    )}
                  />

                  {/* Nome + descrição */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-snug truncate">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Pills */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      <Clock size={11} />
                      {service.duration_min} min
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      <Tag size={11} />
                      {formatPrice(service.price)}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-xl"
                      onClick={() => handleEdit(service)}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        'h-8 w-8 rounded-xl',
                        service.active
                          ? 'text-destructive hover:text-destructive hover:bg-destructive/10'
                          : 'text-green-600 hover:text-green-600 hover:bg-green-500/10',
                      )}
                      onClick={() => toggleActive.mutate({ id: service.id, active: !service.active })}
                      disabled={toggleActive.isPending}
                      title={service.active ? 'Desativar' : 'Ativar'}
                    >
                      <Power size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ServiceFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        service={editingService}
      />
    </PageWrapper>
  )
}
