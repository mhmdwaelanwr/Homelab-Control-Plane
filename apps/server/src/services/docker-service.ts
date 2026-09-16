import Docker from 'dockerode';

// Connect to the local Docker socket by default
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

export const dockerService = {
  async listContainers() {
    try {
      const containers = await docker.listContainers({ all: true });
      return containers.map((c) => ({
        id: c.Id,
        names: c.Names.map(n => n.replace(/^\//, '')),
        image: c.Image,
        state: c.State,
        status: c.Status,
        ports: c.Ports,
        created: c.Created,
      }));
    } catch (error) {
      console.warn('Docker daemon not reachable:', error);
      throw new Error('Docker daemon not reachable. Ensure Docker is running.');
    }
  },

  async getContainer(id: string) {
    return docker.getContainer(id);
  },

  async startContainer(id: string) {
    const container = docker.getContainer(id);
    await container.start();
    return { ok: true };
  },

  async stopContainer(id: string) {
    const container = docker.getContainer(id);
    await container.stop();
    return { ok: true };
  },

  async restartContainer(id: string) {
    const container = docker.getContainer(id);
    await container.restart();
    return { ok: true };
  },
  
  async getContainerStats(id: string) {
    const container = docker.getContainer(id);
    const stats = await container.stats({ stream: false });
    return stats;
  }
};
