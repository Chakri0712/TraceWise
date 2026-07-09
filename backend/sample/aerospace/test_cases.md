# Sample Test Cases — Autonomous Drone Flight System

## Uploaded Test Cases (partial coverage)

- Test-1: Command drone to hover at fixed GPS coordinates for 5 minutes — verify position drift stays within 0.5m using RTK reference.
- Test-2: Program 20-waypoint mission and execute — verify cross-track error remains under 2 meters throughout flight.
- Test-3: Deploy drone in wind tunnel at 15 m/s gusts — verify altitude hold maintains +/-0.3m of target altitude.
- Test-4: Place obstacle at 25m distance during forward flight — verify drone detects and initiates avoidance maneuver.
- Test-5: Fly drone to 5 km range and verify command link latency remains under 100ms for control inputs.

## Notes

- These 5 test cases cover Req-1, Req-2, Req-3, Req-4, and Req-6.
- Missing coverage: Req-5 (GPS accuracy), Req-7 (return-to-home), Req-8 (payload), Req-9 (gimbal stabilization), Req-10 (survey patterns), Req-11 (geofence), Req-12 (emergency landing).
- Expected coverage after analysis: ~42% (5/12 requirements covered).
