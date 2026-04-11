import { useState } from 'react'
import { Plus, Pencil, Power, Clock, DollarSign } from 'lucide-react'
import { PageWrapper } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ServiceFormModal } from '../components/ServiceFormModal'
import { useServices, useToggleServiceActive } from '../hooks/useServices'
import type { Service } from '@/services/services.service'
import { cn } from '@/lib/utils'

export default function ServicesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const { data: services, isLoading } = useServices()
  const toggleActive = useToggleServiceActive()

  const grouped = new Map<string, Service[]>()
  for (const s of services ?? []) {
    const cat = s.category ?? 'Sem categoria'
    if (!grouped.has(cat)) grouped.set(cat, [])
    const catArr = grouped.get(cat)
    if (catArr) catArr.push(s)
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
      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && grouped.size === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <DollarSign size={40} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Nenhum serviço cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Clique em &quot;Novo serviço&quot; para começar</p>
        </div>
      )}

      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([category, categoryServices]) => (
          <div key={category}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-foreground">{category}</h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {categoryServices.length} serviço{categoryServices.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Serviço</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Duração</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Preço</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categoryServices.map((service) => (
                    <tr
                      key={service.id}
                      className={cn(
                        'hover:bg-muted/30 transition-colors',
                        !service.active && 'opacity-50',
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={13} />
                          <span>{service.duration_min} min</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        R$ {Number(service.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={service.active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                          }
                        >
                          {service.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEdit(service)}
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn('h-7 w-7', service.active ? 'text-destructive' : 'text-green-600')}
                            onClick={() => toggleActive.mutate({ id: service.id, active: !service.active })}
                            disabled={toggleActive.isPending}
                            title={service.active ? 'Desativar' : 'Ativar'}
                          >
                            <Power size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
