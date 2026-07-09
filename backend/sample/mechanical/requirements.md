# Sample Requirements — CNC Milling Machine

## Spindle and Motion Requirements

- Req-1: The spindle must maintain rotational speed within +/-0.5% of target RPM under varying load.
- Req-2: The X-axis positioning accuracy must be within 0.005mm across the full travel range.
- Req-3: The machine must support automatic tool changes in under 3 seconds.
- Req-4: The CNC controller must execute G-code programs with a minimum block processing rate of 1000 blocks/second.

## Coolant and Chip Management Requirements

- Req-5: The coolant delivery system must maintain flow rate between 15-25 liters per minute during cutting operations.
- Req-6: The chip conveyor must remove 95% of chips from the cutting zone within 10 seconds of generation.

## Calibration and Maintenance Requirements

- Req-7: The machine must perform automatic thermal compensation using real-time temperature sensors.
- Req-8: The system must track spindle runtime hours and alert maintenance at 500-hour intervals.

## Safety Requirements

- Req-9: The emergency stop must halt all axis motion within 0.5 seconds of activation.
- Req-10: The enclosure interlock must prevent spindle rotation when the door is open.
- Req-11: The machine must comply with ISO 13849-1 Performance Level d for safety functions.
- Req-12: The hydraulic system must maintain pressure within 5% of setpoint during clamping operations.
