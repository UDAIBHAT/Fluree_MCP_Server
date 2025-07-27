export default {
  name: 'fluree_schema_validate',
  title: 'Validate Schema',
  description: 'Validate schema integrity and data consistency in Fluree.',
  arguments: [
    { name: 'collectionName', type: 'string' },
    { name: 'sampleSize', type: 'number' },
    { name: 'validationType', type: 'string', description: 'structure | data | both' }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Validate schema for {{collectionName}} with type {{validationType}}.' }
    }
  ]
};
