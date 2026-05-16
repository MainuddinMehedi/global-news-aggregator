const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const google = createGoogleGenerativeAI({ apiKey: 'test' });
console.log(Object.keys(google));
