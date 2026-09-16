import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Play, Square, RefreshCw, Activity } from 'lucide-react';
import { fetchContainers, startContainer, stopContainer, restartContainer } from '@/services/docker';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/providers/ToastProvider';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { ErrorState } from '@/components/state/ErrorState';

export function ContainersPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data: containers, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['docker-containers'],
    queryFn: fetchContainers,
    refetchInterval: 5000,
  });

  const startMutation = useMutation({
    mutationFn: startContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker-containers'] });
      pushToast({ title: 'Container started', variant: 'success' });
    },
    onError: (err) => pushToast({ title: 'Failed to start container', description: err.message, variant: 'danger' }),
  });

  const stopMutation = useMutation({
    mutationFn: stopContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker-containers'] });
      pushToast({ title: 'Container stopped', variant: 'success' });
    },
    onError: (err) => pushToast({ title: 'Failed to stop container', description: err.message, variant: 'danger' }),
  });

  const restartMutation = useMutation({
    mutationFn: restartContainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docker-containers'] });
      pushToast({ title: 'Container restarted', variant: 'success' });
    },
    onError: (err) => pushToast({ title: 'Failed to restart container', description: err.message, variant: 'danger' }),
  });

  if (isLoading) return <div className="space-y-6"><PageHeader eyebrow="تحميل" title="Containers" /><LoadingSkeleton /></div>;
  if (isError) return <div className="space-y-6"><PageHeader eyebrow="خطأ" title="Containers" /><ErrorState message={error.message} onRetry={() => refetch()} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="خدمات السيرفر"
        title="إدارة الحاويات (Docker)"
        description="تحكم كامل في الحاويات الخاصة بك دون الحاجة للتيرمنال."
        actions={
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" /> تحديث القائمة
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {containers?.map((container) => {
          const isRunning = container.state === 'running';
          const name = container.names[0] || 'Unknown';
          
          return (
            <Card key={container.id} className="premium-card flex flex-col p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-900 border ${isRunning ? 'border-brand/30 text-brand' : 'border-rose-500/30 text-rose-400'}`}>
                    <Box className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[rgb(var(--color-text-primary))]">{name}</h3>
                    <p className="text-xs text-[rgb(var(--color-text-muted))] truncate w-32 md:w-48" title={container.image}>{container.image}</p>
                  </div>
                </div>
                <Badge variant={isRunning ? 'healthy' : 'warning'}>
                  {container.state}
                </Badge>
              </div>

              <div className="mb-6 flex-1 text-xs text-[rgb(var(--color-text-secondary))]">
                <p>Status: {container.status}</p>
                <p className="mt-1 font-mono text-[10px] text-[rgb(var(--color-text-muted))] truncate">
                  ID: {container.id.slice(0, 12)}
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-white/10 pt-4">
                {isRunning ? (
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => stopMutation.mutate(container.id)}
                      disabled={stopMutation.isPending}
                    >
                      <Square className="mr-1 h-3 w-3" /> Stop
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => restartMutation.mutate(container.id)}
                      disabled={restartMutation.isPending}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" /> Restart
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                    onClick={() => startMutation.mutate(container.id)}
                    disabled={startMutation.isPending}
                  >
                    <Play className="mr-1 h-3 w-3" /> Start
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {!containers?.length && (
          <div className="col-span-full py-12 text-center text-sm text-[rgb(var(--color-text-muted))]">
            لم يتم العثور على أي حاويات (Containers) تعمل على هذا الخادم.
          </div>
        )}
      </div>
    </div>
  );
}
