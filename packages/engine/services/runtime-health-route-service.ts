import { SERVER_BOOT_ID } from '@/lib/server-boot'

export async function handleRuntimeBootIdRequest() {
  return Response.json({ bootId: SERVER_BOOT_ID })
}
