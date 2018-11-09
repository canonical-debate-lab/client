import React from 'react';
import {BaseComponent, ApplyBasicStyles, BaseComponentWithConnector} from "react-vextensions";
import {replace, push} from "redux-little-router";
import {VURL} from "js-vextensions";
import {State_overrideCountAsAccess_value, StopStateCountAsAccessOverride, StartStateCountAsAccessOverride, State_overrideData_path} from "UI/@Shared/StateOverrides";
import { store } from 'Main_Hot';
import { GetCurrentURL } from 'Utils/URL/URLManager';
import {StandardCompProps} from "Utils/UI/General";

function isModifiedEvent(event) {
	return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

type Props = {
	onClick?, style?,
	text?: string, to?: string, target?: string, replace?: boolean, // url-based
} & React.HTMLProps<HTMLAnchorElement>;
@ApplyBasicStyles
export class Link extends BaseComponent<Props, {}> {
	handleClick(event) {
		let {onClick, to, target, replace: replaceURL} = this.props;
		if (onClick) onClick(event);

		if (event.defaultPrevented) return; // onClick prevented default
		if (event.button !== 0) return; // ignore right clicks
		if (isModifiedEvent(event)) return; // ignore clicks with modifier keys

		let isExternal = to && VURL.Parse(to, true).domain != GetCurrentURL().domain;
		if (isExternal || target) return; // let browser handle external links, and "target=_blank"

		event.preventDefault();
		store.dispatch(replaceURL ? replace(to) : push(to));
	}

	render() {
		let {text, to, target, children, ...rest} = this.props // eslint-disable-line no-unused-vars
		if (!to) return <a/>;
		
		let isExternal = to && VURL.Parse(to, true).domain != GetCurrentURL().domain;
		if (isExternal && target === undefined) {
			target = "_blank";
		}

		return (
			<a {...rest.Excluding(...StandardCompProps())} onClick={this.handleClick} href={to} target={target}>
				{text}
				{children}
			</a>
		);
	}
}