import { useState } from 'react'
import { Edit2, Check, X, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvailabilityGrid } from './AvailabilityGrid'
import { useUpdateProfessional } from '../hooks/useProfessionals'
import type { Professional } from '@/services/professionals.service'

interface ProfessionalDetailPanelProps {
  professional: Professional
}

export function ProfessionalDetailPanel({
  professional,
}: ProfessionalDetailPanelProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(professional.name)
  const [displayName, setDisplayName] = useState(professional.display_name)
  const [specialty, setSpecialty] = useState(professional.specialty ?? '')

  const update = useUpdateProfessional()

  function handleSave() {
    void update
      .mutateAsync({
        id: professional.id,
        payload: {
          name,
          display_name: displayName,
          specialty: specialty || undefined,
        },
      })
      .then(() => setEditing(false))
  }

  function handleToggleActive() {
    void update.mutateAsync({
      id: professional.id,
      payload: { active: !professional.active },
    })
  }

  const initials = professional.display_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-primary">
              {initials}
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {editing ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome completo</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome de exibição</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Especialidade</Label>
                  <Input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Ex: Barbeiro"
                  />
                </div>
              </>
            ) : (
              <div>
                <p className="text-base font-semibold">
                  {professional.display_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {professional.name}
                </p>
                {professional.specialty && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {professional.specialty}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-1 flex-shrink-0">
            {editing ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditing(false)}
                >
                  <X size={14} />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSave}
                  disabled={update.isPending}
                >
                  <Check size={14} />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setEditing(true)}
              >
                <Edit2 size={14} />
              </Button>
            )}
          </div>
        </div>

        {/* Toggle ativo/inativo */}
        <Button
          variant="outline"
          size="sm"
          className={`mt-4 gap-1.5 text-xs ${
            professional.active
              ? 'text-red-600 border-red-200 hover:bg-red-50'
              : 'text-green-600 border-green-200 hover:bg-green-50'
          }`}
          onClick={handleToggleActive}
          disabled={update.isPending}
        >
          <Power size={13} />
          {professional.active ? 'Desativar profissional' : 'Ativar profissional'}
        </Button>
      </div>

      {/* Grade de horários */}
      <div className="p-5">
        <AvailabilityGrid professionalId={professional.id} />
      </div>
    </div>
  )
}
