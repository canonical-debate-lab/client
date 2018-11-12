import { DoesURLChangeCountAsPageChange } from 'Frame/Store/ActionProcessor';
import { GetNewURL } from 'Frame/URL/URLManager';
import { VURL } from 'js-vextensions';
import { BaseComponent } from 'react-vextensions';
import { push, replace } from 'redux-little-router';
import { Connect } from '../../Frame/Database/FirebaseConnect';
import { GetCurrentURL } from '../../Frame/General/URLs';
import { loadingURL } from '../../Frame/URL/URLManager';

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
		action.payload.byCode = true;
		store.dispatch(action);
	}
	render() {
		return <div/>;
	}
}
