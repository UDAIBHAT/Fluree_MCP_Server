export default {
  name: 'fluree_schema_import',
  title: 'Import Schema',
  description: 'Import schema definitions into Fluree database.',
  arguments: [
    { name: 'schemaData', type: 'object', description: 'Schema JSON object', required: true },
    { name: 'importMode', type: 'string', description: 'create | update | merge', required: true },
    { name: 'dryRun', type: 'boolean' },
    { name: 'skipExisting', type: 'boolean' }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Import schema with mode {{importMode}}. Dry run: {{dryRun}}' }
    }
  ]
};
