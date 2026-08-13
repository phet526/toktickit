# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok |Passed ✅ |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | Passed ✅|
| 3 | Vitest | Heading renders |Passed ✅ |
| 4 | Vitest | Success state shows Online + category list | Passed ✅|
| 5 | Vitest | Error state shows Offline + message |Passed ✅ |

Paste your passing terminal output / screenshot below.

### Evidence: Backend Tests (Server)
```text

 RUN  v2.1.9 D:/toktickit/server

 ✓ tests/lab-01/categories.test.ts (1)
 ✓ tests/lab-01/health.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  21:14:35
   Duration  1.11s (transform 83ms, setup 0ms, collect 714ms, tests 174ms, environment 1ms, prepare 338ms)
 ```

 ### Evidence: Frontend Tests (Client)
 ```text
    RUN  v2.1.9 D:/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3)
   ✓ App (3)
     ✓ renders the TokTickIT heading
     ✓ shows Online and the seeded categories on success
     ✓ shows an Offline error message when the API is unavailable

 Test Files  1 passed (1)
      Tests  3 passed (3)
   Start at  21:40:07
   Duration  2.10s (transform 90ms, setup 168ms, collect 218ms, tests 150ms, environment 922ms, prepare 196ms)
 ```

 