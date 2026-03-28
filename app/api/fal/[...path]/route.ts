import { route } from "@fal-ai/client/nextjs";

export const runtime = "nodejs";

const handler = route();
export const { GET, POST, PUT } = handler;
