// Works, probably because it does not have any dependencies
console.log('Attempting to require lodash, which does not have any dependencies');
const _ = require('autopnp:lodash@latest');
console.log(Object.keys(_));

// Does not work
console.log('----');
console.log('Attempting to require execa, which has dependencies');
console.log(`Resolves to: ${require.resolve('autopnp:execa@latest')}`);
const execa = require('autopnp:execa@latest');