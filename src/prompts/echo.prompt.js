export default {
  name: 'echo',
  title: 'Echo Text',
  description: 'Send text to the echo tool and receive it back verbatim.',
  arguments: [
    { name: 'message', type: 'string', description: 'Text to echo', required: true }
  ],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: '{{message}}' }
    }
  ]
};
