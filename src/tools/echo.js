import { z } from 'zod';

export default {
  name: "echo",
  config: {
    title: "Echo Tool",
    description: "Echoes back the provided message",
    inputSchema: { message: z.string() }
  },
  handler: async ({ message }) => ({
    content: [{ type: "text", text: `Tool echo: ${message}` }]
  })
}; 