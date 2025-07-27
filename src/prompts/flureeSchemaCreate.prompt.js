export default {
  name: 'fluree_schema_create',
  title: 'Create Schema',
  description: 'Create new collections and predicates in Fluree.',
  arguments: [
    { name: 'collectionName', type: 'string', required: true },
    { name: 'doc', type: 'string' },
    { name: 'predicates', type: 'array', items: { type: 'object' }, required: true }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Create schema for collection {{collectionName}} with predicates {{predicates}}.' }
    }
  ]
};
