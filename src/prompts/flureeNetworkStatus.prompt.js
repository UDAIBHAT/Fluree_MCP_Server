export default {
  name: 'fluree_network_status',
  title: 'Check Fluree Network Status',
  description: 'Retrieve raft state, servers, ledgers, and queued transactions.',
  arguments: [],
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Get the current Fluree network status.' }
    }
  ]
};
