import { GetNewURL } from 'Utils/URL/URLs';
import { VURL } from 'js-vextensions';
import { BaseComponent } from 'react-vextensions';
import { push, replace } from 'connected-react-router';
import { Connect, DoesURLChangeCountAsPageChange, GetCurrentURL, MaybeLog } from 'Utils/FrameworkOverrides';
import { loadingURL } from '../../Utils/URL/URLs';

let lastURL: VURL;

type Props = {} & Partial<{newURL: string, lastURL: string, pushURL: boolean}>;
@Connect((state, {}: Props)=> {
	let newURL = GetNewURL();
	let pushURL = !loadingURL && DoesURLChangeCountAsPageChange(lastURL, newURL, false);
	// if (pushURL) Log(`Pushing: ${newURL} @oldURL:${lastURL}`);

	var result = {newURL: newURL.toString({domain: false}), lastURL: lastURL ? lastURL.toString({domain: false}) : null, pushURL};
	lastURL = newURL;
	return result;
	})
export class AddressBarWrapper extends BaseComponent<Props, {}> {
	ComponentWillMountOrReceiveProps(props) {
		const { newURL, lastURL, pushURL } = props;
		if (newURL === lastURL) return;

		if (lastURL) {
			var action = pushURL ? push(newURL) : replace(newURL);
			MaybeLog(a => a.urlLoads, () => `Dispatching new-url: ${newURL} @type:${action.type}`);
		} else {
			// if page just loaded, do one "start-up" LOCATION_CHANGED action, with whatever's in the address-bar
			const startURL = GetCurrentURL(true).toString({ domain: false });
			var action = replace(startURL);
			MaybeLog(a => a.urlLoads, () => `Dispatching start-url: ${GetCurrentURL(true)} @type:${action.type}`);
		}

		// action.byUser = false;
		// g.justChangedURLFromCode = true;
		// action.payload.byCode = true;
		// extend the "state" argument for the to-be-created history-entry
		action.payload.args[1] = E(action.payload.args[1], { byCode: true });
		store.dispatch(action);
	}
	render() {
		return <div/>;
	}
}
