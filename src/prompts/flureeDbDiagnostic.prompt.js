export default {
  name: 'fluree_db_diagnostic',
  title: 'Database Diagnostic',
  description: 'Diagnose Fluree DB collections, predicates, and sample data.',
  arguments: [
    { name: 'checkType', type: 'string', description: 'all | collections | predicates | data', required: false },
    { name: 'includeSystemCollections', type: 'boolean' }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Run database diagnostics with check {{checkType}}.' }
    }
  ]
};
