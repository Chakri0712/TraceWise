# Sample Test Cases — E-Commerce Platform (Backwards Compatibility Demo)

## Uploaded Test Cases

- Test-1: Verify user can register with valid email and password.
- Test-2: Verify user can log in with Google OAuth and receive a session token.
- Test-3: Verify product catalog displays results when filtering by category.
- Test-4: Verify shopping cart updates quantity correctly.
- Test-5: Verify checkout process completes with credit card payment.
- Test-6: Verify SMS notification service sends order alerts to customers.
- Test-7: Verify loyalty points are awarded after purchase completion.
- Test-8: Verify chatbot handles customer support queries with 90% accuracy.

## Notes

- Test-1 through Test-5 map to Req-1, Req-2, Req-3, Req-4, and Req-5.
- Test-6, Test-7, Test-8 are ORPHAN test cases — no matching requirement exists.
  These represent test cases a QA team wrote based on domain knowledge before
  requirements for SMS, loyalty, and chatbot features were finalized.
- Expected results: ~62% coverage (5/8), 3 gaps (Req-6, Req-7, Req-8), 3 orphans (Test-6, Test-7, Test-8).
