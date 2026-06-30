function baseUrl(): string {
  return (process.env.ADMIN_BASE_URL ?? "").replace(/\/+$/, "");
}

export function buildFileUrl(id: string): string {
  return `${baseUrl()}/api/media/file/${id}`;
}
