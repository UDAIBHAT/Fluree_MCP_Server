export default {
  name: 'fluree_block_query',
  title: 'Query Specific Block',
  description: 'Fetch block stats and transactions for a specific Fluree block.',
  arguments: [
    { name: 'block', type: 'number', description: 'Block height to query', required: true }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Get details for block {{block}}.' }
    }
  ]
};
