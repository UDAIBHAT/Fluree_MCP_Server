export default {
  name: 'fluree_query',
  title: 'Run Fluree Query',
  description: 'Execute a FlureeQL query using the flureeQuery tool and return results.',
  arguments: [
    { name: 'fromCollection', type: 'string', description: 'Collection to query', required: true },
    { name: 'selectFields', type: 'array', items: { type: 'string' }, description: 'Fields to select', required: false }
  ],
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'Please query the collection {{fromCollection}} selecting {{selectFields}}.'
      }
    }
  ]
};
