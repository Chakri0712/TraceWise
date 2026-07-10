# Sample Test Cases — Electric Vehicle Battery Management System

## Uploaded Test Cases (partial coverage)

- Test-1: Verify BMS reads individual cell voltages and reports within 100ms sampling interval.
- Test-2: Verify cell voltage balancing reduces delta to under 20mV after a full charge cycle.
- Test-3: Verify SoC estimation matches reference coulomb counter within 3% across 10%-90% range.
- Test-4: Verify motor controller torque response time is under 50ms using oscilloscope measurement.
- Test-5: Verify cooling system activates within 5 seconds when cell temperature exceeds 40C in thermal chamber test.

## Notes

- These 5 test cases cover Req-1, Req-2, Req-3, Req-4, and Req-6.
- Missing coverage: Req-5 (thermal management range), Req-7 (thermal runaway), Req-8 (insulation fault), Req-9 (ISO 26262), Req-10 (charging protocols), Req-11 (fault logging), Req-12 (drop test).
- Expected coverage after analysis: ~42% (5/12 requirements covered).
