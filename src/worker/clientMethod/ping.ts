import {PortHandler, WorkerMethod} from '../../common/PortHandler';

export type PingMethod = WorkerMethod<{}, {}>;

export function ping(portHandler: PortHandler<{}, {ping: PingMethod;}>, timeout: number) {
	const timeoutId = setTimeout(() => {
		portHandler.close();
	}, timeout);

	portHandler.send('ping', {}).then(() => {
		clearTimeout(timeoutId);
	});
}
