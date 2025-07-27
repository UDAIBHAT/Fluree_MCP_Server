export default {
  name: 'fluree_history_query',
  title: 'Get Entity History',
  description: 'Retrieve the history of a specific Fluree entity.',
  arguments: [
    { name: 'history', type: 'array', items: { type: 'string' }, description: 'History vector [predicate, value]', required: true },
    { name: 'block', type: 'number', description: 'Block height (optional)' }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Get history {{history}} at block {{block}}.' }
    }
  ]
};
