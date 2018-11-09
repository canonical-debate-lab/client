import {AddGlobalStyle} from "react-vextensions";

export function StandardCompProps() {
	return ["dispatch", "_user", "_permissions", "_extraInfo"];
}

// todo: get new background
export let backgrounds = {
	1: {
		url_1920: "https://firebasestorage.googleapis.com/v0/b/debate-map-dev.appspot.com/o/Backgrounds%2FOcean_x1920.jpg?alt=media&token=53fc5864-a6de-431b-a724-fe4f9305f336",
		url_3840: "https://firebasestorage.googleapis.com/v0/b/debate-map-dev.appspot.com/o/Backgrounds%2FOcean_x3840.jpg?alt=media&token=2d1c25f3-a25e-4cb4-8586-06f419e4d63c",
		position: "center bottom",
	},
	2: {
		url_1920: "https://firebasestorage.googleapis.com/v0/b/debate-map-dev.appspot.com/o/Backgrounds%2FNebula_x1920.jpg?alt=media&token=f2fec09e-7394-4453-a08e-7f8608553e14",
		url_3840: "https://firebasestorage.googleapis.com/v0/b/debate-map-dev.appspot.com/o/Backgrounds%2FNebula_x2560.jpg?alt=media&token=c4ed8a83-d9ed-410f-9ae1-1d830355349a",
	},
};

export var styles = {
	vMenuItem: {padding: "3px 5px", borderTop: "1px solid rgba(255,255,255,.1)"},
};
export var colors = {
	navBarBoxShadow: "rgba(100, 100, 100, .3) 0px 0px 3px, rgba(70,70,70,.5) 0px 0px 150px",
};

AddGlobalStyle(`
.VMenu > div:first-child { border-top: initial !important; }
`);

/// same as E(...), except applies extra things for style-objects
export function FixStyles(...styles) {
	let result = E(...styles);

	// for firefox; prevents {flex: 1} from setting {minWidth: "auto"}
	if (result.flex) {
		if (result.minWidth == null) result.minWidth = 0;
		if (result.minHeight == null) result.minHeight = 0;
	}

	return result;
}