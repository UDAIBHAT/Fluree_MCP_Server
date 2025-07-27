export default {
  name: 'fluree_multi_query',
  title: 'Run Multiple Queries',
  description: 'Send multiple FlureeQL queries in a single request.',
  arguments: [
    { name: 'queries', type: 'object', description: 'Object mapping query names to { select, from }', required: true }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Execute multi-query: {{queries}}' }
    }
  ]
};
