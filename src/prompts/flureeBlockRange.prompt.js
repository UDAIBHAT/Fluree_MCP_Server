export default {
  name: 'fluree_block_range',
  title: 'Query Block Range',
  description: 'Fetch stats and transactions for a range of Fluree blocks.',
  arguments: [
    { name: 'start', type: 'number', description: 'Start block (inclusive)', required: true },
    { name: 'end', type: 'number', description: 'End block (inclusive)', required: true }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Get block stats from {{start}} to {{end}}.' }
    }
  ]
};
