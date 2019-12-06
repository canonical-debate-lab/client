import { autorun } from 'mobx';
import { GetAuth } from 'Store/firebase';
import { GetOpenMapID } from 'Store/main';
import { GetMapView } from 'Store/main/mapViews/$mapView';
import { Clone } from 'js-vextensions';
import Raven from 'raven-js';

autorun(() => {
	let lastAuth;
	let lastMapView;
	let lastContextData; // only gets updated when one of the above components change
	autorun(() => {
		const auth = GetAuth();
		const mapView = GetOpenMapID() ? GetMapView(GetOpenMapID()) : null;

		let newContextData;
		const ExtendNewContextData = (newData) => {
			if (newContextData == null) newContextData = Clone(lastContextData || {});
			newContextData.Extend(newData);
		};
		// if (auth != lastAuth) ExtendNewContextData(auth ? auth.Including('uid', 'displayName', 'email', 'photoURL') : null);
		if (auth != lastAuth) ExtendNewContextData({ auth: auth ? auth.Including('uid', 'displayName', 'email', 'photoURL') : null });
		if (mapView != lastMapView) ExtendNewContextData({ mapView });

		if (newContextData != null) {
			// Log('Setting user-context: ', newContextData);
			Raven.setUserContext(newContextData);
			lastContextData = newContextData;
		}

		lastAuth = auth;
		lastMapView = mapView;
	});
}, { name: 'AddUserInfoToRavenContext' });