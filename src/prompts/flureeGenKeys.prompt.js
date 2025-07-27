export default {
  name: 'fluree_gen_keys',
  title: 'Generate New Keys',
  description: 'Fetch a new public/private key pair and auth-id from Fluree.',
  arguments: [
    { name: 'method', type: 'string', description: 'HTTP method GET or POST', required: false }
  ],
  messages: [
    {  
      role: 'user',
      content: { type: 'text', text: 'Generate new Fluree keys.' }
    }
  ]
};
