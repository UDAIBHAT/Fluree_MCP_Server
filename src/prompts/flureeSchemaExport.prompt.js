export default {
  name: 'fluree_schema_export',
  title: 'Export Schema',
  description: 'Export Fluree schema to JSON/EDN/compact formats with optional sample data.',
  arguments: [
    { name: 'collectionName', type: 'string' },
    { name: 'format', type: 'string', description: 'json | edn | compact' },
    { name: 'includeData', type: 'boolean' },
    { name: 'sampleSize', type: 'number' }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Export schema for {{collectionName}} in {{format}} format.' }
    }
  ]
};
