const eventTypes = {};

// AWS SDK EVENT TYPES
eventTypes.CREATE_IAM_ROLE = 'CREATE_IAM_ROLE';
eventTypes.HANDLE_NEW_ROLE = 'HANDLE_NEW_ROLE';

// KUBECTL EVENT TYPES
eventTypes.CREATE_POD = 'CREATE_POD';
eventTypes.HANDLE_NEW_POD = 'HANDLE_NEW_POD';

module.exports = eventTypes;