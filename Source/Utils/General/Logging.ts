import { LogTypes } from 'Utils/FrameworkOverrides';

export const logTypes = new LogTypes();
G({ logTypes }); // expose logTypes globally for console-editing, but don't mention to TS

if (localStorage.getItem('logTypes')) {
	logTypes.Extend(JSON.parse(localStorage.getItem('logTypes')));
}
g.addEventListener('beforeunload', () => {
	localStorage.setItem('logTypes', JSON.stringify(logTypes));
});
