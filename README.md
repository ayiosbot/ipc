<div align="center">
    <h1>@ayios/ipc<h1>
    <h3><b>Ayios IPC System</b></h3>
    <h6>This is primarily used internally by Ayios. It is free for anyone to use.</h6>
</div>

## Example
```typescript
import { IPCManager } from '@ayios/ipc';
import cluster, { Worker } from 'cluster';

// If a worker dies, you can instruct the manager to automatically remove it
const ipc = new IPCManager(false); // If true, once the 'exit' signal from Worker is broadcasted, it'll automatically call removeWorker

// Assuming you set this up correctly and do not recursively fork your project:
const worker = cluster.fork();
ipc.addWorker(worker);
ipc.removeWorker(worker); // You can also remove workers

// All data is sufficient as long as it is JSON serializable.

// Broadcast opcode `1` to all workers with specified data
ipc.sendEvent<Result>(1, '*', 'Hello world!');
ipc.sendEvent<Result>(1, worker, 'Hello world!');

// Or from a worker, you can send the master worker a message:
// The response will usually be a boolean, or an array of booleans with the worker ID
const response = ipc.sendEvent<Result>(1, 'primary', 'Hello world!');

// You get a unique ID when creating a listener
const uuid = ipc.onEvent(1, data => {
    console.log('Event received', data);
});

// You can also remove a listener by ID
ipc.removeEventListener(uuid);
// or all event listeners under a particular code
ipc.removeEventListener(1);
```

## License
All code within this repository created by Ayios is under MIT license. Other code within this repository, if present, is under its own respective license which will be displayed within their respective files.