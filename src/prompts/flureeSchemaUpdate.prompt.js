export default {
  name: 'fluree_schema_update',
  title: 'Update Schema',
  description: 'Update existing collections or predicates in Fluree.',
  arguments: [
    { name: 'collectionName', type: 'string', required: true },
    { name: 'updateType', type: 'string', description: 'collection | predicates | both', required: true },
    { name: 'collectionDoc', type: 'string' },
    { name: 'newPredicates', type: 'array', items: { type: 'object' } },
    { name: 'updatePredicates', type: 'array', items: { type: 'object' } }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Update schema for {{collectionName}} with type {{updateType}}.' }
    }
  ]
};
