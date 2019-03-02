import { Global } from 'js-vextensions';
import { LogTypes_Base } from 'Utils/FrameworkOverrides';

@Global
export class LogTypes extends LogTypes_Base {
	actions = false;
	nodeRenders = false;
	nodeRenders_for = null as number;
	nodeRenderDetails = false;
	nodeRenderDetails_for = null as number;
	dbRequests = false;

	// doesn't actually log; rather, causes data to be stored in component.props.extraInfo.renderTriggers
	renderTriggers = false;
}

export const logTypes = new LogTypes();
G({ logTypes }); // expose logTypes globally for console-editing, but don't mention to TS

if (localStorage.getItem('logTypes')) {
	logTypes.Extend(JSON.parse(localStorage.getItem('logTypes')));
}
g.addEventListener('beforeunload', () => {
	localStorage.setItem('logTypes', JSON.stringify(logTypes));
});
