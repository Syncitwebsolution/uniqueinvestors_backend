const fs = require('fs');

const key = '7lzn2wNVjqUAtW48ShkHBexbaFGQyMTrZ1df6RpOY3CKmg5EuL3svg96f0MkUuCAEej28lrHTqYWwtRh';
fetch('https://www.fast2sms.com/dev/bulkV2', {
  method: 'POST',
  headers: {
    'authorization': key,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    route: 'q',
    message: 'Test message',
    numbers: '9999999999',
    flash: 0
  })
})
.then(r => r.json())
.then(data => {
    fs.writeFileSync('f2s_result.json', JSON.stringify(data, null, 2));
    console.log('Result written to f2s_result.json');
})
.catch(console.error);
