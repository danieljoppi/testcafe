---
layout: docs
title: TestCafe Programming Interface
permalink: /documentation/using-testcafe/programming-interface/
---
# TestCafe Programming Interface

This section describes the API that allows you to use TestCafe from your NodeJS applications.

The thing to start with is creating the [TestCafe server](/testcafe/documentation/using-testcafe/programming-interface/TestCafe/) instance.
Use the [createTestCafe](/testcafe/documentation/using-testcafe/programming-interface/createTestCafe/) factory function for this.

```js
const createTestCafe = require('testcafe');
const testCafe       = await createTestCafe('localhost', 1337, 1338);
```

This is the main point of access to TestCafe. You can now use it to create other entities required to execute tests:
the [remote browser connections](/testcafe/documentation/using-testcafe/programming-interface/BrowserConnection/)
and the [test runner](/testcafe/documentation/using-testcafe/programming-interface/Runner/).

```js
const remoteConnection = testcafe.createBrowserConnection();
const runner           = testcafe.createRunner();
```

[Remote browser connections](/testcafe/documentation/using-testcafe/programming-interface/BrowserConnection/), as the name implies,
are used when you need to run tests on a remote device.

The [test runner](/testcafe/documentation/using-testcafe/programming-interface/Runner/) is used to configure and launch test runs.
Here is how you can have it run tests from a `myFixture.js` fixture in the local Chrome and another remote browser
with the report provided in the JSON format.

```js
const failedCount = await runner
    .src('tests/myFixture.js')
    .browsers([remoteConnection, 'chrome'])
    .reporter('json')
    .run();
});
```

For details, see the reference topics below.

## Reference

* [createTestCafe factory function](/testcafe/documentation/using-testcafe/programming-interface/createTestCafe/)
* [TestCafe Class](/testcafe/documentation/using-testcafe/programming-interface/TestCafe/)
* [Runner Class](/testcafe/documentation/using-testcafe/programming-interface/Runner/)
* [BrowserConnection Class](/testcafe/documentation/using-testcafe/programming-interface/BrowserConnection/)