import { useState } from 'react'
import { Search, Users } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { PageWrapper } from '@/components/layout'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientListItem } from '../components/ClientListItem'
import { ClientDetailPanel } from '../components/ClientDetailPanel'
import { useClients } from '../hooks/useClients'
import type { ClientRow, IaStatus } from '@/services/clients.service'

const IA_STATUS_OPTIONS = [
  { label: 'Todos',       value: 'all' },
  { label: 'IA ativa',    value: 'active' },
  { label: 'Humano',      value: 'human_takeover' },
  { label: 'Bloqueados',  value: 'blocked' },
] as const

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [iaStatus, setIaStatus] = useState<'all' | IaStatus>('all')
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading } = useClients({
    search: debouncedSearch || undefined,
    ia_status: iaStatus,
    pageSize: 50,
  })

  const clients = data?.data ?? []
  const total = data?.count ?? 0

  return (
    <PageWrapper
      title="Clientes"
      description={`${total} cliente${total !== 1 ? 's' : ''} cadastrados`}
    >
      {/* Layout split-panel */}
      <div className="flex gap-5 h-[calc(100vh-180px)]">

        {/* Painel esquerdo — lista */}
        <div className="w-80 flex-shrink-0 bg-card rounded-xl border border-border flex flex-col overflow-hidden">

          {/* Filtros */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select
              value={iaStatus}
              onValueChange={(v) => {
                if (v !== null) setIaStatus(v)
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IA_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-sm">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="p-3 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isLoading && clients.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <Users size={32} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            )}

            {!isLoading &&
              clients.map((client) => (
                <ClientListItem
                  key={client.id}
                  client={client}
                  selected={selectedClient?.id === client.id}
                  onClick={() => setSelectedClient(client)}
                />
              ))}
          </div>
        </div>

        {/* Painel direito — detalhes */}
        <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden">
          {selectedClient ? (
            <ClientDetailPanel key={selectedClient.id} client={selectedClient} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Users size={40} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground">Selecione um cliente</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em um cliente na lista para ver os detalhes
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
