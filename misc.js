

/*
motor1.on("start", () => {
    console.log(`start: ${Date.now()}`);
});

motor1.on("stop", () => {
    console.log(`automated stop on timer: ${Date.now()}`);
});

motor1.on("forward", () => {
    console.log(`forward: ${Date.now()}`);

    // demonstrate switching to reverse after 5 seconds
    board.wait(5000, () => motor1.reverse(255));
});


motor1.on("reverse", () => {
    console.log(`reverse: ${Date.now()}`);

    // demonstrate stopping after 5 seconds
    board.wait(5000, () => motor1.stop());
});


// set the motor1 going forward full speed
motor1.forward(255);

 */



//
//
// // Setup logging
// for (let i = 0; i < motors.length; i++) {
//     const motor = motors[i];
//
//     // motor.on('forward', () => {
//     //     console.log(`Motor ${i} closing`);
//     // });
//     //
//     // motor.on('reverse', () => {
//     //     console.log(`Motor ${i} opening`);
//     // });
//     //
//     // motor.on('stop', () => {
//     //     console.log(`Motor ${i} stopped`);
//     // });
//
//     motor.index = i;
//     motor.state = {
//         open: true,
//     };
//
//     motor.config = motorConfigs[i];
//
//     motor.open = (force) => {
//         // Do nothing if running
//         if (motor.isOn) {
//             return;
//         }
//
//         if (!force && motor.state.open) {
//             return;
//         }
//
//         motor.reverse(255);
//         motor.board.wait(
//             motor.config.openTime * 1000,
//             () => {
//                 motor.state.open = true;
//                 motor.brake();
//                 motor.stop();
//
//                 nudgeBlindsDown();
//             }
//         );
//     };
//
//     motor.close = (force) => {
//         // Do nothing if running
//         if (motor.isOn) {
//             return;
//         }
//
//         if (!force && !motor.state.open) {
//             return;
//         }
//
//         motor.forward(255);
//         motor.board.wait(
//             motor.config.closeTime * 1000,
//             () => {
//                 motor.state.open = false;
//                 motor.brake();
//                 motor.stop();
//
//                 nudgeBlindsUp();
//             }
//         );
//     };
//
//     motor.nudgeOpen = () => {
//         // Do nothing if running
//         if (motor.isOn) {
//             return;
//         }
//
//         motor.reverse(128);
//         board.wait(
//             550,
//             () => {
//                 motor.brake();
//                 motor.stop();
//             }
//         );
//     };
//
//     motor.nudgeClose = () => {
//         // Do nothing if running
//         if (motor.isOn) {
//             return;
//         }
//
//         motor.forward(128);
//         motor.board.wait(
//             450,
//             () => {
//                 motor.brake();
//                 motor.stop();
//             }
//         );
//     };
// }
