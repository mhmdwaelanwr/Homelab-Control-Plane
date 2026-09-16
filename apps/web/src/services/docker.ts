import { apiRequest } from './api';
import type { DockerContainer } from '@/types/api';

export async function fetchContainers(): Promise<DockerContainer[]> {
  const result = await apiRequest<{ containers: DockerContainer[] }>('/docker/containers');
  return result.containers;
}

export async function startContainer(id: string): Promise<void> {
  await apiRequest(`/docker/containers/${id}/start`, { method: 'POST' });
}

export async function stopContainer(id: string): Promise<void> {
  await apiRequest(`/docker/containers/${id}/stop`, { method: 'POST' });
}

export async function restartContainer(id: string): Promise<void> {
  await apiRequest(`/docker/containers/${id}/restart`, { method: 'POST' });
}

export async function getContainerStats(id: string): Promise<any> {
  return apiRequest(`/docker/containers/${id}/stats`);
}
