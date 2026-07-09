# Sample Test Cases — Banking Payment Processing System

## Uploaded Test Cases (partial coverage)

- Test-1: Submit credit card authorization request and measure end-to-end response time — verify under 300ms.
- Test-2: Process test transactions across Visa, Mastercard, and RuPay test networks — verify successful authorization.
- Test-3: Send identical transaction request twice within 1 second — verify only one charge is recorded (idempotency).
- Test-4: Submit transaction with card number in request payload — verify card data is masked in all logs (PCI-DSS).
- Test-5: Submit transaction exceeding 300% of customer's 24-hour average — verify transaction is held for review.

## Notes

- These 5 test cases cover Req-1, Req-2, Req-3, Req-5, and Req-10.
- Missing coverage: Req-4 (multi-currency), Req-6 (PCI-DSS environment), Req-7 (OAuth/JWT), Req-8 (3D Secure), Req-9 (fraud engine speed), Req-11 (fraud alerts), Req-12 (reconciliation).
- Expected coverage after analysis: ~42% (5/12 requirements covered).
