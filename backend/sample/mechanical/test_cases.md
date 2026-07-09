# Sample Test Cases — CNC Milling Machine

## Uploaded Test Cases (partial coverage)

- Test-1: Measure spindle RPM deviation under 50%, 75%, and 100% load using tachometer — verify within +/-0.5%.
- Test-2: Perform ballbar test across full X-axis travel — verify positioning accuracy within 0.005mm.
- Test-3: Execute automatic tool change cycle and measure elapsed time — verify under 3 seconds.
- Test-4: Run G-code program with complex geometry — verify block processing rate meets 1000 blocks/second.
- Test-5: Activate emergency stop during full-speed cutting — verify all axes halt within 0.5 seconds.

## Notes

- These 5 test cases cover Req-1, Req-2, Req-3, Req-4, and Req-9.
- Missing coverage: Req-5 (coolant flow), Req-6 (chip removal), Req-7 (thermal compensation), Req-8 (spindle hours), Req-10 (door interlock), Req-11 (ISO 13849-1), Req-12 (hydraulic pressure).
- Expected coverage after analysis: ~42% (5/12 requirements covered).
