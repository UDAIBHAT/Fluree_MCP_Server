export default {
  name: 'fluree_transact',
  title: 'Create Random Collections in Fluree',
  description: 'Create random collections in Fluree by sending a transaction.',
  arguments: [
    { name: 'count', type: 'number', description: 'Number of collections to create (1-50)', required: false }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Create {{count}} random collections in Fluree.' }
    }
  ]
};
